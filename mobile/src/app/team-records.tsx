import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Trophy, Target, Crosshair, Calendar, Shield, Award, Plus, X, Star, TrendingUp, Users, Flame, TrendingDown } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { useTeamStore, Player, getPlayerName, Championship, ArchivedPlayerStats, ArchivedSeason } from '@/lib/store';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface RecordEntry {
  playerId: string;
  playerName: string;
  value: number;
  player: Player;
}

interface RecordCategory {
  title: string;
  icon: React.ReactNode;
  records: RecordEntry[];
  suffix?: string;
  isLowerBetter?: boolean;
}

interface TeamRecordItem {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export default function TeamRecordsScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const addChampionship = useTeamStore((s) => s.addChampionship);
  const removeChampionship = useTeamStore((s) => s.removeChampionship);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const sport = teamSettings.sport || 'hockey';
  const championships = teamSettings.championships || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const seasonHistory = teamSettings.seasonHistory || [];

  // Calculate team records from current + historical records
  const teamRecords = useMemo((): TeamRecordItem[] => {
    const records: TeamRecordItem[] = [];
    const currentRecord = teamSettings.record;

    // Gather all seasons (archived + current)
    type SeasonData = { name: string; wins: number; losses: number; ties: number; winStreak: number; loseStreak: number };
    const allSeasons: SeasonData[] = [];

    // Add archived seasons
    seasonHistory.forEach((season) => {
      allSeasons.push({
        name: season.seasonName,
        wins: season.teamRecord.wins,
        losses: season.teamRecord.losses,
        ties: season.teamRecord.ties ?? 0,
        winStreak: season.teamRecord.longestWinStreak ?? 0,
        loseStreak: season.teamRecord.longestLosingStreak ?? 0,
      });
    });

    // Add current season if it has any games
    const currentWins = currentRecord?.wins ?? 0;
    const currentLosses = currentRecord?.losses ?? 0;
    const currentTies = currentRecord?.ties ?? 0;
    if (currentWins > 0 || currentLosses > 0 || currentTies > 0) {
      allSeasons.push({
        name: teamSettings.currentSeasonName || 'Current',
        wins: currentWins,
        losses: currentLosses,
        ties: currentTies,
        winStreak: currentRecord?.longestWinStreak ?? 0,
        loseStreak: currentRecord?.longestLosingStreak ?? 0,
      });
    }

    if (allSeasons.length === 0) {
      return records;
    }

    // Find best season record (by win percentage)
    let bestSeason = allSeasons[0];
    let bestWinPct = 0;
    allSeasons.forEach((season) => {
      const total = season.wins + season.losses + season.ties;
      const pct = total > 0 ? season.wins / total : 0;
      if (pct > bestWinPct || (pct === bestWinPct && season.wins > bestSeason.wins)) {
        bestWinPct = pct;
        bestSeason = season;
      }
    });

    const bestRecordStr = bestSeason.ties > 0
      ? `${bestSeason.wins}-${bestSeason.losses}-${bestSeason.ties}`
      : `${bestSeason.wins}-${bestSeason.losses}`;
    records.push({
      title: 'Best Season Record',
      value: `${bestRecordStr} (${bestSeason.name})`,
      icon: <Star size={18} color="#22c55e" />,
    });

    // Find most wins in a season
    const mostWinsSeason = allSeasons.reduce((best, season) =>
      season.wins > best.wins ? season : best
    , allSeasons[0]);
    if (mostWinsSeason.wins > 0) {
      records.push({
        title: 'Most Wins (Season)',
        value: `${mostWinsSeason.wins} (${mostWinsSeason.name})`,
        icon: <Trophy size={18} color="#f59e0b" />,
      });
    }

    // Find longest win streak across all seasons
    const bestWinStreak = allSeasons.reduce((best, season) =>
      season.winStreak > best.winStreak ? season : best
    , allSeasons[0]);
    if (bestWinStreak.winStreak > 0) {
      records.push({
        title: 'Longest Win Streak',
        value: `${bestWinStreak.winStreak} (${bestWinStreak.name})`,
        icon: <Flame size={18} color="#f97316" />,
      });
    }

    // Find longest losing streak across all seasons
    const worstLoseStreak = allSeasons.reduce((worst, season) =>
      season.loseStreak > worst.loseStreak ? season : worst
    , allSeasons[0]);
    if (worstLoseStreak.loseStreak > 0) {
      records.push({
        title: 'Longest Losing Streak',
        value: `${worstLoseStreak.loseStreak} (${worstLoseStreak.name})`,
        icon: <TrendingDown size={18} color="#ef4444" />,
      });
    }

    return records;
  }, [teamSettings.record, seasonHistory, teamSettings.currentSeasonName]);

  // Calculate individual records based on sport (all-time, including archived seasons)
  const individualRecords = useMemo((): RecordCategory[] => {
    const categories: RecordCategory[] = [];

    // Build a map of all-time aggregated stats per player
    // Key: playerId, Value: { player info, aggregated stats }
    interface AllTimePlayerRecord {
      playerId: string;
      playerName: string;
      position: string;
      player: Player | null; // null if player no longer exists (only in archived)
      stats: Record<string, number>; // aggregated stat values
      goalieStats: Record<string, number>; // aggregated goalie stat values
    }

    const allTimeRecords: Map<string, AllTimePlayerRecord> = new Map();

    // Helper to add stats to allTimeRecords
    const addPlayerStats = (
      playerId: string,
      playerName: string,
      position: string,
      player: Player | null,
      stats: unknown,
      goalieStats: unknown
    ) => {
      let record = allTimeRecords.get(playerId);
      if (!record) {
        record = {
          playerId,
          playerName,
          position,
          player,
          stats: {},
          goalieStats: {},
        };
        allTimeRecords.set(playerId, record);
      }
      // Update player reference if we have a current player
      if (player) {
        record.player = player;
        record.playerName = getPlayerName(player);
        record.position = player.position;
      }
      // Aggregate stats
      if (stats && typeof stats === 'object') {
        Object.entries(stats as Record<string, unknown>).forEach(([key, value]) => {
          if (typeof value === 'number') {
            record!.stats[key] = (record!.stats[key] || 0) + value;
          }
        });
      }
      // Aggregate goalie stats
      if (goalieStats && typeof goalieStats === 'object') {
        Object.entries(goalieStats as Record<string, unknown>).forEach(([key, value]) => {
          if (typeof value === 'number') {
            record!.goalieStats[key] = (record!.goalieStats[key] || 0) + value;
          }
        });
      }
    };

    // Add current player stats
    players.forEach((player) => {
      addPlayerStats(
        player.id,
        getPlayerName(player),
        player.position,
        player,
        player.stats,
        player.goalieStats
      );
    });

    // Add archived season stats
    seasonHistory.forEach((season: ArchivedSeason) => {
      season.playerStats.forEach((archived: ArchivedPlayerStats) => {
        // Find current player if exists
        const currentPlayer = players.find((p) => p.id === archived.playerId) || null;
        addPlayerStats(
          archived.playerId,
          archived.playerName,
          archived.position,
          currentPlayer,
          archived.stats,
          archived.goalieStats
        );
      });
    });

    // Convert to array for querying
    const allRecords = Array.from(allTimeRecords.values());

    // Helper to create a display-only player object for archived players
    const createDisplayPlayer = (record: AllTimePlayerRecord): Player => {
      if (record.player) return record.player;
      return {
        id: record.playerId,
        firstName: record.playerName.split(' ')[0] || '',
        lastName: record.playerName.split(' ').slice(1).join(' ') || '',
        number: '',
        position: record.position,
        roles: [],
        status: 'active',
      };
    };

    const getTopPlayers = (
      statKey: string,
      filterFn?: (record: AllTimePlayerRecord) => boolean
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      allRecords.forEach((record) => {
        if (filterFn && !filterFn(record)) return;
        const value = record.stats[statKey];
        if (value !== undefined && value > 0) {
          entries.push({
            playerId: record.playerId,
            playerName: record.playerName,
            value,
            player: createDisplayPlayer(record),
          });
        }
      });

      return entries
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    };

    const getTopGoalies = (
      statKey: string,
      filterFn?: (record: AllTimePlayerRecord) => boolean
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      allRecords.forEach((record) => {
        if (filterFn && !filterFn(record)) return;
        const value = record.goalieStats[statKey];
        if (value !== undefined && value > 0) {
          entries.push({
            playerId: record.playerId,
            playerName: record.playerName,
            value,
            player: createDisplayPlayer(record),
          });
        }
      });

      return entries
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    };

    const getTopGoaliesLowerBetter = (
      computeValue: (goalieStats: Record<string, number>) => number | undefined,
      filterFn?: (record: AllTimePlayerRecord) => boolean,
      minGames: number = 1
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      allRecords.forEach((record) => {
        if (filterFn && !filterFn(record)) return;
        const gameCount = record.goalieStats.games ?? 0;
        if (gameCount < minGames) return;
        const value = computeValue(record.goalieStats);
        if (value !== undefined && value > 0) {
          entries.push({
            playerId: record.playerId,
            playerName: record.playerName,
            value,
            player: createDisplayPlayer(record),
          });
        }
      });

      return entries
        .sort((a, b) => a.value - b.value)
        .slice(0, 3);
    };

    const isGoalie = (record: AllTimePlayerRecord): boolean => {
      return record.position === 'G' || record.position === 'GK';
    };

    switch (sport) {
      case 'hockey': {
        categories.push({
          title: 'Most Goals',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers('goals', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers('assists', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers('gamesPlayed', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopGoalies('wins', isGoalie),
        });
        const gaaRecords = getTopGoaliesLowerBetter(
          (gs) => {
            if (!gs.minutesPlayed || gs.minutesPlayed === 0) return undefined;
            return (gs.goalsAgainst ?? 0) * 60 / gs.minutesPlayed;
          },
          isGoalie,
          1
        );
        if (gaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalie)',
            icon: <Shield size={18} color="#ef4444" />,
            records: gaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'soccer': {
        categories.push({
          title: 'Most Goals',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers('goals', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers('assists', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers('gamesPlayed', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Wins (Goalkeeper)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopGoalies('wins', isGoalie),
        });
        const soccerGaaRecords = getTopGoaliesLowerBetter(
          (gs) => {
            if (!gs.minutesPlayed || gs.minutesPlayed === 0) return undefined;
            return (gs.goalsAgainst ?? 0) / gs.minutesPlayed * 90;
          },
          isGoalie,
          1
        );
        if (soccerGaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalkeeper)',
            icon: <Shield size={18} color="#ef4444" />,
            records: soccerGaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'lacrosse': {
        categories.push({
          title: 'Most Goals',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers('goals', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers('assists', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers('gamesPlayed', (p) => !isGoalie(p)),
        });
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopGoalies('wins', isGoalie),
        });
        const lacrosseGaaRecords = getTopGoaliesLowerBetter(
          (gs) => {
            if (!gs.minutesPlayed || gs.minutesPlayed === 0) return undefined;
            return (gs.goalsAgainst ?? 0) / gs.minutesPlayed * 60;
          },
          isGoalie,
          1
        );
        if (lacrosseGaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalie)',
            icon: <Shield size={18} color="#ef4444" />,
            records: lacrosseGaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'baseball':
      case 'softball': {
        categories.push({
          title: 'Most Hits',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers('hits'),
        });
        categories.push({
          title: 'Most Home Runs',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers('homeRuns'),
        });
        categories.push({
          title: 'Most RBIs',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers('rbi'),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers('gamesPlayed'),
        });
        break;
      }

      case 'basketball': {
        categories.push({
          title: 'Most Points',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers('points'),
        });
        categories.push({
          title: 'Most Rebounds',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers('rebounds'),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers('assists'),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers('gamesPlayed'),
        });
        break;
      }
    }

    return categories.filter((cat) => cat.records.length > 0);
  }, [players, sport, seasonHistory]);

  const getMedalColor = (index: number): string => {
    switch (index) {
      case 0: return '#ffd700';
      case 1: return '#c0c0c0';
      case 2: return '#cd7f32';
      default: return '#64748b';
    }
  };

  const getMedalEmoji = (index: number): string => {
    switch (index) {
      case 0: return '1st';
      case 1: return '2nd';
      case 2: return '3rd';
      default: return '';
    }
  };

  const handleAddChampionship = () => {
    if (!newYear.trim() || !newTitle.trim()) return;

    const championship: Championship = {
      id: Date.now().toString(),
      year: newYear.trim(),
      title: newTitle.trim(),
    };

    addChampionship(championship);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewYear('');
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleRemoveChampionship = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeChampionship(id);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(50)}
          className="flex-row items-center px-5 pt-2 pb-3"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center mr-3"
          >
            <ArrowLeft size={20} color="#67e8f9" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-slate-400 text-sm font-medium">Stats and Analytics</Text>
            <Text className="text-white text-2xl font-bold">Team Records</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
            <Trophy size={20} color="#f59e0b" />
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Section 1: Championships */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4">
            <View className="flex-row items-center mb-2">
              <Award size={16} color="#f59e0b" />
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider ml-2">
                Championships
              </Text>
              {isAdmin() && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddModal(true);
                  }}
                  className="ml-auto bg-amber-500/20 rounded-full p-1.5"
                >
                  <Plus size={14} color="#f59e0b" />
                </Pressable>
              )}
            </View>

            <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              {championships.length === 0 ? (
                <View className="px-3 py-3 items-center">
                  <Text className="text-slate-500 text-sm">None</Text>
                </View>
              ) : (
                championships.map((champ, index) => (
                  <View
                    key={champ.id}
                    className={`flex-row items-center px-3 py-2 ${
                      index !== championships.length - 1 ? 'border-b border-slate-700/30' : ''
                    }`}
                  >
                    <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2">
                      <Trophy size={14} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-sm">{champ.title}</Text>
                      <Text className="text-slate-400 text-xs">{champ.year}</Text>
                    </View>
                    {isAdmin() && (
                      <Pressable
                        onPress={() => handleRemoveChampionship(champ.id)}
                        className="p-1.5"
                      >
                        <X size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-700/50 mt-5 mx-10" />
          </Animated.View>

          {/* Section 2: Team Records */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-5 mb-4">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={16} color="#22c55e" />
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider ml-2">
                Team Records
              </Text>
            </View>

            <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
              {teamRecords.length === 0 ? (
                <View className="px-3 py-3 items-center">
                  <Text className="text-slate-500 text-sm">No team records yet</Text>
                  <Text className="text-slate-600 text-xs mt-0.5">Add game scores to track records</Text>
                </View>
              ) : (
                teamRecords.map((record, index) => (
                  <View
                    key={record.title}
                    className={`flex-row items-center px-3 py-2 ${
                      index !== teamRecords.length - 1 ? 'border-b border-slate-700/30' : ''
                    }`}
                  >
                    <View className="w-6 h-6 rounded-full bg-slate-700/50 items-center justify-center mr-2">
                      {record.icon}
                    </View>
                    <Text className="text-slate-300 text-sm flex-1">{record.title}</Text>
                    <Text className="text-white font-semibold text-sm">{record.value}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-700/50 mt-5 mx-10" />
          </Animated.View>

          {/* Section 3: Individual Records */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-5">
            <View className="flex-row items-center mb-2">
              <Users size={16} color="#67e8f9" />
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider ml-2">
                Individual Records
              </Text>
            </View>

            {individualRecords.length === 0 ? (
              <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-3 py-3 items-center">
                <Text className="text-slate-500 text-sm">No individual records yet</Text>
                <Text className="text-slate-600 text-xs mt-0.5">Add player stats to track records</Text>
              </View>
            ) : (
              individualRecords.map((category, catIndex) => (
                <View
                  key={category.title}
                  className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden mb-2"
                >
                  {/* Category Header */}
                  <View className="flex-row items-center px-3 py-2 bg-slate-700/30 border-b border-slate-700/50">
                    <View className="w-5 h-5 rounded-full bg-slate-800 items-center justify-center mr-2">
                      {category.icon}
                    </View>
                    <Text className="text-white font-semibold text-sm flex-1">{category.title}</Text>
                  </View>

                  {/* Records */}
                  {category.records.map((record, index) => (
                    <View
                      key={record.playerId}
                      className={`flex-row items-center px-3 py-1.5 ${
                        index !== category.records.length - 1 ? 'border-b border-slate-700/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: `${getMedalColor(index)}20` }}
                      >
                        <Text
                          className="text-[9px] font-bold"
                          style={{ color: getMedalColor(index) }}
                        >
                          {getMedalEmoji(index)}
                        </Text>
                      </View>

                      {/* Player */}
                      <PlayerAvatar player={record.player} size={24} />
                      <View className="flex-1 ml-2">
                        <Text className="text-white font-medium text-sm">{record.playerName}</Text>
                      </View>

                      {/* Value */}
                      <Text
                        className="text-base font-bold"
                        style={{ color: getMedalColor(index) }}
                      >
                        {category.isLowerBetter ? record.value.toFixed(2) : record.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Add Championship Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setNewYear('');
          setNewTitle('');
        }}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddModal(false);
                    setNewYear('');
                    setNewTitle('');
                  }}
                >
                  <X size={24} color="#64748b" />
                </Pressable>
                <Text className="text-white text-lg font-semibold">Add Championship</Text>
                <Pressable
                  onPress={handleAddChampionship}
                  disabled={!newYear.trim() || !newTitle.trim()}
                >
                  <Text className={`font-semibold ${
                    newYear.trim() && newTitle.trim() ? 'text-amber-400' : 'text-slate-600'
                  }`}>
                    Save
                  </Text>
                </Pressable>
              </View>

              <View className="px-5 pt-6">
                <Text className="text-slate-400 text-sm mb-2">Year/Season</Text>
                <TextInput
                  value={newYear}
                  onChangeText={setNewYear}
                  placeholder="e.g., 2024, 2023-24"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white mb-4"
                  autoFocus
                />

                <Text className="text-slate-400 text-sm mb-2">Championship Title</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g., League Champions, Tournament Winners"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white"
                />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
