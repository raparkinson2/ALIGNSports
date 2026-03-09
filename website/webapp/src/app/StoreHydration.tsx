'use client';

import { useEffect } from 'react';
import { useTeamStore } from '@/lib/store';

export default function StoreHydration() {
  useEffect(() => {
    useTeamStore.persist.rehydrate();
  }, []);
  return null;
}
