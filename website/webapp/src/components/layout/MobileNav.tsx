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
  BarChart3,
  Trophy,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';

interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export default function MobileNav() {
  const pathname = usePathname();
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const getUnreadChatCount = useTeamStore((s) => s.getUnreadChatCount);
  const { isAdmin, isParent } = usePermissions();

  const unreadChat = currentPlayerId ? getUnreadChatCount(currentPlayerId) : 0;

  const allItems: MobileNavItem[] = [
    { href: '/app/schedule', label: 'Schedule', icon: Calendar },
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
    ...(teamSettings.showTeamStats
      ? [{ href: '/app/stats', label: 'Stats', icon: BarChart3 }]
      : []),
    ...(teamSettings.showTeamRecords
      ? [{ href: '/app/records', label: 'Records', icon: Trophy }]
      : []),
    ...(isAdmin
      ? [{ href: '/app/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  // Show max 5 tabs on mobile
  const navItems = allItems.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1526] border-t border-white/[0.07]">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors',
                isActive ? 'text-[#67e8f9]' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#67e8f9] text-[#080c14] text-[10px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#67e8f9] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
