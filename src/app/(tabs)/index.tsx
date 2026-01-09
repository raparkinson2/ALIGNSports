import { View, Text, ScrollView, Pressable, TextInput, Modal, Platform } from 'react-native';
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
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Game } from '@/lib/store';
import { cn } from '@/lib/cn';

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
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const checkedInCount = game.checkedInPlayers?.length ?? 0;
  const invitedCount = game.invitedPlayers?.length ?? 0;

  // Look up jersey color by name or hex code (handles both cases)
  const jerseyColorInfo = teamSettings.jerseyColors.find((c) => c.name === game.jerseyColor || c.color === game.jerseyColor);
  const jerseyColorName = jerseyColorInfo?.name || game.jerseyColor;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={onPress}
        className="mb-4 active:scale-[0.98]"
        style={{ transform: [{ scale: 1 }] }}
      >
        <View className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50">
          {/* Jersey Color Bar */}
          <View style={{ backgroundColor: jerseyColorInfo?.color || '#ffffff', height: 4 }} />

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
                  style={{ backgroundColor: jerseyColorInfo?.color || '#ffffff' }}
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
  const [gameTime, setGameTime] = useState(new Date());
  const [selectedJersey, setSelectedJersey] = useState(teamSettings.jerseyColors[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    setGameTime(new Date());
    setSelectedJersey(teamSettings.jerseyColors[0]?.name || '');
    setNotes('');
  };

  const handleCreateGame = () => {
    if (!opponent.trim() || !location.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const timeString = format(gameTime, 'h:mm a');
    const activePlayers = players.filter((p) => p.status === 'active').map((p) => p.id);

    const newGame: Game = {
      id: Date.now().toString(),
      opponent: opponent.trim(),
      date: gameDate.toISOString(),
      time: timeString,
      location: location.trim(),
      address: address.trim(),
      jerseyColor: selectedJersey,
      notes: notes.trim() || undefined,
      checkedInPlayers: [],
      invitedPlayers: activePlayers,
      photos: [],
      showBeerDuty: false,
    };

    addGame(newGame);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsModalVisible(false);
    resetForm();
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
                  onPress={() => setShowDatePicker(true)}
                  className="bg-slate-800 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-lg">
                    {format(gameDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={gameDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setGameDate(date);
                    }}
                    minimumDate={new Date()}
                    themeVariant="dark"
                  />
                )}
              </View>

              {/* Time */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Time</Text>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  className="bg-slate-800 rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-lg">
                    {format(gameTime, 'h:mm a')}
                  </Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={gameTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (time) setGameTime(time);
                    }}
                    themeVariant="dark"
                  />
                )}
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
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
