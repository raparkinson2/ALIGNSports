import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Shield,
  Settings,
  Users,
  Crown,
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
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle as SvgCircle, Line, Rect, Ellipse } from 'react-native-svg';
import {
  useTeamStore,
  Player,
  Sport,
  SPORT_NAMES,
  PlayerRole,
  PlayerStatus,
} from '@/lib/store';
import { cn } from '@/lib/cn';

// Custom Sport Icons
function HockeyIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Hockey stick - angled with blade */}
      <Path
        d="M19 2L15 6L15 16L13 18L7 18L7 20L14 20L16 18L16 6L20 2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Tape on stick */}
      <Line x1="15" y1="8" x2="16" y2="8" stroke={color} strokeWidth={1} />
      <Line x1="15" y1="10" x2="16" y2="10" stroke={color} strokeWidth={1} />
      {/* Puck - 3D oval */}
      <Ellipse cx="5" cy="14" rx="3.5" ry="1.5" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M1.5 14L1.5 16C1.5 16.8 3 17.5 5 17.5C7 17.5 8.5 16.8 8.5 16L8.5 14" stroke={color} strokeWidth={1.5} fill="none" />
      <Line x1="1.5" y1="15" x2="1.5" y2="14" stroke={color} strokeWidth={1.5} />
      <Line x1="8.5" y1="15" x2="8.5" y2="14" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function BaseballIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Baseball bat - angled */}
      <Path
        d="M20 2C20 2 21 3 21 4L14 11L12 13L10 13L10 11L12 9L19 2C19 2 20 2 20 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bat handle */}
      <Path d="M10 13L8 15L6 15L6 13L8 11L10 11" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Baseball with stitching */}
      <SvgCircle cx="7" cy="19" r="4" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Stitching curves */}
      <Path d="M4.5 17C5 17.5 5 18.5 4.5 19C4 19.5 4 20.5 4.5 21" stroke={color} strokeWidth={1} fill="none" />
      <Path d="M9.5 17C9 17.5 9 18.5 9.5 19C10 19.5 10 20.5 9.5 21" stroke={color} strokeWidth={1} fill="none" />
    </Svg>
  );
}

function BasketballIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball outline */}
      <SvgCircle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Vertical line */}
      <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={1.5} />
      {/* Horizontal line */}
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={1.5} />
      {/* Left curve */}
      <Path d="M7 2.5C7 2.5 4 6 4 12C4 18 7 21.5 7 21.5" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Right curve */}
      <Path d="M17 2.5C17 2.5 20 6 20 12C20 18 17 21.5 17 21.5" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function SoccerIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ball outline */}
      <SvgCircle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Center pentagon - filled */}
      <Path
        d="M12 7L15.5 9.5L14 14H10L8.5 9.5L12 7Z"
        stroke={color}
        strokeWidth={1.5}
        fill={color}
      />
      {/* Top pentagon */}
      <Path d="M12 7L12 2" stroke={color} strokeWidth={1.5} />
      <Path d="M9 3L12 2L15 3" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Top right */}
      <Path d="M15.5 9.5L20 7" stroke={color} strokeWidth={1.5} />
      <Path d="M18 4L20 7L21 10" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Bottom right */}
      <Path d="M14 14L17 18" stroke={color} strokeWidth={1.5} />
      <Path d="M20 15L17 18L15 21" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Bottom left */}
      <Path d="M10 14L7 18" stroke={color} strokeWidth={1.5} />
      <Path d="M4 15L7 18L9 21" stroke={color} strokeWidth={1.5} fill="none" />
      {/* Top left */}
      <Path d="M8.5 9.5L4 7" stroke={color} strokeWidth={1.5} />
      <Path d="M6 4L4 7L3 10" stroke={color} strokeWidth={1.5} fill="none" />
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
                  <Crown size={10} color="#f59e0b" />
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
  const players = useTeamStore((s) => s.players);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const setTeamName = useTeamStore((s) => s.setTeamName);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const isAdmin = useTeamStore((s) => s.isAdmin);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isJerseyModalVisible, setIsJerseyModalVisible] = useState(false);

  // Player edit form
  const [editPlayerName, setEditPlayerName] = useState('');

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
    setIsPlayerModalVisible(true);
  };

  const handleSavePlayerName = () => {
    if (!selectedPlayer || !editPlayerName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updatePlayer(selectedPlayer.id, { name: editPlayerName.trim() });
    setSelectedPlayer({ ...selectedPlayer, name: editPlayerName.trim() });
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTeamSettings({ sport });
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
            <View className="flex-row items-center mb-3">
              <UserCog size={16} color="#67e8f9" />
              <Text className="text-cyan-400 font-semibold ml-2">
                Manage Players ({players.length})
              </Text>
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
                  <Text className="text-slate-400 mt-2">#{selectedPlayer.number}</Text>
                </View>

                {/* Name Edit */}
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Player Name
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      value={editPlayerName}
                      onChangeText={setEditPlayerName}
                      placeholder="Enter player name"
                      placeholderTextColor="#64748b"
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white flex-1"
                      onBlur={handleSavePlayerName}
                      onSubmitEditing={handleSavePlayerName}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* Contact Info (visible to admins) */}
                <View className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Contact Information
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <Mail size={16} color="#67e8f9" />
                    <Text className="text-white ml-3">
                      {selectedPlayer.email || 'No email set'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Phone size={16} color="#67e8f9" />
                    <Text className="text-white ml-3">
                      {selectedPlayer.phone || 'No phone set'}
                    </Text>
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
                            {role === 'captain' && <Crown size={16} color={isSelected ? '#f59e0b' : '#64748b'} />}
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
    </View>
  );
}
