'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn, SPORT_EMOJI } from '@/lib/utils';
import { useTeamStore } from '@/lib/store';
import Avatar from '@/components/ui/Avatar';

const PAGE_TITLES: Record<string, string> = {
  '/app/schedule': 'Schedule',
  '/app/roster': 'Roster',
  '/app/chat': 'Team Chat',
  '/app/photos': 'Photos',
  '/app/payments': 'Payments',
  '/app/stats': 'Stats',
  '/app/records': 'Records',
  '/app/admin': 'Admin',
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'ALIGN Sports';
}

export default function TopBar() {
  const pathname = usePathname();
  const teamName = useTeamStore((s) => s.teamName);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const getUnreadCount = useTeamStore((s) => s.getUnreadCount);

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;
  const unreadCount = getUnreadCount();
  const pageTitle = getPageTitle(pathname);
  const emoji = SPORT_EMOJI[teamSettings.sport] ?? '🏆';

  return (
    <header className="bg-[#0d1526]/80 backdrop-blur border-b border-white/[0.07] px-4 lg:px-6 h-14 flex items-center gap-4 shrink-0">
      {/* Left: mobile shows team name, desktop shows page title */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-100 text-sm lg:text-base truncate lg:hidden">
          {teamSettings.teamLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <span className="inline-flex items-center gap-2">
              <img src={teamSettings.teamLogo} alt={teamName} className="w-5 h-5 object-contain" />
              {teamName}
            </span>
          ) : (
            <span>{emoji} {teamName}</span>
          )}
        </p>
        <p className="hidden lg:block font-semibold text-slate-100">{pageTitle}</p>
      </div>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className={cn(
            'relative p-2 rounded-xl transition-colors',
            unreadCount > 0
              ? 'text-[#67e8f9] bg-[#67e8f9]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          )}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#67e8f9] text-[#080c14] text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Current player avatar */}
        {currentPlayer && (
          <Avatar player={currentPlayer} size="sm" />
        )}
      </div>
    </header>
  );
}
