import { View, Text, ScrollView, Pressable, TextInput, Modal, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Users,
  Plus,
  X,
  Shield,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTeamStore, Player, SPORT_POSITIONS, SPORT_POSITION_NAMES, PlayerRole, PlayerStatus, Sport, HockeyStats, HockeyGoalieStats, BaseballStats, BaseballPitcherStats, BasketballStats, SoccerStats, SoccerGoalieStats, PlayerStats, getPlayerPositions, getPrimaryPosition } from '@/lib/store';
import { cn } from '@/lib/cn';
import { formatPhoneInput, formatPhoneNumber, unformatPhone } from '@/lib/phone';

// Check if player is a goalie
function isGoalie(position: string): boolean {
  return position === 'G' || position === 'GK';
}

// Check if player is a pitcher
function isPitcher(position: string): boolean {
  return position === 'P';
}

// Format name as "F. LastName"
function formatName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return `${firstName.charAt(0)}. ${lastName}`;
}

// Get stat column headers based on sport
function getStatHeaders(sport: Sport): string[] {
  switch (sport) {
    case 'hockey':
      return ['GP', 'G', 'A', 'P', 'PIM', '+/-'];
    case 'baseball':
      return ['GP', 'AB', 'H', 'HR', 'RBI', 'K', 'BA'];
    case 'basketball':
      return ['GP', 'PTS', 'PPG', 'REB', 'AST', 'STL', 'BLK'];
    case 'soccer':
      return ['GP', 'G', 'A', 'YC'];
    default:
      return ['GP', 'G', 'A', 'P', 'PIM', '+/-'];
  }
}

// Get goalie stat headers (includes GAA for both hockey and soccer)
function getGoalieHeaders(sport: Sport): string[] {
  // Soccer uses W-L-D (Draws), hockey uses W-L-T (Ties)
  const recordHeader = sport === 'soccer' ? 'W-L-D' : 'W-L-T';
  return ['GP', recordHeader, 'MP', 'GAA', 'SA', 'SV', 'SV%'];
}

// Get pitcher stat headers
function getPitcherHeaders(): string[] {
  return ['GS', 'W-L', 'IP', 'CG', 'SO', 'K', 'BB', 'HR', 'ERA'];
}

// Get stat values based on sport
// Pass 'batter' as position to force batting stats for a pitcher who also plays field positions
function getStatValues(sport: Sport, stats: PlayerStats | undefined, position: string): (number | string)[] {
  const playerIsGoalie = isGoalie(position);
  const playerIsPitcher = isPitcher(position);
  const forceBatterStats = position === 'batter'; // Special case for pitcher/position players

  if (!stats) {
    if (playerIsGoalie && (sport === 'hockey' || sport === 'soccer')) {
      return [0, '0-0-0', 0, '0.00', 0, 0, '.000'];
    }
    if (playerIsPitcher && sport === 'baseball') {
      return [0, '0-0', 0, 0, 0, 0, 0, 0, '0.00'];
    }
    if (sport === 'hockey') return [0, 0, 0, 0, 0, 0];
    if (sport === 'baseball') return [0, 0, 0, 0, 0, 0, '.000'];
    if (sport === 'basketball') return [0, 0, '0.0', 0, 0, 0, 0];
    if (sport === 'soccer') return [0, 0, 0, 0];
    return [0, 0, 0];
  }

  // Handle goalie stats for hockey/soccer
  if (playerIsGoalie && (sport === 'hockey' || sport === 'soccer')) {
    const s = stats as HockeyGoalieStats | SoccerGoalieStats;
    const record = `${s.wins ?? 0}-${s.losses ?? 0}-${s.ties ?? 0}`;
    const savePercentage = s.shotsAgainst > 0
      ? (s.saves / s.shotsAgainst).toFixed(3)
      : '.000';
    const mp = s.minutesPlayed ?? 0;

    // Hockey GAA = (Goals Against x 60) / Minutes Played
    // Soccer GAA = (Goals Against / Minutes Played) x 90
    let gaa: string;
    if (sport === 'hockey') {
      gaa = mp > 0 ? ((s.goalsAgainst ?? 0) * 60 / mp).toFixed(2) : '0.00';
    } else {
      gaa = mp > 0 ? ((s.goalsAgainst ?? 0) / mp * 90).toFixed(2) : '0.00';
    }

    return [s.games ?? 0, record, mp, gaa, s.shotsAgainst ?? 0, s.saves ?? 0, savePercentage];
  }

  // Handle pitcher stats for baseball (but not if we're forcing batter stats)
  if (playerIsPitcher && sport === 'baseball' && !forceBatterStats) {
    const s = stats as BaseballPitcherStats;
    const record = `${s.wins ?? 0}-${s.losses ?? 0}`;
    const ip = s.innings ?? 0;
    // ERA = (Earned Runs / Innings Pitched) x 9
    const era = ip > 0 ? ((s.earnedRuns ?? 0) / ip * 9).toFixed(2) : '0.00';
    return [s.starts ?? 0, record, ip, s.completeGames ?? 0, s.shutouts ?? 0, s.strikeouts ?? 0, s.walks ?? 0, s.homeRuns ?? 0, era];
  }

  switch (sport) {
    case 'hockey': {
      const s = stats as HockeyStats;
      const points = (s.goals ?? 0) + (s.assists ?? 0);
      const plusMinus = s.plusMinus ?? 0;
      const plusMinusStr = plusMinus > 0 ? `+${plusMinus}` : `${plusMinus}`;
      return [s.gamesPlayed ?? 0, s.goals ?? 0, s.assists ?? 0, points, s.pim ?? 0, plusMinusStr];
    }
    case 'baseball': {
      // For pitcher/position players, stats object may be BaseballPitcherStats
      // but we need to read the batting fields which are stored separately
      const s = stats as BaseballStats;
      const atBats = s.atBats ?? 0;
      const hits = s.hits ?? 0;
      const ba = atBats > 0 ? (hits / atBats).toFixed(3) : '.000';
      return [s.gamesPlayed ?? 0, atBats, hits, s.homeRuns ?? 0, s.rbi ?? 0, s.strikeouts ?? 0, ba];
    }
    case 'basketball': {
      const s = stats as BasketballStats;
      const gp = s.gamesPlayed ?? 0;
      const ppg = gp > 0 ? ((s.points ?? 0) / gp).toFixed(1) : '0.0';
      return [gp, s.points ?? 0, ppg, s.rebounds ?? 0, s.assists ?? 0, s.steals ?? 0, s.blocks ?? 0];
    }
    case 'soccer': {
      const s = stats as SoccerStats;
      return [s.gamesPlayed ?? 0, s.goals ?? 0, s.assists ?? 0, s.yellowCards ?? 0];
    }
    default:
      return [0, 0, 0];
  }
}

interface PlayerCardProps {
  player: Player;
  index: number;
  onPress: () => void;
  showStats?: boolean;
}

function PlayerCard({ player, index, onPress, showStats = true }: PlayerCardProps) {
  const sport = useTeamStore((s) => s.teamSettings.sport);
  const playerPositions = getPlayerPositions(player);
  const primaryPosition = getPrimaryPosition(player);

  // Format position display - show all positions joined by "/"
  const positionDisplay = playerPositions.length > 1
    ? playerPositions.join('/')
    : SPORT_POSITION_NAMES[sport][primaryPosition] || primaryPosition;

  // Check if player has both pitcher and non-pitcher positions (baseball only)
  const hasPitcherPosition = sport === 'baseball' && playerPositions.some(pos => isPitcher(pos));
  const hasNonPitcherPosition = sport === 'baseball' && playerPositions.some(pos => !isPitcher(pos));
  const showBothBaseballStats = hasPitcherPosition && hasNonPitcherPosition;

  // Check if player has both goalie and non-goalie positions (hockey/soccer)
  const hasGoaliePosition = (sport === 'hockey' || sport === 'soccer') && playerPositions.some(pos => isGoalie(pos));
  const hasNonGoaliePosition = (sport === 'hockey' || sport === 'soccer') && playerPositions.some(pos => !isGoalie(pos));
  const showBothGoalieStats = hasGoaliePosition && hasNonGoaliePosition;

  // Get stat headers and values for this player (based on primary position)
  const playerIsGoalieOnly = isGoalie(primaryPosition) && !hasNonGoaliePosition;
  const playerIsPitcherOnly = isPitcher(primaryPosition) && !hasNonPitcherPosition;

  // For players with both positions, always show skater/batter stats first
  let headers: string[];
  let statValues: (number | string)[];

  if (showBothGoalieStats) {
    // Show skater stats as primary for dual position players
    headers = getStatHeaders(sport);
    statValues = getStatValues(sport, player.stats, 'C'); // Use non-goalie position
  } else if (showBothBaseballStats) {
    // Show batting stats as primary for dual position players
    headers = getStatHeaders(sport);
    statValues = getStatValues(sport, player.stats, 'batter');
  } else if (playerIsGoalieOnly && (sport === 'hockey' || sport === 'soccer')) {
    headers = getGoalieHeaders(sport);
    statValues = getStatValues(sport, player.goalieStats, primaryPosition);
  } else if (playerIsPitcherOnly && sport === 'baseball') {
    headers = getPitcherHeaders();
    statValues = getStatValues(sport, player.pitcherStats, primaryPosition);
  } else {
    headers = getStatHeaders(sport);
    statValues = getStatValues(sport, player.stats, primaryPosition);
  }

  // Get goalie stats if player has both goalie and non-goalie positions
  const goalieHeaders = showBothGoalieStats ? getGoalieHeaders(sport) : [];
  const goalieStatValues = showBothGoalieStats ? getStatValues(sport, player.goalieStats, sport === 'hockey' ? 'G' : 'GK') : [];

  // Get pitching stats if player has both pitcher and non-pitcher positions
  const pitchingHeaders = showBothBaseballStats ? getPitcherHeaders() : [];
  const pitchingStatValues = showBothBaseballStats ? getStatValues(sport, player.pitcherStats, 'P') : [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-slate-800/80 rounded-2xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
      >
        <View className="flex-row items-center">
          <View className="relative">
            <Image
              source={{ uri: player.avatar }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              contentFit="cover"
            />
            <View className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-bold">#{player.number}</Text>
            </View>
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-semibold">{player.name}</Text>
              {player.roles?.includes('captain') && (
                <View className="ml-2 bg-amber-500/20 rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-amber-500 text-sm font-black">C</Text>
                </View>
              )}
              {player.roles?.includes('admin') && (
                <View className="ml-2 bg-purple-500/20 rounded-full p-1">
                  <Shield size={14} color="#a78bfa" />
                </View>
              )}
            </View>
            <Text className="text-slate-400 text-sm">{positionDisplay}</Text>
          </View>

          {/* Status Badge */}
          <View className={cn(
            'px-2 py-1 rounded-full',
            player.status === 'active' ? 'bg-green-500/20' : 'bg-slate-600/50'
          )}>
            <Text className={cn(
              'text-xs font-medium',
              player.status === 'active' ? 'text-green-400' : 'text-slate-400'
            )}>
              {player.status === 'active' ? 'Active' : 'Reserve'}
            </Text>
          </View>
        </View>

        {/* Player Stats */}
        {showStats && (
          <View className="mt-3 pt-3 border-t border-slate-700/50">
            {/* Label for skater stats when showing both */}
            {showBothGoalieStats && (
              <Text className="text-cyan-400 text-xs font-medium mb-2">Skater</Text>
            )}
            {/* Label for batting stats when showing both */}
            {showBothBaseballStats && (
              <Text className="text-cyan-400 text-xs font-medium mb-2">Batting</Text>
            )}
            <View className="flex-row justify-between">
              {headers.map((header, i) => (
                <View key={header} className="items-center flex-1">
                  <Text className="text-slate-500 text-xs mb-1">{header}</Text>
                  <Text className="text-white text-sm font-medium">{statValues[i]}</Text>
                </View>
              ))}
            </View>

            {/* Goalie stats row for goalie/skater players */}
            {showBothGoalieStats && (
              <View className="mt-3 pt-3 border-t border-slate-700/30">
                <Text className="text-cyan-400 text-xs font-medium mb-2">Goalie</Text>
                <View className="flex-row justify-between">
                  {goalieHeaders.map((header, i) => (
                    <View key={`goalie-${header}`} className="items-center flex-1">
                      <Text className="text-slate-500 text-xs mb-1">{header}</Text>
                      <Text className="text-white text-sm font-medium">{goalieStatValues[i]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pitching stats row for pitcher/position players */}
            {showBothBaseballStats && (
              <View className="mt-3 pt-3 border-t border-slate-700/30">
                <Text className="text-cyan-400 text-xs font-medium mb-2">Pitching</Text>
                <View className="flex-row justify-between">
                  {pitchingHeaders.map((header, i) => (
                    <View key={`pitching-${header}`} className="items-center flex-1">
                      <Text className="text-slate-500 text-xs mb-1">{header}</Text>
                      <Text className="text-white text-sm font-medium">{pitchingStatValues[i]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function RosterScreen() {
  const players = useTeamStore((s) => s.players);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const showTeamStats = teamSettings.showTeamStats !== false;

  const positions = SPORT_POSITIONS[teamSettings.sport];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([positions[0]]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [playerRoles, setPlayerRoles] = useState<PlayerRole[]>([]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('active');

  // Invite modal state
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [newlyCreatedPlayer, setNewlyCreatedPlayer] = useState<Player | null>(null);

  const resetForm = () => {
    setName('');
    setNumber('');
    setSelectedPositions([positions[0]]);
    setPhone('');
    setEmail('');
    setPlayerRoles([]);
    setPlayerStatus('active');
    setEditingPlayer(null);
  };

  const openAddModal = () => {
    if (!canManageTeam()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (player: Player) => {
    if (!canManageTeam()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setEditingPlayer(player);
    setName(player.name);
    setNumber(player.number);
    setSelectedPositions(getPlayerPositions(player));
    setPhone(formatPhoneNumber(player.phone));
    setEmail(player.email || '');
    setPlayerRoles(player.roles || []);
    setPlayerStatus(player.status || 'active');
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim() || !number.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Store raw phone digits
    const rawPhone = unformatPhone(phone);

    if (editingPlayer) {
      const updates: Partial<Player> = {
        name: name.trim(),
        number: number.trim(),
        position: selectedPositions[0],
        positions: selectedPositions,
        phone: rawPhone || undefined,
        email: email.trim() || undefined,
      };

      // Only admins can change roles and status
      if (isAdmin()) {
        updates.roles = playerRoles;
        updates.status = playerStatus;
      }

      updatePlayer(editingPlayer.id, updates);
      setIsModalVisible(false);
      resetForm();
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        number: number.trim(),
        position: selectedPositions[0],
        positions: selectedPositions,
        phone: rawPhone || undefined,
        email: email.trim() || undefined,
        avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
        roles: [],
        status: 'active',
      };
      addPlayer(newPlayer);
      setIsModalVisible(false);
      resetForm();

      // Show invite modal if player has phone or email
      if (rawPhone || email.trim()) {
        setNewlyCreatedPlayer({ ...newPlayer, phone: rawPhone || undefined, email: email.trim() || undefined });
        setIsInviteModalVisible(true);
      }
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

  // Group players by position type based on sport
  const getPositionGroups = () => {
    const sport = teamSettings.sport;

    if (sport === 'hockey') {
      return [
        { title: 'Forwards', players: players.filter((p) => ['C', 'LW', 'RW'].includes(p.position)) },
        { title: 'Defense', players: players.filter((p) => ['LD', 'RD'].includes(p.position)) },
        { title: 'Goalies', players: players.filter((p) => p.position === 'G') },
      ];
    } else if (sport === 'baseball') {
      return [
        { title: 'Battery', players: players.filter((p) => ['P', 'C'].includes(p.position)) },
        { title: 'Infield', players: players.filter((p) => ['1B', '2B', '3B', 'SS'].includes(p.position)) },
        { title: 'Outfield', players: players.filter((p) => ['LF', 'RF', 'CF'].includes(p.position)) },
      ];
    } else if (sport === 'basketball') {
      return [
        { title: 'Guards', players: players.filter((p) => ['PG', 'SG'].includes(p.position)) },
        { title: 'Forwards', players: players.filter((p) => ['SF', 'PF'].includes(p.position)) },
        { title: 'Centers', players: players.filter((p) => p.position === 'C') },
      ];
    } else {
      return [
        { title: 'Goalkeepers', players: players.filter((p) => p.position === 'GK') },
        { title: 'Defenders', players: players.filter((p) => p.position === 'DEF') },
        { title: 'Midfielders', players: players.filter((p) => p.position === 'MID') },
        { title: 'Forwards', players: players.filter((p) => p.position === 'FWD') },
      ];
    }
  };

  const positionGroups = getPositionGroups();

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
          className="flex-row items-center justify-between px-5 pt-2 pb-4"
        >
          <View>
            <View className="flex-row items-center">
              <Users size={20} color="#67e8f9" />
              <Text className="text-cyan-400 text-sm font-medium ml-2">Roster</Text>
            </View>
            <Text className="text-white text-3xl font-bold">{teamName} Roster</Text>
          </View>
          {canManageTeam() && (
            <Pressable
              onPress={openAddModal}
              className="bg-cyan-500 w-10 h-10 rounded-full items-center justify-center active:bg-cyan-600"
            >
              <Plus size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {positionGroups.map((group) => {
            if (group.players.length === 0) return null;

            return (
              <View key={group.title} className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Text className="text-cyan-400 font-semibold">
                    {group.title} ({group.players.length})
                  </Text>
                </View>
                {group.players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    index={index}
                    onPress={() => openEditModal(player)}
                    showStats={showTeamStats}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Add/Edit Player Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">
                {editingPlayer ? 'Edit Player' : 'Add Player'}
              </Text>
              <Pressable onPress={handleSave}>
                <Text className="text-cyan-400 font-semibold">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* Admin Note for Stats */}
              {editingPlayer && isAdmin() && showTeamStats && (
                <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-5">
                  <Text className="text-purple-400 text-sm">
                    To update player stats, go to Team Stats in the Admin panel.
                  </Text>
                </View>
              )}

              {/* Name Input */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Player Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Number Input */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Jersey Number</Text>
                <TextInput
                  value={number}
                  onChangeText={setNumber}
                  placeholder="00"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  maxLength={2}
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Position Selector - Multiple Selection */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-1">Positions</Text>
                <Text className="text-slate-500 text-xs mb-2">Tap to select multiple positions</Text>
                <View className="flex-row flex-wrap">
                  {positions.map((pos) => {
                    const isSelected = selectedPositions.includes(pos);
                    return (
                      <Pressable
                        key={pos}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (isSelected) {
                            // Don't allow deselecting if it's the only position
                            if (selectedPositions.length > 1) {
                              setSelectedPositions(selectedPositions.filter(p => p !== pos));
                            }
                          } else {
                            setSelectedPositions([...selectedPositions, pos]);
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

              {/* Phone Input - Admin Only */}
              {isAdmin() && (
                <View className="mb-5">
                  <View className="flex-row items-center mb-2">
                    <Phone size={14} color="#a78bfa" />
                    <Text className="text-slate-400 text-sm ml-2">Phone (Admin Only)</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(text) => setPhone(formatPhoneInput(text))}
                    placeholder="(555)123-4567"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  />
                </View>
              )}

              {/* Email Input - Admin Only */}
              {isAdmin() && (
                <View className="mb-5">
                  <View className="flex-row items-center mb-2">
                    <Mail size={14} color="#a78bfa" />
                    <Text className="text-slate-400 text-sm ml-2">Email (Admin Only)</Text>
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="player@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  />
                </View>
              )}

              {/* Status Selector - Admin Only, Edit Mode Only */}
              {isAdmin() && editingPlayer && (
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Player Status</Text>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPlayerStatus('active');
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                        playerStatus === 'active' ? 'bg-green-500' : 'bg-slate-800'
                      )}
                    >
                      {playerStatus === 'active' && <Check size={16} color="white" className="mr-2" />}
                      <Text
                        className={cn(
                          'font-semibold ml-1',
                          playerStatus === 'active' ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Active
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPlayerStatus('reserve');
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                        playerStatus === 'reserve' ? 'bg-slate-600' : 'bg-slate-800'
                      )}
                    >
                      {playerStatus === 'reserve' && <Check size={16} color="white" className="mr-2" />}
                      <Text
                        className={cn(
                          'font-semibold ml-1',
                          playerStatus === 'reserve' ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Reserve
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Role Selector - Admin Only, Edit Mode Only */}
              {isAdmin() && editingPlayer && (
                <View className="mb-5">
                  <Text className="text-slate-400 text-sm mb-2">Player Roles</Text>
                  <View className="flex-row">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (playerRoles.includes('captain')) {
                          setPlayerRoles(playerRoles.filter((r) => r !== 'captain'));
                        } else {
                          setPlayerRoles([...playerRoles, 'captain']);
                        }
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center',
                        playerRoles.includes('captain') ? 'bg-amber-500' : 'bg-slate-800'
                      )}
                    >
                      <View className="w-5 h-5 rounded-full bg-amber-500/30 items-center justify-center">
                        <Text className={cn(
                          'text-xs font-black',
                          playerRoles.includes('captain') ? 'text-white' : 'text-amber-500'
                        )}>C</Text>
                      </View>
                      <Text
                        className={cn(
                          'font-semibold ml-2',
                          playerRoles.includes('captain') ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        Captain
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (playerRoles.includes('admin')) {
                          setPlayerRoles(playerRoles.filter((r) => r !== 'admin'));
                        } else {
                          setPlayerRoles([...playerRoles, 'admin']);
                        }
                      }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                        playerRoles.includes('admin') ? 'bg-purple-500' : 'bg-slate-800'
                      )}
                    >
                      <Shield size={16} color={playerRoles.includes('admin') ? 'white' : '#a78bfa'} />
                      <Text
                        className={cn(
                          'font-semibold ml-2',
                          playerRoles.includes('admin') ? 'text-white' : 'text-slate-400'
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
              )}
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
            <View className="space-y-3">
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
    </View>
  );
}
