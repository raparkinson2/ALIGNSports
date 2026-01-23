import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

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
export type PlayerRole = 'admin' | 'captain' | 'coach';

// Player Status
export type PlayerStatus = 'active' | 'reserve';

// Notification Preferences
export interface NotificationPreferences {
  gameInvites: boolean;
  gameReminderDayBefore: boolean;
  gameReminderHoursBefore: boolean;
  chatMessages: boolean;
  chatMentions: boolean; // Get notified when @mentioned in chat
  paymentReminders: boolean;
  pushToken?: string; // For future push notification implementation
}

export const defaultNotificationPreferences: NotificationPreferences = {
  gameInvites: true,
  gameReminderDayBefore: true,
  gameReminderHoursBefore: true,
  chatMessages: true,
  chatMentions: true,
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
// Security Questions for password recovery
export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite sports team?",
  "What was the make of your first car?",
  "What street did you grow up on?",
  "What is your favorite movie?",
] as const;

export type SecurityQuestion = typeof SECURITY_QUESTIONS[number];

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string; // For authentication
  securityQuestion?: SecurityQuestion; // For password recovery
  securityAnswer?: string; // Answer to security question (stored lowercase for comparison)
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

// Invite release options
export type InviteReleaseOption = 'now' | 'scheduled' | 'none';

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
  // Invite release settings
  inviteReleaseOption?: InviteReleaseOption; // 'now' | 'scheduled' | 'none'
  inviteReleaseDate?: string; // ISO string - when to release invites (only if scheduled)
  invitesSent?: boolean; // Whether invites have been sent
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
  mentionedPlayerIds?: string[]; // Player IDs mentioned with @ (empty array = @all)
  mentionType?: 'all' | 'specific'; // 'all' for @everyone, 'specific' for individual mentions
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
  showLineups?: boolean; // Toggle to show/hide lines/lineups feature
}

// Multi-team support: A complete team with all its data
export interface Team {
  id: string;
  teamName: string;
  teamSettings: TeamSettings;
  players: Player[];
  games: Game[];
  events: Event[];
  photos: Photo[];
  notifications: AppNotification[];
  chatMessages: ChatMessage[];
  chatLastReadAt: Record<string, string>;
  paymentPeriods: PaymentPeriod[];
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
  releaseScheduledGameInvites: () => Game[]; // Returns games that were released

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
  loginWithEmail: (email: string, password: string) => { success: boolean; error?: string; playerId?: string; multipleTeams?: boolean; teamCount?: number };
  loginWithPhone: (phone: string, password: string) => { success: boolean; error?: string; playerId?: string; multipleTeams?: boolean; teamCount?: number };
  registerAdmin: (name: string, email: string, password: string, teamName: string, options?: { phone?: string; jerseyNumber?: string; isCoach?: boolean }) => { success: boolean; error?: string };
  registerInvitedPlayer: (email: string, password: string) => { success: boolean; error?: string; playerId?: string };
  registerInvitedPlayerByPhone: (phone: string, password: string) => { success: boolean; error?: string; playerId?: string };
  findPlayerByEmail: (email: string) => Player | undefined;
  findPlayerByPhone: (phone: string) => Player | undefined;

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

  // Multi-team support
  teams: Team[];
  activeTeamId: string | null;
  userEmail: string | null; // User's email for cross-team identity
  userPhone: string | null; // User's phone for cross-team identity
  pendingTeamIds: string[] | null; // Teams to choose from after login (null = no pending selection)

  // Multi-team methods
  addTeam: (team: Team) => void;
  switchTeam: (teamId: string) => void;
  getTeamsForUser: () => Team[];
  getUserTeamCount: () => number;
  setPendingTeamSelection: (teamIds: string[]) => void;
  clearPendingTeamSelection: () => void;
  createNewTeam: (teamName: string, sport: Sport, adminPlayer: Player) => string; // Returns new team ID
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
  showLineups: true,
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
      releaseScheduledGameInvites: () => {
        const state = get();
        const now = new Date();
        const gamesToRelease: Game[] = [];

        // Find games with scheduled invites that are past due
        state.games.forEach((game) => {
          if (
            game.inviteReleaseOption === 'scheduled' &&
            game.inviteReleaseDate &&
            !game.invitesSent
          ) {
            const releaseDate = new Date(game.inviteReleaseDate);
            if (releaseDate <= now) {
              gamesToRelease.push(game);
            }
          }
        });

        if (gamesToRelease.length > 0) {
          // Update the games to mark invites as sent
          set((state) => ({
            games: state.games.map((g) => {
              const shouldRelease = gamesToRelease.some((gr) => gr.id === g.id);
              if (shouldRelease) {
                return { ...g, invitesSent: true };
              }
              return g;
            }),
          }));

          // Create in-app notifications for each game
          gamesToRelease.forEach((game) => {
            const gameDate = new Date(game.date);
            const formattedDate = gameDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            // Create notification for each invited player
            game.invitedPlayers?.forEach((playerId) => {
              const notification: AppNotification = {
                id: `game-invite-${game.id}-${playerId}-${Date.now()}`,
                type: 'game_invite',
                title: 'New Game Added!',
                message: `You've been invited to play vs ${game.opponent} on ${formattedDate} at ${game.time}`,
                gameId: game.id,
                toPlayerId: playerId,
                read: false,
                createdAt: new Date().toISOString(),
              };
              get().addNotification(notification);
            });
          });
        }

        return gamesToRelease;
      },

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
      logout: () => set({ isLoggedIn: false, currentPlayerId: null, userEmail: null, userPhone: null, pendingTeamIds: null }),

      // Authentication
      loginWithEmail: (email, password) => {
        const state = get();

        // First, find ALL teams where this email exists (regardless of password)
        const teamsWithEmail: { team: Team; player: Player }[] = [];
        let hasValidPassword = false;

        state.teams.forEach((team) => {
          const player = team.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
          if (player) {
            teamsWithEmail.push({ team, player });
            if (player.password === password) {
              hasValidPassword = true;
            }
          }
        });

        // If no teams found with this email, check fallback
        if (teamsWithEmail.length === 0) {
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
          set({ currentPlayerId: player.id, isLoggedIn: true, userEmail: email.toLowerCase() });
          return { success: true, playerId: player.id };
        }

        // Verify password matches in at least one team
        if (!hasValidPassword) {
          // Check legacy data for password
          const legacyPlayer = state.players.find((p) => p.email?.toLowerCase() === email.toLowerCase());
          if (legacyPlayer?.password === password) {
            hasValidPassword = true;
          }
        }

        if (!hasValidPassword) {
          return { success: false, error: 'Incorrect password' };
        }

        // Password is valid - check if user exists in MULTIPLE teams
        if (teamsWithEmail.length > 1) {
          set({
            userEmail: email.toLowerCase(),
            pendingTeamIds: teamsWithEmail.map((t) => t.team.id),
          });
          return { success: true, multipleTeams: true, teamCount: teamsWithEmail.length };
        }

        // User exists in exactly one team
        const { team, player } = teamsWithEmail[0];
        set({
          activeTeamId: team.id,
          teamName: team.teamName,
          teamSettings: team.teamSettings,
          players: team.players,
          games: team.games,
          events: team.events,
          photos: team.photos,
          notifications: team.notifications,
          chatMessages: team.chatMessages,
          chatLastReadAt: team.chatLastReadAt,
          paymentPeriods: team.paymentPeriods,
          currentPlayerId: player.id,
          isLoggedIn: true,
          userEmail: email.toLowerCase(),
          pendingTeamIds: null,
        });
        return { success: true, playerId: player.id };
      },

      loginWithPhone: (phone, password) => {
        const state = get();
        const normalizedPhone = phone.replace(/\D/g, '');

        console.log('LOGIN PHONE: Checking teams array, length:', state.teams.length);
        console.log('LOGIN PHONE: Looking for phone:', normalizedPhone);

        // First, find ALL teams where this phone number exists (regardless of password)
        const teamsWithPhone: { team: Team; player: Player }[] = [];
        let hasValidPassword = false;

        state.teams.forEach((team) => {
          const player = team.players.find((p) => p.phone?.replace(/\D/g, '') === normalizedPhone);
          console.log('LOGIN PHONE: Team', team.teamName, '- found player:', player ? 'yes' : 'no', player?.password ? 'has password' : 'no password');
          if (player) {
            teamsWithPhone.push({ team, player });
            if (player.password === password) {
              hasValidPassword = true;
            }
          }
        });

        console.log('LOGIN PHONE: Teams with this phone:', teamsWithPhone.length, 'has valid password in any:', hasValidPassword);

        // If no teams found with this phone, check fallback
        if (teamsWithPhone.length === 0) {
          console.log('LOGIN PHONE: No teams found, checking legacy state.players');
          const player = state.players.find((p) => p.phone?.replace(/\D/g, '') === normalizedPhone);
          if (!player) {
            return { success: false, error: 'No account found with this phone number' };
          }
          if (!player.password) {
            return { success: false, error: 'Please create an account first' };
          }
          if (player.password !== password) {
            return { success: false, error: 'Incorrect password' };
          }
          set({ currentPlayerId: player.id, isLoggedIn: true, userPhone: normalizedPhone });
          return { success: true, playerId: player.id };
        }

        // Verify password matches in at least one team
        if (!hasValidPassword) {
          // Check legacy data for password
          const legacyPlayer = state.players.find((p) => p.phone?.replace(/\D/g, '') === normalizedPhone);
          if (legacyPlayer?.password === password) {
            hasValidPassword = true;
          }
        }

        if (!hasValidPassword) {
          return { success: false, error: 'Incorrect password' };
        }

        // Password is valid - check if user exists in MULTIPLE teams
        if (teamsWithPhone.length > 1) {
          console.log('LOGIN PHONE: User exists in multiple teams, showing team selection');
          set({
            userPhone: normalizedPhone,
            pendingTeamIds: teamsWithPhone.map((t) => t.team.id),
          });
          return { success: true, multipleTeams: true, teamCount: teamsWithPhone.length };
        }

        // User exists in exactly one team
        const { team, player } = teamsWithPhone[0];
        set({
          activeTeamId: team.id,
          teamName: team.teamName,
          teamSettings: team.teamSettings,
          players: team.players,
          games: team.games,
          events: team.events,
          photos: team.photos,
          notifications: team.notifications,
          chatMessages: team.chatMessages,
          chatLastReadAt: team.chatLastReadAt,
          paymentPeriods: team.paymentPeriods,
          currentPlayerId: player.id,
          isLoggedIn: true,
          userPhone: normalizedPhone,
          pendingTeamIds: null,
        });
        return { success: true, playerId: player.id };
      },

      registerAdmin: (name, email, password, teamName, options) => {
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

        const isCoach = options?.isCoach ?? false;
        const roles: PlayerRole[] = isCoach ? ['admin', 'coach'] : ['admin'];

        const newPlayer: Player = {
          id: Date.now().toString(),
          firstName,
          lastName,
          email: email.toLowerCase(),
          password,
          phone: options?.phone,
          number: isCoach ? '' : (options?.jerseyNumber || '1'),
          position: isCoach ? 'Coach' : SPORT_POSITIONS[state.teamSettings.sport][0],
          roles,
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

      registerInvitedPlayerByPhone: (phone, password) => {
        const state = get();
        // Normalize phone to just digits for comparison
        const normalizedPhone = phone.replace(/\D/g, '');
        const player = state.players.find((p) => p.phone?.replace(/\D/g, '') === normalizedPhone);
        if (!player) {
          return { success: false, error: 'No invitation found for this phone number. Ask your team admin to add you.' };
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

      findPlayerByPhone: (phone) => {
        const state = get();
        const normalizedPhone = phone.replace(/\D/g, '');
        return state.players.find((p) => p.phone?.replace(/\D/g, '') === normalizedPhone);
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

      // Reset all data to defaults - completely wipes everything and signs everyone out
      resetAllData: () => set(() => {
        // Clear AsyncStorage completely to ensure no data remains
        AsyncStorage.clear().catch((err) => console.log('Error clearing AsyncStorage:', err));

        return {
          teamName: 'My Team',
          teamSettings: {
            sport: 'hockey',
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
            showLineups: true,
          },
          players: [], // Delete ALL players
          games: [], // Delete ALL games
          events: [], // Delete ALL events
          photos: [], // Delete ALL photos
          notifications: [], // Delete ALL notifications
          chatMessages: [], // Delete ALL chat messages
          chatLastReadAt: {}, // Reset all read tracking
          paymentPeriods: [], // Delete ALL payment records
          // Sign EVERYONE out
          currentPlayerId: null,
          isLoggedIn: false,
          // Reset multi-team data
          teams: [],
          activeTeamId: null,
          userEmail: null,
          userPhone: null,
          pendingTeamIds: null,
        };
      }),

      // Multi-team support
      teams: [],
      activeTeamId: null,
      userEmail: null,
      userPhone: null,
      pendingTeamIds: null,

      addTeam: (team) => set((state) => ({
        teams: [...state.teams, team],
      })),

      switchTeam: (teamId) => {
        const state = get();
        const team = state.teams.find((t) => t.id === teamId);
        if (!team) return;

        // Find the current user in the new team
        const userInTeam = team.players.find(
          (p) => (state.userEmail && p.email?.toLowerCase() === state.userEmail.toLowerCase()) ||
                 (state.userPhone && p.phone?.replace(/\D/g, '') === state.userPhone.replace(/\D/g, ''))
        );

        set({
          activeTeamId: teamId,
          // Load team data into the "active" slots for backward compatibility
          teamName: team.teamName,
          teamSettings: team.teamSettings,
          players: team.players,
          games: team.games,
          events: team.events,
          photos: team.photos,
          notifications: team.notifications,
          chatMessages: team.chatMessages,
          chatLastReadAt: team.chatLastReadAt,
          paymentPeriods: team.paymentPeriods,
          currentPlayerId: userInTeam?.id || null,
          pendingTeamIds: null,
        });
      },

      getTeamsForUser: () => {
        const state = get();
        if (!state.userEmail && !state.userPhone) return [];

        return state.teams.filter((team) =>
          team.players.some(
            (p) => (state.userEmail && p.email?.toLowerCase() === state.userEmail.toLowerCase()) ||
                   (state.userPhone && p.phone?.replace(/\D/g, '') === state.userPhone.replace(/\D/g, ''))
          )
        );
      },

      getUserTeamCount: () => {
        return get().getTeamsForUser().length;
      },

      setPendingTeamSelection: (teamIds) => set({ pendingTeamIds: teamIds }),

      clearPendingTeamSelection: () => set({ pendingTeamIds: null }),

      createNewTeam: (teamName, sport, adminPlayer) => {
        const teamId = `team-${Date.now()}`;
        const newTeam: Team = {
          id: teamId,
          teamName,
          teamSettings: {
            sport,
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
            showLineups: true,
          },
          players: [adminPlayer],
          games: [],
          events: [],
          photos: [],
          notifications: [],
          chatMessages: [],
          chatLastReadAt: {},
          paymentPeriods: [],
        };

        set((state) => ({
          teams: [...state.teams, newTeam],
          activeTeamId: teamId,
          teamName: newTeam.teamName,
          teamSettings: newTeam.teamSettings,
          players: newTeam.players,
          games: newTeam.games,
          events: newTeam.events,
          photos: newTeam.photos,
          notifications: newTeam.notifications,
          chatMessages: newTeam.chatMessages,
          chatLastReadAt: newTeam.chatLastReadAt,
          paymentPeriods: newTeam.paymentPeriods,
          currentPlayerId: adminPlayer.id,
          isLoggedIn: true,
          userEmail: adminPlayer.email || null,
          userPhone: adminPlayer.phone || null,
        }));

        return teamId;
      },
    }),
    {
      name: 'team-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 11, // Bumped version for multi-team support
      // Persist login state so users stay logged in
      // Also sync active team data back to teams array
      partialize: (state) => {
        // Sync active team data back to teams array before persisting
        let syncedTeams = state.teams;
        if (state.activeTeamId) {
          syncedTeams = state.teams.map((team) =>
            team.id === state.activeTeamId
              ? {
                  ...team,
                  teamName: state.teamName,
                  teamSettings: state.teamSettings,
                  players: state.players,
                  games: state.games,
                  events: state.events,
                  photos: state.photos,
                  notifications: state.notifications,
                  chatMessages: state.chatMessages,
                  chatLastReadAt: state.chatLastReadAt,
                  paymentPeriods: state.paymentPeriods,
                }
              : team
          );
        }

        return {
          teamName: state.teamName,
          teamSettings: state.teamSettings,
          players: state.players,
          games: state.games,
          events: state.events,
          photos: state.photos,
          notifications: state.notifications,
          chatMessages: state.chatMessages,
          chatLastReadAt: state.chatLastReadAt,
          paymentPeriods: state.paymentPeriods,
          currentPlayerId: state.currentPlayerId,
          isLoggedIn: state.isLoggedIn,
          // Multi-team data (with synced teams)
          teams: syncedTeams,
          activeTeamId: state.activeTeamId,
          userEmail: state.userEmail,
          userPhone: state.userPhone,
          pendingTeamIds: state.pendingTeamIds,
        };
      },
    }
  )
);

// Export a hook to check if the store has been hydrated from AsyncStorage
export const useStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const handleHydration = () => {
      // Keep users logged in - don't force logout on hydration
      console.log('HYDRATION COMPLETE - preserving login state');
      const state = useTeamStore.getState();
      console.log('Current login state - isLoggedIn:', state.isLoggedIn, 'currentPlayerId:', state.currentPlayerId);

      // Auto-recovery: If there are no admins at all, make the current player an admin
      const hasAnyAdmin = state.players.some((p) => p.roles?.includes('admin'));
      if (!hasAnyAdmin && state.currentPlayerId && state.isLoggedIn && state.players.length > 0) {
        console.log('AUTO-RECOVERY: No admins found, promoting current player to admin');
        useTeamStore.setState((s) => ({
          players: s.players.map((p) =>
            p.id === s.currentPlayerId
              ? { ...p, roles: [...(p.roles || []), 'admin'] }
              : p
          ),
        }));
      }

      setHydrated(true);
    };

    // Check if already hydrated
    const unsubFinishHydration = useTeamStore.persist.onFinishHydration(handleHydration);

    // Also check if hydration already completed before subscription
    if (useTeamStore.persist.hasHydrated()) {
      handleHydration();
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
