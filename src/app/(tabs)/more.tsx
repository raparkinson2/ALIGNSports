import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Mail,
  Send,
  LogOut,
  User,
  ChevronRight,
  Users,
  MessageSquare,
  Bell,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTeamStore } from '@/lib/store';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  index: number;
  variant?: 'default' | 'danger';
}

function MenuItem({ icon, title, subtitle, onPress, index, variant = 'default' }: MenuItemProps) {
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="flex-row items-center py-4 px-4 bg-slate-800/60 rounded-xl mb-3 active:bg-slate-700/80"
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center ${
          variant === 'danger' ? 'bg-red-500/20' : 'bg-cyan-500/20'
        }`}>
          {icon}
        </View>
        <View className="flex-1 ml-3">
          <Text className={`font-semibold ${
            variant === 'danger' ? 'text-red-400' : 'text-white'
          }`}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-slate-400 text-sm">{subtitle}</Text>
          )}
        </View>
        <ChevronRight size={20} color={variant === 'danger' ? '#f87171' : '#64748b'} />
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const teamName = useTeamStore((s) => s.teamName);
  const logout = useTeamStore((s) => s.logout);
  const games = useTeamStore((s) => s.games);
  const notifications = useTeamStore((s) => s.notifications);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const unreadCount = notifications.filter((n) => n.toPlayerId === currentPlayerId && !n.read).length;

  const handleEmailTeam = () => {
    const emails = players
      .filter((p) => p.email)
      .map((p) => p.email)
      .join(',');

    if (emails.length === 0) {
      Alert.alert('No Emails', 'No team members have email addresses set.');
      return;
    }

    const subject = encodeURIComponent(`Message from ${teamName}`);
    const body = encodeURIComponent(`Hey team,\n\n`);
    const mailtoUrl = `mailto:${emails}?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleSendGeneralInvite = () => {
    // Find the next upcoming game
    const sortedGames = [...games].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const nextGame = sortedGames.find(
      (g) => new Date(g.date) >= new Date(new Date().setHours(0, 0, 0, 0))
    );

    let message = `Hey! You're invited to play with ${teamName}!\n\n`;

    if (nextGame) {
      const gameDate = new Date(nextGame.date);
      message += `Our next game:\n`;
      message += `vs ${nextGame.opponent}\n`;
      message += `${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${nextGame.time}\n`;
      message += `${nextGame.location}\n`;
      message += `${nextGame.address}\n\n`;
    }

    message += `Let me know if you can make it!`;

    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(message)}`,
      android: `sms:?body=${encodeURIComponent(message)}`,
      default: `sms:?body=${encodeURIComponent(message)}`,
    });

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Could not open messaging app');
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
            router.replace('/login');
          },
        },
      ]
    );
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
          className="px-5 pt-2 pb-4"
        >
          <Text className="text-slate-400 text-sm font-medium">Settings</Text>
          <Text className="text-white text-3xl font-bold">More</Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Current Player Card */}
          {currentPlayer && (
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              className="bg-slate-800/80 rounded-2xl p-4 mb-6 border border-slate-700/50"
            >
              <View className="flex-row items-center">
                <View className="relative">
                  {currentPlayer.avatar ? (
                    <Image
                      source={{ uri: currentPlayer.avatar }}
                      style={{ width: 60, height: 60, borderRadius: 30 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-15 h-15 rounded-full bg-cyan-500/20 items-center justify-center">
                      <User size={30} color="#67e8f9" />
                    </View>
                  )}
                  <View className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">#{currentPlayer.number}</Text>
                  </View>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold">{currentPlayer.name}</Text>
                  <Text className="text-cyan-400 text-sm">{currentPlayer.position} · {teamName}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Communication Section */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Communication
          </Text>

          {/* Notifications with badge */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notifications');
              }}
              className="flex-row items-center py-4 px-4 bg-slate-800/60 rounded-xl mb-3 active:bg-slate-700/80"
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-cyan-500/20 relative">
                <Bell size={20} color="#67e8f9" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center px-1">
                    <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-white">Notifications</Text>
                <Text className="text-slate-400 text-sm">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'Game invites & reminders'}
                </Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </Animated.View>

          <MenuItem
            icon={<Mail size={20} color="#67e8f9" />}
            title="Email Team"
            subtitle="Send an email to all players"
            onPress={handleEmailTeam}
            index={0}
          />

          <MenuItem
            icon={<Send size={20} color="#67e8f9" />}
            title="Send Game Invite"
            subtitle="Invite someone to your next game"
            onPress={handleSendGeneralInvite}
            index={1}
          />

          <MenuItem
            icon={<MessageSquare size={20} color="#67e8f9" />}
            title="Group Message"
            subtitle="Quick text to the team"
            onPress={() => {
              const phones = players
                .filter((p) => p.phone)
                .map((p) => p.phone)
                .join(',');
              const message = `Hey ${teamName}!\n\n`;
              const smsUrl = Platform.select({
                ios: `sms:${phones}&body=${encodeURIComponent(message)}`,
                android: `sms:${phones}?body=${encodeURIComponent(message)}`,
                default: `sms:${phones}?body=${encodeURIComponent(message)}`,
              });
              Linking.openURL(smsUrl).catch(() => {
                Alert.alert('Error', 'Could not open messaging app');
              });
            }}
            index={2}
          />

          {/* Team Info Section */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-6">
            Team
          </Text>

          <MenuItem
            icon={<Users size={20} color="#67e8f9" />}
            title="Team Roster"
            subtitle={`${players.length} players`}
            onPress={() => {
              // Navigate to roster tab
              router.push('/(tabs)/roster');
            }}
            index={3}
          />

          {/* Account Section */}
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-6">
            Account
          </Text>

          <MenuItem
            icon={<LogOut size={20} color="#f87171" />}
            title="Log Out"
            subtitle="Switch to a different player"
            onPress={handleLogout}
            index={4}
            variant="danger"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
