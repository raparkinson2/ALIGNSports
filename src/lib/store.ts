import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Player {
  id: string;
  name: string;
  number: string;
  position: 'C' | 'LW' | 'RW' | 'D' | 'G';
  jerseyColors: string[];
  avatar?: string;
}

export interface Game {
  id: string;
  opponent: string;
  date: string; // ISO string
  time: string;
  rinkName: string;
  rinkAddress: string;
  jerseyColor: string;
  beerBagAssignee: string; // player id
  checkedInPlayers: string[]; // player ids
  lineup: {
    forwards: string[];
    defense: string[];
    goalies: string[];
  };
  photos: string[];
}

export interface Photo {
  id: string;
  gameId: string;
  uri: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TeamStore {
  teamName: string;
  setTeamName: (name: string) => void;
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
  photos: Photo[];
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  currentPlayerId: string | null;
  setCurrentPlayerId: (id: string | null) => void;
}

// Mock data
const mockPlayers: Player[] = [
  { id: '1', name: 'Mike Johnson', number: '12', position: 'C', jerseyColors: ['#1e40af', '#dc2626', '#ffffff'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: '2', name: 'Dave Williams', number: '7', position: 'LW', jerseyColors: ['#1e40af', '#16a34a'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: '3', name: 'Chris Brown', number: '22', position: 'RW', jerseyColors: ['#1e40af', '#dc2626'], avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { id: '4', name: 'Jake Miller', number: '4', position: 'D', jerseyColors: ['#1e40af', '#ffffff'], avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
  { id: '5', name: 'Ryan Davis', number: '8', position: 'D', jerseyColors: ['#1e40af', '#dc2626', '#16a34a'], avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
  { id: '6', name: 'Tom Wilson', number: '31', position: 'G', jerseyColors: ['#1e40af'], avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150' },
  { id: '7', name: 'Steve Anderson', number: '15', position: 'C', jerseyColors: ['#1e40af', '#dc2626'], avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' },
  { id: '8', name: 'Kevin Martinez', number: '19', position: 'LW', jerseyColors: ['#1e40af'], avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
];

const mockGames: Game[] = [
  {
    id: '1',
    opponent: 'Ice Wolves',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    time: '8:30 PM',
    rinkName: 'Glacier Ice Arena',
    rinkAddress: '1234 Frozen Lake Drive',
    jerseyColor: '#1e40af',
    beerBagAssignee: '2',
    checkedInPlayers: ['1', '3', '4', '6'],
    lineup: { forwards: ['1', '2', '3', '7', '8'], defense: ['4', '5'], goalies: ['6'] },
    photos: [],
  },
  {
    id: '2',
    opponent: 'Polar Bears',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '9:15 PM',
    rinkName: 'Northside Ice Complex',
    rinkAddress: '567 Winter Road',
    jerseyColor: '#dc2626',
    beerBagAssignee: '5',
    checkedInPlayers: ['2', '5'],
    lineup: { forwards: ['1', '2', '3', '7', '8'], defense: ['4', '5'], goalies: ['6'] },
    photos: [],
  },
  {
    id: '3',
    opponent: 'Frost Giants',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    time: '7:45 PM',
    rinkName: 'Downtown Ice Center',
    rinkAddress: '890 Main Street',
    jerseyColor: '#ffffff',
    beerBagAssignee: '1',
    checkedInPlayers: [],
    lineup: { forwards: ['1', '2', '3', '7', '8'], defense: ['4', '5'], goalies: ['6'] },
    photos: [],
  },
];

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teamName: 'Blue Line Bandits',
      setTeamName: (name) => set({ teamName: name }),

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

      photos: [],
      addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
      removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),

      currentPlayerId: '1', // Default to first player
      setCurrentPlayerId: (id) => set({ currentPlayerId: id }),
    }),
    {
      name: 'team-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
