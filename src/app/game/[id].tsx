import { View, Text, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import {
  MapPin,
  Clock,
  Beer,
  Users,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Camera,
  Navigation,
  Shirt,
  Send,
  Mail,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTeamStore, Player } from '@/lib/store';
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

interface PlayerRowProps {
  player: Player;
  isCheckedIn: boolean;
  isBeerPerson: boolean;
  onToggleCheckIn: () => void;
  index: number;
}

function PlayerRow({ player, isCheckedIn, isBeerPerson, onToggleCheckIn, index }: PlayerRowProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleCheckIn();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={handlePress}
        className={cn(
          'flex-row items-center p-3 rounded-xl mb-2',
          isCheckedIn ? 'bg-green-500/20' : 'bg-slate-800/60'
        )}
      >
        <View className="relative">
          <Image
            source={{ uri: player.avatar }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
            contentFit="cover"
          />
          {isCheckedIn && (
            <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 size={14} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold">{player.name}</Text>
            {isBeerPerson && (
              <View className="bg-amber-500/30 rounded-full px-2 py-0.5 ml-2">
                <Text className="text-amber-400 text-xs">Beer Bag</Text>
              </View>
            )}
          </View>
          <Text className="text-slate-400 text-xs">#{player.number} · {player.position}</Text>
        </View>

        {isCheckedIn ? (
          <CheckCircle2 size={24} color="#22c55e" />
        ) : (
          <Circle size={24} color="#475569" />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const games = useTeamStore((s) => s.games);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);
  const checkInToGame = useTeamStore((s) => s.checkInToGame);
  const checkOutFromGame = useTeamStore((s) => s.checkOutFromGame);

  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white">Game not found</Text>
      </View>
    );
  }

  const beerPerson = players.find((p) => p.id === game.beerBagAssignee);
  const checkedInCount = game.checkedInPlayers.length;
  const totalPlayers = players.length;

  const handleToggleCheckIn = (playerId: string) => {
    if (game.checkedInPlayers.includes(playerId)) {
      checkOutFromGame(game.id, playerId);
    } else {
      checkInToGame(game.id, playerId);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenMaps = () => {
    const address = encodeURIComponent(`${game.rinkName}, ${game.rinkAddress}`);
    Linking.openURL(`https://maps.apple.com/?q=${address}`);
  };

  const handleSendTextInvite = () => {
    const gameDate = new Date(game.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let message = `Hey! You're invited to play hockey with ${teamName}!\n\n`;
    message += `Game Details:\n`;
    message += `vs ${game.opponent}\n`;
    message += `${dateStr} at ${game.time}\n`;
    message += `${game.rinkName}\n`;
    message += `${game.rinkAddress}\n\n`;
    message += `Let me know if you can make it!`;

    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(message)}`,
      android: `sms:?body=${encodeURIComponent(message)}`,
      default: `sms:?body=${encodeURIComponent(message)}`,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Could not open messaging app');
    });
  };

  const handleSendEmailInvite = () => {
    const gameDate = new Date(game.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const subject = encodeURIComponent(`Hockey Game Invite - ${teamName} vs ${game.opponent}`);
    let body = `Hey!\n\nYou're invited to play hockey with ${teamName}!\n\n`;
    body += `Game Details:\n`;
    body += `vs ${game.opponent}\n`;
    body += `${dateStr} at ${game.time}\n`;
    body += `${game.rinkName}\n`;
    body += `${game.rinkAddress}\n\n`;
    body += `Let me know if you can make it!`;

    const mailtoUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  // Group players by position for lineup
  const forwards = players.filter((p) => ['C', 'LW', 'RW'].includes(p.position));
  const defense = players.filter((p) => p.position === 'D');
  const goalies = players.filter((p) => p.position === 'G');

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
          className="flex-row items-center px-4 py-3"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color="#67e8f9" />
            <Text className="text-cyan-400 ml-1">Schedule</Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Game Header Card */}
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className="mx-4 mb-4"
          >
            <View className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50">
              <View style={{ backgroundColor: game.jerseyColor, height: 6 }} />
              <View className="p-5">
                <Text className="text-white text-2xl font-bold mb-1">
                  vs {game.opponent}
                </Text>
                <Text className="text-cyan-400 text-lg">
                  {format(parseISO(game.date), 'EEEE, MMMM d')}
                </Text>

                <View className="flex-row mt-4">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Clock size={16} color="#67e8f9" />
                      <Text className="text-white ml-2 font-medium">{game.time}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Shirt size={16} color="#67e8f9" />
                      <View
                        className="w-4 h-4 rounded-full ml-2 mr-2 border border-white/30"
                        style={{ backgroundColor: game.jerseyColor }}
                      />
                      <Text className="text-white font-medium">
                        {getJerseyColorName(game.jerseyColor)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Users size={16} color="#22c55e" />
                      <Text className="text-green-400 ml-2 font-medium">
                        {checkedInCount}/{totalPlayers} In
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Beer size={16} color="#f59e0b" />
                      <Text className="text-amber-400 ml-2 font-medium">
                        {beerPerson?.name?.split(' ')[0] || 'TBD'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Location Card */}
          <Animated.View
            entering={FadeInUp.delay(150).springify()}
            className="mx-4 mb-4"
          >
            <Pressable
              onPress={handleOpenMaps}
              className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <MapPin size={18} color="#67e8f9" />
                    <Text className="text-cyan-400 font-semibold ml-2">Rink Location</Text>
                  </View>
                  <Text className="text-white font-medium text-lg">{game.rinkName}</Text>
                  <Text className="text-slate-400">{game.rinkAddress}</Text>
                </View>
                <View className="bg-cyan-500/20 p-3 rounded-full">
                  <Navigation size={20} color="#67e8f9" />
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Send Game Invite Section */}
          <Animated.View
            entering={FadeInUp.delay(175).springify()}
            className="mx-4 mb-4"
          >
            <View className="flex-row items-center mb-3">
              <Send size={18} color="#a78bfa" />
              <Text className="text-purple-400 text-lg font-semibold ml-2">
                Invite Someone
              </Text>
            </View>
            <View className="flex-row">
              <Pressable
                onPress={handleSendTextInvite}
                className="flex-1 bg-purple-500/20 rounded-xl p-4 mr-2 border border-purple-500/30 active:bg-purple-500/30 flex-row items-center justify-center"
              >
                <Send size={18} color="#a78bfa" />
                <Text className="text-purple-400 font-semibold ml-2">Text Invite</Text>
              </Pressable>
              <Pressable
                onPress={handleSendEmailInvite}
                className="flex-1 bg-purple-500/20 rounded-xl p-4 ml-2 border border-purple-500/30 active:bg-purple-500/30 flex-row items-center justify-center"
              >
                <Mail size={18} color="#a78bfa" />
                <Text className="text-purple-400 font-semibold ml-2">Email Invite</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Check-In Section */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            className="mx-4 mb-4"
          >
            <View className="flex-row items-center mb-3">
              <CheckCircle2 size={18} color="#22c55e" />
              <Text className="text-green-400 text-lg font-semibold ml-2">
                Check In for Game
              </Text>
            </View>

            <View className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
              {players.map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isCheckedIn={game.checkedInPlayers.includes(player.id)}
                  isBeerPerson={player.id === game.beerBagAssignee}
                  onToggleCheckIn={() => handleToggleCheckIn(player.id)}
                  index={index}
                />
              ))}
            </View>
          </Animated.View>

          {/* Lineup Section */}
          <Animated.View
            entering={FadeInUp.delay(250).springify()}
            className="mx-4 mb-4"
          >
            <View className="flex-row items-center mb-3">
              <Users size={18} color="#67e8f9" />
              <Text className="text-cyan-400 text-lg font-semibold ml-2">
                Tonight's Lineup
              </Text>
            </View>

            <View className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              {/* Forwards */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">
                  Forwards
                </Text>
                <View className="flex-row flex-wrap">
                  {forwards.map((player) => (
                    <View
                      key={player.id}
                      className={cn(
                        'bg-slate-700/60 rounded-lg px-3 py-2 mr-2 mb-2',
                        game.checkedInPlayers.includes(player.id) && 'bg-green-500/20'
                      )}
                    >
                      <Text className="text-white text-sm font-medium">
                        #{player.number} {player.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Defense */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">
                  Defense
                </Text>
                <View className="flex-row flex-wrap">
                  {defense.map((player) => (
                    <View
                      key={player.id}
                      className={cn(
                        'bg-slate-700/60 rounded-lg px-3 py-2 mr-2 mb-2',
                        game.checkedInPlayers.includes(player.id) && 'bg-green-500/20'
                      )}
                    >
                      <Text className="text-white text-sm font-medium">
                        #{player.number} {player.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Goalies */}
              <View>
                <Text className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">
                  Goalie
                </Text>
                <View className="flex-row flex-wrap">
                  {goalies.map((player) => (
                    <View
                      key={player.id}
                      className={cn(
                        'bg-slate-700/60 rounded-lg px-3 py-2 mr-2 mb-2',
                        game.checkedInPlayers.includes(player.id) && 'bg-green-500/20'
                      )}
                    >
                      <Text className="text-white text-sm font-medium">
                        #{player.number} {player.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
