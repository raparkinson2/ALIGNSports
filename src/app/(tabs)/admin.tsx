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
  Beer,
  Edit3,
  ListOrdered,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path, Circle as SvgCircle, Line, Rect, Ellipse } from 'react-native-svg';
import { JuiceBoxIcon } from '@/components/JuiceBoxIcon';
import {
  useTeamStore,
  Player,
  Sport,
  SPORT_NAMES,
  SPORT_POSITIONS,
  SPORT_POSITION_NAMES,
  PlayerRole,
  PlayerStatus,
  getPlayerName,
} from '@/lib/store';
import { cn } from '@/lib/cn';
import { formatPhoneNumber, formatPhoneInput, unformatPhone } from '@/lib/phone';
import { PlayerAvatar } from '@/components/PlayerAvatar';

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
    <Pressable
      onPress={onPress}
      className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 active:bg-slate-700/80"
    >
      <View className="flex-row items-center">
        <PlayerAvatar player={player} size={44} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold">{getPlayerName(player)}</Text>
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
  );
}

interface SwipeablePlayerManageCardProps extends PlayerManageCardProps {
  onDelete: () => void;
  canDelete: boolean;
}

function SwipeablePlayerManageCard({
  onDelete,
  canDelete,
  ...cardProps
}: SwipeablePlayerManageCardProps) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -80;

  const handleDelete = () => {
    translateX.value = withSpring(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const panGesture = Gesture.Pan()
    .enabled(canDelete)
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -100);
      } else {
        translateX.value = withSpring(0);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        translateX.value = withSpring(-80);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / 40),
  }));

  if (!canDelete) {
    return (
      <Animated.View entering={FadeInDown.delay(cardProps.index * 50).springify()} className="mb-2">
        <PlayerManageCard {...cardProps} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(cardProps.index * 50).springify()}>
      <View className="relative mb-2 overflow-hidden rounded-xl">
        {/* Delete button behind */}
        <Animated.View
          style={[deleteButtonStyle]}
          className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 items-center justify-center rounded-r-xl"
        >
          <Pressable
            onPress={handleDelete}
            className="flex-1 w-full items-center justify-center"
          >
            <Trash2 size={24} color="white" />
            <Text className="text-white text-xs font-medium mt-1">Delete</Text>
          </Pressable>
        </Animated.View>

        {/* Swipeable row */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={animatedStyle}>
            <PlayerManageCard {...cardProps} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const removePlayer = useTeamStore((s) => s.removePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const setTeamName = useTeamStore((s) => s.setTeamName);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const resetAllData = useTeamStore((s) => s.resetAllData);
  const games = useTeamStore((s) => s.games);
  const updateGame = useTeamStore((s) => s.updateGame);

  const positions = SPORT_POSITIONS[teamSettings.sport];

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isJerseyModalVisible, setIsJerseyModalVisible] = useState(false);
  const [isManagePlayersModalVisible, setIsManagePlayersModalVisible] = useState(false);

  // Player edit form
  const [editPlayerFirstName, setEditPlayerFirstName] = useState('');
  const [editPlayerLastName, setEditPlayerLastName] = useState('');
  const [editPlayerNumber, setEditPlayerNumber] = useState('');
  const [editPlayerPhone, setEditPlayerPhone] = useState('');
  const [editPlayerEmail, setEditPlayerEmail] = useState('');

  // New player form
  const [isNewPlayerModalVisible, setIsNewPlayerModalVisible] = useState(false);
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('');
  const [newPlayerLastName, setNewPlayerLastName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPositions, setNewPlayerPositions] = useState<string[]>([positions[0]]);
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerRoles, setNewPlayerRoles] = useState<PlayerRole[]>([]);
  const [newPlayerStatus, setNewPlayerStatus] = useState<PlayerStatus>('active');
  const [newPlayerIsInjured, setNewPlayerIsInjured] = useState(false);
  const [newPlayerIsSuspended, setNewPlayerIsSuspended] = useState(false);
  const [newPlayerIsCoach, setNewPlayerIsCoach] = useState(false);

  // Invite modal state
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [newlyCreatedPlayer, setNewlyCreatedPlayer] = useState<Player | null>(null);

  // Sport change confirmation modal
  const [isSportChangeModalVisible, setIsSportChangeModalVisible] = useState(false);
  const [pendingSport, setPendingSport] = useState<Sport | null>(null);

  // Erase all data confirmation modal
  const [isEraseDataModalVisible, setIsEraseDataModalVisible] = useState(false);

  // Delete team confirmation modal
  const [isDeleteTeamModalVisible, setIsDeleteTeamModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Jersey color form
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ffffff');
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [editColorName, setEditColorName] = useState('');
  const [editColorHex, setEditColorHex] = useState('#ffffff');

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
    setEditPlayerFirstName(player.firstName);
    setEditPlayerLastName(player.lastName);
    setEditPlayerNumber(player.number);
    setEditPlayerPhone(formatPhoneNumber(player.phone));
    setEditPlayerEmail(player.email || '');
    // Close manage players modal first, then open player edit modal
    setIsManagePlayersModalVisible(false);
    setTimeout(() => {
      setIsPlayerModalVisible(true);
    }, 300);
  };

  const handleSavePlayerName = () => {
    if (!selectedPlayer || !editPlayerFirstName?.trim() || !editPlayerLastName?.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const firstName = editPlayerFirstName.trim();
    const lastName = editPlayerLastName.trim();
    updatePlayer(selectedPlayer.id, {
      firstName,
      lastName
    });
    setSelectedPlayer({ ...selectedPlayer, firstName, lastName });
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
    setNewPlayerFirstName('');
    setNewPlayerLastName('');
    setNewPlayerNumber('');
    setNewPlayerPositions([positions[0]]);
    setNewPlayerPhone('');
    setNewPlayerEmail('');
    setNewPlayerRoles([]);
    setNewPlayerStatus('active');
    setNewPlayerIsInjured(false);
    setNewPlayerIsSuspended(false);
    setNewPlayerIsCoach(false);
  };

  const handleCreatePlayer = () => {
    const rawPhone = unformatPhone(newPlayerPhone);

    if (!newPlayerFirstName.trim()) {
      Alert.alert('Missing Info', 'Please enter a first name.');
      return;
    }
    if (!newPlayerLastName.trim()) {
      Alert.alert('Missing Info', 'Please enter a last name.');
      return;
    }
    // Only require jersey number if not a coach
    if (!newPlayerIsCoach && !newPlayerNumber.trim()) {
      Alert.alert('Missing Info', 'Please enter a jersey number.');
      return;
    }
    if (!rawPhone) {
      Alert.alert('Missing Info', 'Please enter a phone number.');
      return;
    }
    if (!newPlayerEmail.trim()) {
      Alert.alert('Missing Info', 'Please enter an email address.');
      return;
    }

    // Build roles array - include 'coach' if isCoach is true
    const roles: PlayerRole[] = [...newPlayerRoles];
    if (newPlayerIsCoach && !roles.includes('coach')) {
      roles.push('coach');
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      firstName: newPlayerFirstName.trim(),
      lastName: newPlayerLastName.trim(),
      number: newPlayerIsCoach ? '' : newPlayerNumber.trim(),
      position: newPlayerIsCoach ? 'Coach' : newPlayerPositions[0],
      positions: newPlayerIsCoach ? ['Coach'] : newPlayerPositions,
      phone: rawPhone,
      email: newPlayerEmail.trim(),
      avatar: undefined,
      roles: roles,
      status: newPlayerStatus,
      isInjured: newPlayerIsInjured,
      isSuspended: newPlayerIsSuspended,
    };

    addPlayer(newPlayer);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsNewPlayerModalVisible(false);
    resetNewPlayerForm();

    // Show invite modal since player has phone and email (both required now)
    setNewlyCreatedPlayer({ ...newPlayer });
    setIsInviteModalVisible(true);
  };

  const getInviteMessage = () => {
    return `Hey ${newlyCreatedPlayer ? getPlayerName(newlyCreatedPlayer) : ''}!\n\nYou've been added to ${teamName}! Download the app and log in using your info to view the schedule, check in for games, and stay connected with the team.\n\nYour jersey number is #${newlyCreatedPlayer?.number}\n\nSee you at the next game!`;
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

  const handleEditJerseyColor = (index: number) => {
    const color = teamSettings.jerseyColors[index];
    setEditingColorIndex(index);
    setEditColorName(color.name);
    setEditColorHex(color.color);
  };

  const handleSaveEditJerseyColor = () => {
    if (editingColorIndex === null || !editColorName.trim()) return;

    const oldColorName = teamSettings.jerseyColors[editingColorIndex].name;
    const newColorName = editColorName.trim();

    // Update the jersey color in settings
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newColors = [...teamSettings.jerseyColors];
    newColors[editingColorIndex] = { name: newColorName, color: editColorHex };
    setTeamSettings({ jerseyColors: newColors });

    // Update all games that use the old color name
    if (oldColorName !== newColorName) {
      games.forEach((game) => {
        if (game.jerseyColor === oldColorName) {
          updateGame(game.id, { jerseyColor: newColorName });
        }
      });
    }

    setEditingColorIndex(null);
    setEditColorName('');
    setEditColorHex('#ffffff');
  };

  const handleCancelEditJerseyColor = () => {
    setEditingColorIndex(null);
    setEditColorName('');
    setEditColorHex('#ffffff');
  };

  const handleDeleteEditingColor = () => {
    if (editingColorIndex === null) return;
    const colorName = teamSettings.jerseyColors[editingColorIndex].name;
    Alert.alert(
      'Remove Jersey Color',
      `Are you sure you want to remove "${colorName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const newColors = teamSettings.jerseyColors.filter((_, i) => i !== editingColorIndex);
            setTeamSettings({ jerseyColors: newColors });
            setEditingColorIndex(null);
            setEditColorName('');
            setEditColorHex('#ffffff');
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
          {/* Sport Selection - Above Team Settings */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Sport
            </Text>

            <View className="flex-row justify-between mb-4">
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
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      teamSettings.sport === sport ? 'text-cyan-400' : 'text-slate-400'
                    )}
                  >
                    {SPORT_NAMES[sport]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

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

            {/* Manage Team Menu Item */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsManagePlayersModalVisible(true);
              }}
              className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-cyan-500/20 p-2 rounded-full">
                    <Users size={20} color="#67e8f9" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">Manage Team</Text>
                    <Text className="text-slate-400 text-sm">{players.length} members on roster</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#64748b" />
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

            {/* Create Lines/Lineups Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-emerald-500/20 p-2 rounded-full">
                    <ListOrdered size={20} color="#10b981" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">
                      Use Create {teamSettings.sport === 'hockey' ? 'Lines' : 'Lineups'}
                    </Text>
                    <Text className="text-slate-400 text-sm">
                      {teamSettings.sport === 'hockey'
                        ? 'Set forward, defense, and goalie lines'
                        : 'Set starting lineups for games'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showLineups !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showLineups: value });
                  }}
                  trackColor={{ false: '#334155', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Photos Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-purple-500/20 p-2 rounded-full">
                    <ImageIcon size={20} color="#a78bfa" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Use Photos</Text>
                    <Text className="text-slate-400 text-sm">
                      Share team photos and memories
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showPhotos !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showPhotos: value });
                  }}
                  trackColor={{ false: '#334155', true: '#a78bfa' }}
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

            {/* Refreshment Duty Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-amber-500/20 p-2 rounded-full">
                    {teamSettings.refreshmentDutyIs21Plus !== false ? (
                      <Beer size={20} color="#f59e0b" />
                    ) : (
                      <JuiceBoxIcon size={20} color="#f59e0b" />
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">Use Refreshment Duty</Text>
                    <Text className="text-slate-400 text-sm">
                      Assign players to bring refreshments
                    </Text>
                  </View>
                </View>
                <Switch
                  value={teamSettings.showRefreshmentDuty !== false}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTeamSettings({ showRefreshmentDuty: value });
                  }}
                  trackColor={{ false: '#334155', true: '#f59e0b' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* 21+ Toggle - only show when refreshment duty is enabled */}
            {teamSettings.showRefreshmentDuty !== false && (
              <View className="bg-slate-800/60 rounded-xl p-4 mb-3 border border-slate-700/30 ml-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-amber-500/10 p-2 rounded-full">
                      <Beer size={18} color="#d97706" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-200 font-medium">21+ Beverages</Text>
                      <Text className="text-slate-500 text-sm">
                        Show beer mug icon
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={teamSettings.refreshmentDutyIs21Plus !== false}
                    onValueChange={(value) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTeamSettings({ refreshmentDutyIs21Plus: value });
                    }}
                    trackColor={{ false: '#334155', true: '#d97706' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            )}

            {/* Payments Toggle */}
            <View className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-green-500/20 p-2 rounded-full">
                    <DollarSign size={20} color="#22c55e" />
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
                  trackColor={{ false: '#334155', true: '#22c55e' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Erase All Data */}
            <Pressable
              onPress={handleEraseAllData}
              className="bg-orange-500/10 rounded-xl p-4 mb-3 border border-orange-500/30 active:bg-orange-500/20"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-orange-500/20 p-2 rounded-full">
                    <Trash2 size={20} color="#f97316" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-orange-400 font-semibold">Erase All Data</Text>
                    <Text className="text-slate-400 text-sm">
                      Delete all team data and start fresh
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#f97316" />
              </View>
            </Pressable>

            {/* Delete Team - Nuclear Option */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setDeleteConfirmText('');
                setIsDeleteTeamModalVisible(true);
              }}
              className="bg-red-900/30 rounded-xl p-4 mb-3 border border-red-700/50 active:bg-red-900/50"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-red-700/30 p-2 rounded-full">
                    <AlertTriangle size={20} color="#dc2626" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-red-500 font-semibold">Delete Team</Text>
                    <Text className="text-slate-400 text-sm">
                      Permanently delete team and all accounts
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#dc2626" />
              </View>
            </Pressable>
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
              <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                {/* Name Inputs */}
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">First Name<Text className="text-red-400">*</Text></Text>
                  <TextInput
                    value={editPlayerFirstName}
                    onChangeText={setEditPlayerFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#64748b"
                    autoCapitalize="words"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg mb-3"
                    onBlur={handleSavePlayerName}
                    onSubmitEditing={handleSavePlayerName}
                    returnKeyType="done"
                  />
                  <Text className="text-slate-400 text-sm mb-2">Last Name<Text className="text-red-400">*</Text></Text>
                  <TextInput
                    value={editPlayerLastName}
                    onChangeText={setEditPlayerLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#64748b"
                    autoCapitalize="words"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                    onBlur={handleSavePlayerName}
                    onSubmitEditing={handleSavePlayerName}
                    returnKeyType="done"
                  />
                </View>

                {/* Number Input */}
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Jersey #<Text className="text-red-400">*</Text></Text>
                  <TextInput
                    value={editPlayerNumber}
                    onChangeText={setEditPlayerNumber}
                    placeholder="00"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                    onBlur={handleSavePlayerNumber}
                    onSubmitEditing={handleSavePlayerNumber}
                    returnKeyType="done"
                  />
                </View>

                {/* Phone */}
                <View className="mb-5">
                  <View className="flex-row items-center mb-2">
                    <Phone size={14} color="#a78bfa" />
                    <Text className="text-slate-400 text-sm ml-2">Phone<Text className="text-red-400">*</Text></Text>
                  </View>
                  <TextInput
                    value={editPlayerPhone}
                    onChangeText={(text) => setEditPlayerPhone(formatPhoneInput(text))}
                    placeholder="(555)123-4567"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                    onBlur={handleSavePlayerPhone}
                    onSubmitEditing={handleSavePlayerPhone}
                    returnKeyType="done"
                  />
                </View>

                {/* Email */}
                <View className="mb-5">
                  <View className="flex-row items-center mb-2">
                    <Mail size={14} color="#a78bfa" />
                    <Text className="text-slate-400 text-sm ml-2">Email<Text className="text-red-400">*</Text></Text>
                  </View>
                  <TextInput
                    value={editPlayerEmail}
                    onChangeText={setEditPlayerEmail}
                    placeholder="player@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                    onBlur={handleSavePlayerEmail}
                    onSubmitEditing={handleSavePlayerEmail}
                    returnKeyType="done"
                  />
                </View>

                <Text className="text-slate-500 text-xs mb-4"><Text className="text-red-400">*</Text> Required</Text>

                {/* Player Status */}
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Player Status</Text>
                  <View className="flex-row mb-2">
                    <Pressable
                      onPress={() => handleUpdateStatus('active')}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                        selectedPlayer.status === 'active' ? 'bg-green-500' : 'bg-slate-800'
                      )}
                    >
                      {selectedPlayer.status === 'active' && <Check size={16} color="white" />}
                      <Text
                        className={cn(
                          'font-semibold ml-1',
                          selectedPlayer.status === 'active' ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Active
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleUpdateStatus('reserve')}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                        selectedPlayer.status === 'reserve' ? 'bg-slate-600' : 'bg-slate-800'
                      )}
                    >
                      {selectedPlayer.status === 'reserve' && <Check size={16} color="white" />}
                      <Text
                        className={cn(
                          'font-semibold ml-1',
                          selectedPlayer.status === 'reserve' ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Reserve
                      </Text>
                    </Pressable>
                  </View>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const newValue = !selectedPlayer.isInjured;
                        updatePlayer(selectedPlayer.id, { isInjured: newValue });
                        setSelectedPlayer({ ...selectedPlayer, isInjured: newValue });
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                        selectedPlayer.isInjured ? 'bg-red-500' : 'bg-slate-800'
                      )}
                    >
                      <Text className={cn(
                        'text-lg font-black mr-1',
                        selectedPlayer.isInjured ? 'text-white' : 'text-red-500'
                      )}>+</Text>
                      <Text
                        className={cn(
                          'font-semibold',
                          selectedPlayer.isInjured ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Injured
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const newValue = !selectedPlayer.isSuspended;
                        updatePlayer(selectedPlayer.id, { isSuspended: newValue });
                        setSelectedPlayer({ ...selectedPlayer, isSuspended: newValue });
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                        selectedPlayer.isSuspended ? 'bg-red-600' : 'bg-slate-800'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-bold mr-1',
                          selectedPlayer.isSuspended ? 'text-white' : 'text-red-500'
                        )}
                        style={{ fontSize: 12 }}
                      >
                        SUS
                      </Text>
                      <Text
                        className={cn(
                          'font-semibold',
                          selectedPlayer.isSuspended ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Suspended
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Player Roles */}
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Player Roles</Text>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => handleToggleRole('captain')}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                        selectedRoles.includes('captain') ? 'bg-amber-500' : 'bg-slate-800'
                      )}
                    >
                      <View className="w-5 h-5 rounded-full bg-amber-500/30 items-center justify-center">
                        <Text className={cn(
                          'text-xs font-black',
                          selectedRoles.includes('captain') ? 'text-white' : 'text-amber-500'
                        )}>C</Text>
                      </View>
                      <Text
                        className={cn(
                          'font-semibold ml-2',
                          selectedRoles.includes('captain') ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Captain
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleRole('admin')}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                        selectedRoles.includes('admin') ? 'bg-purple-500' : 'bg-slate-800'
                      )}
                    >
                      <Shield size={16} color={selectedRoles.includes('admin') ? 'white' : '#a78bfa'} />
                      <Text
                        className={cn(
                          'font-semibold ml-2',
                          selectedRoles.includes('admin') ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Admin
                      </Text>
                    </Pressable>
                  </View>
                  <Text className="text-slate-500 text-xs mt-2">
                    Tap to toggle roles. Players can have multiple roles.
                  </Text>
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
                  autoCapitalize="words"
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
                <View key={`color-${index}`}>
                  {editingColorIndex === index ? (
                    // Edit mode
                    <View className="bg-slate-800/80 rounded-xl p-4 mb-2 border border-cyan-500/50">
                      <TextInput
                        value={editColorName}
                        onChangeText={setEditColorName}
                        placeholder="Description (e.g. Home)"
                        placeholderTextColor="#64748b"
                        autoCapitalize="words"
                        className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-3"
                      />
                      <Text className="text-slate-400 text-sm mb-2">Select Color</Text>
                      <View className="flex-row justify-between mb-3">
                        {COLOR_PRESETS.map((hex) => (
                          <Pressable
                            key={hex}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setEditColorHex(hex);
                            }}
                            className={cn(
                              'flex-1 aspect-square rounded-full border-2 items-center justify-center mx-0.5',
                              editColorHex === hex ? 'border-cyan-400' : 'border-slate-600'
                            )}
                            style={{ backgroundColor: hex, maxWidth: 32 }}
                          >
                            {editColorHex === hex && (
                              <Check size={14} color={hex === '#ffffff' || hex === '#ca8a04' ? '#000' : '#fff'} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                      <View className="flex-row">
                        <Pressable
                          onPress={handleCancelEditJerseyColor}
                          className="flex-1 bg-slate-700 rounded-xl py-3 mr-2"
                        >
                          <Text className="text-slate-300 font-semibold text-center">Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleDeleteEditingColor}
                          className="bg-red-500/20 rounded-xl py-3 px-4 mr-2"
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                        <Pressable
                          onPress={handleSaveEditJerseyColor}
                          className="flex-1 bg-cyan-500 rounded-xl py-3"
                        >
                          <Text className="text-white font-semibold text-center">Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    // Display mode
                    <View className="flex-row items-center bg-slate-800/80 rounded-xl p-4 mb-2 border border-slate-700/50">
                      <View
                        className="w-10 h-10 rounded-full border-2 border-slate-600"
                        style={{ backgroundColor: color.color }}
                      />
                      <Text className="text-white font-medium ml-3 flex-1">{color.name}</Text>
                      <Pressable
                        onPress={() => handleEditJerseyColor(index)}
                        className="p-2"
                      >
                        <Edit3 size={18} color="#67e8f9" />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}

              {/* Add New Color */}
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 mt-6">
                Add New Color<Text className="text-red-400">*</Text>
              </Text>

              <View className="mb-4">
                <TextInput
                  value={newColorName}
                  onChangeText={setNewColorName}
                  placeholder="Description (e.g. Home)"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white mb-3"
                />

                <Text className="text-slate-400 text-sm mb-2">Select Color</Text>
                <View className="flex-row justify-between mb-4">
                  {COLOR_PRESETS.map((hex) => (
                    <Pressable
                      key={hex}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewColorHex(hex);
                      }}
                      className={cn(
                        'flex-1 aspect-square rounded-full border-2 items-center justify-center mx-0.5',
                        newColorHex === hex ? 'border-cyan-400' : 'border-slate-600'
                      )}
                      style={{ backgroundColor: hex, maxWidth: 32 }}
                    >
                      {newColorHex === hex && (
                        <Check size={14} color={hex === '#ffffff' || hex === '#ca8a04' ? '#000' : '#fff'} />
                      )}
                    </Pressable>
                  ))}
                </View>

                <Text className="text-slate-500 text-xs mb-3"><Text className="text-red-400">*</Text> Required</Text>

                <Pressable
                  onPress={handleAddJerseyColor}
                  className="bg-cyan-500 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Plus size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Save Color</Text>
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
              {/* Name Inputs */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">First Name<Text className="text-red-400">*</Text></Text>
                <TextInput
                  value={newPlayerFirstName}
                  onChangeText={setNewPlayerFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg mb-3"
                />
                <Text className="text-slate-400 text-sm mb-2">Last Name<Text className="text-red-400">*</Text></Text>
                <TextInput
                  value={newPlayerLastName}
                  onChangeText={setNewPlayerLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#64748b"
                  autoCapitalize="words"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Number Input - Hidden for coaches */}
              {!newPlayerIsCoach && (
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Jersey #<Text className="text-red-400">*</Text></Text>
                  <TextInput
                    value={newPlayerNumber}
                    onChangeText={setNewPlayerNumber}
                    placeholder="00"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={2}
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  />
                </View>
              )}

              {/* Phone */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <Phone size={14} color="#a78bfa" />
                  <Text className="text-slate-400 text-sm ml-2">Phone<Text className="text-red-400">*</Text></Text>
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
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <Mail size={14} color="#a78bfa" />
                  <Text className="text-slate-400 text-sm ml-2">Email<Text className="text-red-400">*</Text></Text>
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

              {/* Position - Hidden for coaches */}
              {!newPlayerIsCoach && (
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-1">Positions</Text>
                  <Text className="text-slate-500 text-xs mb-2">Tap to select multiple positions</Text>
                  <View className="flex-row flex-wrap">
                    {positions.map((pos) => {
                      const isSelected = newPlayerPositions.includes(pos);
                      return (
                        <Pressable
                          key={pos}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            if (isSelected) {
                              if (newPlayerPositions.length > 1) {
                                setNewPlayerPositions(newPlayerPositions.filter(p => p !== pos));
                              }
                            } else {
                              setNewPlayerPositions([...newPlayerPositions, pos]);
                            }
                          }}
                          className={cn(
                            'py-3 px-4 rounded-xl mr-2 mb-2 items-center',
                            isSelected ? 'bg-cyan-500' : 'bg-slate-800'
                          )}
                        >
                          <Text
                            className={cn(
                              'font-semibold',
                              isSelected ? 'text-white' : 'text-slate-400'
                            )}
                          >
                            {pos}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Player Status */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Player Status</Text>
                <View className="flex-row mb-2">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewPlayerStatus('active');
                    }}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                      newPlayerStatus === 'active' ? 'bg-green-500' : 'bg-slate-800'
                    )}
                  >
                    {newPlayerStatus === 'active' && <Check size={16} color="white" />}
                    <Text
                      className={cn(
                        'font-semibold ml-1',
                        newPlayerStatus === 'active' ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Active
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewPlayerStatus('reserve');
                    }}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                      newPlayerStatus === 'reserve' ? 'bg-slate-600' : 'bg-slate-800'
                    )}
                  >
                    {newPlayerStatus === 'reserve' && <Check size={16} color="white" />}
                    <Text
                      className={cn(
                        'font-semibold ml-1',
                        newPlayerStatus === 'reserve' ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Reserve
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewPlayerIsInjured(!newPlayerIsInjured);
                    }}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                      newPlayerIsInjured ? 'bg-red-500' : 'bg-slate-800'
                    )}
                  >
                    <Text className={cn(
                      'text-lg font-black mr-1',
                      newPlayerIsInjured ? 'text-white' : 'text-red-500'
                    )}>+</Text>
                    <Text
                      className={cn(
                        'font-semibold',
                        newPlayerIsInjured ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Injured
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewPlayerIsSuspended(!newPlayerIsSuspended);
                    }}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                      newPlayerIsSuspended ? 'bg-red-600' : 'bg-slate-800'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-bold mr-1',
                        newPlayerIsSuspended ? 'text-white' : 'text-red-500'
                      )}
                      style={{ fontSize: 12 }}
                    >
                      SUS
                    </Text>
                    <Text
                      className={cn(
                        'font-semibold',
                        newPlayerIsSuspended ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Suspended
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Roles */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Roles</Text>
                <View className="flex-row">
                  {/* Captain */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (newPlayerRoles.includes('captain')) {
                        setNewPlayerRoles(newPlayerRoles.filter((r) => r !== 'captain'));
                      } else {
                        setNewPlayerRoles([...newPlayerRoles, 'captain']);
                      }
                    }}
                    className={cn(
                      'flex-1 py-3 px-2 rounded-xl mr-2 items-center justify-center',
                      newPlayerRoles.includes('captain') ? 'bg-amber-500' : 'bg-slate-800'
                    )}
                  >
                    <View className="w-5 h-5 rounded-full bg-amber-500/30 items-center justify-center mb-1">
                      <Text className={cn(
                        'text-xs font-black',
                        newPlayerRoles.includes('captain') ? 'text-white' : 'text-amber-500'
                      )}>C</Text>
                    </View>
                    <Text
                      className={cn(
                        'font-semibold text-sm',
                        newPlayerRoles.includes('captain') ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Captain
                    </Text>
                  </Pressable>
                  {/* Admin */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (newPlayerRoles.includes('admin')) {
                        setNewPlayerRoles(newPlayerRoles.filter((r) => r !== 'admin'));
                      } else {
                        setNewPlayerRoles([...newPlayerRoles, 'admin']);
                      }
                    }}
                    className={cn(
                      'flex-1 py-3 px-2 rounded-xl mr-2 items-center justify-center',
                      newPlayerRoles.includes('admin') ? 'bg-purple-500' : 'bg-slate-800'
                    )}
                  >
                    <Shield size={16} color={newPlayerRoles.includes('admin') ? 'white' : '#a78bfa'} />
                    <Text
                      className={cn(
                        'font-semibold text-sm mt-1',
                        newPlayerRoles.includes('admin') ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Admin
                    </Text>
                  </Pressable>
                  {/* Coach */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewPlayerIsCoach(!newPlayerIsCoach);
                    }}
                    className={cn(
                      'flex-1 py-3 px-2 rounded-xl items-center justify-center',
                      newPlayerIsCoach ? 'bg-cyan-500' : 'bg-slate-800'
                    )}
                  >
                    <UserCog size={16} color={newPlayerIsCoach ? 'white' : '#67e8f9'} />
                    <Text
                      className={cn(
                        'font-semibold text-sm mt-1',
                        newPlayerIsCoach ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Coach
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-slate-500 text-xs mt-2">
                  {newPlayerIsCoach
                    ? 'Coaches don\'t need jersey numbers or positions'
                    : 'Tap to toggle roles. Members can have multiple roles.'}
                </Text>
              </View>

              <Text className="text-slate-500 text-xs mb-6"><Text className="text-red-400">*</Text> Required</Text>
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
                Send {newlyCreatedPlayer ? getPlayerName(newlyCreatedPlayer) : ''} an invite to register and join the team?
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

      {/* Manage Team Modal */}
      <Modal
        visible={isManagePlayersModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsManagePlayersModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsManagePlayersModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Manage Team</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewPlayerPositions([positions[0]]);
                  // Close manage players modal first, then open new player modal
                  setIsManagePlayersModalVisible(false);
                  setTimeout(() => {
                    setIsNewPlayerModalVisible(true);
                  }, 300);
                }}
              >
                <UserPlus size={24} color="#22c55e" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
              {players.map((player, index) => (
                <SwipeablePlayerManageCard
                  key={player.id}
                  player={player}
                  index={index}
                  onPress={() => openPlayerModal(player)}
                  isCurrentUser={player.id === currentPlayerId}
                  canDelete={player.id !== currentPlayerId}
                  onDelete={() => {
                    Alert.alert(
                      'Delete Player',
                      `Are you sure you want to remove ${getPlayerName(player)} from the roster? This cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            removePlayer(player.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          },
                        },
                      ]
                    );
                  }}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Delete Team Confirmation Modal */}
      <Modal
        visible={isDeleteTeamModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsDeleteTeamModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-red-700/50">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-red-900/50 items-center justify-center mb-4">
                <AlertTriangle size={40} color="#dc2626" />
              </View>
              <Text className="text-red-500 text-2xl font-bold text-center">
                Delete Team?
              </Text>
              <Text className="text-slate-300 text-center mt-3">
                This is a permanent, irreversible action that will delete:
              </Text>
              <View className="mt-3 w-full">
                <Text className="text-slate-400 text-sm">• All player accounts and profiles</Text>
                <Text className="text-slate-400 text-sm">• All admin accounts</Text>
                <Text className="text-slate-400 text-sm">• All games and schedules</Text>
                <Text className="text-slate-400 text-sm">• All photos and memories</Text>
                <Text className="text-slate-400 text-sm">• All chat messages</Text>
                <Text className="text-slate-400 text-sm">• All payment records</Text>
                <Text className="text-slate-400 text-sm">• All team settings</Text>
              </View>
              <Text className="text-red-400 text-center mt-4 font-semibold">
                This action CANNOT be undone.
              </Text>
            </View>

            {/* Confirmation Input */}
            <View className="mb-4">
              <Text className="text-slate-300 text-center mb-2">
                Type <Text className="text-red-500 font-bold">DELETE</Text> to confirm:
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE"
                placeholderTextColor="#64748b"
                className="bg-slate-700 rounded-xl px-4 py-3 text-white text-center text-lg font-semibold"
                autoCapitalize="characters"
              />
            </View>

            {/* Buttons */}
            <View>
              <Pressable
                onPress={() => {
                  if (deleteConfirmText === 'DELETE') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    resetAllData();
                    setIsDeleteTeamModalVisible(false);
                    setDeleteConfirmText('');
                    // Navigate to login screen after deleting all data
                    router.replace('/login');
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE'}
                className={cn(
                  'flex-row items-center justify-center rounded-xl py-4 mb-3',
                  deleteConfirmText === 'DELETE'
                    ? 'bg-red-600 active:bg-red-700'
                    : 'bg-slate-600 opacity-50'
                )}
              >
                <Trash2 size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Delete Everything Forever</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsDeleteTeamModalVisible(false);
                  setDeleteConfirmText('');
                }}
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
