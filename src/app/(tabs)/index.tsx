import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar, MapPin, Clock, Beer, Users, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTeamStore, Game } from '@/lib/store';
import { cn } from '@/lib/cn';

const getJerseyColorName = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#1e40af': 'Blue',
    '#dc2626': 'Red',
    '#ffffff': 'White',
    '#16a34a': 'Green',
    '#000000': 'Black',
  };
  return colorMap[hex] || 'Custom';
};

const getDateLabel = (dateString: string): string => {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

interface GameCardProps {
  game: Game;
  index: number;
  onPress: () => void;
}

function GameCard({ game, index, onPress }: GameCardProps) {
  const players = useTeamStore((s) => s.players);
  const beerPerson = players.find((p) => p.id === game.beerBagAssignee);
  const checkedInCount = game.checkedInPlayers.length;
  const totalPlayers = players.length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={onPress}
        className="mb-4 active:scale-[0.98]"
        style={{ transform: [{ scale: 1 }] }}
      >
        <View className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50">
          {/* Jersey Color Bar */}
          <View style={{ backgroundColor: game.jerseyColor, height: 4 }} />

          <View className="p-4">
            {/* Date Badge & Opponent */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="bg-cyan-500/20 px-3 py-1 rounded-full mr-3">
                  <Text className="text-cyan-400 text-xs font-semibold">
                    {getDateLabel(game.date)}
                  </Text>
                </View>
                <Text className="text-white text-xl font-bold">vs {game.opponent}</Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </View>

            {/* Info Grid */}
            <View className="flex-row mb-3">
              <View className="flex-1 flex-row items-center">
                <Clock size={14} color="#67e8f9" />
                <Text className="text-slate-300 text-sm ml-2">{game.time}</Text>
              </View>
              <View className="flex-1 flex-row items-center">
                <View
                  className="w-3 h-3 rounded-full mr-2 border border-white/30"
                  style={{ backgroundColor: game.jerseyColor }}
                />
                <Text className="text-slate-300 text-sm">
                  {getJerseyColorName(game.jerseyColor)} Jersey
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-center mb-3">
              <MapPin size={14} color="#67e8f9" />
              <Text className="text-slate-400 text-sm ml-2">{game.rinkName}</Text>
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-between pt-3 border-t border-slate-700/50">
              <View className="flex-row items-center">
                <Users size={14} color="#22c55e" />
                <Text className="text-green-400 text-sm ml-2 font-medium">
                  {checkedInCount}/{totalPlayers} checked in
                </Text>
              </View>
              <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded-full">
                <Beer size={12} color="#f59e0b" />
                <Text className="text-amber-400 text-xs ml-1">
                  {beerPerson?.name?.split(' ')[0] || 'TBD'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ScheduleScreen() {
  const router = useRouter();
  const teamName = useTeamStore((s) => s.teamName);
  const games = useTeamStore((s) => s.games);

  // Sort games by date
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingGames = sortedGames.filter(
    (g) => new Date(g.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInRight.delay(50).springify()}
          className="px-5 pt-2 pb-4"
        >
          <Text className="text-slate-400 text-sm font-medium">Your Team</Text>
          <Text className="text-white text-3xl font-bold">{teamName}</Text>
        </Animated.View>

        {/* Schedule Section */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color="#67e8f9" />
            <Text className="text-cyan-400 text-lg font-semibold ml-2">
              Upcoming Games
            </Text>
          </View>

          {upcomingGames.length === 0 ? (
            <View className="bg-slate-800/50 rounded-2xl p-8 items-center">
              <Calendar size={48} color="#475569" />
              <Text className="text-slate-400 text-center mt-4">
                No upcoming games scheduled
              </Text>
            </View>
          ) : (
            upcomingGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onPress={() => router.push(`/game/${game.id}`)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
