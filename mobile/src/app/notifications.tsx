import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  Calendar,
  BellRing,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, AppNotification } from '@/lib/store';
import { cn } from '@/lib/cn';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface NotificationCardProps {
  notification: AppNotification;
  index: number;
  onPress: () => void;
}

function NotificationCard({ notification, index, onPress }: NotificationCardProps) {
  const timeAgo = formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true });

  const getIcon = () => {
    switch (notification.type) {
      case 'game_invite':
        return <Calendar size={20} color="#22c55e" />;
      case 'game_reminder':
        return <BellRing size={20} color="#f59e0b" />;
      default:
        return <Bell size={20} color="#67e8f9" />;
    }
  };

  const getBgColor = () => {
    if (notification.read) return 'bg-slate-800/40';
    switch (notification.type) {
      case 'game_invite':
        return 'bg-green-500/10';
      case 'game_reminder':
        return 'bg-amber-500/10';
      default:
        return 'bg-cyan-500/10';
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className={cn(
          'p-4 rounded-xl mb-3 border',
          getBgColor(),
          notification.read ? 'border-slate-700/30' : 'border-slate-700/50'
        )}
      >
        <View className="flex-row items-start">
          <View className={cn(
            'p-2 rounded-full mr-3',
            notification.read ? 'bg-slate-700/50' : 'bg-slate-800/80'
          )}>
            {getIcon()}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className={cn(
                'font-semibold',
                notification.read ? 'text-slate-400' : 'text-white'
              )}>
                {notification.title}
              </Text>
              {!notification.read && (
                <View className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </View>
            <Text className={cn(
              'text-sm mb-2',
              notification.read ? 'text-slate-500' : 'text-slate-300'
            )}>
              {notification.message}
            </Text>
            <Text className="text-slate-500 text-xs">{timeAgo}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useTeamStore((s) => s.notifications);
  const markNotificationRead = useTeamStore((s) => s.markNotificationRead);
  const clearNotifications = useTeamStore((s) => s.clearNotifications);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);

  // Filter notifications for current player
  const myNotifications = notifications.filter((n) => n.toPlayerId === currentPlayerId);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const handleNotificationPress = (notification: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markNotificationRead(notification.id);

    // Navigate to game if it's a game notification
    if (notification.gameId) {
      router.push(`/game/${notification.gameId}`);
    }
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    myNotifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
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
          className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800"
        >
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <ChevronLeft size={24} color="#67e8f9" />
            <Text className="text-cyan-400 ml-1">Back</Text>
          </Pressable>

          <Text className="text-white text-lg font-semibold">Notifications</Text>

          {unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllRead} className="p-2">
              <CheckCircle2 size={22} color="#22c55e" />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </Animated.View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {myNotifications.length === 0 ? (
            <Animated.View
              entering={FadeIn.delay(100)}
              className="flex-1 items-center justify-center pt-20"
            >
              <View className="bg-slate-800/50 rounded-full p-6 mb-4">
                <Bell size={48} color="#475569" />
              </View>
              <Text className="text-slate-400 text-center text-lg font-medium">
                No notifications yet
              </Text>
              <Text className="text-slate-500 text-center mt-1">
                You'll see game invites and reminders here
              </Text>
            </Animated.View>
          ) : (
            <>
              {unreadCount > 0 && (
                <Animated.View
                  entering={FadeIn.delay(50)}
                  className="mb-4"
                >
                  <Text className="text-cyan-400 font-semibold">
                    {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                  </Text>
                </Animated.View>
              )}

              {myNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onPress={() => handleNotificationPress(notification)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
