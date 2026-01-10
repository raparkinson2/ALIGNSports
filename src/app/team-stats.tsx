import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Users,
  Percent,
  Award,
  Flame,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore } from '@/lib/store';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  index: number;
}

function StatCard({ icon, label, value, subtitle, color, index }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).springify()}
      className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50"
    >
      <View className="flex-row items-center mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </View>
        <Text className="text-slate-400 text-sm flex-1">{label}</Text>
      </View>
      <Text className="text-white text-3xl font-bold">{value}</Text>
      {subtitle && (
        <Text className="text-slate-500 text-sm mt-1">{subtitle}</Text>
      )}
    </Animated.View>
  );
}

export default function TeamStatsScreen() {
  const router = useRouter();
  const games = useTeamStore((s) => s.games);
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const teamName = useTeamStore((s) => s.teamName);

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastGames = games.filter((g) => {
    const gameDate = new Date(g.date);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate < today;
  });

  const upcomingGames = games.filter((g) => {
    const gameDate = new Date(g.date);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate >= today;
  });

  const totalGames = games.length;
  const gamesPlayed = pastGames.length;

  // Get record from team settings
  const wins = teamSettings.record?.wins ?? 0;
  const losses = teamSettings.record?.losses ?? 0;
  const ties = teamSettings.record?.ties ?? 0;

  const winPercentage = gamesPlayed > 0
    ? Math.round((wins / (wins + losses + ties)) * 100)
    : 0;

  // Calculate check-in stats
  const totalCheckIns = pastGames.reduce((sum, game) => {
    return sum + (game.checkedInPlayers?.length ?? 0);
  }, 0);

  const avgAttendance = gamesPlayed > 0
    ? Math.round(totalCheckIns / gamesPlayed)
    : 0;

  // Active players count
  const activePlayers = players.filter((p) => p.status === 'active').length;

  // Find player with most check-ins
  const playerCheckIns: Record<string, number> = {};
  pastGames.forEach((game) => {
    game.checkedInPlayers?.forEach((playerId) => {
      playerCheckIns[playerId] = (playerCheckIns[playerId] || 0) + 1;
    });
  });

  const topAttendeeId = Object.entries(playerCheckIns)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const topAttendee = players.find((p) => p.id === topAttendeeId);
  const topAttendeeGames = topAttendeeId ? playerCheckIns[topAttendeeId] : 0;

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

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
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color="#67e8f9" />
            <Text className="text-cyan-400 text-base ml-1">More</Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
            <Text className="text-white text-3xl font-bold">{teamName}</Text>
            <Text className="text-slate-400 text-base mt-1">Team Statistics</Text>
          </Animated.View>

          {/* Record Card */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl p-5 mb-6 border border-cyan-500/30"
          >
            <View className="flex-row items-center mb-3">
              <Trophy size={24} color="#67e8f9" />
              <Text className="text-cyan-400 text-lg font-semibold ml-2">Season Record</Text>
            </View>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-green-400 text-4xl font-bold">{wins}</Text>
                <Text className="text-slate-400 text-sm">Wins</Text>
              </View>
              <View className="items-center">
                <Text className="text-red-400 text-4xl font-bold">{losses}</Text>
                <Text className="text-slate-400 text-sm">Losses</Text>
              </View>
              <View className="items-center">
                <Text className="text-amber-400 text-4xl font-bold">{ties}</Text>
                <Text className="text-slate-400 text-sm">Ties</Text>
              </View>
            </View>
            {(wins + losses + ties) > 0 && (
              <View className="mt-4 pt-4 border-t border-slate-700/50">
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-400">Win Percentage</Text>
                  <Text className="text-white text-xl font-bold">{winPercentage}%</Text>
                </View>
                <View className="h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${winPercentage}%` }}
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Stats Grid */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Game Statistics
          </Text>

          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Calendar size={20} color="#67e8f9" />}
                label="Games Played"
                value={gamesPlayed}
                subtitle={`${upcomingGames.length} upcoming`}
                color="#67e8f9"
                index={0}
              />
            </View>
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Target size={20} color="#a78bfa" />}
                label="Total Games"
                value={totalGames}
                subtitle="All scheduled"
                color="#a78bfa"
                index={1}
              />
            </View>
          </View>

          {/* Attendance Stats */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Attendance
          </Text>

          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Users size={20} color="#22c55e" />}
                label="Avg Attendance"
                value={avgAttendance}
                subtitle="Players per game"
                color="#22c55e"
                index={2}
              />
            </View>
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<TrendingUp size={20} color="#f59e0b" />}
                label="Total Check-ins"
                value={totalCheckIns}
                subtitle="All games"
                color="#f59e0b"
                index={3}
              />
            </View>
          </View>

          {/* Top Attendee */}
          {topAttendee && (
            <>
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Most Dedicated
              </Text>

              <Animated.View
                entering={FadeInDown.delay(300).springify()}
                className="bg-slate-800/60 rounded-2xl p-4 border border-amber-500/30 mb-6"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center mr-4">
                    <Flame size={24} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">{topAttendee.name}</Text>
                    <Text className="text-slate-400 text-sm">#{topAttendee.number} · {topAttendee.position}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-amber-400 text-2xl font-bold">{topAttendeeGames}</Text>
                    <Text className="text-slate-500 text-xs">games attended</Text>
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* Roster Stats */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Roster
          </Text>

          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Users size={20} color="#67e8f9" />}
                label="Active Players"
                value={activePlayers}
                subtitle="On roster"
                color="#67e8f9"
                index={4}
              />
            </View>
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Award size={20} color="#a78bfa" />}
                label="Total Roster"
                value={players.length}
                subtitle="Including reserves"
                color="#a78bfa"
                index={5}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
