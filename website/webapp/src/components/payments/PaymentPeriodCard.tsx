'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Info } from 'lucide-react';
import { cn, getDueDateColor } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useTeamStore } from '@/lib/store';
import { pushPaymentPeriodToSupabase } from '@/lib/realtime-sync';
import type { PaymentPeriod, Player, TeamSettings } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface PaymentPeriodCardProps {
  period: PaymentPeriod;
  players: Player[];
  teamSettings: TeamSettings;
  isAdmin: boolean;
}

function formatDueDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export default function PaymentPeriodCard({
  period,
  players,
  teamSettings,
  isAdmin,
}: PaymentPeriodCardProps) {
  const [expanded, setExpanded] = useState(false);
  const updatePlayerPayment = useTeamStore((s) => s.updatePlayerPayment);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);

  const paidCount = period.playerPayments.filter((pp) => pp.status === 'paid').length;
  const totalCount = players.length;
  const progressPct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const dueDateColor = getDueDateColor(period.dueDate);

  const handleTogglePayment = async (playerId: string) => {
    if (!isAdmin) return;
    const existing = period.playerPayments.find((pp) => pp.playerId === playerId);
    const newStatus: 'paid' | 'unpaid' | 'partial' =
      existing?.status === 'paid'
        ? 'unpaid'
        : existing?.status === 'partial'
        ? 'paid'
        : 'paid';

    updatePlayerPayment(period.id, playerId, newStatus);

    // Optimistically updated — push to Supabase
    if (activeTeamId) {
      const updatedPeriod = {
        ...period,
        playerPayments: period.playerPayments.some((pp) => pp.playerId === playerId)
          ? period.playerPayments.map((pp) =>
              pp.playerId === playerId ? { ...pp, status: newStatus } : pp
            )
          : [...period.playerPayments, { playerId, status: newStatus, entries: [] }],
      };
      await pushPaymentPeriodToSupabase(updatedPeriod, activeTeamId);
    }
  };

  return (
    <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#152236] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-100 truncate">{period.title}</h3>
            <span className="text-sm font-bold text-[#67e8f9] shrink-0">
              ${period.amount}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {period.dueDate && (
              <span style={{ color: dueDateColor }}>
                Due {formatDueDate(period.dueDate)}
              </span>
            )}
            <span className="text-slate-400">
              {paidCount}/{totalCount} paid
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#22c55e] rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <ChevronDown
          size={16}
          className={cn('text-slate-400 transition-transform shrink-0', expanded && 'rotate-180')}
        />
      </button>

      {/* Expanded player list */}
      {expanded && (
        <div className="border-t border-white/10">
          {/* Payment method links */}
          {teamSettings.paymentMethods && teamSettings.paymentMethods.length > 0 && (
            <div className="px-5 py-3 border-b border-white/[0.07] flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Pay via:</span>
              {teamSettings.paymentMethods.map((pm) => {
                const href =
                  pm.app === 'venmo'
                    ? `https://venmo.com/${pm.username}`
                    : pm.app === 'paypal'
                    ? `https://paypal.me/${pm.username}`
                    : pm.app === 'cashapp'
                    ? `https://cash.app/$${pm.username}`
                    : null;

                if (pm.app === 'zelle' || pm.app === 'applepay') {
                  return (
                    <span
                      key={pm.app}
                      title={pm.app === 'zelle' ? 'Pay via your bank app to ' + pm.username : 'Apple Cash: ' + pm.username}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-slate-300 cursor-default"
                    >
                      <Info size={11} />
                      {pm.displayName || (pm.app === 'zelle' ? 'Zelle' : 'Apple Cash')}
                    </span>
                  );
                }

                return href ? (
                  <a
                    key={pm.app}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#67e8f9]/10 border border-[#67e8f9]/20 text-xs text-[#67e8f9] hover:bg-[#67e8f9]/20 transition-colors"
                  >
                    {pm.displayName || pm.app}
                    <ExternalLink size={10} />
                  </a>
                ) : null;
              })}
            </div>
          )}

          {/* Player rows */}
          <div className="divide-y divide-white/[0.05]">
            {players.map((player) => {
              const pp = period.playerPayments.find((p) => p.playerId === player.id);
              const status = pp?.status ?? 'unpaid';

              return (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3',
                    isAdmin && 'cursor-pointer hover:bg-[#152236] transition-colors'
                  )}
                  onClick={() => isAdmin && handleTogglePayment(player.id)}
                >
                  <Avatar player={player} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    {pp?.notes && (
                      <p className="text-xs text-slate-500 truncate">{pp.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {pp?.amount != null && pp.amount > 0 && (
                      <p className="text-xs text-slate-400">${pp.amount}</p>
                    )}
                    <span className={cn(
                      'inline-block text-xs font-semibold px-2 py-0.5 rounded-full',
                      status === 'paid'
                        ? 'bg-[#22c55e]/15 text-[#22c55e]'
                        : status === 'partial'
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-rose-500/15 text-rose-400'
                    )}>
                      {status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
