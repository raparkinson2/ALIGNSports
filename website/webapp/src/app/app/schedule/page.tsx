'use client';

import React, { useState, useMemo } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import { pushGameResponseToSupabase, pushEventResponseToSupabase } from '@/lib/realtime-sync';
import GameCard from '@/components/schedule/GameCard';
import EventCard from '@/components/schedule/EventCard';
import AddGameModal from '@/components/schedule/AddGameModal';
import AddEventModal from '@/components/schedule/AddEventModal';
import { cn } from '@/lib/utils';
import type { Game, Event } from '@/lib/types';

type ScheduleItem =
  | { kind: 'game'; item: Game; sortKey: string }
  | { kind: 'event'; item: Event; sortKey: string };

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function SchedulePage() {
  const games = useTeamStore((s) => s.games);
  const events = useTeamStore((s) => s.events);
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const checkInToGame = useTeamStore((s) => s.checkInToGame);
  const checkOutFromGame = useTeamStore((s) => s.checkOutFromGame);
  const confirmEventAttendance = useTeamStore((s) => s.confirmEventAttendance);
  const declineEventAttendance = useTeamStore((s) => s.declineEventAttendance);
  const { isAdmin } = usePermissions();

  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showPast, setShowPast] = useState(false);

  const today = todayStr();

  const allItems: ScheduleItem[] = useMemo(() => {
    const gameItems: ScheduleItem[] = games.map((g) => ({
      kind: 'game',
      item: g,
      sortKey: `${g.date}T${g.time || '00:00'}`,
    }));
    const eventItems: ScheduleItem[] = events.map((e) => ({
      kind: 'event',
      item: e,
      sortKey: `${e.date}T${e.time || '00:00'}`,
    }));
    return [...gameItems, ...eventItems].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [games, events]);

  const upcomingItems = allItems.filter((x) => x.item.date >= today);
  const pastItems = allItems
    .filter((x) => x.item.date < today)
    .reverse()
    .slice(0, 10);

  const handleGameRsvp = async (gameId: string, response: 'in' | 'out') => {
    if (!currentPlayerId) return;
    // Optimistic update
    if (response === 'in') {
      checkInToGame(gameId, currentPlayerId);
    } else {
      checkOutFromGame(gameId, currentPlayerId);
    }
    await pushGameResponseToSupabase(gameId, currentPlayerId, response);
  };

  const handleEventRsvp = async (eventId: string, response: 'confirmed' | 'declined') => {
    if (!currentPlayerId) return;
    if (response === 'confirmed') {
      confirmEventAttendance(eventId, currentPlayerId);
    } else {
      declineEventAttendance(eventId, currentPlayerId);
    }
    await pushEventResponseToSupabase(eventId, currentPlayerId, response);
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setShowAddGame(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowAddEvent(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with admin buttons */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-100">Schedule</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditingGame(null); setShowAddGame(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#67e8f9]/10 border border-[#67e8f9]/20 text-[#67e8f9] text-sm font-medium hover:bg-[#67e8f9]/20 transition-all"
            >
              <Plus size={15} />
              Game
            </button>
            <button
              onClick={() => { setEditingEvent(null); setShowAddEvent(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa] text-sm font-medium hover:bg-[#a78bfa]/20 transition-all"
            >
              <Plus size={15} />
              Event
            </button>
          </div>
        )}
      </div>

      {/* Upcoming section */}
      <section className="mb-8">
        {upcomingItems.length === 0 ? (
          <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No upcoming games or events</p>
            {isAdmin && (
              <p className="text-slate-500 text-xs mt-1">Use the buttons above to add some</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingItems.map((x) => {
              if (x.kind === 'game') {
                return (
                  <GameCard
                    key={x.item.id}
                    game={x.item}
                    players={players}
                    currentPlayerId={currentPlayerId}
                    isAdmin={isAdmin}
                    teamSettings={teamSettings}
                    onEdit={handleEditGame}
                    onRsvp={handleGameRsvp}
                  />
                );
              }
              return (
                <EventCard
                  key={x.item.id}
                  event={x.item}
                  currentPlayerId={currentPlayerId}
                  isAdmin={isAdmin}
                  onEdit={handleEditEvent}
                  onRsvp={handleEventRsvp}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Past games (collapsible) */}
      {pastItems.length > 0 && (
        <section>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            <ChevronDown size={16} className={cn('transition-transform', showPast && 'rotate-180')} />
            Past ({pastItems.length})
          </button>

          {showPast && (
            <div className="space-y-3 opacity-70">
              {pastItems.map((x) => {
                if (x.kind === 'game') {
                  return (
                    <GameCard
                      key={x.item.id}
                      game={x.item}
                      players={players}
                      currentPlayerId={currentPlayerId}
                      isAdmin={isAdmin}
                      teamSettings={teamSettings}
                      onEdit={handleEditGame}
                    />
                  );
                }
                return (
                  <EventCard
                    key={x.item.id}
                    event={x.item}
                    currentPlayerId={currentPlayerId}
                    isAdmin={isAdmin}
                    onEdit={handleEditEvent}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      <AddGameModal
        isOpen={showAddGame}
        onClose={() => { setShowAddGame(false); setEditingGame(null); }}
        existingGame={editingGame}
      />
      <AddEventModal
        isOpen={showAddEvent}
        onClose={() => { setShowAddEvent(false); setEditingEvent(null); }}
        existingEvent={editingEvent}
      />
    </div>
  );
}
