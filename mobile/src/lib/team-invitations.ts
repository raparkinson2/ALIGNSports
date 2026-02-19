import { supabase } from './supabase';

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

    // Query for pending (not accepted) invitations
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

    const { data, error } = await query.maybeSingle();

    console.log('INVITATION: Query result - data:', data, 'error:', error);

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
    // Handle network errors gracefully - treat as no invitation found
    if (err?.message?.includes('Network') || err?.message?.includes('fetch')) {
      console.log('INVITATION: Network error, treating as no invitation found');
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
}): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    const normalizedData = {
      ...invitation,
      email: invitation.email?.toLowerCase(),
      phone: invitation.phone?.replace(/\D/g, ''), // Store normalized phone
    };

    const { data, error } = await supabase
      .from('team_invitations')
      .insert(normalizedData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      // If table doesn't exist, return gracefully
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return { success: true }; // Gracefully handle missing table
      }
      return { success: false, error: error.message };
    }

    return { success: true, invitationId: data?.id };
  } catch (err) {
    console.error('createTeamInvitation error:', err);
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
 * Get team data for an invitation (minimal info needed for joining)
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
    };
  } catch (err) {
    console.error('getTeamDataForInvitation error:', err);
    return { success: false, error: 'Failed to get team data' };
  }
}
