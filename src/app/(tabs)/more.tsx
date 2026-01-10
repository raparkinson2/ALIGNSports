import { View, Text, ScrollView, Pressable, Alert, Platform, Modal, TextInput, KeyboardAvoidingView, Switch } from 'react-native';
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
  X,
  Camera,
  Pencil,
  BellRing,
  BellOff,
  Play,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTeamStore, Player, NotificationPreferences, defaultNotificationPreferences } from '@/lib/store';
import { formatPhoneInput, formatPhoneNumber, unformatPhone } from '@/lib/phone';
import { sendTestNotification, registerForPushNotificationsAsync } from '@/lib/notifications';

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

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  player: Player;
  onSave: (updates: Partial<Player>) => void;
}

function EditProfileModal({ visible, onClose, player, onSave }: EditProfileModalProps) {
  const [avatar, setAvatar] = useState(player.avatar || '');
  const [number, setNumber] = useState(player.number);
  const [phone, setPhone] = useState(formatPhoneNumber(player.phone));
  const [email, setEmail] = useState(player.email || '');

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!number.trim()) {
      Alert.alert('Error', 'Jersey number is required');
      return;
    }
    // Store raw phone digits
    const rawPhone = unformatPhone(phone);
    onSave({
      avatar: avatar || undefined,
      number: number.trim(),
      phone: rawPhone || undefined,
      email: email.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-white text-lg font-bold">Edit Profile</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View className="items-center mb-6">
                <Pressable onPress={handlePickImage} className="relative">
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-slate-700 items-center justify-center">
                      <User size={40} color="#94a3b8" />
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-500 items-center justify-center">
                    <Camera size={16} color="white" />
                  </View>
                </Pressable>
                <Text className="text-slate-400 text-sm mt-2">Tap to change photo</Text>
              </View>

              {/* Player Name (read-only display) */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Name</Text>
                <View className="bg-slate-800/50 rounded-xl px-4 py-3">
                  <Text className="text-slate-300 text-base">{player.name}</Text>
                </View>
                <Text className="text-slate-500 text-xs mt-1">Contact an admin to change your name</Text>
              </View>

              {/* Jersey Number */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Jersey Number</Text>
                <TextInput
                  value={number}
                  onChangeText={setNumber}
                  placeholder="Enter jersey number"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                  maxLength={3}
                />
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneInput(text))}
                  placeholder="(555)123-4567"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                />
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className="text-slate-400 text-sm mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                />
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                className="bg-cyan-500 rounded-xl py-4 items-center mb-8 active:bg-cyan-600"
              >
                <Text className="text-white font-semibold text-base">Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onSave: (prefs: Partial<NotificationPreferences>) => void;
}

interface PreferenceToggleProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function PreferenceToggle({ label, description, value, onToggle }: PreferenceToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-slate-800">
      <View className="flex-1 mr-4">
        <Text className="text-white font-medium text-base">{label}</Text>
        <Text className="text-slate-400 text-sm mt-0.5">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(newValue);
        }}
        trackColor={{ false: '#334155', true: '#0891b2' }}
        thumbColor={value ? '#67e8f9' : '#94a3b8'}
      />
    </View>
  );
}

function NotificationPreferencesModal({ visible, onClose, preferences, onSave }: NotificationPreferencesModalProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(preferences);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(prefs);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent! You should see it shortly.');
    } catch (error) {
      Alert.alert('Error', 'Could not send test notification. Make sure you have granted permissions.');
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        Alert.alert('Success', 'Push notifications are now enabled!');
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive game reminders and updates.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not request notification permissions.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-slate-900 rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
            <Text className="text-white text-lg font-bold">Notification Settings</Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
            >
              <X size={18} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
            {/* Enable Notifications Button */}
            <Pressable
              onPress={handleRequestPermission}
              disabled={isRequestingPermission}
              className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4 mt-4 mb-2 flex-row items-center active:bg-cyan-500/30"
            >
              <View className="w-10 h-10 rounded-full bg-cyan-500/30 items-center justify-center mr-3">
                <Bell size={20} color="#67e8f9" />
              </View>
              <View className="flex-1">
                <Text className="text-cyan-400 font-semibold">
                  {isRequestingPermission ? 'Requesting...' : 'Enable Push Notifications'}
                </Text>
                <Text className="text-slate-400 text-sm">Tap to grant notification permissions</Text>
              </View>
            </Pressable>

            {/* Game Notifications Section */}
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-4 mb-2">
              Game Notifications
            </Text>

            <PreferenceToggle
              label="Game Invites"
              description="Get notified when you're invited to a game"
              value={prefs.gameInvites}
              onToggle={(v) => handleToggle('gameInvites', v)}
            />

            <PreferenceToggle
              label="Day Before Reminder"
              description="Reminder 24 hours before game time"
              value={prefs.gameReminderDayBefore}
              onToggle={(v) => handleToggle('gameReminderDayBefore', v)}
            />

            <PreferenceToggle
              label="Hours Before Reminder"
              description="Reminder 2 hours before game time"
              value={prefs.gameReminderHoursBefore}
              onToggle={(v) => handleToggle('gameReminderHoursBefore', v)}
            />

            {/* Communication Section */}
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-6 mb-2">
              Communication
            </Text>

            <PreferenceToggle
              label="Chat Messages"
              description="Get notified when someone sends a team message"
              value={prefs.chatMessages}
              onToggle={(v) => handleToggle('chatMessages', v)}
            />

            {/* Payments Section */}
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-6 mb-2">
              Payments
            </Text>

            <PreferenceToggle
              label="Payment Reminders"
              description="Get reminders about outstanding payments"
              value={prefs.paymentReminders}
              onToggle={(v) => handleToggle('paymentReminders', v)}
            />

            {/* Test Notification Button */}
            <Pressable
              onPress={handleTestNotification}
              disabled={isTestingNotif}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 mt-6 flex-row items-center active:bg-slate-700"
            >
              <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center mr-3">
                <Play size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">
                  {isTestingNotif ? 'Sending...' : 'Send Test Notification'}
                </Text>
                <Text className="text-slate-400 text-sm">Verify notifications are working</Text>
              </View>
            </Pressable>

            {/* Info Note */}
            <View className="bg-slate-800/50 rounded-xl p-4 mt-4 mb-4">
              <Text className="text-cyan-400 font-medium mb-1">About Push Notifications</Text>
              <Text className="text-slate-400 text-sm">
                Push notifications let you know about important team updates even when the app is closed.
                You can enable or disable specific notification types above.
              </Text>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="bg-cyan-500 rounded-xl py-4 items-center mb-8 active:bg-cyan-600"
            >
              <Text className="text-white font-semibold text-base">Save Preferences</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const updateNotificationPreferences = useTeamStore((s) => s.updateNotificationPreferences);
  const getNotificationPreferences = useTeamStore((s) => s.getNotificationPreferences);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const canManageTeam = currentPlayer?.roles?.includes('admin') || currentPlayer?.roles?.includes('captain');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [notifPrefsVisible, setNotifPrefsVisible] = useState(false);

  const handleEditProfile = (player: Player) => {
    // Can edit own profile, or any profile if admin/captain
    const canEdit = player.id === currentPlayerId || canManageTeam;
    if (canEdit) {
      setPlayerToEdit(player);
      setEditModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSaveProfile = (updates: Partial<Player>) => {
    if (playerToEdit) {
      updatePlayer(playerToEdit.id, updates);
    }
  };

  const handleSaveNotificationPrefs = (prefs: Partial<NotificationPreferences>) => {
    if (currentPlayerId) {
      updateNotificationPreferences(currentPlayerId, prefs);
    }
  };

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
            >
              <Pressable
                onPress={() => handleEditProfile(currentPlayer)}
                className="bg-slate-800/80 rounded-2xl p-4 mb-6 border border-slate-700/50 active:bg-slate-700/80"
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
                  <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center">
                    <Pencil size={16} color="#94a3b8" />
                  </View>
                </View>
              </Pressable>
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

          {/* Notification Settings */}
          <Animated.View entering={FadeInDown.delay(125).springify()}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifPrefsVisible(true);
              }}
              className="flex-row items-center py-4 px-4 bg-slate-800/60 rounded-xl mb-3 active:bg-slate-700/80"
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-cyan-500/20">
                <BellRing size={20} color="#67e8f9" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-white">Notification Settings</Text>
                <Text className="text-slate-400 text-sm">Manage push notification preferences</Text>
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

      {/* Edit Profile Modal */}
      {playerToEdit && (
        <EditProfileModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setPlayerToEdit(null);
          }}
          player={playerToEdit}
          onSave={handleSaveProfile}
        />
      )}

      {/* Notification Preferences Modal */}
      {currentPlayerId && (
        <NotificationPreferencesModal
          visible={notifPrefsVisible}
          onClose={() => setNotifPrefsVisible(false)}
          preferences={getNotificationPreferences(currentPlayerId)}
          onSave={handleSaveNotificationPrefs}
        />
      )}
    </View>
  );
}
