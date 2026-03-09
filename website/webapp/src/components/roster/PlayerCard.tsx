'use client';

import React from 'react';
import { Pencil, AlertTriangle, Ban, Shield, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerName, getPrimaryPosition } from '@/lib/types';
import type { Player } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface PlayerCardProps {
  player: Player;
  isAdmin: boolean;
  onEdit?: (player: Player) => void;
  onClick?: (player: Player) => void;
}

export default function PlayerCard({ player, isAdmin, onEdit, onClick }: PlayerCardProps) {
  const name = getPlayerName(player);
  const primaryPos = getPrimaryPosition(player);
  const isActive = player.status === 'active';

  return (
    <div
      className={cn(
        'bg-[#0f1a2e] border border-white/10 rounded-2xl p-4 hover:bg-[#152236] hover:border-white/20 transition-all cursor-pointer',
        !isActive && 'opacity-75'
      )}
      onClick={() => onClick?.(player)}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar player={player} size="lg" />
          {/* Status indicator */}
          <span className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f1a2e]',
            isActive ? 'bg-[#22c55e]' : 'bg-slate-500'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-100 truncate">{name}</h3>
                {/* Role badges */}
                {player.roles.includes('admin') && (
                  <span title="Admin" className="text-[#67e8f9]">
                    <Shield size={13} />
                  </span>
                )}
                {player.roles.includes('captain') && (
                  <span
                    className="text-[10px] font-bold bg-[#67e8f9]/20 text-[#67e8f9] px-1.5 py-0.5 rounded"
                    title="Captain"
                  >
                    C
                  </span>
                )}
                {player.roles.includes('coach') && (
                  <span
                    className="text-[10px] font-bold bg-[#a78bfa]/20 text-[#a78bfa] px-1.5 py-0.5 rounded"
                    title="Coach"
                  >
                    Coach
                  </span>
                )}
                {player.roles.includes('parent') && (
                  <span className="text-slate-500" title="Parent">
                    <Users size={12} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {/* Jersey number */}
                {player.number && (
                  <span className="text-xs font-mono text-slate-400">#{player.number}</span>
                )}
                {/* Position */}
                {primaryPos && (
                  <span className="text-xs text-slate-500">{primaryPos}</span>
                )}
                {/* Status */}
                {!isActive && (
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                    Reserve
                  </span>
                )}
              </div>
            </div>

            {/* Edit button (admin) */}
            {isAdmin && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(player); }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0"
                aria-label="Edit player"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          {/* Injury / suspension badges */}
          {(player.isInjured || player.isSuspended) && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {player.isInjured && (
                <span className="flex items-center gap-1 text-[10px] font-medium bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                  <AlertTriangle size={10} />
                  Injured
                </span>
              )}
              {player.isSuspended && (
                <span className="flex items-center gap-1 text-[10px] font-medium bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <Ban size={10} />
                  SUS
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
