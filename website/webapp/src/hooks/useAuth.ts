'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTeamStore } from '@/lib/store';
import { loadTeamFromSupabase } from '@/lib/realtime-sync';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const isLoggedIn = useTeamStore((s) => s.isLoggedIn);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // If we have a valid session but aren't logged in to a team yet, try to load data
        if (!isLoggedIn && activeTeamId) {
          await loadTeamFromSupabase(activeTeamId);
        }
      } else {
        // No session — force logout state
        if (isLoggedIn) {
          useTeamStore.getState().logout();
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        useTeamStore.getState().logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? null;

  return { loading, isLoggedIn, currentPlayer, currentPlayerId };
}
