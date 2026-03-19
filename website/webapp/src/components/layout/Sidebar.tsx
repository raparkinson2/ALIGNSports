'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  MessageSquare,
  Image,
  DollarSign,
  Shield,
  MoreHorizontal,
  Bell,
  CheckCheck,
  X,
  CreditCard,
  Trophy,
} from 'lucide-react';
import { cn, SPORT_EMOJI } from '@/lib/utils';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import Avatar from '@/components/ui/Avatar';
import type { AppNotification } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

function notifIcon(type: AppNotification['type']) {
  switch (type) {
    case 'game_invite':
    case 'game_reminder':
      return <Calendar size={13} className="text-cyan-400" />;
    case 'payment_reminder':
      return <CreditCard size={13} className="text-amber-400" />;
    case 'chat_message':
      return <MessageSquare size={13} className="text-emerald-400" />;
    case 'poll':
      return <Trophy size={13} className="text-orange-400" />;
    default:
      return <Bell size={13} className="text-slate-400" />;
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const teamName = useTeamStore((s) => s.teamName);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const getUnreadChatCount = useTeamStore((s) => s.getUnreadChatCount);
  const notifications = useTeamStore((s) => s.notifications);
  const markNotificationRead = useTeamStore((s) => s.markNotificationRead);
  const getUnreadCount = useTeamStore((s) => s.getUnreadCount);
  const getUnreadDirectMessageCount = useTeamStore((s) => s.getUnreadDirectMessageCount);
  const { isAdmin, isParent } = usePermissions();

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;
  const unreadChat = currentPlayerId ? getUnreadChatCount(currentPlayerId) : 0;
  const unreadNotif = getUnreadCount();
  const unreadDm = currentPlayerId ? getUnreadDirectMessageCount(currentPlayerId) : 0;

  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const sport = teamSettings.sport;
  const emoji = SPORT_EMOJI[sport] ?? '🏆';

  const myNotifications = notifications
    .filter((n) => n.toPlayerId === currentPlayerId)
    .slice(0, 30);

  useEffect(() => {
    if (!notifOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  const handleNotifClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.gameId || n.eventId) router.push('/app/schedule');
    else if (n.type === 'chat_message') router.push('/app/chat');
    else if (n.type === 'payment_reminder') router.push('/app/payments');
    setNotifOpen(false);
  };

  const navItems: NavItem[] = [
    { href: '/app/schedule', label: 'Events', icon: Calendar },
    { href: '/app/roster', label: 'Roster', icon: Users },
    ...(teamSettings.showTeamChat && !isParent
      ? [{ href: '/app/chat', label: 'Chat', icon: MessageSquare, badge: unreadChat > 0 ? unreadChat : undefined }]
      : []),
    ...(teamSettings.showPhotos
      ? [{ href: '/app/photos', label: 'Photos', icon: Image }]
      : []),
    ...(teamSettings.showPayments
      ? [{ href: '/app/payments', label: 'Payments', icon: DollarSign }]
      : []),
    { href: '/app/more', label: 'More', icon: MoreHorizontal },
    ...(isAdmin
      ? [{ href: '/app/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-[#0d1526] border-r border-white/[0.07] h-screen flex-col shrink-0 relative">
      {/* Team header */}
      <div className="px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#67e8f9]/10 flex items-center justify-center text-xl shrink-0">
            {teamSettings.teamLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teamSettings.teamLogo} alt={teamName} className="w-8 h-8 object-contain" />
            ) : (
              emoji
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{teamName}</p>
            <p className="text-xs text-slate-400 capitalize">{sport}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-[#67e8f9]/10 text-[#67e8f9]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="ml-auto bg-[#67e8f9] text-[#080c14] text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: player + action buttons */}
      <div className="px-4 py-4 border-t border-white/[0.07] flex items-center gap-2">
        {currentPlayer && (
          <Link href="/app/more" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
            <Avatar player={currentPlayer} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {currentPlayer.firstName} {currentPlayer.lastName}
              </p>
              {currentPlayer.number && (
                <p className="text-xs text-slate-400">#{currentPlayer.number}</p>
              )}
            </div>
          </Link>
        )}

        {/* Messages */}
        <button
          onClick={() => router.push('/app/messages')}
          className={cn(
            'relative p-2 rounded-xl transition-colors shrink-0',
            unreadDm > 0
              ? 'text-[#67e8f9] bg-[#67e8f9]/10 hover:bg-[#67e8f9]/15'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
          )}
          aria-label="Messages"
        >
          <MessageSquare size={16} />
          {unreadDm > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
              {unreadDm > 9 ? '9+' : unreadDm}
            </span>
          )}
        </button>

        {/* Bell */}
        <button
          ref={bellRef}
          onClick={() => setNotifOpen((v) => !v)}
          className={cn(
            'relative p-2 rounded-xl transition-colors shrink-0',
            notifOpen
              ? 'text-[#67e8f9] bg-[#67e8f9]/15'
              : unreadNotif > 0
              ? 'text-[#67e8f9] bg-[#67e8f9]/10 hover:bg-[#67e8f9]/15'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
          )}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unreadNotif > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#67e8f9] text-[#080c14] text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
              {unreadNotif > 9 ? '9+' : unreadNotif}
            </span>
          )}
        </button>
      </div>

      {/* Notification panel */}
      {notifOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-[72px] left-3 right-3 bg-[#0d1526] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">Notifications</span>
              {unreadNotif > 0 && (
                <span className="bg-[#67e8f9]/15 text-[#67e8f9] text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadNotif} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadNotif > 0 && (
                <button
                  onClick={() => myNotifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id))}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#67e8f9] px-2 py-1 rounded-lg hover:bg-[#67e8f9]/10 transition-colors"
                >
                  <CheckCheck size={11} />Mark all read
                </button>
              )}
              <button onClick={() => setNotifOpen(false)} className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-72">
            {myNotifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Bell size={20} className="text-slate-600" />
                <p className="text-slate-500 text-xs">No notifications</p>
              </div>
            ) : (
              myNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={cn(
                    'w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors last:border-0',
                    !n.read && 'bg-[#67e8f9]/[0.03]'
                  )}
                >
                  <div className={cn('shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5', !n.read ? 'bg-white/[0.08]' : 'bg-white/[0.04]')}>
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs leading-snug truncate', n.read ? 'text-slate-400' : 'text-slate-100 font-medium')}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#67e8f9] mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
