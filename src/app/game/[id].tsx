import { View, Text, ScrollView, Pressable, Platform, Alert, Modal, TextInput } from 'react-native';
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
  Pencil,
  Check,
  Trash2,
  Plus,
  UserPlus,
  ListOrdered,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTeamStore, Player, SPORT_POSITION_NAMES, AppNotification, HockeyLineup, BasketballLineup } from '@/lib/store';
import { cn } from '@/lib/cn';
import { AddressSearch } from '@/components/AddressSearch';
import { JerseyIcon } from '@/components/JerseyIcon';
import { JuiceBoxIcon } from '@/components/JuiceBoxIcon';
import { LineupEditor } from '@/components/LineupEditor';
import { hasAssignedPlayers } from '@/components/LineupViewer';
import { BasketballLineupEditor, hasAssignedBasketballPlayers } from '@/components/BasketballLineupEditor';
import { BasketballLineupViewer } from '@/components/BasketballLineupViewer';

// Helper to convert hex codes to readable color names
const hexToColorName = (hex: string): string => {
  const colorMap: Record<string, string> = {
    '#ffffff': 'White',
    '#000000': 'Black',
    '#1a1a1a': 'Black',
    '#ff0000': 'Red',
    '#00ff00': 'Green',
    '#0000ff': 'Blue',
    '#1e40af': 'Blue',
    '#ffff00': 'Yellow',
    '#ff6600': 'Orange',
    '#800080': 'Purple',
    '#ffc0cb': 'Pink',
    '#808080': 'Gray',
    '#a52a2a': 'Brown',
    '#00ffff': 'Cyan',
    '#000080': 'Navy',
    '#008000': 'Green',
    '#c0c0c0': 'Silver',
    '#ffd700': 'Gold',
    '#8b0000': 'Maroon',
    '#2563eb': 'Blue',
    '#dc2626': 'Red',
    '#16a34a': 'Green',
    '#ca8a04': 'Yellow',
    '#9333ea': 'Purple',
    '#ea580c': 'Orange',
  };

  const lowerHex = hex.toLowerCase();
  if (colorMap[lowerHex]) return colorMap[lowerHex];

  // If hex starts with #, try to identify the color family
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Simple color detection
    if (r > 200 && g > 200 && b > 200) return 'White';
    if (r < 50 && g < 50 && b < 50) return 'Black';
    if (r > g && r > b) return r > 150 ? 'Red' : 'Maroon';
    if (g > r && g > b) return 'Green';
    if (b > r && b > g) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && g < 150 && b < 100) return 'Orange';
    return 'Gray';
  }

  return hex; // Return as-is if not a recognized format
};

interface PlayerRowProps {
  player: Player;
  isCheckedIn: boolean;
  onToggleCheckIn: () => void;
  index: number;
  canToggle: boolean; // Whether the current user can toggle this player's check-in
  isSelf: boolean; // Whether this is the current user's row
}

function PlayerRow({ player, isCheckedIn, onToggleCheckIn, index, canToggle, isSelf }: PlayerRowProps) {
  const sport = useTeamStore((s) => s.teamSettings.sport);
  const positionName = SPORT_POSITION_NAMES[sport][player.position] || player.position;

  const handlePress = () => {
    if (!canToggle) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleCheckIn();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={handlePress}
        disabled={!canToggle}
        className={cn(
          'flex-row items-center p-3 rounded-xl mb-2',
          isCheckedIn ? 'bg-green-500/20' : 'bg-slate-800/60',
          !canToggle && 'opacity-60'
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
          {isSelf && (
            <View className="absolute -top-1 -right-1 bg-cyan-500 rounded-full px-1.5 py-0.5">
              <Text className="text-white text-[8px] font-bold">YOU</Text>
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
          <Circle size={24} color={canToggle ? '#475569' : '#334155'} />
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
  const removeGame = useTeamStore((s) => s.removeGame);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isBeerDutyModalVisible, setIsBeerDutyModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isLineupModalVisible, setIsLineupModalVisible] = useState(false);
  const [isBasketballLineupModalVisible, setIsBasketballLineupModalVisible] = useState(false);

  // Edit form state
  const [editOpponent, setEditOpponent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [editJersey, setEditJersey] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

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
  const uninvitedPlayers = players.filter((p) => !game.invitedPlayers?.includes(p.id));
  const uninvitedActive = uninvitedPlayers.filter((p) => p.status === 'active');
  const uninvitedReserve = uninvitedPlayers.filter((p) => p.status === 'reserve');
  const activePlayers = players.filter((p) => p.status === 'active');
  const beerDutyPlayer = game.beerDutyPlayerId ? players.find((p) => p.id === game.beerDutyPlayerId) : null;

  // Get jersey color info - handle both color name and hex code
  const jerseyColorInfo = teamSettings.jerseyColors.find((c) => c.name === game.jerseyColor || c.color === game.jerseyColor);
  // If found in settings, use the name. Otherwise, try to convert hex to color name
  const jerseyColorName = jerseyColorInfo?.name || hexToColorName(game.jerseyColor);
  const jerseyColorHex = jerseyColorInfo?.color || game.jerseyColor;

  const handleToggleCheckIn = (playerId: string) => {
    if (game.checkedInPlayers?.includes(playerId)) {
      checkOutFromGame(game.id, playerId);
    } else {
      checkInToGame(game.id, playerId);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenMaps = () => {
    const locationQuery = game.address
      ? `${game.location}, ${game.address}`
      : game.location;
    const encodedAddress = encodeURIComponent(locationQuery);
    Linking.openURL(`https://maps.apple.com/?q=${encodedAddress}`);
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
          ? `You're invited to play vs ${game.opponent} on ${dateStr} at ${game.time}. Wear your ${jerseyColorName} jersey!`
          : `Reminder: Game vs ${game.opponent} is coming up on ${dateStr} at ${game.time}. Don't forget your ${jerseyColorName} jersey!`,
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
    message += `Wear your ${jerseyColorName} jersey!\n\n`;
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
    body += `Wear your ${jerseyColorName} jersey!\n\n`;
    body += `Let me know if you can make it!`;

    const mailtoUrl = `mailto:${emails}?subject=${subject}&body=${encodeURIComponent(body)}`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleInvitePlayer = (playerId: string, sendNotification: boolean = true) => {
    const currentInvited = game.invitedPlayers ?? [];
    if (currentInvited.includes(playerId)) return;

    updateGame(game.id, {
      invitedPlayers: [...currentInvited, playerId],
    });

    if (sendNotification) {
      const gameDate = parseISO(game.date);
      const dateStr = format(gameDate, 'EEEE, MMMM d');
      const notification: AppNotification = {
        id: `${Date.now()}-${playerId}`,
        type: 'game_invite',
        title: 'Game Invite',
        message: `You're invited to play vs ${game.opponent} on ${dateStr} at ${game.time}. Wear your ${jerseyColorName} jersey!`,
        gameId: game.id,
        fromPlayerId: currentPlayerId ?? undefined,
        toPlayerId: playerId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      addNotification(notification);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleInviteMultiplePlayers = (playerIds: string[]) => {
    const currentInvited = game.invitedPlayers ?? [];
    const newInvites = playerIds.filter((id) => !currentInvited.includes(id));
    if (newInvites.length === 0) return;

    updateGame(game.id, {
      invitedPlayers: [...currentInvited, ...newInvites],
    });

    const gameDate = parseISO(game.date);
    const dateStr = format(gameDate, 'EEEE, MMMM d');

    newInvites.forEach((playerId) => {
      const notification: AppNotification = {
        id: `${Date.now()}-${playerId}`,
        type: 'game_invite',
        title: 'Game Invite',
        message: `You're invited to play vs ${game.opponent} on ${dateStr} at ${game.time}. Wear your ${jerseyColorName} jersey!`,
        gameId: game.id,
        fromPlayerId: currentPlayerId ?? undefined,
        toPlayerId: playerId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      addNotification(notification);
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Invites Sent', `${newInvites.length} player${newInvites.length !== 1 ? 's' : ''} invited!`);
    setIsInviteModalVisible(false);
  };

  const handleSelectBeerDutyPlayer = (playerId: string | undefined) => {
    updateGame(game.id, { beerDutyPlayerId: playerId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsBeerDutyModalVisible(false);
  };

  const openEditModal = () => {
    // Populate form with current game data
    setEditOpponent(game.opponent);
    // Combine location and address into single field for editing
    const combinedLocation = game.address
      ? `${game.location}, ${game.address}`
      : game.location;
    setEditLocation(combinedLocation);
    setEditDate(parseISO(game.date));
    // Parse time string to Date
    const [time, period] = game.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date();
    let hour = hours;
    if (period === 'PM' && hours !== 12) hour += 12;
    if (period === 'AM' && hours === 12) hour = 0;
    timeDate.setHours(hour, minutes, 0, 0);
    setEditTime(timeDate);
    setEditJersey(game.jerseyColor);
    setEditNotes(game.notes || '');
    setIsSettingsModalVisible(false);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editOpponent.trim() || !editLocation.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const timeString = format(editTime, 'h:mm a');

    updateGame(game.id, {
      opponent: editOpponent.trim(),
      location: editLocation.trim(),
      address: '', // Address is now part of location field
      date: editDate.toISOString(),
      time: timeString,
      jerseyColor: editJersey,
      notes: editNotes.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditModalVisible(false);
  };

  const handleDeleteGame = () => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete the game vs ${game.opponent}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeGame(game.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const handleSaveLineup = (lineup: HockeyLineup) => {
    updateGame(game.id, { lineup });
    setIsLineupModalVisible(false);
  };

  const handleSaveBasketballLineup = (basketballLineup: BasketballLineup) => {
    updateGame(game.id, { basketballLineup });
    setIsBasketballLineupModalVisible(false);
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
              <View style={{ backgroundColor: jerseyColorHex, height: 6 }} />
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
                      <JerseyIcon size={18} color={jerseyColorHex} strokeColor="rgba(255,255,255,0.4)" />
                      <Text className="text-white font-medium ml-2">
                        {jerseyColorName}
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

          {/* Set Lines Button - Only for hockey and captains/admins */}
          {teamSettings.sport === 'hockey' && canManageTeam() && (
            <Animated.View
              entering={FadeInUp.delay(115).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={() => setIsLineupModalVisible(true)}
                className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30 active:bg-emerald-500/30"
              >
                <View className="flex-row items-center">
                  <ListOrdered size={24} color="#10b981" />
                  <View className="flex-1 ml-3">
                    <Text className="text-emerald-400 font-semibold">Set Lines</Text>
                    <Text className="text-slate-400 text-sm">
                      {hasAssignedPlayers(game.lineup) ? 'Edit line combinations' : 'Configure forward, defense, and goalie lines'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#10b981" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Set Lineup Button - Only for basketball and captains/admins */}
          {teamSettings.sport === 'basketball' && canManageTeam() && (
            <Animated.View
              entering={FadeInUp.delay(115).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={() => setIsBasketballLineupModalVisible(true)}
                className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30 active:bg-emerald-500/30"
              >
                <View className="flex-row items-center">
                  <ListOrdered size={24} color="#10b981" />
                  <View className="flex-1 ml-3">
                    <Text className="text-emerald-400 font-semibold">Set Lineup</Text>
                    <Text className="text-slate-400 text-sm">
                      {hasAssignedBasketballPlayers(game.basketballLineup) ? 'Edit starting 5 and bench' : 'Configure starting 5 and bench players'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#10b981" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Beer/Refreshment Duty - Only show if enabled */}
          {game.showBeerDuty && teamSettings.showRefreshmentDuty !== false && (
            <Animated.View
              entering={FadeInUp.delay(120).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={canManageTeam() ? () => setIsBeerDutyModalVisible(true) : undefined}
                className="bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30"
              >
                <View className="flex-row items-center">
                  {teamSettings.refreshmentDutyIs21Plus !== false ? (
                    <Beer size={24} color="#f59e0b" />
                  ) : (
                    <JuiceBoxIcon size={24} color="#f59e0b" />
                  )}
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

          {/* Lines Display - Only for hockey when lineup is set and has players */}
          {teamSettings.sport === 'hockey' && game.lineup && hasAssignedPlayers(game.lineup) && (
            <Animated.View
              entering={FadeInUp.delay(125).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={canManageTeam() ? () => setIsLineupModalVisible(true) : undefined}
                className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <ListOrdered size={20} color="#10b981" />
                    <Text className="text-emerald-400 font-semibold ml-2">Lines</Text>
                  </View>
                  {canManageTeam() && (
                    <ChevronDown size={20} color="#10b981" />
                  )}
                </View>

                {/* Forward Lines Preview */}
                {game.lineup.forwardLines.slice(0, game.lineup.numForwardLines).map((line, index) => {
                  const lw = line.lw ? players.find((p) => p.id === line.lw) : null;
                  const c = line.c ? players.find((p) => p.id === line.c) : null;
                  const rw = line.rw ? players.find((p) => p.id === line.rw) : null;
                  if (!lw && !c && !rw) return null;
                  return (
                    <View key={`fwd-${index}`} className="mb-2">
                      <Text className="text-slate-400 text-xs mb-1">Line {index + 1}</Text>
                      <View className="flex-row justify-around">
                        {[lw, c, rw].map((player, i) => (
                          <View key={i} className="items-center">
                            {player ? (
                              <>
                                <Image
                                  source={{ uri: player.avatar }}
                                  style={{ width: 32, height: 32, borderRadius: 16 }}
                                  contentFit="cover"
                                />
                                <Text className="text-white text-xs mt-0.5">#{player.number}</Text>
                              </>
                            ) : (
                              <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                                <Text className="text-slate-500 text-xs">-</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* Defense Pairs Preview */}
                {game.lineup.defenseLines.slice(0, game.lineup.numDefenseLines).map((line, index) => {
                  const ld = line.ld ? players.find((p) => p.id === line.ld) : null;
                  const rd = line.rd ? players.find((p) => p.id === line.rd) : null;
                  if (!ld && !rd) return null;
                  return (
                    <View key={`def-${index}`} className="mb-2">
                      <Text className="text-slate-400 text-xs mb-1">D-Pair {index + 1}</Text>
                      <View className="flex-row justify-around px-8">
                        {[ld, rd].map((player, i) => (
                          <View key={i} className="items-center">
                            {player ? (
                              <>
                                <Image
                                  source={{ uri: player.avatar }}
                                  style={{ width: 32, height: 32, borderRadius: 16 }}
                                  contentFit="cover"
                                />
                                <Text className="text-white text-xs mt-0.5">#{player.number}</Text>
                              </>
                            ) : (
                              <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                                <Text className="text-slate-500 text-xs">-</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* Goalies Preview */}
                {game.lineup.goalieLines.slice(0, game.lineup.numGoalieLines).map((line, index) => {
                  const g = line.g ? players.find((p) => p.id === line.g) : null;
                  if (!g) return null;
                  return (
                    <View key={`goal-${index}`} className="mb-2">
                      <Text className="text-slate-400 text-xs mb-1">{index === 0 ? 'Starter' : 'Backup'}</Text>
                      <View className="items-center">
                        <Image
                          source={{ uri: g.avatar }}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                          contentFit="cover"
                        />
                        <Text className="text-white text-xs mt-0.5">#{g.number}</Text>
                      </View>
                    </View>
                  );
                })}
              </Pressable>
            </Animated.View>
          )}

          {/* Basketball Lineup Display - Only when lineup is set and has players */}
          {teamSettings.sport === 'basketball' && game.basketballLineup && hasAssignedBasketballPlayers(game.basketballLineup) && (
            <Animated.View
              entering={FadeInUp.delay(125).springify()}
              className="mx-4 mb-4"
            >
              <Pressable
                onPress={canManageTeam() ? () => setIsBasketballLineupModalVisible(true) : undefined}
                className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <ListOrdered size={20} color="#10b981" />
                    <Text className="text-emerald-400 font-semibold ml-2">Lineup</Text>
                  </View>
                  {canManageTeam() && (
                    <ChevronDown size={20} color="#10b981" />
                  )}
                </View>

                {/* Starting 5 Preview */}
                <Text className="text-slate-400 text-xs mb-2">Starting 5</Text>
                <View className="flex-row justify-around mb-2">
                  {/* PG */}
                  {game.basketballLineup.hasPG && (
                    <View className="items-center">
                      {game.basketballLineup.starters.pg ? (
                        <>
                          <Image
                            source={{ uri: players.find((p) => p.id === game.basketballLineup!.starters.pg)?.avatar }}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                            contentFit="cover"
                          />
                          <Text className="text-white text-xs mt-0.5">#{players.find((p) => p.id === game.basketballLineup!.starters.pg)?.number}</Text>
                        </>
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                          <Text className="text-slate-500 text-xs">PG</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {/* Guards */}
                  {game.basketballLineup.starters.guards.slice(0, game.basketballLineup.numGuards).map((playerId, i) => {
                    const player = playerId ? players.find((p) => p.id === playerId) : null;
                    return (
                      <View key={`g-${i}`} className="items-center">
                        {player ? (
                          <>
                            <Image
                              source={{ uri: player.avatar }}
                              style={{ width: 32, height: 32, borderRadius: 16 }}
                              contentFit="cover"
                            />
                            <Text className="text-white text-xs mt-0.5">#{player.number}</Text>
                          </>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                            <Text className="text-slate-500 text-xs">G</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {/* Forwards */}
                  {game.basketballLineup.starters.forwards.slice(0, game.basketballLineup.numForwards).map((playerId, i) => {
                    const player = playerId ? players.find((p) => p.id === playerId) : null;
                    return (
                      <View key={`f-${i}`} className="items-center">
                        {player ? (
                          <>
                            <Image
                              source={{ uri: player.avatar }}
                              style={{ width: 32, height: 32, borderRadius: 16 }}
                              contentFit="cover"
                            />
                            <Text className="text-white text-xs mt-0.5">#{player.number}</Text>
                          </>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                            <Text className="text-slate-500 text-xs">F</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {/* Centers */}
                  {game.basketballLineup.starters.centers.slice(0, game.basketballLineup.numCenters).map((playerId, i) => {
                    const player = playerId ? players.find((p) => p.id === playerId) : null;
                    return (
                      <View key={`c-${i}`} className="items-center">
                        {player ? (
                          <>
                            <Image
                              source={{ uri: player.avatar }}
                              style={{ width: 32, height: 32, borderRadius: 16 }}
                              contentFit="cover"
                            />
                            <Text className="text-white text-xs mt-0.5">#{player.number}</Text>
                          </>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-slate-700/50 items-center justify-center">
                            <Text className="text-slate-500 text-xs">C</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Bench count */}
                {game.basketballLineup.bench.filter(Boolean).length > 0 && (
                  <Text className="text-slate-400 text-xs text-center">
                    + {game.basketballLineup.bench.filter(Boolean).length} on bench
                  </Text>
                )}
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
                  {game.address ? (
                    <Text className="text-slate-400">{game.address}</Text>
                  ) : null}
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

          {/* External Invite Section - Only for captains and admins */}
          {canManageTeam() && (
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
          )}

          {/* Check-In Section */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            className="mx-4 mb-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <CheckCircle2 size={18} color="#22c55e" />
                <Text className="text-green-400 text-lg font-semibold ml-2">
                  Check In for Game
                </Text>
              </View>
              {canManageTeam() && uninvitedPlayers.length > 0 && (
                <Pressable
                  onPress={() => setIsInviteModalVisible(true)}
                  className="flex-row items-center bg-cyan-500/20 rounded-lg px-3 py-1.5"
                >
                  <UserPlus size={14} color="#67e8f9" />
                  <Text className="text-cyan-400 text-sm font-medium ml-1">Invite More</Text>
                </Pressable>
              )}
            </View>

            <View className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
              {invitedPlayers.map((player, index) => {
                const isSelf = player.id === currentPlayerId;
                // Admins and captains can toggle anyone, regular players can only toggle themselves
                const canToggle = canManageTeam() || isSelf;

                return (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isCheckedIn={game.checkedInPlayers?.includes(player.id) ?? false}
                    onToggleCheckIn={() => handleToggleCheckIn(player.id)}
                    index={index}
                    canToggle={canToggle}
                    isSelf={isSelf}
                  />
                );
              })}
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
              {/* Edit Game Button */}
              <Pressable
                onPress={openEditModal}
                className="bg-cyan-500/20 rounded-xl p-4 mb-4 border border-cyan-500/30 active:bg-cyan-500/30"
              >
                <View className="flex-row items-center">
                  <Pencil size={20} color="#67e8f9" />
                  <View className="ml-3">
                    <Text className="text-cyan-400 font-semibold">Edit Game Details</Text>
                    <Text className="text-slate-400 text-sm">Change date, time, location, etc.</Text>
                  </View>
                </View>
              </Pressable>

              {/* Delete Game Button */}
              {isAdmin() && (
                <Pressable
                  onPress={handleDeleteGame}
                  className="bg-red-500/20 rounded-xl p-4 mb-4 border border-red-500/30 active:bg-red-500/30"
                >
                  <View className="flex-row items-center">
                    <Trash2 size={20} color="#ef4444" />
                    <View className="ml-3">
                      <Text className="text-red-400 font-semibold">Delete Game</Text>
                      <Text className="text-slate-400 text-sm">Permanently remove this game</Text>
                    </View>
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
              {/* None option to clear selection */}
              <Pressable
                onPress={() => handleSelectBeerDutyPlayer(undefined)}
                className={cn(
                  'flex-row items-center p-4 rounded-xl mb-2 border',
                  !game.beerDutyPlayerId
                    ? 'bg-slate-600/30 border-slate-500/50'
                    : 'bg-slate-800/60 border-slate-700/50'
                )}
              >
                <View className="w-11 h-11 rounded-full bg-slate-700 items-center justify-center">
                  <X size={20} color="#94a3b8" />
                </View>
                <Text className="text-slate-300 font-semibold ml-3 flex-1">None</Text>
                {!game.beerDutyPlayerId && (
                  <CheckCircle2 size={24} color="#94a3b8" />
                )}
              </Pressable>

              {activePlayers.map((player) => (
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

      {/* Edit Game Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Edit Game</Text>
              <Pressable onPress={handleSaveEdit}>
                <Text className="text-cyan-400 font-semibold">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Opponent */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Opponent</Text>
                <TextInput
                  value={editOpponent}
                  onChangeText={setEditOpponent}
                  placeholder="e.g., Ice Wolves"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Date */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Date</Text>
                <Pressable
                  onPress={() => setShowEditDatePicker(true)}
                  className="bg-slate-800 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-lg">
                    {format(editDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Pressable>
                {showEditDatePicker && (
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowEditDatePicker(Platform.OS === 'ios');
                      if (date) setEditDate(date);
                    }}
                    themeVariant="dark"
                  />
                )}
              </View>

              {/* Time */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Time</Text>
                <Pressable
                  onPress={() => setShowEditTimePicker(true)}
                  className="bg-slate-800 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-lg">
                    {format(editTime, 'h:mm a')}
                  </Text>
                </Pressable>
                {showEditTimePicker && (
                  <DateTimePicker
                    value={editTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => {
                      setShowEditTimePicker(Platform.OS === 'ios');
                      if (time) setEditTime(time);
                    }}
                    themeVariant="dark"
                  />
                )}
              </View>

              {/* Location */}
              <View className="mb-5" style={{ zIndex: 50 }}>
                <Text className="text-slate-400 text-sm mb-2">Location</Text>
                <AddressSearch
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Search for a venue or address..."
                />
              </View>

              {/* Jersey Color */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Jersey Color</Text>
                <View className="flex-row flex-wrap">
                  {teamSettings.jerseyColors.map((color) => (
                    <Pressable
                      key={color.name}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditJersey(color.name);
                      }}
                      className={cn(
                        'flex-row items-center px-4 py-3 rounded-xl mr-2 mb-2 border',
                        editJersey === color.name
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-800 border-slate-700'
                      )}
                    >
                      <View
                        className="w-5 h-5 rounded-full mr-2 border border-white/30"
                        style={{ backgroundColor: color.color }}
                      />
                      <Text
                        className={cn(
                          'font-medium',
                          editJersey === color.name ? 'text-cyan-400' : 'text-slate-400'
                        )}
                      >
                        {color.name}
                      </Text>
                      {editJersey === color.name && (
                        <Check size={16} color="#67e8f9" style={{ marginLeft: 8 }} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Notes (Optional)</Text>
                <TextInput
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Any additional info..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Invite More Players Modal */}
      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsInviteModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Invite Players</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {uninvitedPlayers.length === 0 ? (
                <View className="items-center py-8">
                  <Users size={48} color="#64748b" />
                  <Text className="text-slate-400 text-center mt-4">
                    All players have been invited
                  </Text>
                </View>
              ) : (
                <>
                  {/* Quick Actions */}
                  <View className="flex-row mb-4">
                    {uninvitedActive.length > 0 && (
                      <Pressable
                        onPress={() => handleInviteMultiplePlayers(uninvitedActive.map((p) => p.id))}
                        className="flex-1 py-3 rounded-xl mr-2 bg-green-500/20 border border-green-500/50 items-center"
                      >
                        <Text className="text-green-400 font-medium">
                          Invite All Active ({uninvitedActive.length})
                        </Text>
                      </Pressable>
                    )}
                    {uninvitedReserve.length > 0 && (
                      <Pressable
                        onPress={() => handleInviteMultiplePlayers(uninvitedReserve.map((p) => p.id))}
                        className="flex-1 py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 items-center"
                      >
                        <Text className="text-amber-400 font-medium">
                          Invite All Reserve ({uninvitedReserve.length})
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Uninvited Active Players */}
                  {uninvitedActive.length > 0 && (
                    <>
                      <Text className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        Active Players
                      </Text>
                      {uninvitedActive.map((player) => (
                        <Pressable
                          key={player.id}
                          onPress={() => handleInvitePlayer(player.id)}
                          className="flex-row items-center bg-slate-800/60 rounded-xl p-3 mb-2 border border-slate-700/50 active:bg-slate-700/80"
                        >
                          <Image
                            source={{ uri: player.avatar }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-medium">{player.name}</Text>
                            <Text className="text-slate-400 text-sm">#{player.number}</Text>
                          </View>
                          <View className="bg-cyan-500 rounded-lg px-3 py-1.5">
                            <Text className="text-white font-medium text-sm">Invite</Text>
                          </View>
                        </Pressable>
                      ))}
                    </>
                  )}

                  {/* Uninvited Reserve Players */}
                  {uninvitedReserve.length > 0 && (
                    <>
                      <Text className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                        Reserve Players
                      </Text>
                      {uninvitedReserve.map((player) => (
                        <Pressable
                          key={player.id}
                          onPress={() => handleInvitePlayer(player.id)}
                          className="flex-row items-center bg-slate-800/60 rounded-xl p-3 mb-2 border border-slate-700/50 active:bg-slate-700/80"
                        >
                          <Image
                            source={{ uri: player.avatar }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-medium">{player.name}</Text>
                            <Text className="text-slate-400 text-sm">#{player.number}</Text>
                          </View>
                          <View className="bg-cyan-500 rounded-lg px-3 py-1.5">
                            <Text className="text-white font-medium text-sm">Invite</Text>
                          </View>
                        </Pressable>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Lineup Editor Modal */}
      <LineupEditor
        visible={isLineupModalVisible}
        onClose={() => setIsLineupModalVisible(false)}
        onSave={handleSaveLineup}
        initialLineup={game.lineup}
        availablePlayers={players}
      />

      {/* Basketball Lineup Editor Modal */}
      <BasketballLineupEditor
        visible={isBasketballLineupModalVisible}
        onClose={() => setIsBasketballLineupModalVisible(false)}
        onSave={handleSaveBasketballLineup}
        initialLineup={game.basketballLineup}
        availablePlayers={players}
      />
    </View>
  );
}
