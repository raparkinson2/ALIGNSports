import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Shield,
  Settings,
  Users,
  X,
  Check,
  Plus,
  Trash2,
  Palette,
  ChevronRight,
  UserCog,
  Mail,
  Phone,
  ImageIcon,
  Camera,
  MessageSquare,
  Send,
  UserPlus,
  BarChart3,
  DollarSign,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import Svg, { Path, Circle as SvgCircle, Line, Rect, Ellipse } from 'react-native-svg';
import {
  useTeamStore,
  Player,
  Sport,
  SPORT_NAMES,
  SPORT_POSITIONS,
  SPORT_POSITION_NAMES,
  PlayerRole,
  PlayerStatus,
} from '@/lib/store';
import { cn } from '@/lib/cn';
import { formatPhoneNumber, formatPhoneInput, unformatPhone } from '@/lib/phone';

// Custom Sport Icons
function HockeyIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Hockey stick */}
      <Path
        d="M4 3L4 17L8 21L12 21L12 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stick blade */}
      <Path
        d="M4 17L12 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Puck */}
      <Ellipse cx="18" cy="19" rx="4" ry="2" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function BaseballIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Baseball circle */}
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      {/* Left stitching */}
      <Path
        d="M7 5C8 7 8 9 7 12C6 15 6 17 7 19"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Right stitching */}
      <Path
        d="M17 5C16 7 16 9 17 12C18 15 18 17 17 19"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function BasketballIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball outline */}
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      {/* Vertical line */}
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth={1.5} />
      {/* Horizontal line */}
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={1.5} />
      {/* Left curve */}
      <Path d="M8 3.5C6 6 5 9 5 12C5 15 6 18 8 20.5" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Right curve */}
      <Path d="M16 3.5C18 6 19 9 19 12C19 15 18 18 16 20.5" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function SoccerIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball outline */}
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      {/* Center pentagon */}
      <Path
        d="M12 8L15 10.5L13.5 14.5H10.5L9 10.5L12 8Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill={color}
      />
      {/* Lines from pentagon to edge */}
      <Line x1="12" y1="8" x2="12" y2="3.5" stroke={color} strokeWidth={1.5} />
      <Line x1="15" y1="10.5" x2="20" y2="9" stroke={color} strokeWidth={1.5} />
      <Line x1="13.5" y1="14.5" x2="17" y2="19" stroke={color} strokeWidth={1.5} />
      <Line x1="10.5" y1="14.5" x2="7" y2="19" stroke={color} strokeWidth={1.5} />
      <Line x1="9" y1="10.5" x2="4" y2="9" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function SportIcon({ sport, color, size = 18 }: { sport: Sport; color: string; size?: number }) {
  switch (sport) {
    case 'hockey':
      return <HockeyIcon color={color} size={size} />;
    case 'baseball':
      return <BaseballIcon color={color} size={size} />;
    case 'basketball':
      return <BasketballIcon color={color} size={size} />;
    case 'soccer':
      return <SoccerIcon color={color} size={size} />;
    default:
      return null;
  }
}

interface PlayerManageCardProps {
  player: Player;
  index: number;
  onPress: () => void;
  isCurrentUser: boolean;
}

function PlayerManageCard({ player, index, onPress, isCurrentUser }: PlayerManageCardProps) {
  const roles = player.roles ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-slate-800/80 rounded-xl p-4 mb-2 border border-slate-700/50 active:bg-slate-700/80"
      >
        <View className="flex-row items-center">
          <Image
            source={{ uri: player.avatar }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
            contentFit="cover"
          />
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="text-white font-semibold">{player.name}</Text>
              {isCurrentUser && (
                <View className="ml-2 bg-cyan-500/20 rounded-full px-2 py-0.5">
                  <Text className="text-cyan-400 text-xs">You</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-1 flex-wrap">
              {roles.includes('admin') && (
                <View className="flex-row items-center bg-purple-500/20 rounded-full px-2 py-0.5 mr-2">
                  <Shield size={10} color="#a78bfa" />
                  <Text className="text-purple-400 text-xs ml-1">Admin</Text>
                </View>
              )}
              {roles.includes('captain') && (
                <View className="flex-row items-center bg-amber-500/20 rounded-full px-2 py-0.5 mr-2">
                  <View className="w-3 h-3 rounded-full bg-amber-500/30 items-center justify-center">
                    <Text className="text-amber-500 text-[8px] font-black">C</Text>
                  </View>
                  <Text className="text-amber-400 text-xs ml-1">Captain</Text>
                </View>
              )}
              <View className={cn(
                'rounded-full px-2 py-0.5',
                player.status === 'active' ? 'bg-green-500/20' : 'bg-slate-600/50'
              )}>
                <Text className={cn(
                  'text-xs',
                  player.status === 'active' ? 'text-green-400' : 'text-slate-400'
                )}>
                  {player.status === 'active' ? 'Active' : 'Reserve'}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const setTeamName = useTeamStore((s) => s.setTeamName);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const resetAllData = useTeamStore((s) => s.resetAllData);

  const positions = SPORT_POSITIONS[teamSettings.sport];

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isJerseyModalVisible, setIsJerseyModalVisible] = useState(false);

  // Player edit form
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerNumber, setEditPlayerNumber] = useState('');
  const [editPlayerPhone, setEditPlayerPhone] = useState('');
  const [editPlayerEmail, setEditPlayerEmail] = useState('');

  // New player form
  const [isNewPlayerModalVisible, setIsNewPlayerModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState(positions[0]);
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');

  // Invite modal state
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [newlyCreatedPlayer, setNewlyCreatedPlayer] = useState<Player | null>(null);

  // Sport change confirmation modal
  const [isSportChangeModalVisible, setIsSportChangeModalVisible] = useState(false);
  const [pendingSport, setPendingSport] = useState<Sport | null>(null);

  // Erase all data confirmation modal
  const [isEraseDataModalVisible, setIsEraseDataModalVisible] = useState(false);

  // Jersey color form
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ffffff');

  // Team name form
  const [editTeamName, setEditTeamName] = useState(teamName);

  if (!isAdmin()) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-8">
        <Shield size={64} color="#64748b" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Admin Access Required
        </Text>
        <Text className="text-slate-400 text-center mt-2">
          You need admin privileges to access this panel.
        </Text>
      </View>
    );
  }

  const openPlayerModal = (player: Player) => {
    setSelectedPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerNumber(player.number);
    setEditPlayerPhone(formatPhoneNumber(player.phone));
    setEditPlayerEmail(player.email || '');
    setIsPlayerModalVisible(true);
  };

  const handleSavePlayerName = () => {
    if (!selectedPlayer || !editPlayerName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlayer(selectedPlayer.id, { name: editPlayerName.trim() });
    setSelectedPlayer({ ...selectedPlayer, name: editPlayerName.trim() });
  };

  const handleSavePlayerNumber = () => {
    if (!selectedPlayer || !editPlayerNumber.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlayer(selectedPlayer.id, { number: editPlayerNumber.trim() });
    setSelectedPlayer({ ...selectedPlayer, number: editPlayerNumber.trim() });
  };

  const handleSavePlayerPhone = () => {
    if (!selectedPlayer) return;
    const rawPhone = unformatPhone(editPlayerPhone);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlayer(selectedPlayer.id, { phone: rawPhone || undefined });
    setSelectedPlayer({ ...selectedPlayer, phone: rawPhone || undefined });
  };

  const handleSavePlayerEmail = () => {
    if (!selectedPlayer) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlayer(selectedPlayer.id, { email: editPlayerEmail.trim() || undefined });
    setSelectedPlayer({ ...selectedPlayer, email: editPlayerEmail.trim() || undefined });
  };

  // New Player Functions
  const resetNewPlayerForm = () => {
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPosition(positions[0]);
    setNewPlayerPhone('');
    setNewPlayerEmail('');
  };

  const handleCreatePlayer = () => {
    if (!newPlayerName.trim() || !newPlayerNumber.trim()) {
      Alert.alert('Missing Info', 'Please enter a name and jersey number.');
      return;
    }

    const rawPhone = unformatPhone(newPlayerPhone);

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      number: newPlayerNumber.trim(),
      position: newPlayerPosition,
      phone: rawPhone || undefined,
      email: newPlayerEmail.trim() || undefined,
      avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
      roles: [],
      status: 'active',
    };

    addPlayer(newPlayer);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsNewPlayerModalVisible(false);
    resetNewPlayerForm();

    // Show invite modal if player has phone or email
    if (rawPhone || newPlayerEmail.trim()) {
      setNewlyCreatedPlayer({ ...newPlayer, phone: rawPhone || undefined, email: newPlayerEmail.trim() || undefined });
      setIsInviteModalVisible(true);
    }
  };

  const getInviteMessage = () => {
    return `Hey ${newlyCreatedPlayer?.name}!\n\nYou've been added to ${teamName}! Download the app and log in using your info to view the schedule, check in for games, and stay connected with the team.\n\nYour jersey number is #${newlyCreatedPlayer?.number}\n\nSee you at the next game!`;
  };

  const handleSendTextInvite = () => {
    if (!newlyCreatedPlayer?.phone) {
      Alert.alert('No Phone Number', 'This player does not have a phone number.');
      return;
    }

    const message = encodeURIComponent(getInviteMessage());
    const phoneNumber = newlyCreatedPlayer.phone;

    const smsUrl = Platform.select({
      ios: `sms:${phoneNumber}&body=${message}`,
      android: `sms:${phoneNumber}?body=${message}`,
      default: `sms:${phoneNumber}?body=${message}`,
    });

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Could not open messaging app');
    });

    setIsInviteModalVisible(false);
    setNewlyCreatedPlayer(null);
  };

  const handleSendEmailInvite = () => {
    if (!newlyCreatedPlayer?.email) {
      Alert.alert('No Email', 'This player does not have an email address.');
      return;
    }

    const subject = encodeURIComponent(`Welcome to ${teamName}!`);
    const body = encodeURIComponent(getInviteMessage());
    const mailtoUrl = `mailto:${newlyCreatedPlayer.email}?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });

    setIsInviteModalVisible(false);
    setNewlyCreatedPlayer(null);
  };

  const handleSkipInvite = () => {
    setIsInviteModalVisible(false);
    setNewlyCreatedPlayer(null);
  };

  const handleToggleRole = (role: PlayerRole) => {
    if (!selectedPlayer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentRoles = selectedPlayer.roles ?? [];
    let newRoles: PlayerRole[];

    if (currentRoles.includes(role)) {
      // Remove the role
      newRoles = currentRoles.filter((r) => r !== role);
    } else {
      // Add the role
      newRoles = [...currentRoles, role];
    }

    updatePlayer(selectedPlayer.id, { roles: newRoles });
    setSelectedPlayer({ ...selectedPlayer, roles: newRoles });
  };

  const handleUpdateStatus = (status: PlayerStatus) => {
    if (!selectedPlayer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updatePlayer(selectedPlayer.id, { status });
    setSelectedPlayer({ ...selectedPlayer, status });
  };

  const handleChangeSport = (sport: Sport) => {
    if (sport === teamSettings.sport) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingSport(sport);
    setIsSportChangeModalVisible(true);
  };

  const confirmChangeSport = () => {
    if (!pendingSport) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTeamSettings({ sport: pendingSport });
    setIsSportChangeModalVisible(false);
    setPendingSport(null);
  };

  const cancelChangeSport = () => {
    setIsSportChangeModalVisible(false);
    setPendingSport(null);
  };

  const handleEraseAllData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsEraseDataModalVisible(true);
  };

  const confirmEraseAllData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetAllData();
    setIsEraseDataModalVisible(false);
  };

  const cancelEraseAllData = () => {
    setIsEraseDataModalVisible(false);
  };

  const handleAddJerseyColor = () => {
    if (!newColorName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newColors = [...teamSettings.jerseyColors, { name: newColorName.trim(), color: newColorHex }];
    setTeamSettings({ jerseyColors: newColors });
    setNewColorName('');
    setNewColorHex('#ffffff');
  };

  const handleRemoveJerseyColor = (name: string) => {
    Alert.alert(
      'Remove Jersey Color',
      `Are you sure you want to remove "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const newColors = teamSettings.jerseyColors.filter((c) => c.name !== name);
            setTeamSettings({ jerseyColors: newColors });
          },
        },
      ]
    );
  };

  const handleSaveTeamName = () => {
    if (!editTeamName.trim()) return;
    setTeamName(editTeamName.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSettingsModalVisible(false);
  };

  const handlePickLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTeamSettings({ teamLogo: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Remove Team Logo',
      'Are you sure you want to remove the team logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setTeamSettings({ teamLogo: undefined });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const COLOR_PRESETS = [
    '#ffffff', '#1a1a1a', '#1e40af', '#dc2626', '#16a34a',
    '#7c3aed', '#ea580c', '#ca8a04', '#0891b2', '#db2777',
  ];

  const selectedRoles = selectedPlayer?.roles ?? [];

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
          <View className="flex-row items-center">
            <Shield size={20} color="#a78bfa" />
            <Text className="text-purple-400 text-sm font-medium ml-2">Admin</Text>
          </View>
          <Text className="text-white text-3xl font-bold">Control Panel</Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Team Settings Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Team Settings
            </Text>

            <Pressable
              onPress={() => {
                setEditTeamName(teamName);
                setIsSettingsModalVisible(true);
              }}
              className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-cyan-500/20 p-2 rounded-full">
                    <Settings size={20} color="#67e8f9" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">Team Name</Text>
                    <Text className="text-slate-400 text-sm">{teamName}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#64748b" />
              </View>
            </Pressable>

            {/* Team Logo */}
            <Pressable
              onPress={handlePickLogo}
              className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-amber-500/20 p-2 rounded-full">
                    <ImageIcon size={20} color="#f59e0b" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">Team Logo</Text>
                    <Text className="text-slate-400 text-sm">
                      {teamSettings.teamLogo ? 'Tap to change' : 'Tap to add logo'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  {teamSettings.teamLogo ? (
                    <>
                      <Image
                        source={{ uri: teamSettings.teamLogo }}
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 8 }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        className="p-2"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </Pressable>
                    </>
                  ) : (
                    <Plus size={20} color="#64748b" />
                  )}
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsJerseyModalVisible(true)}
              className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-pink-500/20 p-2 rounded-full">
                    <Palette size={20} color="#ec4899" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">Jersey Colors</Text>
                    <Text className="text-slate-400 text-sm">
                      {teamSettings.jerseyColors.length} colors configured
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  {teamSettings.jerseyColors.slice(0, 3).map((c, index) => (
                    <View
                      key={`preview-${index}`}
                      className="w-6 h-6 rounded-full border-2 border-slate-700 -ml-2"
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                  <ChevronRight size={20} color="#64748b" className="ml-2" />
                </View>
              </View>
            </Pressable>

            {/* Team Chat Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-cyan-500/20 p-2 rounded-full">
                    <MessageSquare size={20} color="#67e8f9" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Use Team Chat</Text>
                    <Text className="text-slate-400 text-sm">
                      Enable team messaging
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showTeamChat !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showTeamChat: value });
                  }}
                  trackColor={{ false: '#334155', true: '#67e8f9' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Team Stats Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-emerald-500/20 p-2 rounded-full">
                    <BarChart3 size={20} color="#10b981" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Use Team Stats</Text>
                    <Text className="text-slate-400 text-sm">
                      Track player and team statistics
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showTeamStats !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showTeamStats: value });
                  }}
                  trackColor={{ false: '#334155', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Team Stats Link - only show when enabled */}
            {teamSettings.showTeamStats !== false && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/team-stats');
                }}
                className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-cyan-500/20 p-2 rounded-full">
                      <BarChart3 size={20} color="#67e8f9" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-semibold">Team Stats</Text>
                      <Text className="text-slate-400 text-sm">
                        View and edit player statistics
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </View>
              </Pressable>
            )}

            {/* Payments Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-amber-500/20 p-2 rounded-full">
                    <DollarSign size={20} color="#f59e0b" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Use Payments</Text>
                    <Text className="text-slate-400 text-sm">
                      Track team dues and payments
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showPayments !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showPayments: value });
                  }}
                  trackColor={{ false: '#334155', true: '#f59e0b' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Erase All Data */}
            <Pressable
              onPress={handleEraseAllData}
              className="bg-red-500/10 rounded-xl p-4 mb-3 border border-red-500/30 active:bg-red-500/20"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-red-500/20 p-2 rounded-full">
                    <Trash2 size={20} color="#ef4444" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-red-400 font-semibold">Erase All Data</Text>
                    <Text className="text-slate-400 text-sm">
                      Delete all team data and start fresh
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#ef4444" />
              </View>
            </Pressable>
          </Animated.View>

          {/* Sport Selection */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-4">
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Sport
            </Text>

            <View className="flex-row justify-between">
              {(Object.keys(SPORT_NAMES) as Sport[]).map((sport) => (
                <Pressable
                  key={sport}
                  onPress={() => handleChangeSport(sport)}
                  className={cn(
                    'flex-1 items-center py-3 rounded-xl mx-1 border',
                    teamSettings.sport === sport
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-slate-800/80 border-slate-700/50'
                  )}
                >
                  <SportIcon
                    sport={sport}
                    size={20}
                    color={teamSettings.sport === sport ? '#67e8f9' : '#64748b'}
                  />
                  <Text
                    className={cn(
                      'mt-1 text-xs font-medium',
                      teamSettings.sport === sport ? 'text-cyan-400' : 'text-slate-400'
                    )}
                  >
                    {SPORT_NAMES[sport]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Player Management */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <UserCog size={16} color="#67e8f9" />
                <Text className="text-cyan-400 font-semibold ml-2">
                  Manage Players ({players.length})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewPlayerPosition(positions[0]);
                  setIsNewPlayerModalVisible(true);
                }}
                className="flex-row items-center bg-green-500/20 rounded-full px-3 py-1.5"
              >
                <UserPlus size={14} color="#22c55e" />
                <Text className="text-green-400 font-medium text-sm ml-1">Add</Text>
              </Pressable>
            </View>

            {players.map((player, index) => (
              <PlayerManageCard
                key={player.id}
                player={player}
                index={index}
                onPress={() => openPlayerModal(player)}
                isCurrentUser={player.id === currentPlayerId}
              />
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Player Edit Modal */}
      <Modal
        visible={isPlayerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPlayerModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsPlayerModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Edit Player</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedPlayer && (
              <ScrollView className="flex-1 px-5 pt-6">
                {/* Player Info */}
                <View className="items-center mb-6">
                  <Image
                    source={{ uri: selectedPlayer.avatar }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    contentFit="cover"
                  />
                </View>

                {/* Name Edit */}
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Player Name
                  </Text>
                  <TextInput
                    value={editPlayerName}
                    onChangeText={setEditPlayerName}
                    placeholder="Enter player name"
                    placeholderTextColor="#64748b"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                    onBlur={handleSavePlayerName}
                    onSubmitEditing={handleSavePlayerName}
                    returnKeyType="done"
                  />
                </View>

                {/* Jersey Number Edit */}
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Jersey Number
                  </Text>
                  <TextInput
                    value={editPlayerNumber}
                    onChangeText={setEditPlayerNumber}
                    placeholder="Enter jersey number"
                    placeholderTextColor="#64748b"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                    keyboardType="number-pad"
                    onBlur={handleSavePlayerNumber}
                    onSubmitEditing={handleSavePlayerNumber}
                    returnKeyType="done"
                    maxLength={3}
                  />
                </View>

                {/* Contact Info - Editable */}
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Contact Information
                  </Text>

                  {/* Phone */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <Phone size={14} color="#67e8f9" />
                      <Text className="text-slate-400 text-sm ml-2">Phone</Text>
                    </View>
                    <TextInput
                      value={editPlayerPhone}
                      onChangeText={(text) => setEditPlayerPhone(formatPhoneInput(text))}
                      placeholder="(555)123-4567"
                      placeholderTextColor="#64748b"
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      keyboardType="phone-pad"
                      onBlur={handleSavePlayerPhone}
                      onSubmitEditing={handleSavePlayerPhone}
                      returnKeyType="done"
                    />
                  </View>

                  {/* Email */}
                  <View>
                    <View className="flex-row items-center mb-2">
                      <Mail size={14} color="#67e8f9" />
                      <Text className="text-slate-400 text-sm ml-2">Email</Text>
                    </View>
                    <TextInput
                      value={editPlayerEmail}
                      onChangeText={setEditPlayerEmail}
                      placeholder="player@example.com"
                      placeholderTextColor="#64748b"
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={handleSavePlayerEmail}
                      onSubmitEditing={handleSavePlayerEmail}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* Role Selection - Multi-select */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Roles
                  </Text>
                  <Text className="text-slate-500 text-xs mb-3">
                    Tap to toggle roles. Players can have multiple roles.
                  </Text>
                  <View className="flex-row">
                    {(['admin', 'captain'] as PlayerRole[]).map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <Pressable
                          key={role}
                          onPress={() => handleToggleRole(role)}
                          className={cn(
                            'flex-1 py-3 rounded-xl mr-2 items-center border',
                            isSelected
                              ? role === 'admin'
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'bg-amber-500/20 border-amber-500/50'
                              : 'bg-slate-800 border-slate-700'
                          )}
                        >
                          <View className="flex-row items-center">
                            {role === 'admin' && <Shield size={16} color={isSelected ? '#a78bfa' : '#64748b'} />}
                            {role === 'captain' && (
                              <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: isSelected ? '#f59e0b40' : '#64748b30' }}>
                                <Text style={{ color: isSelected ? '#f59e0b' : '#64748b', fontSize: 11, fontWeight: '900' }}>C</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View className="ml-2">
                                <Check size={14} color={role === 'admin' ? '#a78bfa' : '#f59e0b'} />
                              </View>
                            )}
                          </View>
                          <Text
                            className={cn(
                              'mt-1 font-medium capitalize',
                              isSelected
                                ? role === 'admin'
                                  ? 'text-purple-400'
                                  : 'text-amber-400'
                                : 'text-slate-400'
                            )}
                          >
                            {role}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {selectedRoles.length === 0 && (
                    <Text className="text-slate-500 text-sm mt-2 text-center">
                      No special roles - regular player
                    </Text>
                  )}
                </View>

                {/* Status Selection */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Status
                  </Text>
                  <View className="flex-row">
                    {(['active', 'reserve'] as PlayerStatus[]).map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => handleUpdateStatus(status)}
                        className={cn(
                          'flex-1 py-3 rounded-xl mr-2 items-center border',
                          selectedPlayer.status === status
                            ? status === 'active'
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-slate-600/50 border-slate-500/50'
                            : 'bg-slate-800 border-slate-700'
                        )}
                      >
                        <Text
                          className={cn(
                            'font-medium capitalize',
                            selectedPlayer.status === status
                              ? status === 'active'
                                ? 'text-green-400'
                                : 'text-slate-300'
                              : 'text-slate-400'
                          )}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Team Settings Modal */}
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
              <Text className="text-white text-lg font-semibold">Team Settings</Text>
              <Pressable onPress={handleSaveTeamName}>
                <Text className="text-cyan-400 font-semibold">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Team Name</Text>
                <TextInput
                  value={editTeamName}
                  onChangeText={setEditTeamName}
                  placeholder="Enter team name"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Jersey Colors Modal */}
      <Modal
        visible={isJerseyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsJerseyModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsJerseyModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Jersey Colors</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Current Colors */}
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Current Colors
              </Text>

              {teamSettings.jerseyColors.map((color, index) => (
                <View
                  key={`color-${index}`}
                  className="flex-row items-center bg-slate-800/80 rounded-xl p-4 mb-2 border border-slate-700/50"
                >
                  <View
                    className="w-10 h-10 rounded-full border-2 border-slate-600"
                    style={{ backgroundColor: color.color }}
                  />
                  <Text className="text-white font-medium ml-3 flex-1">{color.name}</Text>
                  <Pressable
                    onPress={() => handleRemoveJerseyColor(color.name)}
                    className="p-2"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </View>
              ))}

              {/* Add New Color */}
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-6">
                Add New Color
              </Text>

              <View className="mb-4">
                <TextInput
                  value={newColorName}
                  onChangeText={setNewColorName}
                  placeholder="Color name (e.g., Navy Blue)"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white mb-3"
                />

                <Text className="text-slate-400 text-sm mb-2">Select Color</Text>
                <View className="flex-row flex-wrap mb-4">
                  {COLOR_PRESETS.map((hex) => (
                    <Pressable
                      key={hex}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewColorHex(hex);
                      }}
                      className={cn(
                        'w-12 h-12 rounded-full mr-3 mb-3 border-2 items-center justify-center',
                        newColorHex === hex ? 'border-cyan-400' : 'border-slate-600'
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {newColorHex === hex && (
                        <Check size={20} color={hex === '#ffffff' || hex === '#ca8a04' ? '#000' : '#fff'} />
                      )}
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={handleAddJerseyColor}
                  className="bg-cyan-500 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Plus size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Add Color</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* New Player Modal */}
      <Modal
        visible={isNewPlayerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsNewPlayerModalVisible(false);
          resetNewPlayerForm();
        }}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => {
                setIsNewPlayerModalVisible(false);
                resetNewPlayerForm();
              }}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Add Player</Text>
              <Pressable onPress={handleCreatePlayer}>
                <Text className="text-cyan-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Name *</Text>
                <TextInput
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                  placeholder="Player name"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Jersey Number */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Jersey Number *</Text>
                <TextInput
                  value={newPlayerNumber}
                  onChangeText={setNewPlayerNumber}
                  placeholder="00"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  maxLength={3}
                />
              </View>

              {/* Position */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Position</Text>
                <View className="flex-row flex-wrap">
                  {positions.map((pos) => (
                    <Pressable
                      key={pos}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewPlayerPosition(pos);
                      }}
                      className={cn(
                        'px-3 py-2 rounded-xl mr-2 mb-2 border',
                        newPlayerPosition === pos
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-800 border-slate-700'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-medium text-sm',
                          newPlayerPosition === pos ? 'text-cyan-400' : 'text-slate-400'
                        )}
                      >
                        {pos}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Phone */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <Phone size={14} color="#67e8f9" />
                  <Text className="text-slate-400 text-sm ml-2">Phone</Text>
                </View>
                <TextInput
                  value={newPlayerPhone}
                  onChangeText={(text) => setNewPlayerPhone(formatPhoneInput(text))}
                  placeholder="(555)123-4567"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Email */}
              <View className="mb-8">
                <View className="flex-row items-center mb-2">
                  <Mail size={14} color="#67e8f9" />
                  <Text className="text-slate-400 text-sm ml-2">Email</Text>
                </View>
                <TextInput
                  value={newPlayerEmail}
                  onChangeText={setNewPlayerEmail}
                  placeholder="player@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              <Text className="text-slate-500 text-sm text-center mb-6">
                Add phone or email to send an invite after creating the player
              </Text>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Send Invite Modal */}
      <Modal
        visible={isInviteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleSkipInvite}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
                <Send size={32} color="#22c55e" />
              </View>
              <Text className="text-white text-xl font-bold text-center">
                Player Added!
              </Text>
              <Text className="text-slate-400 text-center mt-2">
                Send {newlyCreatedPlayer?.name} an invite to register and join the team?
              </Text>
            </View>

            {/* Invite Options */}
            <View>
              {newlyCreatedPlayer?.phone && (
                <Pressable
                  onPress={handleSendTextInvite}
                  className="flex-row items-center justify-center bg-cyan-500 rounded-xl py-4 mb-3 active:bg-cyan-600"
                >
                  <MessageSquare size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Send Text Message</Text>
                </Pressable>
              )}

              {newlyCreatedPlayer?.email && (
                <Pressable
                  onPress={handleSendEmailInvite}
                  className="flex-row items-center justify-center bg-purple-500 rounded-xl py-4 mb-3 active:bg-purple-600"
                >
                  <Mail size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Send Email</Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleSkipInvite}
                className="flex-row items-center justify-center bg-slate-700 rounded-xl py-4 active:bg-slate-600"
              >
                <Text className="text-slate-300 font-semibold">Skip for Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sport Change Confirmation Modal */}
      <Modal
        visible={isSportChangeModalVisible}
        animationType="fade"
        transparent
        onRequestClose={cancelChangeSport}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                {pendingSport && <SportIcon sport={pendingSport} color="#f59e0b" size={32} />}
              </View>
              <Text className="text-white text-xl font-bold text-center">
                Change Sport?
              </Text>
              <Text className="text-slate-400 text-center mt-2">
                Switching to {pendingSport ? SPORT_NAMES[pendingSport] : ''} will reset all player positions and clear their statistics.
              </Text>
              <Text className="text-amber-400 text-center mt-3 font-medium">
                This action cannot be undone.
              </Text>
            </View>

            {/* Buttons */}
            <View>
              <Pressable
                onPress={confirmChangeSport}
                className="flex-row items-center justify-center bg-amber-500 rounded-xl py-4 mb-3 active:bg-amber-600"
              >
                <Text className="text-white font-semibold">Proceed</Text>
              </Pressable>

              <Pressable
                onPress={cancelChangeSport}
                className="flex-row items-center justify-center bg-slate-700 rounded-xl py-4 active:bg-slate-600"
              >
                <Text className="text-slate-300 font-semibold">Return</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Erase All Data Confirmation Modal */}
      <Modal
        visible={isEraseDataModalVisible}
        animationType="fade"
        transparent
        onRequestClose={cancelEraseAllData}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Text className="text-white text-xl font-bold text-center">
                Erase All Data?
              </Text>
              <Text className="text-slate-400 text-center mt-2">
                This will permanently delete all players, games, statistics, photos, chat messages, and payment records.
              </Text>
              <Text className="text-red-400 text-center mt-3 font-medium">
                This action cannot be undone.
              </Text>
            </View>

            {/* Buttons */}
            <View>
              <Pressable
                onPress={confirmEraseAllData}
                className="flex-row items-center justify-center bg-red-500 rounded-xl py-4 mb-3 active:bg-red-600"
              >
                <Trash2 size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Erase Everything</Text>
              </Pressable>

              <Pressable
                onPress={cancelEraseAllData}
                className="flex-row items-center justify-center bg-slate-700 rounded-xl py-4 active:bg-slate-600"
              >
                <Text className="text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
