import { View, Text, ScrollView, Pressable, TextInput, Modal, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Users,
  X,
  Shield,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Check,
  Cross,
  UserPlus,
  UserCog,
  User,
  UserMinus,
  Heart,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useTeamStore, Player, SPORT_POSITIONS, SPORT_POSITION_NAMES, PlayerRole, PlayerStatus, Sport, HockeyStats, HockeyGoalieStats, BaseballStats, BaseballPitcherStats, BasketballStats, SoccerStats, SoccerGoalieStats, LacrosseStats, LacrosseGoalieStats, PlayerStats, getPlayerPositions, getPrimaryPosition, getPlayerName, StatusDuration, DurationUnit } from '@/lib/store';
import { cn } from '@/lib/cn';
import { useResponsive } from '@/lib/useResponsive';
import { formatPhoneInput, formatPhoneNumber, unformatPhone } from '@/lib/phone';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { ParentChildIcon } from '@/components/ParentChildIcon';

// Format status duration for display
function formatStatusDuration(duration: StatusDuration | undefined): string {
  if (!duration) return '';
  if (duration.unit === 'remainder_of_season') {
    return 'Rest of season';
  }
  const value = duration.value || 0;
  if (duration.unit === 'days') {
    return `${value} ${value === 1 ? 'day' : 'days'}`;
  }
  if (duration.unit === 'weeks') {
    return `${value} ${value === 1 ? 'week' : 'weeks'}`;
  }
  if (duration.unit === 'games') {
    return `${value} ${value === 1 ? 'game' : 'games'}`;
  }
  return '';
}

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
    case 'softball':
      return ['GP', 'AB', 'H', 'HR', 'RBI', 'K', 'BA'];
    case 'basketball':
      return ['GP', 'PTS', 'PPG', 'REB', 'AST', 'STL', 'BLK'];
    case 'soccer':
      return ['GP', 'G', 'A', 'YC'];
    case 'lacrosse':
      return ['GP', 'G', 'A', 'P', 'GB', 'CT'];
    default:
      return ['GP', 'G', 'A', 'P', 'PIM', '+/-'];
  }
}

// Get goalie stat headers (includes GAA for both hockey and soccer)
function getGoalieHeaders(sport: Sport): string[] {
  // Soccer uses W-L-D (Draws), hockey uses W-L-T (Ties)
  if (sport === 'lacrosse') {
    return ['GP', 'W-L', 'GAA', 'SA', 'SV', 'SV%', 'GB'];
  }
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
    if (playerIsGoalie && sport === 'lacrosse') {
      return [0, '0-0', '0.00', 0, 0, '.000', 0];
    }
    if (playerIsGoalie && (sport === 'hockey' || sport === 'soccer')) {
      return [0, '0-0-0', 0, '0.00', 0, 0, '.000'];
    }
    if (playerIsPitcher && (sport === 'baseball' || sport === 'softball')) {
      return [0, '0-0', 0, 0, 0, 0, 0, 0, '0.00'];
    }
    if (sport === 'hockey') return [0, 0, 0, 0, 0, 0];
    if (sport === 'baseball' || sport === 'softball') return [0, 0, 0, 0, 0, 0, '.000'];
    if (sport === 'basketball') return [0, 0, '0.0', 0, 0, 0, 0];
    if (sport === 'soccer') return [0, 0, 0, 0];
    if (sport === 'lacrosse') return [0, 0, 0, 0, 0, 0];
    return [0, 0, 0];
  }

  // Handle lacrosse goalie stats
  if (playerIsGoalie && sport === 'lacrosse') {
    const s = stats as LacrosseGoalieStats;
    const record = `${s.wins ?? 0}-${s.losses ?? 0}`;
    const savePercentage = s.shotsAgainst > 0
      ? (s.saves / s.shotsAgainst).toFixed(3)
      : '.000';
    const mp = s.minutesPlayed ?? 0;
    // Lacrosse GAA = (Goals Against / Minutes Played) x 60
    const gaa = mp > 0 ? ((s.goalsAgainst ?? 0) / mp * 60).toFixed(2) : '0.00';
    return [s.games ?? 0, record, gaa, s.shotsAgainst ?? 0, s.saves ?? 0, savePercentage, s.groundBalls ?? 0];
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

  // Handle pitcher stats for baseball/softball (but not if we're forcing batter stats)
  if (playerIsPitcher && (sport === 'baseball' || sport === 'softball') && !forceBatterStats) {
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
    case 'baseball':
    case 'softball': {
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
    case 'lacrosse': {
      const s = stats as LacrosseStats;
      const points = (s.goals ?? 0) + (s.assists ?? 0);
      return [s.gamesPlayed ?? 0, s.goals ?? 0, s.assists ?? 0, points, s.groundBalls ?? 0, s.causedTurnovers ?? 0];
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
  isCurrentUser?: boolean;
  canEditOwnStats?: boolean;
}

function PlayerCard({ player, index, onPress, showStats = true, isCurrentUser = false, canEditOwnStats = false }: PlayerCardProps) {
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
        className="bg-slate-800/80 rounded-2xl p-4 mb-2.5 border border-slate-700/50 active:bg-slate-700/80"
      >
        <View className="flex-row items-center">
          <View className="relative">
            <PlayerAvatar player={player} size={56} />
            <View className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-bold">#{player.number}</Text>
            </View>
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-semibold">{getPlayerName(player)}</Text>
              {isCurrentUser && (
                <View className="ml-1.5 bg-cyan-500/20 rounded-full px-1.5 py-0.5">
                  <Text className="text-cyan-400 text-[10px] font-semibold">You</Text>
                </View>
              )}
              {player.roles?.includes('captain') && (
                <View className="ml-1.5 bg-amber-500/20 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-amber-500 text-xs font-black">C</Text>
                </View>
              )}
              {player.roles?.includes('admin') && (
                <View className="ml-1.5 bg-purple-500/20 rounded-full w-5 h-5 items-center justify-center">
                  <Shield size={12} color="#a78bfa" strokeWidth={2.5} />
                </View>
              )}
            </View>
            <View className="flex-row items-center">
              <Text className="text-slate-300 text-sm">{positionDisplay}</Text>
              {/* Injured indicator with end date */}
              {player.isInjured && (
                <View className="flex-row items-center ml-2">
                  <Text className="text-red-400 font-black text-sm">+</Text>
                  {player.statusEndDate ? (
                    <Text className="text-red-400/80 text-xs ml-0.5">
                      (until {format(parseISO(player.statusEndDate), 'MMM d')})
                    </Text>
                  ) : player.injuryDuration ? (
                    <Text className="text-red-400/80 text-xs ml-0.5">
                      ({formatStatusDuration(player.injuryDuration)})
                    </Text>
                  ) : null}
                </View>
              )}
              {/* Suspended indicator with end date */}
              {player.isSuspended && (
                <View className="flex-row items-center ml-2">
                  <Text className="text-red-400 font-bold text-xs">SUS</Text>
                  {player.statusEndDate ? (
                    <Text className="text-red-400/80 text-xs ml-0.5">
                      (until {format(parseISO(player.statusEndDate), 'MMM d')})
                    </Text>
                  ) : player.suspensionDuration ? (
                    <Text className="text-red-400/80 text-xs ml-0.5">
                      ({formatStatusDuration(player.suspensionDuration)})
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
            {/* Show hint for self-stats editing */}
            {isCurrentUser && canEditOwnStats && showStats && (
              <Text className="text-cyan-400/70 text-xs mt-1">Tap to edit your stats</Text>
            )}
          </View>

          {/* Status Badge */}
          <View className={cn(
            'px-2.5 py-1 rounded-full',
            player.status === 'active' ? 'bg-green-500/15' : 'bg-slate-600/50'
          )}>
            <Text className={cn(
              'text-xs font-semibold',
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
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const teamName = useTeamStore((s) => s.teamName);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const showTeamStats = teamSettings.showTeamStats !== false;
  const allowPlayerSelfStats = teamSettings.allowPlayerSelfStats === true;

  // Responsive layout for iPad
  const { isTablet, columns, containerPadding } = useResponsive();

  // Count how many admins exist
  const adminCount = players.filter((p) => p.roles?.includes('admin')).length;

  const positions = SPORT_POSITIONS[teamSettings.sport];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [number, setNumber] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [playerRoles, setPlayerRoles] = useState<PlayerRole[]>([]);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('active');
  const [memberRole, setMemberRole] = useState<'player' | 'reserve' | 'coach' | 'parent'>('player');
  const [isInjured, setIsInjured] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [injuryDuration, setInjuryDuration] = useState<StatusDuration | undefined>(undefined);
  const [suspensionDuration, setSuspensionDuration] = useState<StatusDuration | undefined>(undefined);
  const [statusEndDate, setStatusEndDate] = useState<string>(''); // YYYY-MM-DD format
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Invite modal state
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [newlyCreatedPlayer, setNewlyCreatedPlayer] = useState<Player | null>(null);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setNumber('');
    setSelectedPositions([]);
    setPhone('');
    setEmail('');
    setPlayerRoles([]);
    setPlayerStatus('active');
    setMemberRole('player');
    setIsInjured(false);
    setIsSuspended(false);
    setInjuryDuration(undefined);
    setSuspensionDuration(undefined);
    setStatusEndDate('');
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
    setFirstName(player.firstName);
    setLastName(player.lastName);
    setNumber(player.number);
    // Filter out 'Coach' from positions - keep empty if coach
    const playerPositions = getPlayerPositions(player).filter(p => p && p !== 'Coach');
    setSelectedPositions(playerPositions);
    setPhone(formatPhoneNumber(player.phone));
    setEmail(player.email || '');
    setPlayerRoles(player.roles || []);
    setPlayerStatus(player.status || 'active');
    setIsInjured(player.isInjured || false);
    setIsSuspended(player.isSuspended || false);
    setInjuryDuration(player.injuryDuration);
    setSuspensionDuration(player.suspensionDuration);
    setStatusEndDate(player.statusEndDate || '');
    // Determine member role from player data
    if (player.roles?.includes('coach') || player.position === 'Coach') {
      setMemberRole('coach');
    } else if (player.roles?.includes('parent')) {
      setMemberRole('parent');
    } else if (player.status === 'reserve') {
      setMemberRole('reserve');
    } else {
      setMemberRole('player');
    }
    setIsModalVisible(true);
  };

  // Handle player card press - either edit player or go to stats
  const handlePlayerPress = (player: Player) => {
    const isOwnProfile = player.id === currentPlayerId;
    const canEdit = canManageTeam();

    // If admin/captain, open edit modal
    if (canEdit) {
      openEditModal(player);
      return;
    }

    // If it's their own profile and self-stats is enabled, go to team stats
    if (isOwnProfile && allowPlayerSelfStats && showTeamStats) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/team-stats');
      return;
    }

    // Otherwise, no action (or could show a read-only profile in the future)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    const isCoachRole = memberRole === 'coach';
    const isParentRole = memberRole === 'parent';

    // Only require jersey number if not a coach or parent
    if (!firstName.trim() || !lastName.trim() || (!isCoachRole && !isParentRole && !number.trim())) return;

    // Require at least one position if not a coach or parent
    if (!isCoachRole && !isParentRole && selectedPositions.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one position.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Store raw phone digits and email before any state changes
    const rawPhone = unformatPhone(phone);
    const rawEmail = email.trim();

    // Build roles array based on memberRole
    const roles: PlayerRole[] = playerRoles.filter(r => r !== 'coach' && r !== 'parent');
    if (isCoachRole) {
      roles.push('coach');
    }
    if (isParentRole) {
      roles.push('parent');
    }

    // Determine status based on memberRole
    const effectiveStatus: PlayerStatus = memberRole === 'reserve' ? 'reserve' : 'active';

    if (editingPlayer) {
      const updates: Partial<Player> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        number: (isCoachRole || isParentRole) ? '' : number.trim(),
        position: isCoachRole ? 'Coach' : (isParentRole ? 'Parent' : selectedPositions[0]),
        positions: isCoachRole ? ['Coach'] : (isParentRole ? ['Parent'] : selectedPositions),
        phone: rawPhone || undefined,
        email: rawEmail || undefined,
      };

      // Only admins can change roles and status
      if (isAdmin()) {
        updates.roles = roles;
        updates.status = effectiveStatus;
        updates.isInjured = isInjured;
        updates.isSuspended = isSuspended;
        updates.injuryDuration = isInjured ? injuryDuration : undefined;
        updates.suspensionDuration = isSuspended ? suspensionDuration : undefined;
        // Only save end date if injured or suspended
        updates.statusEndDate = (isInjured || isSuspended) ? (statusEndDate || undefined) : undefined;
      }

      console.log('Saving player updates:', { isInjured, isSuspended, memberRole, updates });
      updatePlayer(editingPlayer.id, updates);
      setIsModalVisible(false);
      resetForm();
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        number: (isCoachRole || isParentRole) ? '' : number.trim(),
        position: isCoachRole ? 'Coach' : (isParentRole ? 'Parent' : selectedPositions[0]),
        positions: isCoachRole ? ['Coach'] : (isParentRole ? ['Parent'] : selectedPositions),
        phone: rawPhone || undefined,
        email: rawEmail || undefined,
        roles: isAdmin() ? roles : [],
        status: isAdmin() ? effectiveStatus : 'active',
        isInjured: isAdmin() ? isInjured : false,
        isSuspended: isAdmin() ? isSuspended : false,
        statusEndDate: isAdmin() && (isInjured || isSuspended) ? (statusEndDate || undefined) : undefined,
      };
      addPlayer(newPlayer);
      setIsModalVisible(false);
      resetForm();

      // Show invite modal if player has phone or email
      console.log('Player created - rawPhone:', rawPhone, 'rawEmail:', rawEmail);
      if (rawPhone || rawEmail) {
        setNewlyCreatedPlayer({ ...newPlayer, phone: rawPhone || undefined, email: rawEmail || undefined });
        setIsInviteModalVisible(true);
      }
    }
  };

  // Placeholder for App Store URL - will be updated once app is published
  const APP_STORE_URL = 'https://apps.apple.com/app/your-app-id';

  const getInviteMessage = (method: 'sms' | 'email') => {
    const playerName = newlyCreatedPlayer ? getPlayerName(newlyCreatedPlayer) : '';
    const contactInfo = method === 'sms'
      ? newlyCreatedPlayer?.phone
        ? `\n\nLog in with your phone number: ${formatPhoneNumber(newlyCreatedPlayer.phone)}`
        : ''
      : newlyCreatedPlayer?.email
        ? `\n\nLog in with your email: ${newlyCreatedPlayer.email}`
        : '';

    return `Hey ${playerName}!\n\nYou've been added to ${teamName}! Download the app and log in using your info to view the schedule, check in for games, and stay connected with the team.\n\nDownload here: ${APP_STORE_URL}${contactInfo}\n\nYour jersey number is #${newlyCreatedPlayer?.number}\n\nSee you at the next game!`;
  };

  const handleSendTextInvite = () => {
    if (!newlyCreatedPlayer?.phone) {
      Alert.alert('No Phone Number', 'This player does not have a phone number.');
      return;
    }

    const message = encodeURIComponent(getInviteMessage('sms'));
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

  const handleSendEmailInvite = async () => {
    if (!newlyCreatedPlayer?.email) {
      Alert.alert('No Email', 'This player does not have an email address.');
      return;
    }

    const subject = `Welcome to ${teamName}!`;
    const body = getInviteMessage('email');

    try {
      // Call Supabase Edge Function to send email
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-team-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            to: [newlyCreatedPlayer.email],
            subject: subject,
            body: body,
            teamName: teamName,
          }),
        }
      );

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Email Sent', `Invite email sent to ${getPlayerName(newlyCreatedPlayer)}!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send email. Please try again later.');
      console.error('Email invite send error:', error);
    }

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
    } else if (sport === 'baseball' || sport === 'softball') {
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
    } else if (sport === 'lacrosse') {
      return [
        { title: 'Attack', players: players.filter((p) => p.position === 'A') },
        { title: 'Midfield', players: players.filter((p) => p.position === 'M') },
        { title: 'Defense', players: players.filter((p) => p.position === 'D') },
        { title: 'Goalies', players: players.filter((p) => p.position === 'G') },
      ];
    } else if (sport === 'soccer') {
      return [
        { title: 'Goalkeepers', players: players.filter((p) => p.position === 'GK') },
        { title: 'Defenders', players: players.filter((p) => p.position === 'DEF') },
        { title: 'Midfielders', players: players.filter((p) => p.position === 'MID') },
        { title: 'Forwards', players: players.filter((p) => p.position === 'FWD') },
      ];
    } else {
      // Fallback - group all players together
      return [
        { title: 'Players', players: players },
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
          className="px-5 pt-2 pb-4"
        >
          <View className="flex-row items-center">
            <Users size={20} color="#67e8f9" />
            <Text className="text-cyan-400 text-sm font-medium ml-2">Roster</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-3xl font-bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{teamName} Roster</Text>
            {canManageTeam() && (
              <Pressable
                onPress={openAddModal}
              >
                <UserPlus size={24} color="#22c55e" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: isTablet ? containerPadding : 20 }}
        >
          {positionGroups.map((group) => {
            if (group.players.length === 0) return null;

            return (
              <View key={group.title} className="mb-5">
                <View className="flex-row items-center mb-2">
                  <Text className="text-cyan-300 font-bold text-base">
                    {group.title} ({group.players.length})
                  </Text>
                </View>
                {/* Use grid layout on iPad */}
                <View className={isTablet && columns >= 2 ? 'flex-row flex-wrap' : ''} style={isTablet && columns >= 2 ? { marginHorizontal: -6 } : undefined}>
                  {group.players.map((player, index) => (
                    <View
                      key={player.id}
                      style={isTablet && columns >= 2 ? {
                        width: columns >= 3 ? '33.33%' : '50%',
                        paddingHorizontal: 6
                      } : undefined}
                    >
                      <PlayerCard
                        player={player}
                        index={index}
                        onPress={() => handlePlayerPress(player)}
                        showStats={showTeamStats}
                        isCurrentUser={player.id === currentPlayerId}
                        canEditOwnStats={allowPlayerSelfStats && !canManageTeam()}
                      />
                    </View>
                  ))}
                </View>
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
                <Text className="text-cyan-400 font-bold text-base">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              {/* First Name and Last Name Row */}
              <View className="flex-row mb-5">
                {/* First Name Input */}
                <View className="flex-1 mr-2">
                  <Text className="text-slate-300 text-sm mb-2">First Name<Text className="text-red-400 font-bold">*</Text></Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First"
                    placeholderTextColor="#64748b"
                    autoCapitalize="words"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  />
                </View>

                {/* Last Name Input */}
                <View className="flex-1 ml-2">
                  <Text className="text-slate-300 text-sm mb-2">Last Name<Text className="text-red-400 font-bold">*</Text></Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last"
                    placeholderTextColor="#64748b"
                    autoCapitalize="words"
                    className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  />
                </View>
              </View>

              {/* Jersey Number Row */}
              <View className="mb-5">
                <Text className="text-slate-300 text-sm mb-2">Jersey Number<Text className="text-red-400 font-bold">*</Text></Text>
                <TextInput
                  value={number}
                  onChangeText={setNumber}
                  placeholder="00"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  maxLength={2}
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  style={{ width: 100 }}
                />
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

              {/* Position Selector - Multiple Selection - Hidden for coaches and parents */}
              {memberRole !== 'coach' && memberRole !== 'parent' && (
                <View className="mb-5">
                  <Text className="text-slate-300 text-sm mb-1">Positions<Text className="text-red-400 font-bold">*</Text></Text>
                  <Text className="text-slate-500 text-xs mb-2">Tap to select multiple positions</Text>
                  {/* Split positions into rows for better layout */}
                  {(() => {
                    const posCount = positions.length;
                    // For 10+ positions, split into two rows
                    const splitAt = posCount <= 6 ? posCount : Math.ceil(posCount / 2);
                    const row1 = positions.slice(0, splitAt);
                    const row2 = positions.slice(splitAt);

                    const renderRow = (rowPositions: string[], isLastRow: boolean) => (
                      <View className={cn("flex-row", !isLastRow && "mb-2")} style={{ gap: 6 }}>
                        {rowPositions.map((pos) => {
                          const isSelected = selectedPositions.includes(pos);
                          return (
                            <Pressable
                              key={pos}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (isSelected) {
                                  setSelectedPositions(selectedPositions.filter(p => p !== pos));
                                } else {
                                  setSelectedPositions([...selectedPositions, pos]);
                                }
                              }}
                              className={cn(
                                'flex-1 py-2.5 rounded-xl items-center border',
                                isSelected ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800/80 border-slate-700'
                              )}
                              style={isSelected ? {
                                shadowColor: '#22d3ee',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                              } : undefined}
                            >
                              <Text
                                className={cn(
                                  'font-semibold',
                                  isSelected ? 'text-white' : 'text-slate-500'
                                )}
                              >
                                {pos}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    );

                    return (
                      <>
                        {renderRow(row1, row2.length === 0)}
                        {row2.length > 0 && renderRow(row2, true)}
                      </>
                    );
                  })()}
                  {selectedPositions.length === 0 && (
                    <Text className="text-red-400 text-xs mt-1">Please select at least one position</Text>
                  )}
                </View>
              )}

              {/* Status Selector - Admin Only (Injured/Suspended) */}
              {isAdmin() && (
                <View className="mb-5">
                  <Text className="text-slate-300 text-sm mb-2">Status</Text>

                  {/* Status container - groups Status, Duration, and End Date */}
                  <View className={cn(
                    'rounded-2xl',
                    (isInjured || isSuspended) && 'bg-slate-800/30 p-3 border border-slate-700/50'
                  )}>
                    <View className="flex-row">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsInjured(!isInjured);
                          if (isInjured) {
                            setInjuryDuration(undefined);
                          }
                        }}
                        className={cn(
                          'flex-1 py-3 px-4 rounded-xl mr-2 flex-row items-center justify-center border',
                          isInjured ? 'bg-red-500/90 border-red-400' : 'bg-slate-800 border-slate-700'
                        )}
                      >
                        <Text className={cn(
                          'text-lg font-black mr-1',
                          isInjured ? 'text-white' : 'text-red-400'
                        )}>+</Text>
                        <Text
                          className={cn(
                            'font-semibold',
                            isInjured ? 'text-white' : 'text-slate-500'
                          )}
                        >
                          Injured
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsSuspended(!isSuspended);
                          if (isSuspended) {
                            setSuspensionDuration(undefined);
                          }
                        }}
                        className={cn(
                          'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center border',
                          isSuspended ? 'bg-red-500/90 border-red-400' : 'bg-slate-800 border-slate-700'
                        )}
                      >
                        <Text
                          className={cn(
                            'font-bold mr-1',
                            isSuspended ? 'text-white' : 'text-red-400'
                          )}
                          style={{ fontSize: 12 }}
                        >
                          SUS
                        </Text>
                        <Text
                          className={cn(
                            'font-semibold',
                            isSuspended ? 'text-white' : 'text-slate-500'
                          )}
                        >
                          Suspended
                        </Text>
                      </Pressable>
                    </View>

                  {/* Injury Duration - shown when injured is selected */}
                  {isInjured && (
                    <View className="mt-3 bg-red-500/10 rounded-xl p-2.5 border border-red-500/20">
                      <Text className="text-red-400 text-sm font-medium mb-2">Injury Duration</Text>
                      <View className="flex-row items-center bg-slate-800/50 rounded-xl p-1">
                        {injuryDuration?.unit !== 'remainder_of_season' && (
                          <TextInput
                            value={injuryDuration?.value?.toString() || ''}
                            onChangeText={(text) => {
                              const num = parseInt(text) || undefined;
                              setInjuryDuration(prev => ({
                                ...prev,
                                value: num,
                                unit: prev?.unit || 'days'
                              }));
                            }}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="bg-slate-700 rounded-lg px-3 py-2 text-white text-base w-14 mr-1 text-center"
                          />
                        )}
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setInjuryDuration(prev => ({ ...prev, value: prev?.value, unit: 'days' }));
                          }}
                          className={cn(
                            'flex-1 py-2.5 px-2 rounded-lg',
                            injuryDuration?.unit === 'days' ? 'bg-red-500/80' : 'bg-transparent'
                          )}
                        >
                          <Text className={cn(
                            'text-center text-sm font-medium',
                            injuryDuration?.unit === 'days' ? 'text-white' : 'text-slate-400'
                          )}>Days</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setInjuryDuration(prev => ({ ...prev, value: prev?.value, unit: 'weeks' }));
                          }}
                          className={cn(
                            'flex-1 py-2.5 px-2 rounded-lg',
                            injuryDuration?.unit === 'weeks' ? 'bg-red-500/80' : 'bg-transparent'
                          )}
                        >
                          <Text className={cn(
                            'text-center text-sm font-medium',
                            injuryDuration?.unit === 'weeks' ? 'text-white' : 'text-slate-400'
                          )}>Weeks</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setInjuryDuration({ unit: 'remainder_of_season', value: undefined });
                          }}
                          className={cn(
                            'flex-1 py-2.5 px-1 rounded-lg',
                            injuryDuration?.unit === 'remainder_of_season' ? 'bg-red-500/80' : 'bg-transparent'
                          )}
                        >
                          <Text className={cn(
                            'text-center text-xs font-medium',
                            injuryDuration?.unit === 'remainder_of_season' ? 'text-white' : 'text-slate-400'
                          )}>Season</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Suspension Duration - shown when suspended is selected */}
                  {isSuspended && (
                    <View className="mt-3 bg-red-500/10 rounded-xl p-2.5 border border-red-500/20">
                      <Text className="text-red-400 text-sm font-medium mb-2">Suspension Duration</Text>
                      <View className="flex-row items-center bg-slate-800/50 rounded-xl p-1">
                        {suspensionDuration?.unit !== 'remainder_of_season' && (
                          <TextInput
                            value={suspensionDuration?.value?.toString() || ''}
                            onChangeText={(text) => {
                              const num = parseInt(text) || undefined;
                              setSuspensionDuration(prev => ({
                                ...prev,
                                value: num,
                                unit: prev?.unit || 'games'
                              }));
                            }}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="bg-slate-700 rounded-lg px-3 py-2 text-white text-base w-14 mr-1 text-center"
                          />
                        )}
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSuspensionDuration(prev => ({ ...prev, value: prev?.value, unit: 'games' }));
                          }}
                          className={cn(
                            'flex-1 py-2.5 px-2 rounded-lg',
                            suspensionDuration?.unit === 'games' ? 'bg-red-500/80' : 'bg-transparent'
                          )}
                        >
                          <Text className={cn(
                            'text-center text-sm font-medium',
                            suspensionDuration?.unit === 'games' ? 'text-white' : 'text-slate-400'
                          )}>Games</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSuspensionDuration({ unit: 'remainder_of_season', value: undefined });
                          }}
                          className={cn(
                            'flex-1 py-2.5 px-2 rounded-lg',
                            suspensionDuration?.unit === 'remainder_of_season' ? 'bg-red-500/80' : 'bg-transparent'
                          )}
                        >
                          <Text className={cn(
                            'text-center text-sm font-medium',
                            suspensionDuration?.unit === 'remainder_of_season' ? 'text-white' : 'text-slate-400'
                          )}>Season</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* End Date Picker - shown when injured or suspended */}
                  {(isInjured || isSuspended) && (
                    <View className="mt-3 bg-amber-500/10 rounded-xl p-2.5 border border-amber-500/30">
                      <Text className="text-amber-400 text-sm font-medium mb-2">
                        End Date (Auto-mark OUT for games)
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowEndDatePicker(true);
                        }}
                        className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3"
                      >
                        <Calendar size={18} color="#f59e0b" />
                        <Text className="text-white ml-3 flex-1">
                          {statusEndDate
                            ? format(parseISO(statusEndDate), 'MMM d, yyyy')
                            : 'Select end date'}
                        </Text>
                        {statusEndDate && (
                          <Pressable
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setStatusEndDate('');
                            }}
                            hitSlop={8}
                          >
                            <X size={20} color="#94a3b8" />
                          </Pressable>
                        )}
                      </Pressable>
                      <Text className="text-slate-400 text-xs mt-2">
                        Games on or before this date will have this player auto-marked as OUT
                      </Text>
                      {showEndDatePicker && (
                        <View className="mt-3">
                          <DateTimePicker
                            value={statusEndDate ? parseISO(statusEndDate) : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === 'android') {
                                setShowEndDatePicker(false);
                                // On Android, save immediately when date is selected
                                if (selectedDate && editingPlayer) {
                                  const newEndDate = format(selectedDate, 'yyyy-MM-dd');
                                  setStatusEndDate(newEndDate);
                                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  updatePlayer(editingPlayer.id, {
                                    isInjured,
                                    isSuspended,
                                    statusEndDate: newEndDate,
                                  });
                                }
                              }
                              if (selectedDate) {
                                setStatusEndDate(format(selectedDate, 'yyyy-MM-dd'));
                              }
                            }}
                            minimumDate={new Date()}
                            themeVariant="dark"
                          />
                          {Platform.OS === 'ios' && (
                            <Pressable
                              onPress={() => {
                                setShowEndDatePicker(false);
                                // Save when tapping Save on iOS
                                if (statusEndDate && editingPlayer) {
                                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  updatePlayer(editingPlayer.id, {
                                    isInjured,
                                    isSuspended,
                                    statusEndDate,
                                  });
                                  setIsModalVisible(false);
                                  resetForm();
                                }
                              }}
                              className="mt-2 bg-green-500 rounded-xl py-2"
                            >
                              <Text className="text-white text-center font-semibold">Save</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  </View>
                </View>
              )}

              {/* Role Selector - Admin Only - Single Select */}
              {isAdmin() && (
                <View className="mb-5">
                  <Text className="text-slate-300 text-sm mb-2">Role</Text>
                  {(() => {
                    const enabledRoles = teamSettings.enabledRoles ?? ['player', 'reserve', 'coach', 'parent'];
                    const showPlayer = enabledRoles.includes('player');
                    const showReserve = enabledRoles.includes('reserve');
                    const showCoach = enabledRoles.includes('coach');
                    const showParent = enabledRoles.includes('parent');
                    const row1Count = (showPlayer ? 1 : 0) + (showReserve ? 1 : 0);
                    const row2Count = (showCoach ? 1 : 0) + (showParent ? 1 : 0);

                    return (
                      <>
                        {/* Row 1: Player & Reserve (if enabled) */}
                        {row1Count > 0 && (
                          <View className="flex-row mb-2">
                            {/* Player (Active) */}
                            {showPlayer && (
                              <Pressable
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setMemberRole('player');
                                }}
                                className={cn(
                                  'flex-1 py-3 px-2 rounded-xl items-center justify-center border',
                                  showReserve && 'mr-2',
                                  memberRole === 'player' ? 'bg-green-500 border-green-400' : 'bg-slate-800/80 border-slate-700'
                                )}
                              >
                                <User size={16} color={memberRole === 'player' ? 'white' : '#475569'} strokeWidth={2} />
                                <Text
                                  className={cn(
                                    'font-semibold text-sm mt-1',
                                    memberRole === 'player' ? 'text-white' : 'text-slate-500'
                                  )}
                                >
                                  Player
                                </Text>
                              </Pressable>
                            )}
                            {/* Reserve */}
                            {showReserve && (
                              <Pressable
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setMemberRole('reserve');
                                }}
                                className={cn(
                                  'flex-1 py-3 px-2 rounded-xl items-center justify-center border',
                                  memberRole === 'reserve' ? 'bg-slate-600 border-slate-500' : 'bg-slate-800/80 border-slate-700'
                                )}
                              >
                                <UserMinus size={16} color={memberRole === 'reserve' ? 'white' : '#475569'} strokeWidth={2} />
                                <Text
                                  className={cn(
                                    'font-semibold text-sm mt-1',
                                    memberRole === 'reserve' ? 'text-white' : 'text-slate-500'
                                  )}
                                >
                                  Reserve
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                        {/* Row 2: Coach & Parent (if enabled) */}
                        {row2Count > 0 && (
                          <View className="flex-row">
                            {/* Coach */}
                            {showCoach && (
                              <Pressable
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setMemberRole('coach');
                                }}
                                className={cn(
                                  'flex-1 py-3 px-2 rounded-xl items-center justify-center border',
                                  showParent && 'mr-2',
                                  memberRole === 'coach' ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800/80 border-slate-700'
                                )}
                              >
                                <UserCog size={16} color={memberRole === 'coach' ? 'white' : '#475569'} strokeWidth={2} />
                                <Text
                                  className={cn(
                                    'font-semibold text-sm mt-1',
                                    memberRole === 'coach' ? 'text-white' : 'text-slate-500'
                                  )}
                                >
                                  Coach
                                </Text>
                              </Pressable>
                            )}
                            {/* Parent */}
                            {showParent && (
                              <Pressable
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setMemberRole('parent');
                                }}
                                className={cn(
                                  'flex-1 py-3 px-2 rounded-xl items-center justify-center border',
                                  memberRole === 'parent' ? 'bg-pink-500 border-pink-400' : 'bg-slate-800/80 border-slate-700'
                                )}
                              >
                                <ParentChildIcon size={16} color={memberRole === 'parent' ? 'white' : '#475569'} />
                                <Text
                                  className={cn(
                                    'font-semibold text-sm mt-1',
                                    memberRole === 'parent' ? 'text-white' : 'text-slate-500'
                                  )}
                                >
                                  Parent
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                      </>
                    );
                  })()}
                  <Text className="text-slate-500 text-xs mt-2">
                    {memberRole === 'coach' || memberRole === 'parent'
                      ? `${memberRole === 'coach' ? 'Coaches' : 'Parents'} don't need jersey numbers or positions`
                      : 'Select one role for this member.'}
                  </Text>

                  {/* Admin Roles: Captain & Admin */}
                  <Text className="text-slate-300 text-sm mb-2 mt-4">Admin Roles</Text>
                  <View className="flex-row">
                    {/* Captain */}
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
                        'flex-1 py-3 px-2 rounded-xl mr-2 items-center justify-center border',
                        playerRoles.includes('captain') ? 'bg-amber-500/90 border-amber-400' : 'bg-slate-800/80 border-slate-700'
                      )}
                    >
                      <View className={cn(
                        'w-5 h-5 rounded-full items-center justify-center mb-1',
                        playerRoles.includes('captain') ? 'bg-amber-400/30' : 'bg-slate-700'
                      )}>
                        <Text className={cn(
                          'text-xs font-black',
                          playerRoles.includes('captain') ? 'text-white' : 'text-slate-500'
                        )}>C</Text>
                      </View>
                      <Text
                        className={cn(
                          'font-semibold text-sm',
                          playerRoles.includes('captain') ? 'text-white' : 'text-slate-500'
                        )}
                      >
                        Captain
                      </Text>
                    </Pressable>
                    {/* Admin */}
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
                        'flex-1 py-3 px-2 rounded-xl items-center justify-center border',
                        playerRoles.includes('admin') ? 'bg-purple-500/90 border-purple-400' : 'bg-slate-800/80 border-slate-700'
                      )}
                    >
                      <Shield size={16} color={playerRoles.includes('admin') ? 'white' : '#475569'} strokeWidth={2} />
                      <Text
                        className={cn(
                          'font-semibold text-sm mt-1',
                          playerRoles.includes('admin') ? 'text-white' : 'text-slate-500'
                        )}
                      >
                        Admin
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Admin Note for Stats */}
              {editingPlayer && isAdmin() && showTeamStats && (
                <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mt-5 mb-5">
                  <Text className="text-purple-400 text-sm">
                    To update player stats, go to Team Stats in the Admin panel.
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
                Send {newlyCreatedPlayer ? getPlayerName(newlyCreatedPlayer) : ''} an invite to register and join the team?
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
