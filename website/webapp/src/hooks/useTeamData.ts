'use client';

import { useEffect } from 'react';
import { useTeamStore } from '@/lib/store';
import { startRealtimeSync, stopRealtimeSync } from '@/lib/realtime-sync';

export function useTeamData() {
  const isLoggedIn = useTeamStore((s) => s.isLoggedIn);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);

  useEffect(() => {
    if (!isLoggedIn || !activeTeamId) return;
    startRealtimeSync(activeTeamId);
    return () => stopRealtimeSync();
  }, [isLoggedIn, activeTeamId]);
}
