'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ImageIcon } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { pushChatMessageToSupabase, deleteChatMessageFromSupabase, uploadAndSavePhoto } from '@/lib/realtime-sync';
import { generateId } from '@/lib/utils';
import MessageBubble from '@/components/chat/MessageBubble';
import type { ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const chatMessages = useTeamStore((s) => s.chatMessages);
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const addChatMessage = useTeamStore((s) => s.addChatMessage);
  const deleteChatMessage = useTeamStore((s) => s.deleteChatMessage);
  const markChatAsRead = useTeamStore((s) => s.markChatAsRead);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (currentPlayerId) {
      markChatAsRead(currentPlayerId);
    }
  }, [currentPlayerId, chatMessages.length, markChatAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = useCallback(async (imageUrl?: string) => {
    const msgText = text.trim();
    if (!msgText && !imageUrl) return;
    if (!currentPlayerId || !activeTeamId) return;

    setSending(true);
    const msg: ChatMessage = {
      id: generateId(),
      senderId: currentPlayerId,
      senderName: currentPlayer
        ? `${currentPlayer.firstName} ${currentPlayer.lastName}`
        : undefined,
      message: msgText,
      imageUrl,
      createdAt: new Date().toISOString(),
      mentionedPlayerIds: [],
    };

    addChatMessage(msg);
    setText('');
    await pushChatMessageToSupabase(msg, activeTeamId);
    setSending(false);
  }, [text, currentPlayerId, activeTeamId, currentPlayer, addChatMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id: string) => {
    deleteChatMessage(id);
    await deleteChatMessageFromSupabase(id);
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTeamId || !currentPlayerId) return;
    setUploading(true);
    const uri = await uploadAndSavePhoto(file, activeTeamId, currentPlayerId);
    setUploading(false);
    if (uri) {
      await handleSend(uri);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-2">
        {chatMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-400 text-sm">No messages yet</p>
              <p className="text-slate-500 text-xs mt-1">Be the first to say something!</p>
            </div>
          </div>
        )}

        {chatMessages.map((msg) => {
          const sender = players.find((p) => p.id === msg.senderId) ?? null;
          const isOwn = msg.senderId === currentPlayerId;
          return (
            <div key={msg.id} className="relative">
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                sender={sender}
                players={players}
                onDelete={isOwn ? handleDelete : undefined}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-[#0d1526] border-t border-white/[0.07] px-4 py-3 lg:px-6">
        <div className="flex items-end gap-2">
          {/* Image attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="p-2.5 rounded-xl text-slate-400 hover:text-[#67e8f9] hover:bg-[#67e8f9]/10 transition-all disabled:opacity-50 shrink-0"
            aria-label="Attach image"
          >
            <ImageIcon size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageAttach}
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the team..."
              rows={1}
              disabled={sending || uploading}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/30 focus:border-[#67e8f9]/30 resize-none text-sm leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
              style={{ minHeight: '42px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={(!text.trim() && !uploading) || sending}
            className="p-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] hover:bg-[#67e8f9]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            {sending || uploading ? (
              <div className="w-4 h-4 rounded-full border-2 border-[#080c14]/30 border-t-[#080c14] animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
