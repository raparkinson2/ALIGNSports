'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Users,
  MessageSquare,
  Image,
  DollarSign,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { cn, SPORT_EMOJI } from '@/lib/utils';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import Avatar from '@/components/ui/Avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const teamName = useTeamStore((s) => s.teamName);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const getUnreadChatCount = useTeamStore((s) => s.getUnreadChatCount);
  const { isAdmin, isParent } = usePermissions();

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;
  const unreadChat = currentPlayerId ? getUnreadChatCount(currentPlayerId) : 0;

  const sport = teamSettings.sport;
  const emoji = SPORT_EMOJI[sport] ?? '🏆';

  // Stats/Records live inside More tab — not in the main sidebar nav
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
    <aside className="hidden lg:flex w-64 bg-[#0d1526] border-r border-white/[0.07] h-screen flex-col shrink-0">
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

      {/* Current player */}
      {currentPlayer && (
        <div className="px-4 py-4 border-t border-white/[0.07]">
          <Link href="/app/more" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
        </div>
      )}
    </aside>
  );
}
