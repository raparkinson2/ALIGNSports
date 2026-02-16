import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Trophy, Target, Crosshair, Calendar, Shield, Award, Plus, X, Star, TrendingUp, Users, Flame, TrendingDown } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { useTeamStore, Player, HockeyStats, HockeyGoalieStats, BaseballStats, BasketballStats, SoccerStats, SoccerGoalieStats, LacrosseStats, LacrosseGoalieStats, getPlayerName, Championship } from '@/lib/store';
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

  // Calculate team records from current team record
  const teamRecords = useMemo((): TeamRecordItem[] => {
    const records: TeamRecordItem[] = [];
    const currentRecord = teamSettings.record;

    // Current Season Record (if available)
    if (currentRecord && (currentRecord.wins > 0 || currentRecord.losses > 0 || (currentRecord.ties ?? 0) > 0)) {
      const recordStr = currentRecord.ties
        ? `${currentRecord.wins}-${currentRecord.losses}-${currentRecord.ties}`
        : `${currentRecord.wins}-${currentRecord.losses}`;
      records.push({
        title: 'Best Season Record',
        value: recordStr,
        icon: <Star size={18} color="#22c55e" />,
      });

      // Most Wins (Season) - using current season
      if (currentRecord.wins > 0) {
        records.push({
          title: 'Most Wins (Season)',
          value: `${currentRecord.wins}`,
          icon: <Trophy size={18} color="#f59e0b" />,
        });
      }
    }

    // Longest Win Streak
    if (currentRecord?.longestWinStreak && currentRecord.longestWinStreak > 0) {
      records.push({
        title: 'Longest Win Streak',
        value: `${currentRecord.longestWinStreak}`,
        icon: <Flame size={18} color="#f97316" />,
      });
    }

    // Longest Losing Streak
    if (currentRecord?.longestLosingStreak && currentRecord.longestLosingStreak > 0) {
      records.push({
        title: 'Longest Losing Streak',
        value: `${currentRecord.longestLosingStreak}`,
        icon: <TrendingDown size={18} color="#ef4444" />,
      });
    }

    return records;
  }, [teamSettings.record]);

  // Calculate individual records based on sport
  const individualRecords = useMemo((): RecordCategory[] => {
    const categories: RecordCategory[] = [];

    const getTopPlayers = (
      getStatValue: (player: Player) => number | undefined,
      filterFn?: (player: Player) => boolean
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      players.forEach((player) => {
        if (filterFn && !filterFn(player)) return;
        const value = getStatValue(player);
        if (value !== undefined && value > 0) {
          entries.push({
            playerId: player.id,
            playerName: getPlayerName(player),
            value,
            player,
          });
        }
      });

      return entries
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    };

    const getTopPlayersLowerBetter = (
      getStatValue: (player: Player) => number | undefined,
      filterFn?: (player: Player) => boolean,
      minGames: number = 1
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      players.forEach((player) => {
        if (filterFn && !filterFn(player)) return;
        const value = getStatValue(player);
        const goalieStats = player.goalieStats as HockeyGoalieStats | SoccerGoalieStats | LacrosseGoalieStats | undefined;
        const gameCount = goalieStats?.games ?? 0;
        if (value !== undefined && value > 0 && gameCount >= minGames) {
          entries.push({
            playerId: player.id,
            playerName: getPlayerName(player),
            value,
            player,
          });
        }
      });

      return entries
        .sort((a, b) => a.value - b.value)
        .slice(0, 3);
    };

    const isGoalie = (player: Player): boolean => {
      return player.position === 'G' || player.position === 'GK';
    };

    switch (sport) {
      case 'hockey': {
        categories.push({
          title: 'Most Goals',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as HockeyGoalieStats)?.wins,
            isGoalie
          ),
        });
        const gaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as HockeyGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            return (stats.goalsAgainst ?? 0) * 60 / stats.minutesPlayed;
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
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Wins (Goalkeeper)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as SoccerGoalieStats)?.wins,
            isGoalie
          ),
        });
        const soccerGaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as SoccerGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            return (stats.goalsAgainst ?? 0) / stats.minutesPlayed * 90;
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
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as unknown as LacrosseGoalieStats)?.wins,
            isGoalie
          ),
        });
        const lacrosseGaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as unknown as LacrosseGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            return (stats.goalsAgainst ?? 0) / stats.minutesPlayed * 60;
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
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.hits),
        });
        categories.push({
          title: 'Most Home Runs',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.homeRuns),
        });
        categories.push({
          title: 'Most RBIs',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.rbi),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.gamesPlayed),
        });
        break;
      }

      case 'basketball': {
        categories.push({
          title: 'Most Points',
          icon: <Target size={18} color="#22c55e" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.points),
        });
        categories.push({
          title: 'Most Rebounds',
          icon: <Trophy size={18} color="#f59e0b" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.rebounds),
        });
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={18} color="#3b82f6" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.assists),
        });
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={18} color="#a78bfa" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.gamesPlayed),
        });
        break;
      }
    }

    return categories.filter((cat) => cat.records.length > 0);
  }, [players, sport]);

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
          </Animated.View>

          {/* Section 2: Team Records */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-4">
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
          </Animated.View>

          {/* Section 3: Individual Records */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
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
