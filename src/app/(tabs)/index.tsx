import { View, Text, ScrollView, Pressable, TextInput, Modal, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Plus,
  X,
  Check,
  Beer,
  ChevronDown,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useTeamStore, Game } from '@/lib/store';
import { cn } from '@/lib/cn';

const getDateLabel = (dateString: string): string => {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

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

interface GameCardProps {
  game: Game;
  index: number;
  onPress: () => void;
}

function GameCard({ game, index, onPress }: GameCardProps) {
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const checkedInCount = game.checkedInPlayers?.length ?? 0;
  const invitedCount = game.invitedPlayers?.length ?? 0;

  // Look up jersey color by name or hex code (handles both cases)
  const jerseyColorInfo = teamSettings.jerseyColors.find((c) => c.name === game.jerseyColor || c.color === game.jerseyColor);
  // If found in settings, use the name. Otherwise, try to convert hex to color name
  const jerseyColorName = jerseyColorInfo?.name || hexToColorName(game.jerseyColor);
  const jerseyColorHex = jerseyColorInfo?.color || game.jerseyColor;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={onPress}
        className="mb-4 active:scale-[0.98]"
        style={{ transform: [{ scale: 1 }] }}
      >
        <View className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50">
          {/* Jersey Color Bar */}
          <View style={{ backgroundColor: jerseyColorHex, height: 4 }} />

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
                  style={{ backgroundColor: jerseyColorHex }}
                />
                <Text className="text-slate-300 text-sm">
                  {jerseyColorName} Jersey
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-center mb-3">
              <MapPin size={14} color="#67e8f9" />
              <Text className="text-slate-400 text-sm ml-2">{game.location}</Text>
            </View>

            {/* Footer */}
            <View className="flex-row items-center justify-between pt-3 border-t border-slate-700/50">
              <View className="flex-row items-center">
                <Users size={14} color="#22c55e" />
                <Text className="text-green-400 text-sm ml-2 font-medium">
                  {checkedInCount}/{invitedCount} checked in
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
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const addGame = useTeamStore((s) => s.addGame);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [gameDate, setGameDate] = useState(new Date());
  const [gameTime, setGameTime] = useState('7:00 PM');
  const [selectedJersey, setSelectedJersey] = useState(teamSettings.jerseyColors[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBeerDuty, setShowBeerDuty] = useState(false);
  const [selectedBeerDutyPlayer, setSelectedBeerDutyPlayer] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);

  const activePlayers = players.filter((p) => p.status === 'active');
  const reservePlayers = players.filter((p) => p.status === 'reserve');

  // Initialize selected players with active players by default
  const initializeSelectedPlayers = () => {
    setSelectedPlayerIds(activePlayers.map((p) => p.id));
  };

  // Sort games by date
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingGames = sortedGames.filter(
    (g) => new Date(g.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const resetForm = () => {
    setOpponent('');
    setLocation('');
    setAddress('');
    setGameDate(new Date());
    setGameTime('7:00 PM');
    setSelectedJersey(teamSettings.jerseyColors[0]?.name || '');
    setNotes('');
    setShowBeerDuty(false);
    setSelectedBeerDutyPlayer(null);
    setSelectedPlayerIds([]);
    setShowPlayerSelection(false);
  };

  const handleCreateGame = () => {
    if (!opponent.trim() || !location.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Use selected players or default to active players if none selected
    const invitedPlayerIds = selectedPlayerIds.length > 0
      ? selectedPlayerIds
      : activePlayers.map((p) => p.id);

    const newGame: Game = {
      id: Date.now().toString(),
      opponent: opponent.trim(),
      date: gameDate.toISOString(),
      time: gameTime.trim() || '7:00 PM',
      location: location.trim(),
      address: address.trim(),
      jerseyColor: selectedJersey,
      notes: notes.trim() || undefined,
      checkedInPlayers: [],
      invitedPlayers: invitedPlayerIds,
      photos: [],
      showBeerDuty: showBeerDuty,
      beerDutyPlayerId: selectedBeerDutyPlayer || undefined,
    };

    addGame(newGame);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsModalVisible(false);
    resetForm();
  };

  // Player selection helpers
  const togglePlayer = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllActive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const activeIds = activePlayers.map((p) => p.id);
    setSelectedPlayerIds((prev) => {
      const nonActiveSelected = prev.filter((id) => !activePlayers.find((p) => p.id === id));
      return [...nonActiveSelected, ...activeIds];
    });
  };

  const selectAllReserve = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const reserveIds = reservePlayers.map((p) => p.id);
    setSelectedPlayerIds((prev) => {
      const nonReserveSelected = prev.filter((id) => !reservePlayers.find((p) => p.id === id));
      return [...nonReserveSelected, ...reserveIds];
    });
  };

  const deselectAllActive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerIds((prev) => prev.filter((id) => !activePlayers.find((p) => p.id === id)));
  };

  const deselectAllReserve = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerIds((prev) => prev.filter((id) => !reservePlayers.find((p) => p.id === id)));
  };

  const selectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPlayerIds(players.map((p) => p.id));
  };

  const deselectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlayerIds([]);
  };

  const isAllActiveSelected = activePlayers.every((p) => selectedPlayerIds.includes(p.id));
  const isAllReserveSelected = reservePlayers.length > 0 && reservePlayers.every((p) => selectedPlayerIds.includes(p.id));

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
              {canManageTeam() && (
                <Pressable
                  onPress={() => setIsModalVisible(true)}
                  className="mt-4 bg-cyan-500 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">Add First Game</Text>
                </Pressable>
              )}
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

        {/* FAB for adding games */}
        {canManageTeam() && upcomingGames.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsModalVisible(true);
            }}
            className="absolute bottom-28 right-5 bg-cyan-500 w-14 h-14 rounded-full items-center justify-center shadow-lg active:bg-cyan-600"
            style={{
              shadowColor: '#67e8f9',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Plus size={28} color="white" />
          </Pressable>
        )}
      </SafeAreaView>

      {/* Create Game Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">New Game</Text>
              <Pressable onPress={handleCreateGame}>
                <Text className="text-cyan-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Opponent */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Opponent</Text>
                <TextInput
                  value={opponent}
                  onChangeText={setOpponent}
                  placeholder="e.g., Ice Wolves"
                  placeholderTextColor="#64748b"
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
                    {format(gameDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View className="bg-slate-800 rounded-xl mt-2 overflow-hidden items-center">
                    <DateTimePicker
                      value={gameDate}
                      mode="date"
                      display="inline"
                      onChange={(event, date) => {
                        if (date) setGameDate(date);
                        if (Platform.OS === 'android') setShowDatePicker(false);
                      }}
                      minimumDate={new Date()}
                      themeVariant="dark"
                      accentColor="#67e8f9"
                    />
                  </View>
                )}
              </View>

              {/* Time */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Time (e.g., 7:30 PM)</Text>
                <TextInput
                  value={gameTime}
                  onChangeText={setGameTime}
                  placeholder="7:00 PM"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  autoCapitalize="characters"
                />
              </View>

              {/* Location */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Location Name</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Glacier Ice Arena"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Address */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Address</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g., 1234 Main Street"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
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
                        setSelectedJersey(color.name);
                      }}
                      className={cn(
                        'flex-row items-center px-4 py-3 rounded-xl mr-2 mb-2 border',
                        selectedJersey === color.name
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
                          selectedJersey === color.name ? 'text-cyan-400' : 'text-slate-400'
                        )}
                      >
                        {color.name}
                      </Text>
                      {selectedJersey === color.name && (
                        <Check size={16} color="#67e8f9" className="ml-2" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Refreshment Duty */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between bg-slate-800 rounded-xl p-4">
                  <View className="flex-row items-center">
                    <Beer size={20} color="#f59e0b" />
                    <Text className="text-white font-medium ml-3">Refreshment Duty</Text>
                  </View>
                  <Switch
                    value={showBeerDuty}
                    onValueChange={setShowBeerDuty}
                    trackColor={{ false: '#334155', true: '#f59e0b40' }}
                    thumbColor={showBeerDuty ? '#f59e0b' : '#64748b'}
                  />
                </View>

                {showBeerDuty && (
                  <View className="mt-3">
                    <Text className="text-slate-400 text-sm mb-2">Assign Player</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      <Pressable
                        onPress={() => setSelectedBeerDutyPlayer(null)}
                        className={cn(
                          'px-4 py-2 rounded-xl mr-2 border',
                          selectedBeerDutyPlayer === null
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-slate-800 border-slate-700'
                        )}
                      >
                        <Text className={cn(
                          'font-medium',
                          selectedBeerDutyPlayer === null ? 'text-amber-400' : 'text-slate-400'
                        )}>
                          None
                        </Text>
                      </Pressable>
                      {activePlayers.map((player) => (
                        <Pressable
                          key={player.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedBeerDutyPlayer(player.id);
                          }}
                          className={cn(
                            'flex-row items-center px-3 py-2 rounded-xl mr-2 border',
                            selectedBeerDutyPlayer === player.id
                              ? 'bg-amber-500/20 border-amber-500/50'
                              : 'bg-slate-800 border-slate-700'
                          )}
                        >
                          <Image
                            source={{ uri: player.avatar }}
                            style={{ width: 24, height: 24, borderRadius: 12 }}
                            contentFit="cover"
                          />
                          <Text className={cn(
                            'font-medium ml-2',
                            selectedBeerDutyPlayer === player.id ? 'text-amber-400' : 'text-slate-400'
                          )}>
                            {player.name.split(' ')[0]}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Notes */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional info..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>

              {/* Player Invitations */}
              <View className="mb-5">
                <Pressable
                  onPress={() => {
                    if (!showPlayerSelection && selectedPlayerIds.length === 0) {
                      initializeSelectedPlayers();
                    }
                    setShowPlayerSelection(!showPlayerSelection);
                  }}
                  className="flex-row items-center justify-between bg-slate-800 rounded-xl p-4"
                >
                  <View className="flex-row items-center">
                    <Users size={20} color="#67e8f9" />
                    <View className="ml-3">
                      <Text className="text-white font-medium">Invite Players</Text>
                      <Text className="text-slate-400 text-sm">
                        {selectedPlayerIds.length === 0
                          ? 'All active players (default)'
                          : `${selectedPlayerIds.length} player${selectedPlayerIds.length !== 1 ? 's' : ''} selected`}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: showPlayerSelection ? '180deg' : '0deg' }] }}
                  />
                </Pressable>

                {showPlayerSelection && (
                  <View className="mt-3 bg-slate-800/50 rounded-xl p-4">
                    {/* Group Selection Buttons */}
                    <View className="flex-row mb-4">
                      <Pressable
                        onPress={isAllActiveSelected ? deselectAllActive : selectAllActive}
                        className={cn(
                          'flex-1 py-2 rounded-lg mr-2 border items-center',
                          isAllActiveSelected
                            ? 'bg-green-500/20 border-green-500/50'
                            : 'bg-slate-700/50 border-slate-600'
                        )}
                      >
                        <Text className={cn(
                          'font-medium text-sm',
                          isAllActiveSelected ? 'text-green-400' : 'text-slate-400'
                        )}>
                          {isAllActiveSelected ? '✓ Active' : 'Active'} ({activePlayers.length})
                        </Text>
                      </Pressable>
                      {reservePlayers.length > 0 && (
                        <Pressable
                          onPress={isAllReserveSelected ? deselectAllReserve : selectAllReserve}
                          className={cn(
                            'flex-1 py-2 rounded-lg mr-2 border items-center',
                            isAllReserveSelected
                              ? 'bg-amber-500/20 border-amber-500/50'
                              : 'bg-slate-700/50 border-slate-600'
                          )}
                        >
                          <Text className={cn(
                            'font-medium text-sm',
                            isAllReserveSelected ? 'text-amber-400' : 'text-slate-400'
                          )}>
                            {isAllReserveSelected ? '✓ Reserve' : 'Reserve'} ({reservePlayers.length})
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={selectedPlayerIds.length === players.length ? deselectAll : selectAll}
                        className={cn(
                          'py-2 px-3 rounded-lg border items-center',
                          selectedPlayerIds.length === players.length
                            ? 'bg-cyan-500/20 border-cyan-500/50'
                            : 'bg-slate-700/50 border-slate-600'
                        )}
                      >
                        <Text className={cn(
                          'font-medium text-sm',
                          selectedPlayerIds.length === players.length ? 'text-cyan-400' : 'text-slate-400'
                        )}>
                          {selectedPlayerIds.length === players.length ? '✓ All' : 'All'}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Active Players */}
                    <Text className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">
                      Active Players
                    </Text>
                    <View className="flex-row flex-wrap mb-4">
                      {activePlayers.map((player) => {
                        const isSelected = selectedPlayerIds.includes(player.id);
                        return (
                          <Pressable
                            key={player.id}
                            onPress={() => togglePlayer(player.id)}
                            className={cn(
                              'flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2 border',
                              isSelected
                                ? 'bg-green-500/20 border-green-500/50'
                                : 'bg-slate-700/50 border-slate-600'
                            )}
                          >
                            <Image
                              source={{ uri: player.avatar }}
                              style={{ width: 24, height: 24, borderRadius: 12 }}
                              contentFit="cover"
                            />
                            <Text className={cn(
                              'font-medium ml-2 text-sm',
                              isSelected ? 'text-green-400' : 'text-slate-400'
                            )}>
                              {player.name.split(' ')[0]}
                            </Text>
                            {isSelected && <Check size={14} color="#22c55e" style={{ marginLeft: 4 }} />}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Reserve Players */}
                    {reservePlayers.length > 0 && (
                      <>
                        <Text className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                          Reserve Players
                        </Text>
                        <View className="flex-row flex-wrap">
                          {reservePlayers.map((player) => {
                            const isSelected = selectedPlayerIds.includes(player.id);
                            return (
                              <Pressable
                                key={player.id}
                                onPress={() => togglePlayer(player.id)}
                                className={cn(
                                  'flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2 border',
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500/50'
                                    : 'bg-slate-700/50 border-slate-600'
                                )}
                              >
                                <Image
                                  source={{ uri: player.avatar }}
                                  style={{ width: 24, height: 24, borderRadius: 12 }}
                                  contentFit="cover"
                                />
                                <Text className={cn(
                                  'font-medium ml-2 text-sm',
                                  isSelected ? 'text-amber-400' : 'text-slate-400'
                                )}>
                                  {player.name.split(' ')[0]}
                                </Text>
                                {isSelected && <Check size={14} color="#f59e0b" style={{ marginLeft: 4 }} />}
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
