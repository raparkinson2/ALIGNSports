import { View, Text, ScrollView, Pressable, Platform, Alert, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import {
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Navigation,
  Shirt,
  Send,
  Mail,
  Bell,
  BellRing,
  Beer,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTeamStore, Player, SPORT_POSITION_NAMES, AppNotification } from '@/lib/store';
import { cn } from '@/lib/cn';

interface PlayerRowProps {
  player: Player;
  isCheckedIn: boolean;
  onToggleCheckIn: () => void;
  index: number;
}

function PlayerRow({ player, isCheckedIn, onToggleCheckIn, index }: PlayerRowProps) {
  const sport = useTeamStore((s) => s.teamSettings.sport);
  const positionName = SPORT_POSITION_NAMES[sport][player.position] || player.position;

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
          <Text className="text-white font-semibold">{player.name}</Text>
          <Text className="text-slate-400 text-xs">#{player.number} · {positionName}</Text>
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
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const checkInToGame = useTeamStore((s) => s.checkInToGame);
  const checkOutFromGame = useTeamStore((s) => s.checkOutFromGame);
  const addNotification = useTeamStore((s) => s.addNotification);
  const updateGame = useTeamStore((s) => s.updateGame);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isBeerDutyModalVisible, setIsBeerDutyModalVisible] = useState(false);

  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white">Game not found</Text>
      </View>
    );
  }

  const checkedInCount = game.checkedInPlayers?.length ?? 0;
  const invitedPlayers = players.filter((p) => game.invitedPlayers?.includes(p.id));
  const beerDutyPlayer = game.beerDutyPlayerId ? players.find((p) => p.id === game.beerDutyPlayerId) : null;

  const handleToggleCheckIn = (playerId: string) => {
    if (game.checkedInPlayers?.includes(playerId)) {
      checkOutFromGame(game.id, playerId);
    } else {
      checkInToGame(game.id, playerId);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenMaps = () => {
    const address = encodeURIComponent(`${game.location}, ${game.address}`);
    Linking.openURL(`https://maps.apple.com/?q=${address}`);
  };

  const handleSendInAppNotification = (type: 'invite' | 'reminder') => {
    const gameDate = parseISO(game.date);
    const dateStr = format(gameDate, 'EEEE, MMMM d');

    invitedPlayers.forEach((player) => {
      const notification: AppNotification = {
        id: `${Date.now()}-${player.id}`,
        type: type === 'invite' ? 'game_invite' : 'game_reminder',
        title: type === 'invite' ? 'Game Invite' : 'Game Reminder',
        message: type === 'invite'
          ? `You're invited to play vs ${game.opponent} on ${dateStr} at ${game.time}. Wear your ${game.jerseyColor} jersey!`
          : `Reminder: Game vs ${game.opponent} is coming up on ${dateStr} at ${game.time}. Don't forget your ${game.jerseyColor} jersey!`,
        gameId: game.id,
        fromPlayerId: currentPlayerId ?? undefined,
        toPlayerId: player.id,
        createdAt: new Date().toISOString(),
        read: false,
      };
      addNotification(notification);
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Notifications Sent',
      `${type === 'invite' ? 'Game invites' : 'Reminders'} sent to ${invitedPlayers.length} players!`
    );
  };

  const handleSendTextInvite = () => {
    const gameDate = new Date(game.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const phoneNumbers = invitedPlayers
      .filter((p) => p.phone)
      .map((p) => p.phone)
      .join(',');

    let message = `Hey! You're invited to play with ${teamName}!\n\n`;
    message += `Game Details:\n`;
    message += `vs ${game.opponent}\n`;
    message += `${dateStr} at ${game.time}\n`;
    message += `${game.location}\n`;
    message += `${game.address}\n\n`;
    message += `Wear your ${game.jerseyColor} jersey!\n\n`;
    message += `Let me know if you can make it!`;

    const smsUrl = Platform.select({
      ios: `sms:${phoneNumbers}&body=${encodeURIComponent(message)}`,
      android: `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`,
      default: `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Could not open messaging app');
    });
  };

  const handleSendEmailInvite = () => {
    const gameDate = new Date(game.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const emails = invitedPlayers
      .filter((p) => p.email)
      .map((p) => p.email)
      .join(',');

    const subject = encodeURIComponent(`Game Invite - ${teamName} vs ${game.opponent}`);
    let body = `Hey!\n\nYou're invited to play with ${teamName}!\n\n`;
    body += `Game Details:\n`;
    body += `vs ${game.opponent}\n`;
    body += `${dateStr} at ${game.time}\n`;
    body += `${game.location}\n`;
    body += `${game.address}\n\n`;
    body += `Wear your ${game.jerseyColor} jersey!\n\n`;
    body += `Let me know if you can make it!`;

    const mailtoUrl = `mailto:${emails}?subject=${subject}&body=${encodeURIComponent(body)}`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleToggleBeerDuty = (value: boolean) => {
    updateGame(game.id, { showBeerDuty: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectBeerDutyPlayer = (playerId: string) => {
    updateGame(game.id, { beerDutyPlayerId: playerId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsBeerDutyModalVisible(false);
  };

  // Get jersey color info
  const jerseyColorInfo = teamSettings.jerseyColors.find((c) => c.name === game.jerseyColor);

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
          className="flex-row items-center justify-between px-4 py-3"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color="#67e8f9" />
            <Text className="text-cyan-400 ml-1">Schedule</Text>
          </Pressable>

          {canManageTeam() && (
            <Pressable
              onPress={() => setIsSettingsModalVisible(true)}
              className="p-2"
            >
              <Settings size={22} color="#64748b" />
            </Pressable>
          )}
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
              <View style={{ backgroundColor: jerseyColorInfo?.color || '#ffffff', height: 6 }} />
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
                        style={{ backgroundColor: jerseyColorInfo?.color || '#ffffff' }}
                      />
                      <Text className="text-white font-medium">
                        {game.jerseyColor}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Users size={16} color="#22c55e" />
                      <Text className="text-green-400 ml-2 font-medium">
                        {checkedInCount}/{invitedPlayers.length} In
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Beer/Refreshment Duty - Only show if enabled */}
          {game.showBeerDuty && (
            <Animated.View
              entering={FadeInUp.delay(120).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={canManageTeam() ? () => setIsBeerDutyModalVisible(true) : undefined}
                className="bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30"
              >
                <View className="flex-row items-center">
                  <Beer size={24} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-400 font-semibold">Refreshment Duty</Text>
                    {beerDutyPlayer ? (
                      <View className="flex-row items-center mt-1">
                        <Image
                          source={{ uri: beerDutyPlayer.avatar }}
                          style={{ width: 24, height: 24, borderRadius: 12 }}
                          contentFit="cover"
                        />
                        <Text className="text-white ml-2">{beerDutyPlayer.name}</Text>
                      </View>
                    ) : (
                      <Text className="text-slate-400 text-sm">Not assigned</Text>
                    )}
                  </View>
                  {canManageTeam() && (
                    <ChevronDown size={20} color="#f59e0b" />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          )}

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
                    <Text className="text-cyan-400 font-semibold ml-2">Location</Text>
                  </View>
                  <Text className="text-white font-medium text-lg">{game.location}</Text>
                  <Text className="text-slate-400">{game.address}</Text>
                </View>
                <View className="bg-cyan-500/20 p-3 rounded-full">
                  <Navigation size={20} color="#67e8f9" />
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* In-App Notifications Section */}
          {canManageTeam() && (
            <Animated.View
              entering={FadeInUp.delay(160).springify()}
              className="mx-4 mb-4"
            >
              <View className="flex-row items-center mb-3">
                <Bell size={18} color="#22c55e" />
                <Text className="text-green-400 text-lg font-semibold ml-2">
                  Send Notifications
                </Text>
              </View>
              <View className="flex-row">
                <Pressable
                  onPress={() => handleSendInAppNotification('invite')}
                  className="flex-1 bg-green-500/20 rounded-xl p-4 mr-2 border border-green-500/30 active:bg-green-500/30 flex-row items-center justify-center"
                >
                  <Bell size={18} color="#22c55e" />
                  <Text className="text-green-400 font-semibold ml-2">Send Invite</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSendInAppNotification('reminder')}
                  className="flex-1 bg-green-500/20 rounded-xl p-4 ml-2 border border-green-500/30 active:bg-green-500/30 flex-row items-center justify-center"
                >
                  <BellRing size={18} color="#22c55e" />
                  <Text className="text-green-400 font-semibold ml-2">Reminder</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* External Invite Section */}
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
              {invitedPlayers.map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isCheckedIn={game.checkedInPlayers?.includes(player.id) ?? false}
                  onToggleCheckIn={() => handleToggleCheckIn(player.id)}
                  index={index}
                />
              ))}
              {invitedPlayers.length === 0 && (
                <Text className="text-slate-400 text-center py-4">
                  No players invited yet
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Game Notes */}
          {game.notes && (
            <Animated.View
              entering={FadeInUp.delay(250).springify()}
              className="mx-4 mb-4"
            >
              <View className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <Text className="text-slate-400 text-sm font-medium mb-2">Notes</Text>
                <Text className="text-white">{game.notes}</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Game Settings Modal (Admin only) */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsSettingsModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Game Settings</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Beer Duty Toggle - Admin Only */}
              {isAdmin() && (
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Beer size={20} color="#f59e0b" />
                      <View className="ml-3">
                        <Text className="text-white font-semibold">Show Refreshment Duty</Text>
                        <Text className="text-slate-400 text-sm">
                          Display who's bringing drinks
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={game.showBeerDuty ?? false}
                      onValueChange={handleToggleBeerDuty}
                      trackColor={{ false: '#334155', true: '#f59e0b40' }}
                      thumbColor={game.showBeerDuty ? '#f59e0b' : '#64748b'}
                    />
                  </View>
                </View>
              )}

              {/* Beer Duty Player Selection */}
              {game.showBeerDuty && (
                <Pressable
                  onPress={() => setIsBeerDutyModalVisible(true)}
                  className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50 active:bg-slate-700/80"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Beer size={20} color="#f59e0b" />
                      <View className="ml-3">
                        <Text className="text-white font-semibold">Assign Refreshment Duty</Text>
                        {beerDutyPlayer ? (
                          <Text className="text-amber-400 text-sm">{beerDutyPlayer.name}</Text>
                        ) : (
                          <Text className="text-slate-400 text-sm">Not assigned</Text>
                        )}
                      </View>
                    </View>
                    <ChevronDown size={20} color="#64748b" />
                  </View>
                </Pressable>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Beer Duty Player Selection Modal */}
      <Modal
        visible={isBeerDutyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsBeerDutyModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsBeerDutyModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Assign Refreshment Duty</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
              {invitedPlayers.map((player) => (
                <Pressable
                  key={player.id}
                  onPress={() => handleSelectBeerDutyPlayer(player.id)}
                  className={cn(
                    'flex-row items-center p-4 rounded-xl mb-2 border',
                    game.beerDutyPlayerId === player.id
                      ? 'bg-amber-500/20 border-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700/50'
                  )}
                >
                  <Image
                    source={{ uri: player.avatar }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                  />
                  <Text className="text-white font-semibold ml-3 flex-1">{player.name}</Text>
                  {game.beerDutyPlayerId === player.id && (
                    <CheckCircle2 size={24} color="#f59e0b" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
