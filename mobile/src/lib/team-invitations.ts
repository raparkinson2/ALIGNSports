import { supabase } from './supabase';
import type { Team } from './store';

export interface TeamInvitation {
  id: string;
  team_id: string;
  team_name: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  jersey_number?: string;
  position?: string;
  roles?: string[];
  invited_by_email?: string;
  created_at: string;
  accepted_at?: string;
  team_data?: string; // JSON string of full team data
}

/**
 * Helper to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Check if there's a pending team invitation for this email or phone
 * This queries the Supabase team_invitations table
 */
export async function checkPendingInvitation(identifier: string): Promise<{
  success: boolean;
  invitation?: TeamInvitation;
  error?: string;
}> {
  try {
    const isPhone = !identifier.includes('@');
    const normalizedIdentifier = isPhone
      ? identifier.replace(/\D/g, '') // Remove non-digits for phone
      : identifier.toLowerCase();

    console.log('INVITATION: Checking for identifier:', normalizedIdentifier, 'isPhone:', isPhone);

    // Query for pending (not accepted) invitations with a timeout
    let query = supabase
      .from('team_invitations')
      .select('*')
      .is('accepted_at', null);

    if (isPhone) {
      // For phone, we need to search with normalized format
      query = query.or(`phone.eq.${normalizedIdentifier},phone.eq.+1${normalizedIdentifier}`);
    } else {
      query = query.ilike('email', normalizedIdentifier);
    }

    // Add 8 second timeout to prevent hanging
    const queryPromise = new Promise<{ data: TeamInvitation | null; error: any }>((resolve) => {
      query.maybeSingle().then(resolve);
    });
    const { data, error } = await withTimeout(queryPromise, 8000);

    console.log('INVITATION: Query result - data:', JSON.stringify(data), 'error:', error?.message);

    if (error) {
      console.error('INVITATION: Error checking invitation:', error.message, error.code);
      // If table doesn't exist, return gracefully (no invitation found)
      if (error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.code === '42P01' ||
          error.code === 'PGRST116') {
        console.log('INVITATION: Table does not exist, returning no invitation');
        return { success: true, invitation: undefined };
      }
      return { success: false, error: error.message };
    }

    console.log('INVITATION: Found invitation:', data ? 'yes' : 'no');
    return { success: true, invitation: data || undefined };
  } catch (err: any) {
    console.error('INVITATION: checkPendingInvitation exception:', err?.message || err);
    // Handle network errors and timeouts gracefully - treat as no invitation found
    if (err?.message?.includes('Network') ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('timed out')) {
      console.log('INVITATION: Network error or timeout, treating as no invitation found');
      return { success: true, invitation: undefined };
    }
    return { success: false, error: 'Failed to check invitation' };
  }
}

/**
 * Create a team invitation in Supabase
 * Called when an admin adds a new player to their team
 */
export async function createTeamInvitation(invitation: {
  team_id: string;
  team_name: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  jersey_number?: string;
  position?: string;
  roles?: string[];
  invited_by_email?: string;
  team_data?: Team; // Full team data to store
}): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    console.log('INVITATION: Creating invitation for team:', invitation.team_name, 'team_id:', invitation.team_id);

    const normalizedData = {
      team_id: invitation.team_id,
      team_name: invitation.team_name,
      email: invitation.email?.toLowerCase(),
      phone: invitation.phone?.replace(/\D/g, ''), // Store normalized phone
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      jersey_number: invitation.jersey_number,
      position: invitation.position,
      roles: invitation.roles,
      invited_by_email: invitation.invited_by_email,
    };

    console.log('INVITATION: Inserting into Supabase for team:', normalizedData.team_name);

    const { data, error } = await supabase
      .from('team_invitations')
      .insert(normalizedData)
      .select('id')
      .single();

    if (error) {
      console.error('INVITATION: Error creating invitation:', error.message, error.code);
      // If table doesn't exist, return gracefully
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('INVITATION: Table does not exist, returning gracefully');
        return { success: true }; // Gracefully handle missing table
      }
      return { success: false, error: error.message };
    }

    console.log('INVITATION: Created successfully with ID:', data?.id);
    return { success: true, invitationId: data?.id };
  } catch (err: any) {
    console.error('INVITATION: createTeamInvitation error:', err?.message || err);
    return { success: false, error: 'Failed to create invitation' };
  }
}

/**
 * Mark an invitation as accepted
 */
export async function acceptTeamInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('acceptTeamInvitation error:', err);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

/**
 * Get team data for an invitation (includes full team data if available)
 */
export async function getTeamDataForInvitation(invitationId: string): Promise<{
  success: boolean;
  teamData?: {
    id: string;
    name: string;
    sport?: string;
  };
  playerData?: {
    first_name: string;
    last_name: string;
    jersey_number?: string;
    position?: string;
    roles?: string[];
  };
  fullTeamData?: Team; // Full team data from JSON
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Invitation not found' };
    }

    // Parse full team data if available
    let fullTeamData: Team | undefined;
    if (data.team_data) {
      try {
        fullTeamData = typeof data.team_data === 'string'
          ? JSON.parse(data.team_data)
          : data.team_data;
        console.log('INVITATION: Parsed full team data with', fullTeamData?.players?.length || 0, 'players');
      } catch (parseErr) {
        console.error('INVITATION: Failed to parse team_data JSON:', parseErr);
      }
    }

    return {
      success: true,
      teamData: {
        id: data.team_id,
        name: data.team_name,
        sport: data.sport,
      },
      playerData: {
        first_name: data.first_name,
        last_name: data.last_name,
        jersey_number: data.jersey_number,
        position: data.position,
        roles: data.roles,
      },
      fullTeamData,
    };
  } catch (err) {
    console.error('getTeamDataForInvitation error:', err);
    return { success: false, error: 'Failed to get team data' };
  }
}
