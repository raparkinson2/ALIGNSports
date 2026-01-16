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
  baseball: 'Baseball',
  basketball: 'Basketball',
  hockey: 'Hockey',
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

export interface BaseballPitcherStats {
  starts: number;
  wins: number;
  losses: number;
  innings: number;
  completeGames: number;
  strikeouts: number;
  walks: number;
  hits: number;
  homeRuns: number;
  shutouts: number;
  earnedRuns: number;
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

export type PlayerStats = HockeyStats | HockeyGoalieStats | BaseballStats | BaseballPitcherStats | BasketballStats | SoccerStats | SoccerGoalieStats;

// Game log entry for tracking individual game stats
export interface GameLogEntry {
  id: string;
  date: string; // ISO string
  stats: PlayerStats;
  statType: 'skater' | 'goalie' | 'batter' | 'pitcher'; // Which type of stats this log is for
}

// Types
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string; // For authentication
  phone?: string;
  number: string;
  position: string; // Primary position (first in positions array)
  positions?: string[]; // All positions player can play
  avatar?: string;
  roles: PlayerRole[]; // Array of roles - can be admin, captain, or both
  status: PlayerStatus; // active or reserve (this is separate from roles)
  isInjured?: boolean; // Player is injured
  isSuspended?: boolean; // Player is suspended
  notificationPreferences?: NotificationPreferences;
  stats?: PlayerStats; // Regular player stats (batter for baseball, skater for hockey/soccer)
  pitcherStats?: BaseballPitcherStats; // Separate stats for pitching (baseball only)
  goalieStats?: HockeyGoalieStats | SoccerGoalieStats; // Separate stats for goalie (hockey/soccer only)
  gameLogs?: GameLogEntry[]; // Individual game stat logs
}

// Helper to get full name from player
export const getPlayerName = (player: Player): string => {
  return `${player.firstName} ${player.lastName}`.trim();
};

// Helper to get initials from player (for avatar fallback)
export const getPlayerInitials = (player: Player): string => {
  const first = player.firstName?.charAt(0)?.toUpperCase() || '';
  const last = player.lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

// Helper to get all positions for a player (returns positions array or falls back to single position)
export const getPlayerPositions = (player: Player): string[] => {
  if (player.positions && player.positions.length > 0) {
    return player.positions;
  }
  return [player.position];
};

// Helper to get primary position (first position)
export const getPrimaryPosition = (player: Player): string => {
  if (player.positions && player.positions.length > 0) {
    return player.positions[0];
  }
  return player.position;
};

// Hockey Lines Types
export interface HockeyForwardLine {
  lw?: string; // player id
  c?: string;  // player id
  rw?: string; // player id
}

export interface HockeyDefenseLine {
  ld?: string; // player id
  rd?: string; // player id
}

export interface HockeyGoalieLine {
  g?: string; // player id
}

export interface HockeyLineup {
  forwardLines: HockeyForwardLine[]; // 1-4 lines
  defenseLines: HockeyDefenseLine[]; // 1-4 lines
  goalieLines: HockeyGoalieLine[]; // 1-2 lines
  numForwardLines: number; // 1-4
  numDefenseLines: number; // 1-4
  numGoalieLines: number;  // 1-2
}

// Basketball Lineup Types
export interface BasketballStartingFive {
  pg?: string; // Point Guard - max 1
  guards: (string | undefined)[]; // Guards (G) - max 3
  forwards: (string | undefined)[]; // Forwards (F) - max 2
  centers: (string | undefined)[]; // Centers (C) - max 2
}

export interface BasketballLineup {
  starters: BasketballStartingFive;
  bench: (string | undefined)[]; // Up to 10 bench spots
  // Configuration for how many of each position in starting 5
  numGuards: number; // 0-3
  numForwards: number; // 0-2
  numCenters: number; // 0-2
  hasPG: boolean; // 0 or 1
}

// Baseball Lineup Types
export interface BaseballLineup {
  lf?: string;  // Left Field
  cf?: string;  // Center Field
  rf?: string;  // Right Field
  thirdBase?: string; // 3B
  shortstop?: string; // SS
  secondBase?: string; // 2B
  firstBase?: string; // 1B
  pitcher?: string; // P
  catcher?: string; // C
}

// Soccer Lineup Types (11 starters)
export interface SoccerLineup {
  gk?: string;  // Goalkeeper
  lb?: string;  // Left Back
  cb1?: string; // Center Back 1
  cb2?: string; // Center Back 2
  rb?: string;  // Right Back
  lm?: string;  // Left Midfield
  cm1?: string; // Center Midfield 1
  cm2?: string; // Center Midfield 2
  rm?: string;  // Right Midfield
  st1?: string; // Striker 1
  st2?: string; // Striker 2
}

// Soccer Diamond Midfield Lineup Types (4-1-2-1-2)
export interface SoccerDiamondLineup {
  gk?: string;  // Goalkeeper
  lb?: string;  // Left Back
  cb1?: string; // Center Back 1
  cb2?: string; // Center Back 2
  rb?: string;  // Right Back
  cdm?: string; // Center Defensive Midfielder
  lm?: string;  // Left Midfielder
  rm?: string;  // Right Midfielder
  cam?: string; // Center Attacking Midfielder
  st1?: string; // Striker 1
  st2?: string; // Striker 2
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
  checkedInPlayers: string[]; // player ids marked as IN
  checkedOutPlayers: string[]; // player ids marked as OUT
  invitedPlayers: string[]; // player ids
  photos: string[];
  showBeerDuty: boolean; // Admin toggle for beer/refreshment duty display
  beerDutyPlayerId?: string; // Player responsible for bringing beverages
  lineup?: HockeyLineup; // Hockey line combinations
  basketballLineup?: BasketballLineup; // Basketball lineup
  baseballLineup?: BaseballLineup; // Baseball lineup
  soccerLineup?: SoccerLineup; // Soccer lineup (4-4-2)
  soccerDiamondLineup?: SoccerDiamondLineup; // Soccer diamond midfield lineup (4-1-2-1-2)
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
  imageUrl?: string; // For images from camera/gallery
  gifUrl?: string; // For GIFs from GIPHY
  gifWidth?: number; // GIF original width
  gifHeight?: number; // GIF original height
  createdAt: string;
}

// Payment tracking types
export type PaymentApp = 'venmo' | 'paypal' | 'zelle' | 'cashapp' | 'applepay';

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
  showTeamStats?: boolean; // Toggle to show/hide team stats feature
  showPayments?: boolean; // Toggle to show/hide payments tab
  showTeamChat?: boolean; // Toggle to show/hide team chat tab
  showPhotos?: boolean; // Toggle to show/hide photos tab
  showRefreshmentDuty?: boolean; // Toggle to show/hide refreshment duty feature
  refreshmentDutyIs21Plus?: boolean; // If true, use beer icon; if false, use juice box icon
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
  clearPlayerResponse: (gameId: string, playerId: string) => void;
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

  // Authentication
  loginWithEmail: (email: string, password: string) => { success: boolean; error?: string; playerId?: string };
  registerAdmin: (name: string, email: string, password: string, teamName: string) => { success: boolean; error?: string };
  registerInvitedPlayer: (email: string, password: string) => { success: boolean; error?: string; playerId?: string };
  findPlayerByEmail: (email: string) => Player | undefined;
  loginWithApple: (appleUser: string, email: string | null, fullName: { givenName: string | null; familyName: string | null } | null) => { success: boolean; error?: string; playerId?: string; isNewUser?: boolean };

  // Helper to check if current user has admin/captain privileges
  canManageTeam: () => boolean;
  isAdmin: () => boolean;

  // Notification Preferences
  updateNotificationPreferences: (playerId: string, prefs: Partial<NotificationPreferences>) => void;
  getNotificationPreferences: (playerId: string) => NotificationPreferences;

  // Game Logs
  addGameLog: (playerId: string, gameLog: GameLogEntry) => void;
  removeGameLog: (playerId: string, gameLogId: string) => void;

  // Reset all data
  resetAllData: () => void;
}

// Empty initial data for fresh start
const initialPlayers: Player[] = [];
const initialGames: Game[] = [];

const defaultTeamSettings: TeamSettings = {
  sport: 'hockey',
  jerseyColors: [
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#1a1a1a' },
  ],
  paymentMethods: [],
  showTeamStats: true,
  showPayments: true,
  showTeamChat: true,
  showPhotos: true,
  showRefreshmentDuty: true,
  refreshmentDutyIs21Plus: true,
};

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teamName: 'My Team',
      setTeamName: (name) => set({ teamName: name }),

      teamSettings: defaultTeamSettings,
      setTeamSettings: (settings) => set((state) => {
        const newSettings = { ...state.teamSettings, ...settings };

        // If sport is changing, remap all player positions and clear old sport data
        if (settings.sport && settings.sport !== state.teamSettings.sport) {
          const fromSport = state.teamSettings.sport;
          const toSport = settings.sport;
          const updatedPlayers = state.players.map((player) => {
            // Map only the primary position to the new sport
            const newPosition = mapPosition(player.position, fromSport, toSport);
            return {
              ...player,
              position: newPosition,
              positions: [newPosition], // Reset to single position for new sport
              stats: undefined, // Clear stats when switching sports
            };
          });
          return {
            teamSettings: newSettings,
            players: updatedPlayers,
          };
        }

        return { teamSettings: newSettings };
      }),

      players: initialPlayers,
      addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      removePlayer: (id) => set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

      games: initialGames,
      addGame: (game) => set((state) => ({ games: [...state.games, game] })),
      updateGame: (id, updates) => set((state) => ({
        games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      })),
      removeGame: (id) => set((state) => ({ games: state.games.filter((g) => g.id !== id) })),

      checkInToGame: (gameId, playerId) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                checkedInPlayers: (g.checkedInPlayers || []).includes(playerId)
                  ? g.checkedInPlayers
                  : [...(g.checkedInPlayers || []), playerId],
                checkedOutPlayers: (g.checkedOutPlayers || []).filter((id) => id !== playerId)
              }
            : g
        ),
      })),
      checkOutFromGame: (gameId, playerId) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                checkedInPlayers: (g.checkedInPlayers || []).filter((id) => id !== playerId),
                checkedOutPlayers: (g.checkedOutPlayers || []).includes(playerId)
                  ? g.checkedOutPlayers
                  : [...(g.checkedOutPlayers || []), playerId]
              }
            : g
        ),
      })),
      clearPlayerResponse: (gameId: string, playerId: string) => set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                checkedInPlayers: (g.checkedInPlayers || []).filter((id) => id !== playerId),
                checkedOutPlayers: (g.checkedOutPlayers || []).filter((id) => id !== playerId)
              }
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

      // Notifications - start empty
      notifications: [],
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

      // Chat - start empty
      chatMessages: [],
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

      currentPlayerId: null, // No default player
      setCurrentPlayerId: (id) => set({ currentPlayerId: id }),

      isLoggedIn: false,
      setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      logout: () => set({ isLoggedIn: false, currentPlayerId: null }),

      // Authentication
      loginWithEmail: (email, password) => {
        const state = get();
        const player = state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
        if (!player) {
          return { success: false, error: 'No account found with this email' };
        }
        if (!player.password) {
          return { success: false, error: 'Please create an account first' };
        }
        if (player.password !== password) {
          return { success: false, error: 'Incorrect password' };
        }
        set({ currentPlayerId: player.id, isLoggedIn: true });
        return { success: true, playerId: player.id };
      },

      registerAdmin: (name, email, password, teamName) => {
        const state = get();
        // Check if email already exists
        const existingPlayer = state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
        if (existingPlayer?.password) {
          return { success: false, error: 'An account with this email already exists' };
        }

        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newPlayer: Player = {
          id: Date.now().toString(),
          firstName,
          lastName,
          email: email.toLowerCase(),
          password,
          number: '1',
          position: SPORT_POSITIONS[state.teamSettings.sport][0],
          roles: ['admin'],
          status: 'active',
        };

        set({
          teamName,
          players: [newPlayer],
          currentPlayerId: newPlayer.id,
          isLoggedIn: true,
        });

        return { success: true };
      },

      registerInvitedPlayer: (email, password) => {
        const state = get();
        const player = state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
        if (!player) {
          return { success: false, error: 'No invitation found for this email. Ask your team admin to add you.' };
        }
        if (player.password) {
          return { success: false, error: 'Account already exists. Please log in instead.' };
        }

        // Update player with password
        const updatedPlayers = state.players.map((p) =>
          p.id === player.id ? { ...p, password } : p
        );

        set({
          players: updatedPlayers,
          currentPlayerId: player.id,
          isLoggedIn: true,
        });

        return { success: true, playerId: player.id };
      },

      findPlayerByEmail: (email) => {
        const state = get();
        return state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
      },

      loginWithApple: (appleUser, email, fullName) => {
        const state = get();

        // First, check if we already have a player with this Apple ID
        const existingPlayerByAppleId = state.players.find((p) => (p as Player & { appleUserId?: string }).appleUserId === appleUser);
        if (existingPlayerByAppleId) {
          set({ currentPlayerId: existingPlayerByAppleId.id, isLoggedIn: true });
          return { success: true, playerId: existingPlayerByAppleId.id, isNewUser: false };
        }

        // Check if email matches an existing player (link Apple ID to existing account)
        if (email) {
          const existingPlayerByEmail = state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
          if (existingPlayerByEmail) {
            // Link Apple ID to existing account
            const updatedPlayers = state.players.map((p) =>
              p.id === existingPlayerByEmail.id ? { ...p, appleUserId: appleUser } as Player : p
            );
            set({
              players: updatedPlayers,
              currentPlayerId: existingPlayerByEmail.id,
              isLoggedIn: true,
            });
            return { success: true, playerId: existingPlayerByEmail.id, isNewUser: false };
          }
        }

        // No existing account found - create a new admin user for a new team
        // This handles both first-time users and users who want to create a new team
        if (state.players.length > 0) {
          // Team exists but this Apple ID isn't linked - they need an invitation
          // OR they can create a new team from the Create Team screen
          return { success: false, error: 'No account found with this Apple ID. Ask your team admin to add you, or create a new team.' };
        }

        // Create new admin user for new team
        const firstName = fullName?.givenName || 'User';
        const lastName = fullName?.familyName || '';

        const newPlayer: Player = {
          id: Date.now().toString(),
          firstName,
          lastName,
          email: email || undefined,
          number: '1',
          position: SPORT_POSITIONS[state.teamSettings.sport][0],
          roles: ['admin'],
          status: 'active',
        };

        // Add appleUserId to the player object
        const playerWithApple = { ...newPlayer, appleUserId: appleUser } as Player;

        set({
          players: [playerWithApple],
          currentPlayerId: newPlayer.id,
          isLoggedIn: true,
        });

        return { success: true, playerId: newPlayer.id, isNewUser: true };
      },

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

      // Game Logs
      addGameLog: (playerId, gameLog) => set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId
            ? { ...p, gameLogs: [...(p.gameLogs || []), gameLog] }
            : p
        ),
      })),
      removeGameLog: (playerId, gameLogId) => set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId
            ? { ...p, gameLogs: (p.gameLogs || []).filter((g) => g.id !== gameLogId) }
            : p
        ),
      })),

      // Reset all data to defaults
      resetAllData: () => set((state) => {
        // Preserve the current user's account and permissions
        const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
        const preservedPlayer = currentPlayer ? {
          ...currentPlayer,
          // Clear player stats but keep their identity and permissions
          stats: undefined,
        } : null;

        return {
          teamName: 'My Team',
          teamSettings: {
            sport: state.teamSettings.sport, // Keep the sport setting
            jerseyColors: [
              { name: 'White', color: '#ffffff' },
              { name: 'Black', color: '#1a1a1a' },
            ],
            paymentMethods: [],
            teamLogo: undefined,
            record: undefined,
            showTeamStats: true,
            showPayments: true,
            showTeamChat: true,
            showPhotos: true,
            showRefreshmentDuty: true,
            refreshmentDutyIs21Plus: true,
          },
          players: preservedPlayer ? [preservedPlayer] : [],
          games: [],
          events: [],
          photos: [],
          notifications: [],
          chatMessages: [],
          chatLastReadAt: {},
          paymentPeriods: [],
          // Keep the current user logged in
          currentPlayerId: preservedPlayer ? state.currentPlayerId : null,
          isLoggedIn: preservedPlayer ? true : false,
        };
      }),
    }),
    {
      name: 'team-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 7, // Force logout for fresh testing
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<TeamStore> | null;
        // Version 7: Force logout for fresh testing but preserve team data
        if (version < 7) {
          return {
            ...(state || {}),
            isLoggedIn: false,
            currentPlayerId: null,
          };
        }
        // Version 6: Complete reset to fresh state
        if (version < 6) {
          return {
            teamName: 'My Team',
            teamSettings: {
              sport: 'hockey' as Sport,
              jerseyColors: [
                { name: 'White', color: '#ffffff' },
                { name: 'Black', color: '#1a1a1a' },
              ],
              paymentMethods: [],
              teamLogo: undefined,
              record: undefined,
              showTeamStats: true,
              showPayments: true,
              showTeamChat: true,
              showPhotos: true,
              showRefreshmentDuty: true,
              refreshmentDutyIs21Plus: true,
            },
            players: [],
            games: [],
            events: [],
            photos: [],
            notifications: [],
            chatMessages: [],
            chatLastReadAt: {},
            paymentPeriods: [],
            currentPlayerId: null,
            isLoggedIn: false,
          };
        }
        return persistedState;
      },
    }
  )
);
