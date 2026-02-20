import { supabase } from './supabase';
import type { ChatMessage } from './store';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Chat Sync Service
 * Handles syncing chat messages between users via Supabase
 * Provides real-time updates when other users send messages
 */

export interface ChatSyncResult {
  success: boolean;
  error?: string;
}

// Active subscription channel
let chatChannel: RealtimeChannel | null = null;
let currentTeamId: string | null = null;

/**
 * Send a chat message to Supabase for real-time sync
 */
export async function sendChatMessage(
  message: ChatMessage,
  teamId: string,
  senderName: string
): Promise<ChatSyncResult> {
  try {
    console.log('CHAT_SYNC: Sending message to Supabase:', message.id);

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        id: message.id,
        team_id: teamId,
        sender_id: message.senderId,
        sender_name: senderName,
        message: message.message,
        image_url: message.imageUrl || null,
        gif_url: message.gifUrl || null,
        gif_width: message.gifWidth || null,
        gif_height: message.gifHeight || null,
        mentioned_player_ids: message.mentionedPlayerIds || [],
        mention_type: message.mentionType || null,
        created_at: message.createdAt,
      });

    if (error) {
      console.error('CHAT_SYNC: Error sending message:', error);
      return { success: false, error: error.message };
    }

    console.log('CHAT_SYNC: Message sent successfully');
    return { success: true };
  } catch (err: any) {
    console.error('CHAT_SYNC: Exception sending message:', err);
    return { success: false, error: err?.message || 'Failed to send message' };
  }
}

/**
 * Delete a chat message from Supabase
 */
export async function deleteChatMessage(messageId: string): Promise<ChatSyncResult> {
  try {
    console.log('CHAT_SYNC: Deleting message:', messageId);

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('CHAT_SYNC: Error deleting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('CHAT_SYNC: Exception deleting message:', err);
    return { success: false, error: err?.message || 'Failed to delete message' };
  }
}

/**
 * Fetch all chat messages for a team from Supabase
 */
export async function fetchChatMessages(teamId: string): Promise<{
  success: boolean;
  messages?: ChatMessage[];
  error?: string;
}> {
  try {
    console.log('CHAT_SYNC: Fetching messages for team:', teamId);

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('CHAT_SYNC: Error fetching messages:', error);
      return { success: false, error: error.message };
    }

    const messages: ChatMessage[] = (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name || undefined,
      message: m.message,
      imageUrl: m.image_url || undefined,
      gifUrl: m.gif_url || undefined,
      gifWidth: m.gif_width || undefined,
      gifHeight: m.gif_height || undefined,
      mentionedPlayerIds: m.mentioned_player_ids || [],
      mentionType: m.mention_type || undefined,
      createdAt: m.created_at,
    }));

    console.log('CHAT_SYNC: Fetched', messages.length, 'messages');
    return { success: true, messages };
  } catch (err: any) {
    console.error('CHAT_SYNC: Exception fetching messages:', err);
    return { success: false, error: err?.message || 'Failed to fetch messages' };
  }
}

/**
 * Subscribe to real-time chat messages for a team
 * Calls onNewMessage when a new message arrives from another user
 * Calls onDeleteMessage when a message is deleted
 */
export function subscribeToChatMessages(
  teamId: string,
  currentUserId: string,
  onNewMessage: (message: ChatMessage) => void,
  onDeleteMessage: (messageId: string) => void
): () => void {
  // Unsubscribe from previous channel if team changed
  if (chatChannel && currentTeamId !== teamId) {
    console.log('CHAT_SYNC: Unsubscribing from previous team:', currentTeamId);
    chatChannel.unsubscribe();
    chatChannel = null;
  }

  currentTeamId = teamId;

  // Create subscription
  console.log('CHAT_SYNC: Subscribing to real-time messages for team:', teamId);

  chatChannel = supabase
    .channel(`chat:${teamId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        console.log('CHAT_SYNC: Received new message from realtime');
        const m = payload.new as any;

        // Skip messages from current user (already added locally)
        if (m.sender_id === currentUserId) {
          console.log('CHAT_SYNC: Skipping own message');
          return;
        }

        const message: ChatMessage = {
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name || undefined,
          message: m.message,
          imageUrl: m.image_url || undefined,
          gifUrl: m.gif_url || undefined,
          gifWidth: m.gif_width || undefined,
          gifHeight: m.gif_height || undefined,
          mentionedPlayerIds: m.mentioned_player_ids || [],
          mentionType: m.mention_type || undefined,
          createdAt: m.created_at,
        };

        onNewMessage(message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        console.log('CHAT_SYNC: Received delete from realtime');
        const oldMessage = payload.old as any;
        if (oldMessage?.id) {
          onDeleteMessage(oldMessage.id);
        }
      }
    )
    .subscribe((status) => {
      console.log('CHAT_SYNC: Subscription status:', status);
    });

  // Return unsubscribe function
  return () => {
    console.log('CHAT_SYNC: Unsubscribing from chat');
    if (chatChannel) {
      chatChannel.unsubscribe();
      chatChannel = null;
      currentTeamId = null;
    }
  };
}

/**
 * Unsubscribe from all chat channels
 */
export function unsubscribeFromChat(): void {
  if (chatChannel) {
    chatChannel.unsubscribe();
    chatChannel = null;
    currentTeamId = null;
  }
}
