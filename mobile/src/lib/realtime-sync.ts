/**
 * Realtime Sync Manager
 *
 * Subscribes to all Supabase tables and updates the local Zustand store
 * in real-time. This is the core of cross-device sync for games, events,
 * payments, players, and game responses.
 *
 * Call startRealtimeSync(teamId) when a user logs in.
 * Call stopRealtimeSync() on logout.
 */

import { supabase } from './supabase';
import { useTeamStore } from './store';
import type { Game, Event, Player, Photo } from './store';

let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeTeamId: string | null = null;

// ─── Row → Store mappers ──────────────────────────────────────────────────────

function mapGame(g: any): Game {
  return {
    id: g.id,
    opponent: g.opponent,
    date: g.date,
    time: g.time,
    location: g.location,
    address: g.address || '',
    jerseyColor: g.jersey_color || '',
    notes: g.notes,
    showBeerDuty: g.show_beer_duty || false,
    beerDutyPlayerId: g.beer_duty_player_id,
    lineup: g.hockey_lineup,
    basketballLineup: g.basketball_lineup,
    baseballLineup: g.baseball_lineup,
    soccerLineup: g.soccer_lineup,
    soccerDiamondLineup: g.soccer_diamond_lineup,
    inviteReleaseOption: g.invite_release_option || 'now',
    inviteReleaseDate: g.invite_release_date,
    invitesSent: g.invites_sent || false,
    checkedInPlayers: [],
    checkedOutPlayers: [],
    invitedPlayers: [],
    photos: [],
  };
}

function mapEvent(e: any): Event {
  return {
    id: e.id,
    title: e.title,
    type: e.type || 'other',
    date: e.date,
    time: e.time,
    location: e.location,
    address: e.address,
    notes: e.notes,
    invitedPlayers: [],
    confirmedPlayers: [],
  };
}

function mapPlayer(p: any): Player {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    phone: p.phone,
    number: p.jersey_number || '',
    position: p.position || 'C',
    positions: p.positions || [],
    avatar: p.avatar,
    roles: p.roles || [],
    status: p.status || 'active',
    isInjured: p.is_injured || false,
    isSuspended: p.is_suspended || false,
    stats: p.stats || {},
    goalieStats: p.goalie_stats || {},
    pitcherStats: p.pitcher_stats || {},
    gameLogs: p.game_logs || [],
  };
}

// ─── Supabase write helpers ───────────────────────────────────────────────────

export async function pushGameToSupabase(game: Game, teamId: string): Promise<void> {
  try {
    await supabase.from('games').upsert({
      id: game.id,
      team_id: teamId,
      opponent: game.opponent,
      date: game.date,
      time: game.time,
      location: game.location,
      address: game.address,
      jersey_color: game.jerseyColor,
      notes: game.notes,
      show_beer_duty: game.showBeerDuty || false,
      beer_duty_player_id: game.beerDutyPlayerId || null,
      hockey_lineup: game.lineup,
      basketball_lineup: game.basketballLineup,
      baseball_lineup: game.baseballLineup,
      soccer_lineup: game.soccerLineup,
      soccer_diamond_lineup: game.soccerDiamondLineup,
      invite_release_option: game.inviteReleaseOption || 'now',
      invite_release_date: game.inviteReleaseDate || null,
      invites_sent: game.invitesSent || false,
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('SYNC: pushGameToSupabase error:', err);
  }
}

export async function deleteGameFromSupabase(gameId: string): Promise<void> {
  try {
    await supabase.from('games').delete().eq('id', gameId);
  } catch (err) {
    console.error('SYNC: deleteGameFromSupabase error:', err);
  }
}

export async function pushEventToSupabase(event: Event, teamId: string): Promise<void> {
  try {
    await supabase.from('events').upsert({
      id: event.id,
      team_id: teamId,
      title: event.title,
      type: event.type || 'other',
      date: event.date,
      time: event.time,
      location: event.location,
      address: event.address || null,
      notes: event.notes || null,
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('SYNC: pushEventToSupabase error:', err);
  }
}

export async function deleteEventFromSupabase(eventId: string): Promise<void> {
  try {
    await supabase.from('events').delete().eq('id', eventId);
  } catch (err) {
    console.error('SYNC: deleteEventFromSupabase error:', err);
  }
}

export async function pushGameResponseToSupabase(
  gameId: string,
  playerId: string,
  response: 'in' | 'out' | 'invited'
): Promise<void> {
  try {
    await supabase.from('game_responses').upsert(
      { game_id: gameId, player_id: playerId, response },
      { onConflict: 'game_id,player_id' }
    );
  } catch (err) {
    console.error('SYNC: pushGameResponseToSupabase error:', err);
  }
}

export async function pushEventResponseToSupabase(
  eventId: string,
  playerId: string,
  response: 'confirmed' | 'declined' | 'invited'
): Promise<void> {
  try {
    await supabase.from('event_responses').upsert(
      { event_id: eventId, player_id: playerId, response },
      { onConflict: 'event_id,player_id' }
    );
  } catch (err) {
    console.error('SYNC: pushEventResponseToSupabase error:', err);
  }
}

export async function pushPlayerToSupabase(player: Player, teamId: string): Promise<void> {
  try {
    await supabase.from('players').upsert({
      id: player.id,
      team_id: teamId,
      first_name: player.firstName,
      last_name: player.lastName,
      email: player.email || null,
      phone: player.phone || null,
      jersey_number: player.number,
      position: player.position,
      positions: player.positions || [],
      avatar: player.avatar || null,
      roles: player.roles || [],
      status: player.status || 'active',
      is_injured: player.isInjured || false,
      is_suspended: player.isSuspended || false,
      stats: player.stats || {},
      goalie_stats: player.goalieStats || {},
      pitcher_stats: player.pitcherStats || {},
      game_logs: player.gameLogs || [],
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('SYNC: pushPlayerToSupabase error:', err);
  }
}

export async function pushPaymentPeriodToSupabase(period: any, teamId: string): Promise<void> {
  try {
    await supabase.from('payment_periods').upsert({
      id: period.id,
      team_id: teamId,
      title: period.title,
      amount: period.amount,
      type: period.type || 'dues',
      due_date: period.dueDate || null,
    }, { onConflict: 'id' });

    // Also upsert all player payment rows
    if (period.playerPayments && period.playerPayments.length > 0) {
      for (const pp of period.playerPayments) {
        await supabase.from('player_payments').upsert({
          id: pp.id,
          payment_period_id: period.id,
          player_id: pp.playerId,
          status: pp.status || 'unpaid',
          amount: pp.amountPaid || 0,
          notes: pp.notes || null,
          paid_at: pp.paidAt || null,
        }, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.error('SYNC: pushPaymentPeriodToSupabase error:', err);
  }
}

// ─── Full team fetch (used for initial sync) ──────────────────────────────────

export async function fetchAndApplyFullTeamSync(teamId: string): Promise<void> {
  const store = useTeamStore.getState();

  try {
    console.log('SYNC: Starting full team fetch for:', teamId);

    // Fetch games
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: true });

    // Fetch all game responses for this team's games
    const gameIds = (gamesData || []).map((g: any) => g.id);
    let gameResponsesMap: Record<string, { checkedIn: string[]; checkedOut: string[]; invited: string[] }> = {};

    if (gameIds.length > 0) {
      const { data: responsesData } = await supabase
        .from('game_responses')
        .select('*')
        .in('game_id', gameIds);

      for (const r of responsesData || []) {
        if (!gameResponsesMap[r.game_id]) {
          gameResponsesMap[r.game_id] = { checkedIn: [], checkedOut: [], invited: [] };
        }
        if (r.response === 'in') gameResponsesMap[r.game_id].checkedIn.push(r.player_id);
        else if (r.response === 'out') gameResponsesMap[r.game_id].checkedOut.push(r.player_id);
        else if (r.response === 'invited') gameResponsesMap[r.game_id].invited.push(r.player_id);
      }
    }

    // Fetch events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: true });

    // Fetch event responses
    const eventIds = (eventsData || []).map((e: any) => e.id);
    let eventResponsesMap: Record<string, { confirmed: string[]; declined: string[]; invited: string[] }> = {};

    if (eventIds.length > 0) {
      const { data: eventResponses } = await supabase
        .from('event_responses')
        .select('*')
        .in('event_id', eventIds);

      for (const r of eventResponses || []) {
        if (!eventResponsesMap[r.event_id]) {
          eventResponsesMap[r.event_id] = { confirmed: [], declined: [], invited: [] };
        }
        if (r.response === 'confirmed') eventResponsesMap[r.event_id].confirmed.push(r.player_id);
        else if (r.response === 'declined') eventResponsesMap[r.event_id].declined.push(r.player_id);
        else if (r.response === 'invited') eventResponsesMap[r.event_id].invited.push(r.player_id);
      }
    }

    // Fetch players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId);

    // Fetch payment periods
    const { data: paymentPeriodsData } = await supabase
      .from('payment_periods')
      .select('*')
      .eq('team_id', teamId)
      .order('sort_order', { ascending: true });

    const periodIds = (paymentPeriodsData || []).map((p: any) => p.id);
    let playerPaymentsMap: Record<string, any[]> = {};

    if (periodIds.length > 0) {
      const { data: playerPayments } = await supabase
        .from('player_payments')
        .select('*')
        .in('payment_period_id', periodIds);

      for (const pp of playerPayments || []) {
        if (!playerPaymentsMap[pp.payment_period_id]) {
          playerPaymentsMap[pp.payment_period_id] = [];
        }
        playerPaymentsMap[pp.payment_period_id].push(pp);
      }
    }

    // Map games
    const games: Game[] = (gamesData || []).map((g: any) => {
      const resp = gameResponsesMap[g.id] || { checkedIn: [], checkedOut: [], invited: [] };
      return {
        ...mapGame(g),
        checkedInPlayers: resp.checkedIn,
        checkedOutPlayers: resp.checkedOut,
        invitedPlayers: [...resp.checkedIn, ...resp.checkedOut, ...resp.invited],
      };
    });

    // Map events
    const events: Event[] = (eventsData || []).map((e: any) => {
      const resp = eventResponsesMap[e.id] || { confirmed: [], declined: [], invited: [] };
      return {
        ...mapEvent(e),
        confirmedPlayers: resp.confirmed,
        invitedPlayers: [...resp.confirmed, ...resp.declined, ...resp.invited],
      };
    });

    // Map players (preserve local password fields - only update non-sensitive fields)
    const localPlayers = store.players;
    const players: Player[] = (playersData || []).map((p: any) => {
      const local = localPlayers.find((lp) => lp.id === p.id);
      return {
        ...mapPlayer(p),
        // Preserve local-only fields that Supabase doesn't store
        password: local?.password,
        securityQuestion: local?.securityQuestion,
        securityAnswer: local?.securityAnswer,
        notificationPreferences: local?.notificationPreferences,
      };
    });

    // Map payment periods
    const paymentPeriods = (paymentPeriodsData || []).map((pp: any) => {
      const playerPayments = (playerPaymentsMap[pp.id] || []).map((p: any) => ({
        playerId: p.player_id,
        status: (p.status || 'unpaid') as 'unpaid' | 'paid' | 'partial',
        amount: parseFloat(p.amount) || 0,
        notes: p.notes,
        paidAt: p.paid_at,
        entries: [],
      }));

      return {
        id: pp.id,
        title: pp.title,
        amount: parseFloat(pp.amount) || 0,
        type: (pp.type || 'misc') as any,
        dueDate: pp.due_date,
        playerPayments,
        createdAt: pp.created_at || new Date().toISOString(),
      };
    });

    // Apply to store — merge with existing local data, don't wipe local-only fields
    const currentState = useTeamStore.getState();

    // Only update if we got data back (don't wipe local data on network errors)
    if (gamesData !== null) {
      useTeamStore.setState({ games });
    }
    if (eventsData !== null) {
      useTeamStore.setState({ events });
    }
    if (playersData !== null && players.length > 0) {
      useTeamStore.setState({ players });
    }
    if (paymentPeriodsData !== null) {
      useTeamStore.setState({ paymentPeriods });
    }

    console.log('SYNC: Full sync complete -', games.length, 'games,', events.length, 'events,', players.length, 'players,', paymentPeriods.length, 'payment periods');
  } catch (err) {
    console.error('SYNC: fetchAndApplyFullTeamSync error:', err);
  }
}

// ─── Realtime subscriptions ───────────────────────────────────────────────────

export function startRealtimeSync(teamId: string): void {
  if (activeTeamId === teamId && activeChannel) {
    console.log('SYNC: Already subscribed for team:', teamId);
    return;
  }

  stopRealtimeSync();
  activeTeamId = teamId;

  console.log('SYNC: Starting realtime sync for team:', teamId);

  // Do an immediate full sync first
  fetchAndApplyFullTeamSync(teamId);

  const channel = supabase.channel(`team-sync:${teamId}`)

    // ── GAMES ──────────────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'games',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Game INSERT');
      const store = useTeamStore.getState();
      const game = mapGame(payload.new);
      const exists = store.games.some((g) => g.id === game.id);
      if (!exists) {
        useTeamStore.setState({ games: [...store.games, game] });
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'games',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Game UPDATE', payload.new.id);
      const store = useTeamStore.getState();
      const updatedGame = mapGame(payload.new);
      // Preserve local check-in state when merging
      const existing = store.games.find((g) => g.id === updatedGame.id);
      const merged = {
        ...updatedGame,
        checkedInPlayers: existing?.checkedInPlayers || [],
        checkedOutPlayers: existing?.checkedOutPlayers || [],
        invitedPlayers: existing?.invitedPlayers || [],
        photos: existing?.photos || [],
      };
      useTeamStore.setState({
        games: store.games.map((g) => g.id === merged.id ? merged : g),
      });
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'games',
    }, (payload) => {
      console.log('SYNC: Game DELETE', payload.old.id);
      const store = useTeamStore.getState();
      useTeamStore.setState({
        games: store.games.filter((g) => g.id !== payload.old.id),
      });
    })

    // ── GAME RESPONSES ─────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_responses',
    }, (payload) => {
      console.log('SYNC: Game response change');
      const store = useTeamStore.getState();
      const row = (payload.new || payload.old) as any;
      if (!row?.game_id) return;

      const games = store.games.map((game) => {
        if (game.id !== row.game_id) return game;

        let checkedIn = [...(game.checkedInPlayers || [])];
        let checkedOut = [...(game.checkedOutPlayers || [])];
        let invited = [...(game.invitedPlayers || [])];

        // Remove old response for this player first
        checkedIn = checkedIn.filter((id) => id !== row.player_id);
        checkedOut = checkedOut.filter((id) => id !== row.player_id);
        invited = invited.filter((id) => id !== row.player_id);

        if (payload.eventType !== 'DELETE') {
          if (row.response === 'in') {
            checkedIn.push(row.player_id);
            if (!invited.includes(row.player_id)) invited.push(row.player_id);
          } else if (row.response === 'out') {
            checkedOut.push(row.player_id);
            if (!invited.includes(row.player_id)) invited.push(row.player_id);
          } else if (row.response === 'invited') {
            if (!invited.includes(row.player_id)) invited.push(row.player_id);
          }
        }

        return { ...game, checkedInPlayers: checkedIn, checkedOutPlayers: checkedOut, invitedPlayers: invited };
      });

      useTeamStore.setState({ games });
    })

    // ── EVENTS ─────────────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'events',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Event INSERT');
      const store = useTeamStore.getState();
      const event = mapEvent(payload.new);
      const exists = store.events.some((e) => e.id === event.id);
      if (!exists) {
        useTeamStore.setState({ events: [...store.events, event] });
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Event UPDATE');
      const store = useTeamStore.getState();
      const updated = mapEvent(payload.new);
      const existing = store.events.find((e) => e.id === updated.id);
      useTeamStore.setState({
        events: store.events.map((e) => e.id === updated.id
          ? { ...updated, confirmedPlayers: existing?.confirmedPlayers || [], invitedPlayers: existing?.invitedPlayers || [] }
          : e
        ),
      });
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'events',
    }, (payload) => {
      console.log('SYNC: Event DELETE');
      const store = useTeamStore.getState();
      useTeamStore.setState({ events: store.events.filter((e) => e.id !== payload.old.id) });
    })

    // ── EVENT RESPONSES ────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'event_responses',
    }, (payload) => {
      console.log('SYNC: Event response change');
      const store = useTeamStore.getState();
      const row = (payload.new || payload.old) as any;
      if (!row?.event_id) return;

      const events = store.events.map((event) => {
        if (event.id !== row.event_id) return event;

        let confirmed = [...(event.confirmedPlayers || [])];
        let invited = [...(event.invitedPlayers || [])];

        confirmed = confirmed.filter((id) => id !== row.player_id);
        invited = invited.filter((id) => id !== row.player_id);

        if (payload.eventType !== 'DELETE') {
          if (row.response === 'confirmed') {
            confirmed.push(row.player_id);
            if (!invited.includes(row.player_id)) invited.push(row.player_id);
          } else if (row.response === 'invited' || row.response === 'declined') {
            if (!invited.includes(row.player_id)) invited.push(row.player_id);
          }
        }

        return { ...event, confirmedPlayers: confirmed, invitedPlayers: invited };
      });

      useTeamStore.setState({ events });
    })

    // ── PLAYERS ────────────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'players',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Player INSERT');
      const store = useTeamStore.getState();
      const player = mapPlayer(payload.new);
      const exists = store.players.some((p) => p.id === player.id);
      if (!exists) {
        useTeamStore.setState({ players: [...store.players, player] });
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'players',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      console.log('SYNC: Player UPDATE');
      const store = useTeamStore.getState();
      const updated = mapPlayer(payload.new);
      const local = store.players.find((p) => p.id === updated.id);
      useTeamStore.setState({
        players: store.players.map((p) => p.id === updated.id
          ? { ...updated, password: local?.password, securityQuestion: local?.securityQuestion, securityAnswer: local?.securityAnswer, notificationPreferences: local?.notificationPreferences }
          : p
        ),
      });
    })

    // ── PAYMENT PERIODS ────────────────────────────────────────────────────────
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'payment_periods',
      filter: `team_id=eq.${teamId}`,
    }, async (payload) => {
      console.log('SYNC: Payment period change');
      // Re-fetch full payment data on any change (simpler than incremental)
      await refetchPayments(teamId);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'player_payments',
    }, async (payload) => {
      console.log('SYNC: Player payment change');
      await refetchPayments(teamId);
    });

  channel.subscribe((status) => {
    console.log('SYNC: Subscription status:', status);
  });

  activeChannel = channel;
}

async function refetchPayments(teamId: string): Promise<void> {
  try {
    const { data: periodsData } = await supabase
      .from('payment_periods')
      .select('*')
      .eq('team_id', teamId)
      .order('sort_order', { ascending: true });

    if (!periodsData) return;

    const periodIds = periodsData.map((p: any) => p.id);
    let playerPaymentsMap: Record<string, any[]> = {};

    if (periodIds.length > 0) {
      const { data: playerPayments } = await supabase
        .from('player_payments')
        .select('*')
        .in('payment_period_id', periodIds);

      for (const pp of playerPayments || []) {
        if (!playerPaymentsMap[pp.payment_period_id]) {
          playerPaymentsMap[pp.payment_period_id] = [];
        }
        playerPaymentsMap[pp.payment_period_id].push(pp);
      }
    }

    const paymentPeriods = periodsData.map((pp: any) => ({
      id: pp.id,
      title: pp.title,
      amount: parseFloat(pp.amount) || 0,
      type: (pp.type || 'misc') as any,
      dueDate: pp.due_date,
      createdAt: pp.created_at || new Date().toISOString(),
      playerPayments: (playerPaymentsMap[pp.id] || []).map((p: any) => ({
        playerId: p.player_id,
        status: (p.status || 'unpaid') as 'unpaid' | 'paid' | 'partial',
        amount: parseFloat(p.amount) || 0,
        notes: p.notes,
        paidAt: p.paid_at,
        entries: [],
      })),
    }));

    useTeamStore.setState({ paymentPeriods });
  } catch (err) {
    console.error('SYNC: refetchPayments error:', err);
  }
}

export function stopRealtimeSync(): void {
  if (activeChannel) {
    console.log('SYNC: Stopping realtime sync');
    activeChannel.unsubscribe();
    activeChannel = null;
    activeTeamId = null;
  }
}

export function getActiveSyncTeamId(): string | null {
  return activeTeamId;
}
