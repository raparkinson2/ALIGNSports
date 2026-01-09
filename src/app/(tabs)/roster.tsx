import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Users,
  Plus,
  X,
  Shirt,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Player } from '@/lib/store';
import { cn } from '@/lib/cn';

const JERSEY_COLORS = [
  { hex: '#1e40af', name: 'Blue' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#16a34a', name: 'Green' },
  { hex: '#000000', name: 'Black' },
  { hex: '#7c3aed', name: 'Purple' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#ca8a04', name: 'Gold' },
];

const POSITIONS = ['C', 'LW', 'RW', 'D', 'G'] as const;

interface PlayerCardProps {
  player: Player;
  index: number;
  onPress: () => void;
}

function PlayerCard({ player, index, onPress }: PlayerCardProps) {
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
            <Text className="text-white text-lg font-semibold">{player.name}</Text>
            <Text className="text-slate-400 text-sm">{player.position}</Text>
          </View>

          {/* Jersey Colors */}
          <View className="flex-row items-center">
            <Shirt size={16} color="#67e8f9" className="mr-2" />
            <View className="flex-row">
              {player.jerseyColors.map((color, idx) => (
                <View
                  key={idx}
                  className="w-5 h-5 rounded-full -ml-1 border-2 border-slate-800"
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
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

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState<Player['position']>('C');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setNumber('');
    setPosition('C');
    setSelectedColors([]);
    setEditingPlayer(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setNumber(player.number);
    setPosition(player.position);
    setSelectedColors(player.jerseyColors);
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
        jerseyColors: selectedColors.length > 0 ? selectedColors : ['#1e40af'],
      });
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: name.trim(),
        number: number.trim(),
        position,
        jerseyColors: selectedColors.length > 0 ? selectedColors : ['#1e40af'],
        avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150`,
      };
      addPlayer(newPlayer);
    }

    setIsModalVisible(false);
    resetForm();
  };

  const toggleColor = (hex: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedColors.includes(hex)) {
      setSelectedColors(selectedColors.filter((c) => c !== hex));
    } else {
      setSelectedColors([...selectedColors, hex]);
    }
  };

  // Group players by position
  const forwards = players.filter((p) => ['C', 'LW', 'RW'].includes(p.position));
  const defense = players.filter((p) => p.position === 'D');
  const goalies = players.filter((p) => p.position === 'G');

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
          <Pressable
            onPress={openAddModal}
            className="bg-cyan-500 w-10 h-10 rounded-full items-center justify-center active:bg-cyan-600"
          >
            <Plus size={24} color="white" />
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Forwards Section */}
          {forwards.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Users size={16} color="#67e8f9" />
                <Text className="text-cyan-400 font-semibold ml-2">
                  Forwards ({forwards.length})
                </Text>
              </View>
              {forwards.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={index}
                  onPress={() => openEditModal(player)}
                />
              ))}
            </View>
          )}

          {/* Defense Section */}
          {defense.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Users size={16} color="#67e8f9" />
                <Text className="text-cyan-400 font-semibold ml-2">
                  Defense ({defense.length})
                </Text>
              </View>
              {defense.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={index}
                  onPress={() => openEditModal(player)}
                />
              ))}
            </View>
          )}

          {/* Goalies Section */}
          {goalies.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Users size={16} color="#67e8f9" />
                <Text className="text-cyan-400 font-semibold ml-2">
                  Goalies ({goalies.length})
                </Text>
              </View>
              {goalies.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={index}
                  onPress={() => openEditModal(player)}
                />
              ))}
            </View>
          )}
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
                <View className="flex-row">
                  {POSITIONS.map((pos) => (
                    <Pressable
                      key={pos}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPosition(pos);
                      }}
                      className={cn(
                        'flex-1 py-3 rounded-xl mr-2 items-center',
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

              {/* Jersey Colors */}
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">
                  Jersey Colors (Select all you own)
                </Text>
                <View className="flex-row flex-wrap">
                  {JERSEY_COLORS.map((color) => (
                    <Pressable
                      key={color.hex}
                      onPress={() => toggleColor(color.hex)}
                      className="mr-3 mb-3 items-center"
                    >
                      <View
                        className={cn(
                          'w-12 h-12 rounded-full items-center justify-center border-2',
                          selectedColors.includes(color.hex)
                            ? 'border-cyan-400'
                            : 'border-slate-600'
                        )}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selectedColors.includes(color.hex) && (
                          <Check
                            size={20}
                            color={color.hex === '#ffffff' ? '#000' : '#fff'}
                          />
                        )}
                      </View>
                      <Text className="text-slate-400 text-xs mt-1">{color.name}</Text>
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
