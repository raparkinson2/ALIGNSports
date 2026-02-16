import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Trophy, Target, Crosshair, Calendar, Shield } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useTeamStore, Player, HockeyStats, HockeyGoalieStats, BaseballStats, BasketballStats, SoccerStats, SoccerGoalieStats, LacrosseStats, LacrosseGoalieStats, getPlayerName } from '@/lib/store';
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
  isLowerBetter?: boolean; // For GAA where lower is better
}

export default function TeamRecordsScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const sport = teamSettings.sport || 'hockey';

  // Calculate all records based on sport
  const recordCategories = useMemo((): RecordCategory[] => {
    const categories: RecordCategory[] = [];

    // Helper to get top players for a stat
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

      // Sort by value descending and take top 3
      return entries
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    };

    // Helper for stats where lower is better (like GAA)
    const getTopPlayersLowerBetter = (
      getStatValue: (player: Player) => number | undefined,
      filterFn?: (player: Player) => boolean,
      minGames: number = 1
    ): RecordEntry[] => {
      const entries: RecordEntry[] = [];

      players.forEach((player) => {
        if (filterFn && !filterFn(player)) return;
        const value = getStatValue(player);
        // Check minimum games for goalies
        const goalieStats = player.goalieStats as HockeyGoalieStats | SoccerGoalieStats | LacrosseGoalieStats | undefined;
        const games = goalieStats?.games ?? 0;
        if (value !== undefined && value > 0 && games >= minGames) {
          entries.push({
            playerId: player.id,
            playerName: getPlayerName(player),
            value,
            player,
          });
        }
      });

      // Sort by value ascending (lower is better) and take top 3
      return entries
        .sort((a, b) => a.value - b.value)
        .slice(0, 3);
    };

    // Check if player is a goalie
    const isGoalie = (player: Player): boolean => {
      return player.position === 'G' || player.position === 'GK';
    };

    // Sport-specific records
    switch (sport) {
      case 'hockey': {
        // Most Goals (Season/Career)
        categories.push({
          title: 'Most Goals',
          icon: <Target size={20} color="#22c55e" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });

        // Most Assists (Season/Career)
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={20} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });

        // Most Games Played (Career)
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={20} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as HockeyStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });

        // Most Wins by Goalie (Season/Career)
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={20} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as HockeyGoalieStats)?.wins,
            isGoalie
          ),
        });

        // Lowest GAA (min 1 game)
        const gaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as HockeyGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            // Hockey GAA = (Goals Against x 60) / Minutes Played
            return (stats.goalsAgainst ?? 0) * 60 / stats.minutesPlayed;
          },
          isGoalie,
          1
        );
        if (gaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalie)',
            icon: <Shield size={20} color="#ef4444" />,
            records: gaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'soccer': {
        // Most Goals
        categories.push({
          title: 'Most Goals',
          icon: <Target size={20} color="#22c55e" />,
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });

        // Most Assists
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={20} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });

        // Most Games Played
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={20} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as SoccerStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });

        // Most Wins by Goalkeeper
        categories.push({
          title: 'Most Wins (Goalkeeper)',
          icon: <Trophy size={20} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as SoccerGoalieStats)?.wins,
            isGoalie
          ),
        });

        // Lowest GAA
        const soccerGaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as SoccerGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            // Soccer GAA = (Goals Against / Minutes Played) x 90
            return (stats.goalsAgainst ?? 0) / stats.minutesPlayed * 90;
          },
          isGoalie,
          1
        );
        if (soccerGaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalkeeper)',
            icon: <Shield size={20} color="#ef4444" />,
            records: soccerGaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'lacrosse': {
        // Most Goals
        categories.push({
          title: 'Most Goals',
          icon: <Target size={20} color="#22c55e" />,
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.goals,
            (p) => !isGoalie(p)
          ),
        });

        // Most Assists
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={20} color="#3b82f6" />,
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.assists,
            (p) => !isGoalie(p)
          ),
        });

        // Most Games Played
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={20} color="#a78bfa" />,
          records: getTopPlayers(
            (p) => (p.stats as LacrosseStats)?.gamesPlayed,
            (p) => !isGoalie(p)
          ),
        });

        // Most Wins by Goalie
        categories.push({
          title: 'Most Wins (Goalie)',
          icon: <Trophy size={20} color="#f59e0b" />,
          records: getTopPlayers(
            (p) => (p.goalieStats as unknown as LacrosseGoalieStats)?.wins,
            isGoalie
          ),
        });

        // Lowest GAA
        const lacrosseGaaRecords = getTopPlayersLowerBetter(
          (p) => {
            const stats = p.goalieStats as unknown as LacrosseGoalieStats;
            if (!stats || !stats.minutesPlayed || stats.minutesPlayed === 0) return undefined;
            // Lacrosse GAA = (Goals Against / Minutes Played) x 60
            return (stats.goalsAgainst ?? 0) / stats.minutesPlayed * 60;
          },
          isGoalie,
          1
        );
        if (lacrosseGaaRecords.length > 0) {
          categories.push({
            title: 'Lowest GAA (Goalie)',
            icon: <Shield size={20} color="#ef4444" />,
            records: lacrosseGaaRecords.map(r => ({ ...r, value: Math.round(r.value * 100) / 100 })),
            isLowerBetter: true,
          });
        }
        break;
      }

      case 'baseball':
      case 'softball': {
        // Most Hits
        categories.push({
          title: 'Most Hits',
          icon: <Target size={20} color="#22c55e" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.hits),
        });

        // Most Home Runs
        categories.push({
          title: 'Most Home Runs',
          icon: <Trophy size={20} color="#f59e0b" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.homeRuns),
        });

        // Most RBIs
        categories.push({
          title: 'Most RBIs',
          icon: <Crosshair size={20} color="#3b82f6" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.rbi),
        });

        // Most Games Played
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={20} color="#a78bfa" />,
          records: getTopPlayers((p) => (p.stats as BaseballStats)?.gamesPlayed),
        });
        break;
      }

      case 'basketball': {
        // Most Points
        categories.push({
          title: 'Most Points',
          icon: <Target size={20} color="#22c55e" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.points),
        });

        // Most Rebounds
        categories.push({
          title: 'Most Rebounds',
          icon: <Trophy size={20} color="#f59e0b" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.rebounds),
        });

        // Most Assists
        categories.push({
          title: 'Most Assists',
          icon: <Crosshair size={20} color="#3b82f6" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.assists),
        });

        // Most Games Played
        categories.push({
          title: 'Most Games Played',
          icon: <Calendar size={20} color="#a78bfa" />,
          records: getTopPlayers((p) => (p.stats as BasketballStats)?.gamesPlayed),
        });
        break;
      }
    }

    // Filter out categories with no records
    return categories.filter((cat) => cat.records.length > 0);
  }, [players, sport]);

  const getMedalColor = (index: number): string => {
    switch (index) {
      case 0: return '#ffd700'; // Gold
      case 1: return '#c0c0c0'; // Silver
      case 2: return '#cd7f32'; // Bronze
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
          className="flex-row items-center px-5 pt-2 pb-4"
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
          {recordCategories.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="bg-slate-800/60 rounded-xl p-6 items-center"
            >
              <Trophy size={40} color="#64748b" />
              <Text className="text-slate-400 text-center mt-3">
                No records yet.
              </Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Records will appear as player stats are added.
              </Text>
            </Animated.View>
          ) : (
            recordCategories.map((category, catIndex) => (
              <Animated.View
                key={category.title}
                entering={FadeInDown.delay(100 + catIndex * 50).springify()}
                className="mb-2"
              >
                <View className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  {/* Category Header */}
                  <View className="flex-row items-center px-3 py-2 bg-slate-700/30 border-b border-slate-700/50">
                    <View className="w-6 h-6 rounded-full bg-slate-800 items-center justify-center mr-2">
                      {category.icon}
                    </View>
                    <Text className="text-white font-semibold text-sm flex-1">{category.title}</Text>
                  </View>

                  {/* Records */}
                  {category.records.map((record, index) => (
                    <View
                      key={record.playerId}
                      className={`flex-row items-center px-3 py-2 ${
                        index !== category.records.length - 1 ? 'border-b border-slate-700/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: `${getMedalColor(index)}20` }}
                      >
                        <Text
                          className="text-[10px] font-bold"
                          style={{ color: getMedalColor(index) }}
                        >
                          {getMedalEmoji(index)}
                        </Text>
                      </View>

                      {/* Player */}
                      <PlayerAvatar player={record.player} size={28} />
                      <View className="flex-1 ml-2">
                        <Text className="text-white font-medium text-sm">{record.playerName}</Text>
                        <Text className="text-slate-500 text-[10px]">#{record.player.number}</Text>
                      </View>

                      {/* Value */}
                      <View className="items-end">
                        <Text
                          className="text-lg font-bold"
                          style={{ color: getMedalColor(index) }}
                        >
                          {category.isLowerBetter ? record.value.toFixed(2) : record.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
