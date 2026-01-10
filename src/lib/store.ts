import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sport Types and Positions
export type Sport = 'hockey' | 'baseball' | 'basketball' | 'soccer';

export const SPORT_POSITIONS: Record<Sport, string[]> = {
  hockey: ['C', 'LW', 'RW', 'LD', 'RD', 'G'],
  baseball: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'RF', 'CF'],
  basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  soccer: ['GK', 'DEF', 'MID', 'FWD'],
};

export const SPORT_POSITION_NAMES: Record<Sport, Record<string, string>> = {
  hockey: {
    C: 'Center',
    LW: 'Left Wing',
    RW: 'Right Wing',
    LD: 'Left Defense',
    RD: 'Right Defense',
    G: 'Goalie',
  },
  baseball: {
    P: 'Pitcher',
    C: 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    SS: 'Shortstop',
    LF: 'Left Field',
    RF: 'Right Field',
    CF: 'Center Field',
  },
  basketball: {
    PG: 'Point Guard',
    SG: 'Shooting Guard',
    SF: 'Small Forward',
    PF: 'Power Forward',
    C: 'Center',
  },
  soccer: {
    GK: 'Goalkeeper',
    DEF: 'Defender',
    MID: 'Midfielder',
    FWD: 'Forward',
  },
};

// Map positions from one sport to another based on role similarity
export const POSITION_MAPPING: Record<Sport, Record<string, Record<Sport, string>>> = {
  hockey: {
    G: { hockey: 'G', baseball: 'C', basketball: 'C', soccer: 'GK' },
    LD: { hockey: 'LD', baseball: '3B', basketball: 'PF', soccer: 'DEF' },
    RD: { hockey: 'RD', baseball: 'SS', basketball: 'C', soccer: 'DEF' },
    C: { hockey: 'C', baseball: 'SS', basketball: 'PG', soccer: 'MID' },
    LW: { hockey: 'LW', baseball: 'LF', basketball: 'SG', soccer: 'FWD' },
    RW: { hockey: 'RW', baseball: 'RF', basketball: 'SF', soccer: 'FWD' },
  },
  baseball: {
    P: { hockey: 'G', baseball: 'P', basketball: 'C', soccer: 'GK' },
    C: { hockey: 'G', baseball: 'C', basketball: 'C', soccer: 'GK' },
    '1B': { hockey: 'LD', baseball: '1B', basketball: 'PF', soccer: 'DEF' },
    '2B': { hockey: 'C', baseball: '2B', basketball: 'PG', soccer: 'MID' },
    '3B': { hockey: 'LD', baseball: '3B', basketball: 'PF', soccer: 'DEF' },
    SS: { hockey: 'C', baseball: 'SS', basketball: 'PG', soccer: 'MID' },
    LF: { hockey: 'LW', baseball: 'LF', basketball: 'SG', soccer: 'FWD' },
    RF: { hockey: 'RW', baseball: 'RF', basketball: 'SF', soccer: 'FWD' },
    CF: { hockey: 'C', baseball: 'CF', basketball: 'SF', soccer: 'MID' },
  },
  basketball: {
    PG: { hockey: 'C', baseball: 'SS', basketball: 'PG', soccer: 'MID' },
    SG: { hockey: 'LW', baseball: 'LF', basketball: 'SG', soccer: 'FWD' },
    SF: { hockey: 'RW', baseball: 'RF', basketball: 'SF', soccer: 'FWD' },
    PF: { hockey: 'LD', baseball: '3B', basketball: 'PF', soccer: 'DEF' },
    C: { hockey: 'G', baseball: 'C', basketball: 'C', soccer: 'GK' },
  },
  soccer: {
    GK: { hockey: 'G', baseball: 'C', basketball: 'C', soccer: 'GK' },
    DEF: { hockey: 'LD', baseball: '3B', basketball: 'PF', soccer: 'DEF' },
    MID: { hockey: 'C', baseball: 'SS', basketball: 'PG', soccer: 'MID' },
    FWD: { hockey: 'LW', baseball: 'LF', basketball: 'SG', soccer: 'FWD' },
  },
};

// Helper to map a position from one sport to another
export const mapPosition = (currentPosition: string, fromSport: Sport, toSport: Sport): string => {
  if (fromSport === toSport) return currentPosition;

  // Check if we have a mapping for this position
  const sportMapping = POSITION_MAPPING[fromSport];
  if (sportMapping && sportMapping[currentPosition]) {
    return sportMapping[currentPosition][toSport];
  }

  // Fallback: return first position of the target sport
  return SPORT_POSITIONS[toSport][0];
};

export const SPORT_NAMES: Record<Sport, string> = {
  hockey: 'Hockey',
  baseball: 'Baseball',
  basketball: 'Basketball',
  soccer: 'Soccer',
};

// Role Types
export type PlayerRole = 'admin' | 'captain';

// Player Status
export type PlayerStatus = 'active' | 'reserve';

// Notification Preferences
export interface NotificationPreferences {
  gameInvites: boolean;
  gameReminderDayBefore: boolean;
  gameReminderHoursBefore: boolean;
  chatMessages: boolean;
  paymentReminders: boolean;
  pushToken?: string; // For future push notification implementation
}

export const defaultNotificationPreferences: NotificationPreferences = {
  gameInvites: true,
  gameReminderDayBefore: true,
  gameReminderHoursBefore: true,
  chatMessages: true,
  paymentReminders: true,
};

// Sport-specific player stats
export interface HockeyStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  pim: number; // Penalty minutes
  plusMinus: number; // +/-
}

export interface HockeyGoalieStats {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  minutesPlayed: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
}

export interface BaseballStats {
  gamesPlayed: number;
  atBats: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  strikeouts: number;
}

export interface BasketballStats {
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

export interface SoccerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
}

export interface SoccerGoalieStats {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  minutesPlayed: number;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
}

export type PlayerStats = HockeyStats | HockeyGoalieStats | BaseballStats | BasketballStats | SoccerStats | SoccerGoalieStats;

// Types
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  number: string;
  position: string;
  avatar?: string;
  roles: PlayerRole[]; // Array of roles - can be admin, captain, or both
  status: PlayerStatus; // active or reserve (this is separate from roles)
  notificationPreferences?: NotificationPreferences;
  stats?: PlayerStats;
}

export interface Game {
  id: string;
  opponent: string;
  date: string; // ISO string
  time: string;
  location: string;
  address: string;
  jerseyColor: string;
  notes?: string;
  checkedInPlayers: string[]; // player ids
  invitedPlayers: string[]; // player ids
  photos: string[];
  showBeerDuty: boolean; // Admin toggle for beer/refreshment duty display
  beerDutyPlayerId?: string; // Player responsible for bringing beverages
}

// In-app notification types
export interface AppNotification {
  id: string;
  type: 'game_invite' | 'game_reminder' | 'payment_reminder' | 'chat_message';
  title: string;
  message: string;
  gameId?: string;
  fromPlayerId?: string;
  toPlayerId: string;
  createdAt: string;
  read: boolean;
}

// Chat message type
export interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

// Payment tracking types
export type PaymentApp = 'venmo' | 'paypal' | 'zelle' | 'cashapp';

export interface PaymentMethod {
  app: PaymentApp;
  username: string; // Venmo/PayPal username or Zelle email/phone
  displayName: string; // Display name for the button
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface PlayerPayment {
  playerId: string;
  status: 'unpaid' | 'paid' | 'partial';
  amount?: number; // Total paid (computed from entries)
  notes?: string;
  paidAt?: string;
  entries: PaymentEntry[]; // Individual payment entries
}

export type PaymentPeriodType = 'dues' | 'reserve_fee' | 'facility_rental' | 'misc';

export interface PaymentPeriod {
  id: string;
  title: string;
  amount: number;
  type: PaymentPeriodType;
  dueDate?: string;
  playerPayments: PlayerPayment[];
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  type: 'practice' | 'meeting' | 'social' | 'other';
  date: string;
  time: string;
  location: string;
  address?: string;
  notes?: string;
  invitedPlayers: string[];
  confirmedPlayers: string[];
}

export interface Photo {
  id: string;
  gameId: string;
  uri: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Team Record based on sport
export interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number; // Hockey, Soccer
  otLosses?: number; // Hockey only (Overtime losses)
}

export interface TeamSettings {
  sport: Sport;
  jerseyColors: { name: string; color: string }[];
  paymentMethods: PaymentMethod[];
  teamLogo?: string;
  record?: TeamRecord;
}

interface TeamStore {
  teamName: string;
  setTeamName: (name: string) => void;

  teamSettings: TeamSettings;
  setTeamSettings: (settings: Partial<TeamSettings>) => void;

  players: Player[];
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  games: Game[];
  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  removeGame: (id: string) => void;
  checkInToGame: (gameId: string, playerId: string) => void;
  checkOutFromGame: (gameId: string, playerId: string) => void;
  invitePlayersToGame: (gameId: string, playerIds: string[]) => void;

  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  confirmEventAttendance: (eventId: string, playerId: string) => void;
  declineEventAttendance: (eventId: string, playerId: string) => void;
  invitePlayersToEvent: (eventId: string, playerIds: string[]) => void;

  photos: Photo[];
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  deleteChatMessage: (messageId: string) => void;

  // Chat read tracking
  chatLastReadAt: Record<string, string>; // playerId -> ISO timestamp
  markChatAsRead: (playerId: string) => void;
  getUnreadChatCount: (playerId: string) => number;

  // Payments
  paymentPeriods: PaymentPeriod[];
  addPaymentPeriod: (period: PaymentPeriod) => void;
  updatePaymentPeriod: (id: string, updates: Partial<PaymentPeriod>) => void;
  removePaymentPeriod: (id: string) => void;
  reorderPaymentPeriods: (periods: PaymentPeriod[]) => void;
  updatePlayerPayment: (periodId: string, playerId: string, status: 'unpaid' | 'paid' | 'partial', amount?: number, notes?: string) => void;
  addPaymentEntry: (periodId: string, playerId: string, entry: PaymentEntry) => void;
  removePaymentEntry: (periodId: string, playerId: string, entryId: string) => void;

  currentPlayerId: string | null;
  setCurrentPlayerId: (id: string | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;

  // Helper to check if current user has admin/captain privileges
  canManageTeam: () => boolean;
  isAdmin: () => boolean;

  // Notification Preferences
  updateNotificationPreferences: (playerId: string, prefs: Partial<NotificationPreferences>) => void;
  getNotificationPreferences: (playerId: string) => NotificationPreferences;
}

// Mock data
const mockPlayers: Player[] = [
  { id: '1', name: 'Mike Johnson', email: 'mike.johnson@email.com', phone: '555-0101', number: '12', position: 'C', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', roles: ['admin', 'captain'], status: 'active', stats: { gamesPlayed: 9, goals: 12, assists: 18, pim: 8, plusMinus: 5 } },
  { id: '2', name: 'Dave Williams', email: 'dave.williams@email.com', phone: '555-0102', number: '7', position: 'LW', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', roles: ['captain'], status: 'active', stats: { gamesPlayed: 8, goals: 8, assists: 14, pim: 12, plusMinus: 3 } },
  { id: '3', name: 'Chris Brown', email: 'chris.brown@email.com', phone: '555-0103', number: '22', position: 'RW', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', roles: [], status: 'active', stats: { gamesPlayed: 9, goals: 15, assists: 9, pim: 4, plusMinus: 8 } },
  { id: '4', name: 'Jake Miller', email: 'jake.miller@email.com', phone: '555-0104', number: '4', position: 'LD', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', roles: [], status: 'active', stats: { gamesPlayed: 9, goals: 2, assists: 11, pim: 18, plusMinus: -2 } },
  { id: '5', name: 'Ryan Davis', email: 'ryan.davis@email.com', phone: '555-0105', number: '8', position: 'RD', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', roles: [], status: 'active', stats: { gamesPlayed: 7, goals: 3, assists: 8, pim: 14, plusMinus: 1 } },
  { id: '6', name: 'Tom Wilson', email: 'tom.wilson@email.com', phone: '555-0106', number: '31', position: 'G', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', roles: [], status: 'active', stats: { games: 8, wins: 6, losses: 1, ties: 1, minutesPlayed: 480, shotsAgainst: 240, saves: 218, goalsAgainst: 22 } },
  { id: '7', name: 'Steve Anderson', email: 'steve.anderson@email.com', phone: '555-0107', number: '15', position: 'C', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', roles: [], status: 'reserve', stats: { gamesPlayed: 5, goals: 4, assists: 6, pim: 6, plusMinus: 2 } },
  { id: '8', name: 'Kevin Martinez', email: 'kevin.martinez@email.com', phone: '555-0108', number: '19', position: 'LW', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', roles: [], status: 'reserve', stats: { gamesPlayed: 6, goals: 5, assists: 7, pim: 10, plusMinus: 0 } },
];

const mockGames: Game[] = [
  {
    id: '1',
    opponent: 'Ice Wolves',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: '8:30 PM',
    location: 'Glacier Ice Arena',
    address: '1234 Frozen Lake Drive',
    jerseyColor: 'White',
    checkedInPlayers: ['1', '3', '4', '6'],
    invitedPlayers: ['1', '2', '3', '4', '5', '6'],
    photos: [],
    showBeerDuty: true,
    beerDutyPlayerId: '3',
  },
  {
    id: '2',
    opponent: 'Polar Bears',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '9:15 PM',
    location: 'Northside Ice Complex',
    address: '567 Winter Road',
    jerseyColor: 'Black',
    checkedInPlayers: ['2', '5'],
    invitedPlayers: ['1', '2', '3', '4', '5', '6', '7', '8'],
    photos: [],
    showBeerDuty: true,
    beerDutyPlayerId: '4',
  },
  {
    id: '3',
    opponent: 'Frost Giants',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '7:45 PM',
    location: 'Downtown Ice Center',
    address: '890 Main Street',
    jerseyColor: 'White',
    checkedInPlayers: [],
    invitedPlayers: ['1', '2', '3', '4', '5', '6'],
    photos: [],
    showBeerDuty: false,
  },
];

const defaultTeamSettings: TeamSettings = {
  sport: 'hockey',
  jerseyColors: [
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#1a1a1a' },
  ],
  paymentMethods: [
    { app: 'venmo', username: 'raparkinson2', displayName: 'Venmo' },
    { app: 'paypal', username: 'raparkinson2@gmail.com', displayName: 'PayPal' },
  ],
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teamName: 'Blue Line Bandits',
      setTeamName: (name) => set({ teamName: name }),

      teamSettings: defaultTeamSettings,
      setTeamSettings: (settings) => set((state) => {
        const newSettings = { ...state.teamSettings, ...settings };

        // If sport is changing, remap all player positions
        if (settings.sport && settings.sport !== state.teamSettings.sport) {
          const fromSport = state.teamSettings.sport;
          const toSport = settings.sport;
          const updatedPlayers = state.players.map((player) => ({
            ...player,
            position: mapPosition(player.position, fromSport, toSport),
            // Keep stats - user can manually update them if needed
          }));
          return {
            teamSettings: newSettings,
            players: updatedPlayers,
          };
        }

        return { teamSettings: newSettings };
      }),

      players: mockPlayers,
      addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      removePlayer: (id) => set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

      games: mockGames,
      addGame: (game) => set((state) => ({ games: [...state.games, game] })),
      updateGame: (id, updates) => set((state) => ({
        games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      })),
      removeGame: (id) => set((state) => ({ games: state.games.filter((g) => g.id !== id) })),

      checkInToGame: (gameId, playerId) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId && !g.checkedInPlayers.includes(playerId)
            ? { ...g, checkedInPlayers: [...g.checkedInPlayers, playerId] }
            : g
        ),
      })),
      checkOutFromGame: (gameId, playerId) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? { ...g, checkedInPlayers: g.checkedInPlayers.filter((id) => id !== playerId) }
            : g
        ),
      })),
      invitePlayersToGame: (gameId, playerIds) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId ? { ...g, invitedPlayers: playerIds } : g
        ),
      })),

      events: [],
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      confirmEventAttendance: (eventId, playerId) => set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId && !e.confirmedPlayers.includes(playerId)
            ? { ...e, confirmedPlayers: [...e.confirmedPlayers, playerId] }
            : e
        ),
      })),
      declineEventAttendance: (eventId, playerId) => set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, confirmedPlayers: e.confirmedPlayers.filter((id) => id !== playerId) }
            : e
        ),
      })),
      invitePlayersToEvent: (eventId, playerIds) => set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, invitedPlayers: playerIds } : e
        ),
      })),

      photos: [],
      addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
      removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),

      // Notifications - start with some mock notifications
      notifications: [
        {
          id: 'notif-1',
          type: 'game_invite',
          title: 'Game Invite',
          message: 'You\'ve been invited to play vs Ice Wolves',
          gameId: '1',
          toPlayerId: '1',
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'notif-2',
          type: 'game_reminder',
          title: 'Game Tomorrow',
          message: 'Don\'t forget: Game vs Ice Wolves tomorrow at 8:30 PM',
          gameId: '1',
          toPlayerId: '1',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
      ],
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => {
        const state = get();
        const currentPlayerId = state.currentPlayerId;
        return state.notifications.filter(
          (n) => n.toPlayerId === currentPlayerId && !n.read
        ).length;
      },

      // Chat - start with some mock messages
      chatMessages: [
        {
          id: 'chat-1',
          senderId: '7', // Steve Anderson
          message: 'Whats up brother?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'chat-2',
          senderId: '4', // Jake Miller
          message: 'We better fucking win.',
          createdAt: new Date(Date.now() - 2400000).toISOString(),
        },
        {
          id: 'chat-3',
          senderId: '3', // Chris Brown
          message: 'Thats dusty.',
          createdAt: new Date(Date.now() - 1200000).toISOString(),
        },
      ],
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
      deleteChatMessage: (messageId) => set((state) => ({
        chatMessages: state.chatMessages.filter((m) => m.id !== messageId),
      })),

      // Chat read tracking
      chatLastReadAt: {},
      markChatAsRead: (playerId) => set((state) => ({
        chatLastReadAt: {
          ...state.chatLastReadAt,
          [playerId]: new Date().toISOString(),
        },
      })),
      getUnreadChatCount: (playerId) => {
        const state = get();
        const lastReadAt = state.chatLastReadAt[playerId];
        if (!lastReadAt) {
          // If never read, count all messages from others
          return state.chatMessages.filter((m) => m.senderId !== playerId).length;
        }
        // Count messages from others after last read time
        return state.chatMessages.filter(
          (m) => m.senderId !== playerId && new Date(m.createdAt) > new Date(lastReadAt)
        ).length;
      },

      // Payments
      paymentPeriods: [],
      addPaymentPeriod: (period) => set((state) => ({
        paymentPeriods: [...state.paymentPeriods, period],
      })),
      updatePaymentPeriod: (id, updates) => set((state) => ({
        paymentPeriods: state.paymentPeriods.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
      removePaymentPeriod: (id) => set((state) => ({
        paymentPeriods: state.paymentPeriods.filter((p) => p.id !== id),
      })),
      reorderPaymentPeriods: (periods) => set(() => ({
        paymentPeriods: periods,
      })),
      updatePlayerPayment: (periodId, playerId, status, amount, notes) => set((state) => ({
        paymentPeriods: state.paymentPeriods.map((period) => {
          if (period.id !== periodId) return period;
          const existingPayment = period.playerPayments.find((pp) => pp.playerId === playerId);
          if (existingPayment) {
            return {
              ...period,
              playerPayments: period.playerPayments.map((pp) =>
                pp.playerId === playerId
                  ? { ...pp, status, amount, notes, paidAt: status === 'paid' ? new Date().toISOString() : undefined }
                  : pp
              ),
            };
          } else {
            return {
              ...period,
              playerPayments: [
                ...period.playerPayments,
                { playerId, status, amount, notes, entries: [], paidAt: status === 'paid' ? new Date().toISOString() : undefined },
              ],
            };
          }
        }),
      })),

      addPaymentEntry: (periodId, playerId, entry) => set((state) => ({
        paymentPeriods: state.paymentPeriods.map((period) => {
          if (period.id !== periodId) return period;
          const existingPayment = period.playerPayments.find((pp) => pp.playerId === playerId);
          if (existingPayment) {
            const newEntries = [...(existingPayment.entries || []), entry];
            const totalPaid = newEntries.reduce((sum, e) => sum + e.amount, 0);
            const status = totalPaid >= period.amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
            return {
              ...period,
              playerPayments: period.playerPayments.map((pp) =>
                pp.playerId === playerId
                  ? { ...pp, entries: newEntries, amount: totalPaid, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined }
                  : pp
              ),
            };
          } else {
            const totalPaid = entry.amount;
            const status = totalPaid >= period.amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
            return {
              ...period,
              playerPayments: [
                ...period.playerPayments,
                { playerId, status, amount: totalPaid, entries: [entry], paidAt: status === 'paid' ? new Date().toISOString() : undefined },
              ],
            };
          }
        }),
      })),

      removePaymentEntry: (periodId, playerId, entryId) => set((state) => ({
        paymentPeriods: state.paymentPeriods.map((period) => {
          if (period.id !== periodId) return period;
          const existingPayment = period.playerPayments.find((pp) => pp.playerId === playerId);
          if (!existingPayment) return period;
          const newEntries = (existingPayment.entries || []).filter((e) => e.id !== entryId);
          const totalPaid = newEntries.reduce((sum, e) => sum + e.amount, 0);
          const status = totalPaid >= period.amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
          return {
            ...period,
            playerPayments: period.playerPayments.map((pp) =>
              pp.playerId === playerId
                ? { ...pp, entries: newEntries, amount: totalPaid, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined }
                : pp
            ),
          };
        }),
      })),

      currentPlayerId: '1', // Default to first player (admin)
      setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

      isLoggedIn: false,
      setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      logout: () => set({ isLoggedIn: false, currentPlayerId: null }),

      canManageTeam: () => {
        const state = get();
        const currentPlayer = state.players.find((p) => p.id === state.currentPlayerId);
        return currentPlayer?.roles?.includes('admin') || currentPlayer?.roles?.includes('captain') || false;
      },
      isAdmin: () => {
        const state = get();
        const currentPlayer = state.players.find((p) => p.id === state.currentPlayerId);
        return currentPlayer?.roles?.includes('admin') || false;
      },

      // Notification Preferences
      updateNotificationPreferences: (playerId, prefs) => set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                notificationPreferences: {
                  ...(p.notificationPreferences || defaultNotificationPreferences),
                  ...prefs,
                },
              }
            : p
        ),
      })),
      getNotificationPreferences: (playerId) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        return player?.notificationPreferences || defaultNotificationPreferences;
      },
    }),
    {
      name: 'team-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4, // Increment to fix corrupted player positions and stats
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<TeamStore>;
        // Force update players to have correct positions and stats
        if (version < 4) {
          return {
            ...state,
            players: mockPlayers, // Reset to mock data with correct positions
            teamSettings: defaultTeamSettings, // Reset to hockey
          };
        }
        return state as TeamStore;
      },
    }
  )
);
