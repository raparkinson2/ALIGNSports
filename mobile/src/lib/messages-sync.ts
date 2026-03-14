import { supabase } from './supabase';
import type { DirectMessage } from './store';
import { RealtimeChannel } from '@supabase/supabase-js';

let messagesChannel: RealtimeChannel | null = null;
let currentTeamId: string | null = null;

export async function sendDirectMessage(message: DirectMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('direct_messages').insert({
      id: message.id,
      team_id: message.teamId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      recipient_ids: message.recipientIds,
      subject: message.subject,
      body: message.body,
      created_at: message.createdAt,
      read_by: message.readBy,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message' };
  }
}

export async function fetchDirectMessages(teamId: string, playerId: string): Promise<{ success: boolean; messages?: DirectMessage[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('team_id', teamId)
      .contains('recipient_ids', [playerId])
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    const messages: DirectMessage[] = (data || []).map((m) => ({
      id: m.id,
      teamId: m.team_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      recipientIds: m.recipient_ids || [],
      subject: m.subject,
      body: m.body,
      createdAt: m.created_at,
      readBy: m.read_by || [],
    }));

    return { success: true, messages };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch messages' };
  }
}

export async function fetchSentDirectMessages(teamId: string, senderId: string): Promise<{ success: boolean; messages?: DirectMessage[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('team_id', teamId)
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    const messages: DirectMessage[] = (data || []).map((m) => ({
      id: m.id,
      teamId: m.team_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      recipientIds: m.recipient_ids || [],
      subject: m.subject,
      body: m.body,
      createdAt: m.created_at,
      readBy: m.read_by || [],
    }));

    return { success: true, messages };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch sent messages' };
  }
}

export async function markMessageReadInSupabase(messageId: string, playerId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('direct_messages')
      .select('read_by')
      .eq('id', messageId)
      .single();

    if (!data) return;
    const readBy: string[] = data.read_by || [];
    if (readBy.includes(playerId)) return;

    await supabase
      .from('direct_messages')
      .update({ read_by: [...readBy, playerId] })
      .eq('id', messageId);
  } catch {
    // best effort
  }
}

export function subscribeToDirectMessages(
  teamId: string,
  playerId: string,
  onNewMessage: (message: DirectMessage) => void
): () => void {
  if (messagesChannel && currentTeamId !== teamId) {
    messagesChannel.unsubscribe();
    messagesChannel = null;
  }

  currentTeamId = teamId;

  messagesChannel = supabase
    .channel(`direct_messages:${teamId}:${playerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        const m = payload.new as any;
        const recipientIds: string[] = m.recipient_ids || [];
        if (!recipientIds.includes(playerId)) return;

        const message: DirectMessage = {
          id: m.id,
          teamId: m.team_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          recipientIds,
          subject: m.subject,
          body: m.body,
          createdAt: m.created_at,
          readBy: m.read_by || [],
        };
        onNewMessage(message);
      }
    )
    .subscribe();

  return () => {
    if (messagesChannel) {
      messagesChannel.unsubscribe();
      messagesChannel = null;
      currentTeamId = null;
    }
  };
}
