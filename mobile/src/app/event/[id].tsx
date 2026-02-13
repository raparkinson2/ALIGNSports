import { View, Text, ScrollView, Pressable, Alert, Modal, TextInput } from 'react-native';
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
  XCircle,
  Circle,
  Navigation,
  Calendar,
  X,
  Pencil,
  Check,
  Trash2,
  Send,
  UserPlus,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTeamStore, Player, getPlayerName, AppNotification } from '@/lib/store';
import { cn } from '@/lib/cn';
import { AddressSearch } from '@/components/AddressSearch';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { sendEventInviteNotification } from '@/lib/notifications';

interface PlayerRowProps {
  player: Player;
  status: 'confirmed' | 'declined' | 'none';
  onToggle: () => void;
  index: number;
  canToggle: boolean;
  isSelf: boolean;
}

function PlayerRow({ player, status, onToggle, index, canToggle, isSelf }: PlayerRowProps) {
  const handlePress = () => {
    if (!canToggle) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={handlePress}
        disabled={!canToggle}
        className={cn(
          'flex-row items-center p-3 rounded-xl mb-2',
          status === 'confirmed' ? 'bg-green-500/20' : status === 'declined' ? 'bg-red-500/20' : 'bg-slate-800/60',
          !canToggle && 'opacity-60'
        )}
      >
        <View className="relative">
          <PlayerAvatar player={player} size={44} />
          {status === 'confirmed' && (
            <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 size={14} color="white" />
            </View>
          )}
          {status === 'declined' && (
            <View className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
              <XCircle size={14} color="white" />
            </View>
          )}
          {isSelf && (
            <View className="absolute -top-1 -right-1 bg-cyan-500 rounded-full px-1.5 py-0.5">
              <Text className="text-white text-[8px] font-bold">YOU</Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold">{getPlayerName(player)}</Text>
          <Text className="text-slate-400 text-xs">#{player.number}</Text>
        </View>

        {status === 'confirmed' ? (
          <CheckCircle2 size={24} color="#22c55e" />
        ) : status === 'declined' ? (
          <XCircle size={24} color="#ef4444" />
        ) : (
          <Circle size={24} color={canToggle ? '#475569' : '#334155'} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const events = useTeamStore((s) => s.events);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);
  const updateEvent = useTeamStore((s) => s.updateEvent);
  const removeEvent = useTeamStore((s) => s.removeEvent);
  const addNotification = useTeamStore((s) => s.addNotification);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);

  const event = events.find((e) => e.id === id);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editTimeValue, setEditTimeValue] = useState('');
  const [editTimePeriod, setEditTimePeriod] = useState<'AM' | 'PM'>('PM');
  const [editNotes, setEditNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!event) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white text-lg">Event not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-cyan-400">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const eventDate = parseISO(event.date);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');

  // Get invited players
  const invitedPlayers = players.filter((p) => event.invitedPlayers?.includes(p.id));

  // Get uninvited players for the invite modal
  const uninvitedPlayers = players.filter((p) => !event.invitedPlayers?.includes(p.id));
  const uninvitedActive = uninvitedPlayers.filter((p) => p.status === 'active');
  const uninvitedReserve = uninvitedPlayers.filter((p) => p.status === 'reserve');

  // Get confirmed and declined players
  const confirmedPlayers = event.confirmedPlayers || [];
  const declinedPlayers = event.declinedPlayers || [];

  // Sort invited players: confirmed first, then pending, then declined
  const sortedInvitedPlayers = [...invitedPlayers].sort((a, b) => {
    const statusOrder = { confirmed: 0, none: 1, declined: 2 };
    const aStatus = confirmedPlayers.includes(a.id) ? 'confirmed' : declinedPlayers.includes(a.id) ? 'declined' : 'none';
    const bStatus = confirmedPlayers.includes(b.id) ? 'confirmed' : declinedPlayers.includes(b.id) ? 'declined' : 'none';
    return statusOrder[aStatus] - statusOrder[bStatus];
  });

  const getPlayerStatus = (playerId: string): 'confirmed' | 'declined' | 'none' => {
    if (confirmedPlayers.includes(playerId)) return 'confirmed';
    if (declinedPlayers.includes(playerId)) return 'declined';
    return 'none';
  };

  const togglePlayerStatus = (playerId: string) => {
    const currentStatus = getPlayerStatus(playerId);
    let newConfirmed = [...confirmedPlayers];
    let newDeclined = [...declinedPlayers];

    if (currentStatus === 'none') {
      // No response -> Confirmed
      newConfirmed.push(playerId);
    } else if (currentStatus === 'confirmed') {
      // Confirmed -> Declined
      newConfirmed = newConfirmed.filter((id) => id !== playerId);
      newDeclined.push(playerId);
    } else {
      // Declined -> No response
      newDeclined = newDeclined.filter((id) => id !== playerId);
    }

    updateEvent(event.id, {
      confirmedPlayers: newConfirmed,
      declinedPlayers: newDeclined,
    });
  };

  const openInMaps = () => {
    const address = event.address || event.location;
    const url = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const openEditModal = () => {
    setEditTitle(event.title);
    setEditLocation(event.location);
    setEditDate(eventDate);
    // Parse time
    const timeParts = event.time.match(/(\d+:\d+)\s*(AM|PM)/i);
    if (timeParts) {
      setEditTimeValue(timeParts[1]);
      setEditTimePeriod(timeParts[2].toUpperCase() as 'AM' | 'PM');
    } else {
      setEditTimeValue(event.time);
      setEditTimePeriod('PM');
    }
    setEditNotes(event.notes || '');
    setIsEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim() || !editLocation.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const fullTime = `${editTimeValue.trim() || '7:00'} ${editTimePeriod}`;

    updateEvent(event.id, {
      title: editTitle.trim(),
      location: editLocation.trim(),
      date: editDate.toISOString(),
      time: fullTime,
      notes: editNotes.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditModalVisible(false);
  };

  const deleteEvent = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeEvent(event.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const handleInvitePlayer = (playerId: string) => {
    const currentInvited = event.invitedPlayers ?? [];
    if (currentInvited.includes(playerId)) return;

    updateEvent(event.id, {
      invitedPlayers: [...currentInvited, playerId],
    });

    // Create in-app notification
    const formattedDateShort = format(eventDate, 'EEE, MMM d');
    const notification: AppNotification = {
      id: `event-invite-${event.id}-${playerId}-${Date.now()}`,
      type: 'game_invite',
      title: 'Event Invite',
      message: `You're invited to "${event.title}" on ${formattedDateShort} at ${event.time}`,
      gameId: event.id,
      fromPlayerId: currentPlayerId ?? undefined,
      toPlayerId: playerId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(notification);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleInviteMultiplePlayers = (playerIds: string[]) => {
    const currentInvited = event.invitedPlayers ?? [];
    const newInvites = playerIds.filter((id) => !currentInvited.includes(id));
    if (newInvites.length === 0) return;

    updateEvent(event.id, {
      invitedPlayers: [...currentInvited, ...newInvites],
    });

    const formattedDateShort = format(eventDate, 'EEE, MMM d');

    // Create in-app notifications for each player
    newInvites.forEach((playerId) => {
      const notification: AppNotification = {
        id: `event-invite-${event.id}-${playerId}-${Date.now()}`,
        type: 'game_invite',
        title: 'Event Invite',
        message: `You're invited to "${event.title}" on ${formattedDateShort} at ${event.time}`,
        gameId: event.id,
        fromPlayerId: currentPlayerId ?? undefined,
        toPlayerId: playerId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      addNotification(notification);
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Invites Sent', `${newInvites.length} player${newInvites.length !== 1 ? 's' : ''} invited!`);
    setIsInviteModalVisible(false);
  };

  const sendInviteReminder = () => {
    const formattedDateShort = format(eventDate, 'EEE, MMM d');

    // Send push notification
    sendEventInviteNotification(event.id, event.title, formattedDateShort, event.time);

    // Create in-app notifications for players who haven't responded
    const pendingPlayers = invitedPlayers.filter(
      (p) => !confirmedPlayers.includes(p.id) && !declinedPlayers.includes(p.id)
    );

    pendingPlayers.forEach((player) => {
      const notification: AppNotification = {
        id: `event-reminder-${event.id}-${player.id}-${Date.now()}`,
        type: 'game_invite',
        title: 'Event Reminder',
        message: `Please RSVP for "${event.title}" on ${formattedDateShort} at ${event.time}`,
        gameId: event.id,
        toPlayerId: player.id,
        read: false,
        createdAt: new Date().toISOString(),
      };
      addNotification(notification);
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Reminder Sent', `Reminder sent to ${pendingPlayers.length} player(s) who haven't responded.`);
  };

  const confirmedCount = confirmedPlayers.length;
  const declinedCount = declinedPlayers.length;
  const pendingCount = invitedPlayers.length - confirmedCount - declinedCount;

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#3b82f6', '#2563eb', '#0f172a']}
        locations={[0, 0.3, 0.6]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            >
              <ChevronLeft size={24} color="white" />
            </Pressable>

            <View className="flex-row">
              {canManageTeam() && (
                <>
                  <Pressable
                    onPress={openEditModal}
                    className="w-10 h-10 rounded-full bg-black/30 items-center justify-center mr-2"
                  >
                    <Pencil size={20} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={deleteEvent}
                    className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Event Info */}
          <View className="px-5">
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-500/30 px-3 py-1 rounded-full">
                  <Text className="text-blue-300 text-xs font-semibold">EVENT</Text>
                </View>
              </View>
              <Text className="text-white text-3xl font-bold mb-2">{event.title}</Text>
              <Text className="text-blue-200/80 text-base">{teamName}</Text>
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-6">
              <View className="flex-row">
                <View className="flex-1 bg-slate-800/80 rounded-2xl p-4 mr-2">
                  <View className="flex-row items-center mb-1">
                    <Calendar size={16} color="#60a5fa" />
                    <Text className="text-slate-400 text-xs ml-2">Date</Text>
                  </View>
                  <Text className="text-white font-semibold">{formattedDate}</Text>
                </View>
                <View className="flex-1 bg-slate-800/80 rounded-2xl p-4 ml-2">
                  <View className="flex-row items-center mb-1">
                    <Clock size={16} color="#60a5fa" />
                    <Text className="text-slate-400 text-xs ml-2">Time</Text>
                  </View>
                  <Text className="text-white font-semibold">{event.time}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-4">
              <Pressable
                onPress={openInMaps}
                className="bg-slate-800/80 rounded-2xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
                    <MapPin size={20} color="#60a5fa" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-400 text-xs">Location</Text>
                    <Text className="text-white font-semibold">{event.location}</Text>
                  </View>
                </View>
                <View className="bg-blue-500/20 rounded-full p-2">
                  <Navigation size={18} color="#60a5fa" />
                </View>
              </Pressable>
            </Animated.View>

            {/* Notes */}
            {event.notes && (
              <Animated.View entering={FadeInDown.delay(350).springify()} className="mt-4">
                <View className="bg-slate-800/80 rounded-2xl p-4">
                  <Text className="text-slate-400 text-xs mb-2">Notes</Text>
                  <Text className="text-white">{event.notes}</Text>
                </View>
              </Animated.View>
            )}

            {/* RSVP Summary */}
            <Animated.View entering={FadeInDown.delay(400).springify()} className="mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">RSVPs</Text>
                <View className="flex-row items-center">
                  {canManageTeam() && uninvitedPlayers.length > 0 && (
                    <Pressable
                      onPress={() => setIsInviteModalVisible(true)}
                      className="flex-row items-center bg-cyan-500/20 rounded-full px-3 py-1.5 mr-2"
                    >
                      <UserPlus size={14} color="#67e8f9" />
                      <Text className="text-cyan-400 text-sm font-medium ml-1.5">Invite More</Text>
                    </Pressable>
                  )}
                  {canManageTeam() && (
                    <Pressable
                      onPress={sendInviteReminder}
                      className="flex-row items-center bg-green-500/20 rounded-full px-3 py-1.5"
                    >
                      <Send size={14} color="#22c55e" />
                      <Text className="text-green-400 text-sm font-medium ml-1.5">Send Reminder</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* RSVP Stats */}
              <View className="flex-row mb-4">
                <View className="flex-1 bg-green-500/20 rounded-xl p-3 mr-2 items-center">
                  <Text className="text-green-400 text-2xl font-bold">{confirmedCount}</Text>
                  <Text className="text-green-400/70 text-xs">Confirmed</Text>
                </View>
                <View className="flex-1 bg-slate-700/50 rounded-xl p-3 mx-1 items-center">
                  <Text className="text-slate-300 text-2xl font-bold">{pendingCount}</Text>
                  <Text className="text-slate-400 text-xs">Pending</Text>
                </View>
                <View className="flex-1 bg-red-500/20 rounded-xl p-3 ml-2 items-center">
                  <Text className="text-red-400 text-2xl font-bold">{declinedCount}</Text>
                  <Text className="text-red-400/70 text-xs">Declined</Text>
                </View>
              </View>

              {/* Instruction note */}
              <View className="bg-slate-700/30 rounded-xl px-3 py-2.5 mb-3 border border-slate-600/30">
                <Text className="text-slate-400 text-xs text-center">
                  Tap your name to cycle: <Text className="text-green-400 font-medium">IN</Text> → <Text className="text-red-400 font-medium">OUT</Text> → <Text className="text-slate-500 font-medium">No Response</Text>
                </Text>
              </View>

              {/* Player List */}
              <View className="bg-slate-800/50 rounded-2xl p-4">
                {sortedInvitedPlayers.length === 0 ? (
                  <Text className="text-slate-400 text-center py-4">No players invited</Text>
                ) : (
                  sortedInvitedPlayers.map((player, index) => {
                    const status = getPlayerStatus(player.id);
                    const isSelf = player.id === currentPlayerId;
                    // Players can toggle their own status, admins can toggle anyone
                    const canToggle = isSelf || isAdmin();

                    return (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        status={status}
                        onToggle={() => togglePlayerStatus(player.id)}
                        index={index}
                        canToggle={canToggle}
                        isSelf={isSelf}
                      />
                    );
                  })
                )}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Modal */}
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
              <Text className="text-white text-lg font-semibold">Edit Event</Text>
              <Pressable onPress={saveEdit}>
                <Check size={24} color="#22c55e" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Event Name */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Event Name</Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Event name"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Date */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Date</Text>
                <Pressable
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  className="bg-slate-800 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-lg">
                    {format(editDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View className="bg-slate-800 rounded-xl mt-2 overflow-hidden items-center">
                    <DateTimePicker
                      value={editDate}
                      mode="date"
                      display="inline"
                      onChange={(evt, date) => {
                        if (date) setEditDate(date);
                      }}
                      themeVariant="dark"
                      accentColor="#f87171"
                    />
                  </View>
                )}
              </View>

              {/* Time */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Time</Text>
                <View className="flex-row items-center">
                  <TextInput
                    value={editTimeValue}
                    onChangeText={setEditTimeValue}
                    placeholder="7:00"
                    placeholderTextColor="#64748b"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg flex-1"
                    keyboardType="numbers-and-punctuation"
                  />
                  <View className="flex-row ml-3">
                    <Pressable
                      onPress={() => setEditTimePeriod('AM')}
                      className={cn(
                        'px-4 py-3 rounded-l-xl',
                        editTimePeriod === 'AM'
                          ? 'bg-red-500/30 border border-red-500/50'
                          : 'bg-slate-800 border border-slate-700'
                      )}
                    >
                      <Text className={cn(
                        'font-semibold text-lg',
                        editTimePeriod === 'AM' ? 'text-red-400' : 'text-slate-400'
                      )}>
                        AM
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditTimePeriod('PM')}
                      className={cn(
                        'px-4 py-3 rounded-r-xl',
                        editTimePeriod === 'PM'
                          ? 'bg-red-500/30 border border-red-500/50'
                          : 'bg-slate-800 border border-slate-700'
                      )}
                    >
                      <Text className={cn(
                        'font-semibold text-lg',
                        editTimePeriod === 'PM' ? 'text-red-400' : 'text-slate-400'
                      )}>
                        PM
                      </Text>
                    </Pressable>
                  </View>
                </View>
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

              {/* Notes */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Notes (Optional)</Text>
                <TextInput
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Any additional info..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="sentences"
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
                          <PlayerAvatar player={player} size={44} />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-medium">{getPlayerName(player)}</Text>
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
                          <PlayerAvatar player={player} size={44} />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-medium">{getPlayerName(player)}</Text>
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
    </View>
  );
}
