import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Calendar, Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTeamStore, ArchivedSeason, SPORT_NAMES } from '@/lib/store';
import { format, parseISO } from 'date-fns';

export default function SeasonHistoryScreen() {
  const router = useRouter();
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const seasonHistory = teamSettings.seasonHistory || [];

  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);

  const toggleExpanded = (seasonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSeasonId(expandedSeasonId === seasonId ? null : seasonId);
  };

  const formatRecord = (season: ArchivedSeason): string => {
    const { wins, losses, ties, otLosses } = season.teamRecord;
    if (season.sport === 'hockey' && otLosses !== undefined) {
      return `${wins}-${losses}-${ties ?? 0}-${otLosses}`;
    }
    if (ties !== undefined && ties > 0) {
      return `${wins}-${losses}-${ties}`;
    }
    return `${wins}-${losses}`;
  };

  // Sort seasons by archived date, most recent first
  const sortedSeasons = [...seasonHistory].sort((a, b) =>
    new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );

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
            <Text className="text-white text-2xl font-bold">Season History</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
            <Calendar size={20} color="#a78bfa" />
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {sortedSeasons.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="bg-slate-800/60 rounded-xl p-6 items-center"
            >
              <Calendar size={40} color="#64748b" />
              <Text className="text-slate-400 text-center mt-3">
                No archived seasons yet.
              </Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Use "End Season" in Admin to archive your first season.
              </Text>
            </Animated.View>
          ) : (
            sortedSeasons.map((season, index) => (
              <Animated.View
                key={season.id}
                entering={FadeInDown.delay(100 + index * 50).springify()}
                className="mb-3"
              >
                <Pressable
                  onPress={() => toggleExpanded(season.id)}
                  className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden"
                >
                  {/* Season Header */}
                  <View className="flex-row items-center px-4 py-3">
                    <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                      <Trophy size={20} color="#a78bfa" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{season.seasonName}</Text>
                      <Text className="text-slate-400 text-sm">
                        {formatRecord(season)} • {SPORT_NAMES[season.sport]}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-slate-500 text-xs mr-2">
                        {format(parseISO(season.archivedAt), 'MMM yyyy')}
                      </Text>
                      {expandedSeasonId === season.id ? (
                        <ChevronUp size={20} color="#64748b" />
                      ) : (
                        <ChevronDown size={20} color="#64748b" />
                      )}
                    </View>
                  </View>

                  {/* Expanded Content */}
                  {expandedSeasonId === season.id && (
                    <View className="border-t border-slate-700/50">
                      {/* Team Record Details */}
                      <View className="px-4 py-3 bg-slate-700/20">
                        <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          Team Record
                        </Text>
                        <View className="flex-row flex-wrap">
                          <View className="w-1/3 mb-2">
                            <Text className="text-slate-500 text-xs">Wins</Text>
                            <Text className="text-white font-semibold">{season.teamRecord.wins}</Text>
                          </View>
                          <View className="w-1/3 mb-2">
                            <Text className="text-slate-500 text-xs">Losses</Text>
                            <Text className="text-white font-semibold">{season.teamRecord.losses}</Text>
                          </View>
                          {season.teamRecord.ties !== undefined && (
                            <View className="w-1/3 mb-2">
                              <Text className="text-slate-500 text-xs">Ties</Text>
                              <Text className="text-white font-semibold">{season.teamRecord.ties}</Text>
                            </View>
                          )}
                          {season.teamRecord.longestWinStreak !== undefined && season.teamRecord.longestWinStreak > 0 && (
                            <View className="w-1/3 mb-2">
                              <Text className="text-slate-500 text-xs">Win Streak</Text>
                              <Text className="text-orange-400 font-semibold">{season.teamRecord.longestWinStreak}</Text>
                            </View>
                          )}
                          {season.teamRecord.longestLosingStreak !== undefined && season.teamRecord.longestLosingStreak > 0 && (
                            <View className="w-1/3 mb-2">
                              <Text className="text-slate-500 text-xs">Lose Streak</Text>
                              <Text className="text-red-400 font-semibold">{season.teamRecord.longestLosingStreak}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Player Stats */}
                      {season.playerStats.length > 0 && (
                        <View className="px-4 py-3">
                          <View className="flex-row items-center mb-2">
                            <Users size={14} color="#67e8f9" />
                            <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider ml-2">
                              Players ({season.playerStats.length})
                            </Text>
                          </View>
                          {season.playerStats.slice(0, 5).map((player) => (
                            <View
                              key={player.playerId}
                              className="flex-row items-center py-1.5 border-b border-slate-700/30 last:border-b-0"
                            >
                              <View className="w-6 h-6 rounded-full bg-slate-700 items-center justify-center mr-2">
                                <Text className="text-slate-300 text-xs font-bold">
                                  {player.jerseyNumber}
                                </Text>
                              </View>
                              <Text className="text-white text-sm flex-1">{player.playerName}</Text>
                              <Text className="text-slate-400 text-xs">{player.position}</Text>
                            </View>
                          ))}
                          {season.playerStats.length > 5 && (
                            <Text className="text-slate-500 text-xs mt-2 text-center">
                              +{season.playerStats.length - 5} more players
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
