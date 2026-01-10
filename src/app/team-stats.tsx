import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ChevronLeft,
  Trophy,
  Calendar,
  Users,
  Award,
  X,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTeamStore, Sport, HockeyStats, BaseballStats, BasketballStats, SoccerStats, Player, PlayerStats } from '@/lib/store';

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
      return ['AB', 'H', 'HR', 'RBI', 'K'];
    case 'basketball':
      return ['PTS', 'REB', 'AST', 'STL', 'BLK'];
    case 'soccer':
      return ['G', 'A', 'YC'];
    default:
      return ['G', 'A', 'PIM'];
  }
}

// Get stat values based on sport
function getStatValues(sport: Sport, stats: HockeyStats | BaseballStats | BasketballStats | SoccerStats | undefined): (number | string)[] {
  if (!stats) {
    if (sport === 'baseball' || sport === 'basketball') return ['-', '-', '-', '-', '-'];
    return ['-', '-', '-'];
  }

  switch (sport) {
    case 'hockey': {
      const s = stats as HockeyStats;
      return [s.goals ?? 0, s.assists ?? 0, s.pim ?? 0];
    }
    case 'baseball': {
      const s = stats as BaseballStats;
      return [s.atBats ?? 0, s.hits ?? 0, s.homeRuns ?? 0, s.rbi ?? 0, s.strikeouts ?? 0];
    }
    case 'basketball': {
      const s = stats as BasketballStats;
      return [s.points ?? 0, s.rebounds ?? 0, s.assists ?? 0, s.steals ?? 0, s.blocks ?? 0];
    }
    case 'soccer': {
      const s = stats as SoccerStats;
      return [s.goals ?? 0, s.assists ?? 0, s.yellowCards ?? 0];
    }
    default:
      return ['-', '-', '-'];
  }
}

// Calculate team totals based on sport
function calculateTeamTotals(players: Player[], sport: Sport): { label: string; value: number }[] {
  switch (sport) {
    case 'hockey': {
      let totalGoals = 0;
      let totalAssists = 0;
      let totalPim = 0;
      players.forEach((p) => {
        if (p.stats) {
          const s = p.stats as HockeyStats;
          totalGoals += s.goals ?? 0;
          totalAssists += s.assists ?? 0;
          totalPim += s.pim ?? 0;
        }
      });
      return [
        { label: 'Goals', value: totalGoals },
        { label: 'Assists', value: totalAssists },
        { label: 'PIM', value: totalPim },
      ];
    }
    case 'baseball': {
      let totalAB = 0;
      let totalHits = 0;
      let totalHR = 0;
      let totalRBI = 0;
      let totalK = 0;
      players.forEach((p) => {
        if (p.stats) {
          const s = p.stats as BaseballStats;
          totalAB += s.atBats ?? 0;
          totalHits += s.hits ?? 0;
          totalHR += s.homeRuns ?? 0;
          totalRBI += s.rbi ?? 0;
          totalK += s.strikeouts ?? 0;
        }
      });
      return [
        { label: 'Hits', value: totalHits },
        { label: 'HRs', value: totalHR },
        { label: 'RBIs', value: totalRBI },
      ];
    }
    case 'basketball': {
      let totalPts = 0;
      let totalReb = 0;
      let totalAst = 0;
      let totalStl = 0;
      let totalBlk = 0;
      players.forEach((p) => {
        if (p.stats) {
          const s = p.stats as BasketballStats;
          totalPts += s.points ?? 0;
          totalReb += s.rebounds ?? 0;
          totalAst += s.assists ?? 0;
          totalStl += s.steals ?? 0;
          totalBlk += s.blocks ?? 0;
        }
      });
      return [
        { label: 'Points', value: totalPts },
        { label: 'Rebounds', value: totalReb },
        { label: 'Assists', value: totalAst },
      ];
    }
    case 'soccer': {
      let totalGoals = 0;
      let totalAssists = 0;
      let totalYC = 0;
      players.forEach((p) => {
        if (p.stats) {
          const s = p.stats as SoccerStats;
          totalGoals += s.goals ?? 0;
          totalAssists += s.assists ?? 0;
          totalYC += s.yellowCards ?? 0;
        }
      });
      return [
        { label: 'Goals', value: totalGoals },
        { label: 'Assists', value: totalAssists },
        { label: 'Yellow Cards', value: totalYC },
      ];
    }
    default:
      return [];
  }
}

// Get stat field definitions based on sport
function getStatFields(sport: Sport): { key: string; label: string }[] {
  switch (sport) {
    case 'hockey':
      return [
        { key: 'goals', label: 'Goals' },
        { key: 'assists', label: 'Assists' },
        { key: 'pim', label: 'PIM' },
      ];
    case 'baseball':
      return [
        { key: 'atBats', label: 'At Bats' },
        { key: 'hits', label: 'Hits' },
        { key: 'homeRuns', label: 'Home Runs' },
        { key: 'rbi', label: 'RBI' },
        { key: 'strikeouts', label: 'Strikeouts' },
      ];
    case 'basketball':
      return [
        { key: 'points', label: 'Points' },
        { key: 'rebounds', label: 'Rebounds' },
        { key: 'assists', label: 'Assists' },
        { key: 'steals', label: 'Steals' },
        { key: 'blocks', label: 'Blocks' },
      ];
    case 'soccer':
      return [
        { key: 'goals', label: 'Goals' },
        { key: 'assists', label: 'Assists' },
        { key: 'yellowCards', label: 'Yellow Cards' },
      ];
    default:
      return [];
  }
}

// Get default stats for a sport
function getDefaultStats(sport: Sport): PlayerStats {
  switch (sport) {
    case 'hockey':
      return { goals: 0, assists: 0, pim: 0 };
    case 'baseball':
      return { atBats: 0, hits: 0, homeRuns: 0, rbi: 0, strikeouts: 0 };
    case 'basketball':
      return { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
    case 'soccer':
      return { goals: 0, assists: 0, yellowCards: 0 };
    default:
      return { goals: 0, assists: 0, pim: 0 };
  }
}

export default function TeamStatsScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);

  const sport = teamSettings.sport || 'hockey';

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editStats, setEditStats] = useState<Record<string, string>>({});

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

  // Calculate team totals
  const teamTotals = calculateTeamTotals(players, sport);

  // Get stat fields for edit modal
  const statFields = getStatFields(sport);

  // Open edit modal for a player
  const openEditModal = (player: Player) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayer(player);
    const currentStats = player.stats || getDefaultStats(sport);
    const statsObj: Record<string, string> = {};
    statFields.forEach((field) => {
      statsObj[field.key] = String((currentStats as unknown as Record<string, number>)[field.key] ?? 0);
    });
    setEditStats(statsObj);
    setEditModalVisible(true);
  };

  // Save stats
  const saveStats = () => {
    if (!selectedPlayer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStats: Record<string, number> = {};
    statFields.forEach((field) => {
      newStats[field.key] = parseInt(editStats[field.key] || '0', 10) || 0;
    });
    updatePlayer(selectedPlayer.id, { stats: newStats as unknown as PlayerStats });
    setEditModalVisible(false);
    setSelectedPlayer(null);
  };

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
            Season Statistics
          </Text>

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-6"
          >
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: '#67e8f920' }}
              >
                <Calendar size={20} color="#67e8f9" />
              </View>
              <View className="mr-4">
                <Text className="text-slate-400 text-sm">Games Played</Text>
                <Text className="text-white text-2xl font-bold">{gamesPlayed}</Text>
              </View>

              {/* Team Totals - inline */}
              {teamTotals.map((total) => (
                <View key={total.label} className="mx-3 items-center">
                  <Text className="text-cyan-400 text-xl font-bold">{total.value}</Text>
                  <Text className="text-slate-500 text-xs">{total.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

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
                <Text key={header} className="text-slate-300 font-semibold w-10 text-center">
                  {header}
                </Text>
              ))}
              {/* Spacer for chevron alignment */}
              <View className="w-5" />
            </View>

            {/* Table Rows */}
            {sortedPlayers.map((player, index) => {
              const statValues = getStatValues(sport, player.stats);
              return (
                <Pressable
                  key={player.id}
                  onPress={() => openEditModal(player)}
                  className={`flex-row items-center px-4 py-3 active:bg-slate-700/50 ${
                    index !== sortedPlayers.length - 1 ? 'border-b border-slate-700/50' : ''
                  }`}
                >
                  <View className="flex-1 flex-row items-center">
                    <Text className="text-cyan-400 font-medium w-8">#{player.number}</Text>
                    <Text className="text-white flex-1" numberOfLines={1}>{player.name}</Text>
                  </View>
                  {statValues.map((value, i) => (
                    <Text key={i} className="text-slate-300 w-10 text-center">
                      {value}
                    </Text>
                  ))}
                  <View className="w-5 items-center">
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Stats Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-slate-900">
            <LinearGradient
              colors={['#0f172a', '#1e293b', '#0f172a']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <SafeAreaView className="flex-1" edges={['top']}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-slate-700/50">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditModalVisible(false);
                  }}
                  className="p-2 -ml-2"
                >
                  <X size={24} color="#94a3b8" />
                </Pressable>
                <Text className="text-white text-lg font-semibold">Edit Stats</Text>
                <Pressable
                  onPress={saveStats}
                  className="px-4 py-2 bg-cyan-500 rounded-lg"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </Pressable>
              </View>

              <ScrollView className="flex-1 px-5 pt-4">
                {/* Player Info */}
                {selectedPlayer && (
                  <View className="mb-6">
                    <Text className="text-cyan-400 text-sm">#{selectedPlayer.number}</Text>
                    <Text className="text-white text-2xl font-bold">{selectedPlayer.name}</Text>
                  </View>
                )}

                {/* Stat Fields */}
                {statFields.map((field) => (
                  <View key={field.key} className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">{field.label}</Text>
                    <TextInput
                      className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg border border-slate-700"
                      value={editStats[field.key]}
                      onChangeText={(text) => setEditStats({ ...editStats, [field.key]: text.replace(/[^0-9]/g, '') })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                ))}
              </ScrollView>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
