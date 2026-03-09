'use client';

import { useTeamStore } from '@/lib/store';

export function usePermissions() {
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;

  const roles = currentPlayer?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isCaptain = roles.includes('captain');
  const isCoach = roles.includes('coach');
  const isParent = roles.includes('parent');
  const canManage = isAdmin || isCaptain;

  return { isAdmin, isCaptain, isCoach, isParent, canManage, currentPlayer };
}
