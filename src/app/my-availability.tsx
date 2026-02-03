import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isSameMonth, isToday, isBefore, startOfToday } from 'date-fns';
import { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  List,
  CalendarDays,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Game, Event } from '@/lib/store';
import { cn } from '@/lib/cn';

type ViewMode = 'list' | 'calendar';

export default function MyAvailabilityScreen() {
  const router = useRouter();
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const games = useTeamStore((s) => s.games);
  const events = useTeamStore((s) => s.events);
  const addUnavailableDate = useTeamStore((s) => s.addUnavailableDate);
  const removeUnavailableDate = useTeamStore((s) => s.removeUnavailableDate);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const unavailableDates = currentPlayer?.unavailableDates || [];

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);

  // Get conflicts for a date (games/events the player would be marked OUT for)
  const getConflictsForDate = (dateStr: string) => {
    const conflicts: { type: 'game' | 'event'; item: Game | Event }[] = [];

    games.forEach((game) => {
      const gameDate = game.date.split('T')[0];
      if (gameDate === dateStr && game.invitedPlayers.includes(currentPlayerId || '')) {
        conflicts.push({ type: 'game', item: game });
      }
    });

    events.forEach((event) => {
      const eventDate = event.date.split('T')[0];
      if (eventDate === dateStr && event.invitedPlayers.includes(currentPlayerId || '')) {
        conflicts.push({ type: 'event', item: event });
      }
    });

    return conflicts;
  };

  const handleAddDate = () => {
    if (!currentPlayerId) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Check if already unavailable
    if (unavailableDates.includes(dateStr)) {
      Alert.alert('Already Added', 'You are already marked as unavailable on this date.');
      return;
    }

    // Check for conflicts
    const conflicts = getConflictsForDate(dateStr);

    if (conflicts.length > 0) {
      const conflictList = conflicts.map((c) => {
        if (c.type === 'game') {
          return `Game vs ${(c.item as Game).opponent}`;
        } else {
          return `Event: ${(c.item as Event).title}`;
        }
      }).join('\n');

      Alert.alert(
        'Schedule Conflict',
        `Adding this date will automatically mark you OUT for:\n\n${conflictList}\n\nDo you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Unavailable',
            style: 'destructive',
            onPress: () => {
              addUnavailableDate(currentPlayerId, dateStr);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowAddModal(false);
            },
          },
        ]
      );
    } else {
      addUnavailableDate(currentPlayerId, dateStr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
    }
  };

  const handleRemoveDate = (dateStr: string) => {
    if (!currentPlayerId) return;

    Alert.alert(
      'Remove Date',
      'Are you sure you want to remove this unavailable date? This will NOT automatically change your status for games/events on this date.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeUnavailableDate(currentPlayerId, dateStr);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  // Sort dates chronologically
  const sortedDates = [...unavailableDates].sort((a, b) => a.localeCompare(b));

  // Filter to upcoming dates only for list view
  const today = startOfToday();
  const upcomingDates = sortedDates.filter((d) => !isBefore(parseISO(d), today));
  const pastDates = sortedDates.filter((d) => isBefore(parseISO(d), today));

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array(startDayOfWeek).fill(null);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isDateUnavailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return unavailableDates.includes(dateStr);
  };

  const hasGameOrEvent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return games.some((g) => g.date.split('T')[0] === dateStr && g.invitedPlayers.includes(currentPlayerId || '')) ||
           events.some((e) => e.date.split('T')[0] === dateStr && e.invitedPlayers.includes(currentPlayerId || ''));
  };

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(subMonths(currentMonth, 1));
    setCalendarSelectedDate(null);
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(addMonths(currentMonth, 1));
    setCalendarSelectedDate(null);
  };

  const handleCalendarDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = format(date, 'yyyy-MM-dd');

    if (isDateUnavailable(date)) {
      // If already unavailable, offer to remove
      handleRemoveDate(dateStr);
    } else {
      // Offer to add as unavailable
      setSelectedDate(date);
      setShowAddModal(true);
    }
  };

  // Count unavailable dates this month
  const unavailableThisMonth = unavailableDates.filter((d) => {
    const date = parseISO(d);
    return isSameMonth(date, currentMonth);
  }).length;

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
          className="px-5 pt-2 pb-4"
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center"
            >
              <ChevronLeft size={24} color="#67e8f9" />
            </Pressable>
            <View className="flex-1 mx-4">
              <Text className="text-white text-2xl font-bold text-center">My Availability</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(new Date());
                setShowAddModal(true);
              }}
              className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center"
            >
              <Plus size={24} color="white" />
            </Pressable>
          </View>
        </Animated.View>

        {/* View Toggle */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="px-5 mb-4"
        >
          <View className="flex-row bg-slate-800/60 rounded-xl p-1">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('list');
              }}
              className={cn(
                'flex-1 flex-row items-center justify-center py-2.5 rounded-lg',
                viewMode === 'list' && 'bg-cyan-500/30'
              )}
            >
              <List size={16} color={viewMode === 'list' ? '#67e8f9' : '#64748b'} />
              <Text className={cn(
                'ml-2 font-medium',
                viewMode === 'list' ? 'text-cyan-400' : 'text-slate-400'
              )}>
                List
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode('calendar');
              }}
              className={cn(
                'flex-1 flex-row items-center justify-center py-2.5 rounded-lg',
                viewMode === 'calendar' && 'bg-cyan-500/30'
              )}
            >
              <CalendarDays size={16} color={viewMode === 'calendar' ? '#67e8f9' : '#64748b'} />
              <Text className={cn(
                'ml-2 font-medium',
                viewMode === 'calendar' ? 'text-cyan-400' : 'text-slate-400'
              )}>
                Calendar
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {viewMode === 'list' ? (
            <>
              {/* Upcoming Unavailable Dates */}
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Upcoming Unavailable Dates ({upcomingDates.length})
                </Text>

                {upcomingDates.length === 0 ? (
                  <View className="bg-slate-800/50 rounded-xl p-6 items-center mb-6">
                    <Calendar size={32} color="#64748b" />
                    <Text className="text-slate-400 text-center mt-2">
                      No upcoming unavailable dates
                    </Text>
                    <Text className="text-slate-500 text-sm text-center mt-1">
                      Tap + to add dates you can't play
                    </Text>
                  </View>
                ) : (
                  <View className="mb-6">
                    {upcomingDates.map((dateStr, index) => {
                      const date = parseISO(dateStr);
                      const conflicts = getConflictsForDate(dateStr);

                      return (
                        <Animated.View
                          key={dateStr}
                          entering={FadeInDown.delay(200 + index * 50).springify()}
                        >
                          <View className="bg-slate-800/60 rounded-xl p-4 mb-3 border border-slate-700/50">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="text-white font-semibold text-lg">
                                  {format(date, 'EEEE, MMMM d')}
                                </Text>
                                <Text className="text-slate-400 text-sm">
                                  {format(date, 'yyyy')}
                                </Text>
                                {conflicts.length > 0 && (
                                  <View className="flex-row items-center mt-2">
                                    <AlertCircle size={14} color="#f59e0b" />
                                    <Text className="text-amber-400 text-xs ml-1">
                                      {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} - marked OUT
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Pressable
                                onPress={() => handleRemoveDate(dateStr)}
                                className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
                              >
                                <Trash2 size={18} color="#f87171" />
                              </Pressable>
                            </View>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                )}
              </Animated.View>

              {/* Past Dates (collapsed) */}
              {pastDates.length > 0 && (
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                  <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    Past Dates ({pastDates.length})
                  </Text>
                  <View className="bg-slate-800/30 rounded-xl p-4">
                    <Text className="text-slate-500 text-sm">
                      {pastDates.length} past unavailable date{pastDates.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </>
          ) : (
            /* Calendar View */
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              {/* Month Navigation */}
              <View className="flex-row items-center justify-between mb-4 px-2">
                <Pressable
                  onPress={goToPreviousMonth}
                  className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center"
                >
                  <ChevronLeft size={20} color="#67e8f9" />
                </Pressable>
                <View className="items-center">
                  <Text className="text-white text-xl font-bold">
                    {format(currentMonth, 'MMMM yyyy')}
                  </Text>
                  {unavailableThisMonth > 0 && (
                    <Text className="text-amber-400 text-sm">
                      {unavailableThisMonth} unavailable day{unavailableThisMonth !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={goToNextMonth}
                  className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center"
                >
                  <ChevronRight size={20} color="#67e8f9" />
                </Pressable>
              </View>

              {/* Week Days Header */}
              <View className="flex-row mb-2">
                {weekDays.map((day) => (
                  <View key={day} className="flex-1 items-center py-2">
                    <Text className="text-slate-500 text-xs font-semibold">{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View className="flex-row flex-wrap">
                {/* Padding days */}
                {paddingDays.map((_, index) => (
                  <View key={`padding-${index}`} className="w-[14.28%] aspect-square p-1" />
                ))}

                {/* Actual days */}
                {daysInMonth.map((date) => {
                  const isUnavailable = isDateUnavailable(date);
                  const hasSchedule = hasGameOrEvent(date);
                  const isTodayDate = isToday(date);
                  const isPast = isBefore(date, today);

                  return (
                    <Pressable
                      key={date.toISOString()}
                      onPress={() => handleCalendarDatePress(date)}
                      disabled={isPast}
                      className="w-[14.28%] aspect-square p-0.5"
                    >
                      <View
                        className={cn(
                          'flex-1 rounded-xl items-center justify-center relative',
                          isUnavailable && 'bg-red-500/30 border border-red-500/50',
                          !isUnavailable && hasSchedule && 'bg-cyan-500/20 border border-cyan-500/30',
                          !isUnavailable && !hasSchedule && 'bg-slate-800/40',
                          isTodayDate && !isUnavailable && 'border-2 border-cyan-400',
                          isPast && 'opacity-40'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            isUnavailable ? 'text-red-400' : isTodayDate ? 'text-cyan-400' : 'text-white'
                          )}
                        >
                          {format(date, 'd')}
                        </Text>
                        {/* Indicator dots */}
                        <View className="flex-row absolute bottom-1">
                          {isUnavailable && (
                            <View className="w-1.5 h-1.5 rounded-full bg-red-400 mx-0.5" />
                          )}
                          {hasSchedule && !isUnavailable && (
                            <View className="w-1.5 h-1.5 rounded-full bg-cyan-400 mx-0.5" />
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Legend */}
              <View className="mt-6 bg-slate-800/40 rounded-xl p-4">
                <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Legend
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="flex-row items-center mr-6 mb-2">
                    <View className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50 mr-2" />
                    <Text className="text-slate-300 text-sm">Unavailable</Text>
                  </View>
                  <View className="flex-row items-center mr-6 mb-2">
                    <View className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/30 mr-2" />
                    <Text className="text-slate-300 text-sm">Game/Event</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <View className="w-4 h-4 rounded bg-slate-800/40 border-2 border-cyan-400 mr-2" />
                    <Text className="text-slate-300 text-sm">Today</Text>
                  </View>
                </View>
                <Text className="text-slate-500 text-xs mt-2">
                  Tap a date to mark as unavailable or remove
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add Unavailable Date Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-3xl">
            <SafeAreaView edges={['bottom']}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
                <Text className="text-white text-lg font-bold">Add Unavailable Date</Text>
                <Pressable onPress={handleAddDate}>
                  <Text className="text-cyan-400 font-semibold">Add</Text>
                </Pressable>
              </View>

              <View className="px-5 py-6">
                <Text className="text-slate-400 text-sm mb-4 text-center">
                  Select a date when you will be unavailable
                </Text>

                <View className="bg-slate-800 rounded-xl overflow-hidden items-center">
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="inline"
                    onChange={(event, date) => {
                      if (date) setSelectedDate(date);
                    }}
                    minimumDate={new Date()}
                    themeVariant="dark"
                    accentColor="#67e8f9"
                  />
                </View>

                <View className="bg-amber-500/10 rounded-xl p-4 mt-4 border border-amber-500/20">
                  <View className="flex-row items-start">
                    <AlertCircle size={18} color="#f59e0b" />
                    <Text className="text-amber-300 text-sm ml-2 flex-1">
                      If you have a game or event on this date, you will automatically be marked as OUT with note "Unavailable".
                    </Text>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
