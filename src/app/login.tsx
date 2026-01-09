import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Player, SPORT_NAMES } from '@/lib/store';

interface PlayerLoginCardProps {
  player: Player;
  index: number;
  onSelect: () => void;
}

function PlayerLoginCard({ player, index, onSelect }: PlayerLoginCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).springify()}>
      <Pressable
        onPress={handlePress}
        className="bg-slate-800/80 rounded-2xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80 active:scale-[0.98]"
      >
        <View className="flex-row items-center">
          <View className="relative">
            {player.avatar ? (
              <Image
                source={{ uri: player.avatar }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-cyan-500/20 items-center justify-center">
                <User size={28} color="#67e8f9" />
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-bold">#{player.number}</Text>
            </View>
          </View>

          <View className="flex-1 ml-4">
            <Text className="text-white text-lg font-semibold">{player.name}</Text>
            <Text className="text-slate-400 text-sm">{player.position}</Text>
          </View>

          <ChevronRight size={24} color="#67e8f9" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const setCurrentPlayerId = useTeamStore((s) => s.setCurrentPlayerId);
  const setIsLoggedIn = useTeamStore((s) => s.setIsLoggedIn);

  const teamLogo = teamSettings?.teamLogo;
  const sport = teamSettings?.sport ?? 'hockey';

  // Sport emoji fallbacks
  const sportEmojis: Record<string, string> = {
    hockey: '🏒',
    baseball: '⚾',
    basketball: '🏀',
    soccer: '⚽',
  };

  const handleSelectPlayer = (playerId: string) => {
    setCurrentPlayerId(playerId);
    setIsLoggedIn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0c4a6e', '#0f172a', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInUp.delay(50).springify()}
          className="items-center pt-8 pb-6"
        >
          {teamLogo ? (
            <Image
              source={{ uri: teamLogo }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(103, 232, 249, 0.5)' }}
              contentFit="cover"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
              <Text className="text-4xl">{sportEmojis[sport]}</Text>
            </View>
          )}
          <Text className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-1 mt-4">
            Welcome to
          </Text>
          <Text className="text-white text-3xl font-bold">{teamName}</Text>
        </Animated.View>

        {/* Player Selection */}
        <Animated.View
          entering={FadeInUp.delay(150).springify()}
          className="px-5 mb-4"
        >
          <Text className="text-slate-400 text-base mb-2">
            Select your name to continue
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {players.map((player, index) => (
            <PlayerLoginCard
              key={player.id}
              player={player}
              index={index}
              onSelect={() => handleSelectPlayer(player.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
