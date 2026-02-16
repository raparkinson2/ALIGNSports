import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, X, HelpCircle, TrendingUp, Calendar, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, getPlayerName } from '@/lib/store';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useMemo } from 'react';

interface AttendanceStats {
  playerId: string;
  playerName: string;
  gamesIn: number;
  gamesOut: number;
  noResponse: number;
  totalGames: number;
  attendanceRate: number;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const games = useTeamStore((s) => s.games);

  // Calculate attendance stats for each player
  const attendanceStats = useMemo(() => {
    // Only count past games (games that have already happened)
    const now = new Date();
    const pastGames = games.filter((game) => {
      const gameDate = new Date(game.date);
      return gameDate < now;
    });

    const stats: AttendanceStats[] = players.map((player) => {
      let gamesIn = 0;
      let gamesOut = 0;
      let noResponse = 0;

      pastGames.forEach((game) => {
        // Only count if player was invited to the game
        if (game.invitedPlayers?.includes(player.id)) {
          if (game.checkedInPlayers?.includes(player.id)) {
            gamesIn++;
          } else if (game.checkedOutPlayers?.includes(player.id)) {
            gamesOut++;
          } else {
            noResponse++;
          }
        }
      });

      const totalGames = gamesIn + gamesOut + noResponse;
      const attendanceRate = totalGames > 0 ? (gamesIn / totalGames) * 100 : 0;

      return {
        playerId: player.id,
        playerName: getPlayerName(player),
        gamesIn,
        gamesOut,
        noResponse,
        totalGames,
        attendanceRate,
      };
    });

    // Sort by attendance rate (highest first), then by total games
    return stats
      .filter((s) => s.totalGames > 0)
      .sort((a, b) => {
        if (b.attendanceRate !== a.attendanceRate) {
          return b.attendanceRate - a.attendanceRate;
        }
        return b.totalGames - a.totalGames;
      });
  }, [players, games]);

  // Team totals
  const teamTotals = useMemo(() => {
    const totals = attendanceStats.reduce(
      (acc, stat) => ({
        gamesIn: acc.gamesIn + stat.gamesIn,
        gamesOut: acc.gamesOut + stat.gamesOut,
        noResponse: acc.noResponse + stat.noResponse,
      }),
      { gamesIn: 0, gamesOut: 0, noResponse: 0 }
    );

    const totalResponses = totals.gamesIn + totals.gamesOut + totals.noResponse;
    const overallRate = totalResponses > 0 ? (totals.gamesIn / totalResponses) * 100 : 0;

    return { ...totals, totalResponses, overallRate };
  }, [attendanceStats]);

  const getPlayer = (playerId: string) => players.find((p) => p.id === playerId);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return '#22c55e'; // green
    if (rate >= 60) return '#eab308'; // yellow
    if (rate >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(50)}
          className="flex-row items-center px-4 pt-2 pb-4"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center mr-3"
          >
            <ChevronLeft size={24} color="#fff" />
          </Pressable>
          <Text className="text-white text-2xl font-bold flex-1">Attendance</Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Team Summary Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View className="bg-slate-800/80 rounded-2xl p-5 mb-6 border border-slate-700/50">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center">
                  <TrendingUp size={20} color="#67e8f9" />
                </View>
                <Text className="text-white text-lg font-bold ml-3">Team Summary</Text>
              </View>

              {/* Overall Attendance Rate */}
              <View className="items-center mb-5">
                <Text className="text-slate-400 text-sm mb-1">Overall Attendance Rate</Text>
                <Text
                  className="text-4xl font-bold"
                  style={{ color: getAttendanceColor(teamTotals.overallRate) }}
                >
                  {teamTotals.overallRate.toFixed(0)}%
                </Text>
              </View>

              {/* Stats Row */}
              <View className="flex-row justify-between">
                <View className="flex-1 items-center">
                  <View className="flex-row items-center mb-1">
                    <Check size={16} color="#22c55e" />
                    <Text className="text-green-400 text-xs ml-1">IN</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">{teamTotals.gamesIn}</Text>
                </View>
                <View className="w-px bg-slate-700" />
                <View className="flex-1 items-center">
                  <View className="flex-row items-center mb-1">
                    <X size={16} color="#ef4444" />
                    <Text className="text-red-400 text-xs ml-1">OUT</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">{teamTotals.gamesOut}</Text>
                </View>
                <View className="w-px bg-slate-700" />
                <View className="flex-1 items-center">
                  <View className="flex-row items-center mb-1">
                    <HelpCircle size={16} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1">NO RSP</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">{teamTotals.noResponse}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Players Section Header */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-row items-center mb-3"
          >
            <Users size={16} color="#94a3b8" />
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-2">
              Player Attendance
            </Text>
          </Animated.View>

          {/* Player Stats */}
          {attendanceStats.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="bg-slate-800/60 rounded-xl p-6 items-center"
            >
              <Calendar size={40} color="#64748b" />
              <Text className="text-slate-400 text-center mt-3">
                No past games with attendance data yet.
              </Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Attendance will be tracked as games are played.
              </Text>
            </Animated.View>
          ) : (
            attendanceStats.map((stat, index) => {
              const player = getPlayer(stat.playerId);
              if (!player) return null;

              return (
                <Animated.View
                  key={stat.playerId}
                  entering={FadeInDown.delay(200 + index * 30).springify()}
                >
                  <View className="bg-slate-800/60 rounded-xl p-4 mb-3 border border-slate-700/30">
                    <View className="flex-row items-center mb-3">
                      <PlayerAvatar player={player} size={44} />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">{stat.playerName}</Text>
                        <Text className="text-slate-400 text-sm">
                          {stat.totalGames} game{stat.totalGames !== 1 ? 's' : ''} invited
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-xl font-bold"
                          style={{ color: getAttendanceColor(stat.attendanceRate) }}
                        >
                          {stat.attendanceRate.toFixed(0)}%
                        </Text>
                        <Text className="text-slate-500 text-xs">attendance</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${stat.attendanceRate}%`,
                          backgroundColor: getAttendanceColor(stat.attendanceRate),
                        }}
                      />
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row justify-between">
                      <View className="flex-row items-center">
                        <View className="flex-row items-center bg-green-500/20 rounded-full px-2.5 py-1">
                          <Check size={12} color="#22c55e" />
                          <Text className="text-green-400 text-xs font-medium ml-1">
                            {stat.gamesIn} In
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center bg-red-500/20 rounded-full px-2.5 py-1">
                          <X size={12} color="#ef4444" />
                          <Text className="text-red-400 text-xs font-medium ml-1">
                            {stat.gamesOut} Out
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center bg-slate-600/50 rounded-full px-2.5 py-1">
                          <HelpCircle size={12} color="#94a3b8" />
                          <Text className="text-slate-400 text-xs font-medium ml-1">
                            {stat.noResponse} No Rsp
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
