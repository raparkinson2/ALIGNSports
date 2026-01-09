import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Users,
  Plus,
  X,
  Shield,
  Crown,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Player, SPORT_POSITIONS, SPORT_POSITION_NAMES } from '@/lib/store';
import { cn } from '@/lib/cn';

interface PlayerCardProps {
  player: Player;
  index: number;
  onPress: () => void;
}

function PlayerCard({ player, index, onPress }: PlayerCardProps) {
  const sport = useTeamStore((s) => s.teamSettings.sport);
  const positionName = SPORT_POSITION_NAMES[sport][player.position] || player.position;

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
                <View className="ml-2 bg-amber-500/20 rounded-full p-1">
                  <Crown size={14} color="#f59e0b" />
                </View>
              )}
              {player.roles?.includes('admin') && (
                <View className="ml-2 bg-purple-500/20 rounded-full p-1">
                  <Shield size={14} color="#a78bfa" />
                </View>
              )}
            </View>
            <Text className="text-slate-400 text-sm">{positionName}</Text>
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
      </Pressable>
    </Animated.View>
  );
}

export default function RosterScreen() {
  const players = useTeamStore((s) => s.players);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);

  const positions = SPORT_POSITIONS[teamSettings.sport];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState(positions[0]);

  const resetForm = () => {
    setName('');
    setNumber('');
    setPosition(positions[0]);
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
    setPosition(player.position);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim() || !number.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, {
        name: name.trim(),
        number: number.trim(),
        position,
      });
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        number: number.trim(),
        position,
        avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
        roles: [],
        status: 'active',
      };
      addPlayer(newPlayer);
    }

    setIsModalVisible(false);
    resetForm();
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
            <Text className="text-slate-400 text-sm font-medium">Team</Text>
            <Text className="text-white text-3xl font-bold">Roster</Text>
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
          {positionGroups.map((group) => (
            group.players.length > 0 && (
              <View key={group.title} className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Users size={16} color="#67e8f9" />
                  <Text className="text-cyan-400 font-semibold ml-2">
                    {group.title} ({group.players.length})
                  </Text>
                </View>
                {group.players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    index={index}
                    onPress={() => openEditModal(player)}
                  />
                ))}
              </View>
            )
          ))}
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

              {/* Position Selector */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Position</Text>
                <View className="flex-row flex-wrap">
                  {positions.map((pos) => (
                    <Pressable
                      key={pos}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPosition(pos);
                      }}
                      className={cn(
                        'py-3 px-4 rounded-xl mr-2 mb-2 items-center',
                        position === pos ? 'bg-cyan-500' : 'bg-slate-800'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-semibold',
                          position === pos ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        {pos}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
