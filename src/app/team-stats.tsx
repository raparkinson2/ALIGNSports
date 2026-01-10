import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  Trophy,
  Calendar,
  Users,
  Award,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Sport, HockeyStats, BaseballStats, BasketballStats, SoccerStats } from '@/lib/store';

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

// Get stat column headers based on sport
function getStatHeaders(sport: Sport): string[] {
  switch (sport) {
    case 'hockey':
      return ['G', 'A', 'PIM'];
    case 'baseball':
      return ['AB', 'H', 'RBI'];
    case 'basketball':
      return ['PTS', 'REB', 'AST'];
    case 'soccer':
      return ['G', 'A', 'YC'];
    default:
      return ['G', 'A', 'PIM'];
  }
}

// Get stat values based on sport
function getStatValues(sport: Sport, stats: HockeyStats | BaseballStats | BasketballStats | SoccerStats | undefined): (number | string)[] {
  if (!stats) return ['-', '-', '-'];

  switch (sport) {
    case 'hockey': {
      const s = stats as HockeyStats;
      return [s.goals ?? 0, s.assists ?? 0, s.pim ?? 0];
    }
    case 'baseball': {
      const s = stats as BaseballStats;
      return [s.atBats ?? 0, s.hits ?? 0, s.rbi ?? 0];
    }
    case 'basketball': {
      const s = stats as BasketballStats;
      return [s.points ?? 0, s.rebounds ?? 0, s.assists ?? 0];
    }
    case 'soccer': {
      const s = stats as SoccerStats;
      return [s.goals ?? 0, s.assists ?? 0, s.yellowCards ?? 0];
    }
    default:
      return ['-', '-', '-'];
  }
}

export default function TeamStatsScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const teamName = useTeamStore((s) => s.teamName);

  const sport = teamSettings.sport || 'hockey';

  // Get record from team settings
  const wins = teamSettings.record?.wins ?? 0;
  const losses = teamSettings.record?.losses ?? 0;
  const ties = teamSettings.record?.ties ?? 0;

  // Games played is the sum of wins + losses + ties
  const gamesPlayed = wins + losses + ties;

  // Win percentage calculation - format as .XXX (three decimal places)
  const winPercentage = gamesPlayed > 0
    ? (wins / gamesPlayed).toFixed(3)
    : '.000';

  // Active players count
  const activePlayers = players.filter((p) => p.status === 'active').length;

  // Sort players by points (goals + assists for hockey/soccer, points for basketball, hits for baseball)
  const sortedPlayers = [...players].sort((a, b) => {
    const aStats = a.stats;
    const bStats = b.stats;

    if (!aStats && !bStats) return 0;
    if (!aStats) return 1;
    if (!bStats) return -1;

    switch (sport) {
      case 'hockey': {
        const aTotal = (aStats as HockeyStats).goals + (aStats as HockeyStats).assists;
        const bTotal = (bStats as HockeyStats).goals + (bStats as HockeyStats).assists;
        return bTotal - aTotal;
      }
      case 'baseball': {
        return (bStats as BaseballStats).hits - (aStats as BaseballStats).hits;
      }
      case 'basketball': {
        return (bStats as BasketballStats).points - (aStats as BasketballStats).points;
      }
      case 'soccer': {
        const aTotal = (aStats as SoccerStats).goals + (aStats as SoccerStats).assists;
        const bTotal = (bStats as SoccerStats).goals + (bStats as SoccerStats).assists;
        return bTotal - aTotal;
      }
      default:
        return 0;
    }
  });

  const statHeaders = getStatHeaders(sport);

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
            <View className="mt-4 pt-4 border-t border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400">Win Percentage</Text>
                <Text className="text-white text-xl font-bold">{winPercentage}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Game Statistics
          </Text>

          <View className="mb-6">
            <StatCard
              icon={<Calendar size={20} color="#67e8f9" />}
              label="Games Played"
              value={gamesPlayed}
              subtitle="This season"
              color="#67e8f9"
              index={0}
            />
          </View>

          {/* Roster Stats */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Roster
          </Text>

          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Users size={20} color="#22c55e" />}
                label="Active Players"
                value={activePlayers}
                subtitle="On roster"
                color="#22c55e"
                index={1}
              />
            </View>
            <View className="w-[48%] mb-3">
              <StatCard
                icon={<Award size={20} color="#a78bfa" />}
                label="Total Roster"
                value={players.length}
                subtitle="Including reserves"
                color="#a78bfa"
                index={2}
              />
            </View>
          </View>

          {/* Player Stats Table */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Player Statistics
          </Text>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden"
          >
            {/* Table Header */}
            <View className="flex-row items-center px-4 py-3 bg-slate-700/50 border-b border-slate-700">
              <Text className="text-slate-300 font-semibold flex-1">Player</Text>
              {statHeaders.map((header) => (
                <Text key={header} className="text-slate-300 font-semibold w-12 text-center">
                  {header}
                </Text>
              ))}
            </View>

            {/* Table Rows */}
            {sortedPlayers.map((player, index) => {
              const statValues = getStatValues(sport, player.stats);
              return (
                <View
                  key={player.id}
                  className={`flex-row items-center px-4 py-3 ${
                    index !== sortedPlayers.length - 1 ? 'border-b border-slate-700/50' : ''
                  }`}
                >
                  <View className="flex-1 flex-row items-center">
                    <Text className="text-cyan-400 font-medium w-8">#{player.number}</Text>
                    <Text className="text-white flex-1" numberOfLines={1}>{player.name}</Text>
                  </View>
                  {statValues.map((value, i) => (
                    <Text key={i} className="text-slate-300 w-12 text-center">
                      {value}
                    </Text>
                  ))}
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
