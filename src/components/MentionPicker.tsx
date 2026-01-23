import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Users, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Player, getPlayerName, getPlayerInitials } from '@/lib/store';
import { cn } from '@/lib/cn';

interface MentionPickerProps {
  visible: boolean;
  players: Player[];
  currentPlayerId: string | null;
  selectedPlayerIds: string[];
  onSelectPlayer: (playerId: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
  onConfirm: () => void;
  isAllSelected: boolean;
}

export function MentionPicker({
  visible,
  players,
  currentPlayerId,
  selectedPlayerIds,
  onSelectPlayer,
  onSelectAll,
  onClose,
  onConfirm,
  isAllSelected,
}: MentionPickerProps) {
  if (!visible) return null;

  // Filter out current player - you don't mention yourself
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId && p.status === 'active');

  const handleSelectPlayer = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectPlayer(playerId);
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectAll();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20)}
      exiting={FadeOut.duration(150)}
      className="absolute bottom-full left-0 right-0 mb-2 mx-2"
    >
      <View className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700">
          <Text className="text-white font-semibold">Tag People</Text>
          <View className="flex-row">
            <Pressable
              onPress={onClose}
              className="px-3 py-1.5 rounded-lg mr-2 active:bg-slate-700"
            >
              <Text className="text-slate-400 font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!isAllSelected && selectedPlayerIds.length === 0}
              className={cn(
                'px-3 py-1.5 rounded-lg',
                isAllSelected || selectedPlayerIds.length > 0
                  ? 'bg-cyan-500 active:bg-cyan-600'
                  : 'bg-slate-700'
              )}
            >
              <Text
                className={cn(
                  'font-medium',
                  isAllSelected || selectedPlayerIds.length > 0
                    ? 'text-white'
                    : 'text-slate-500'
                )}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>

        {/* @everyone option */}
        <Pressable
          onPress={handleSelectAll}
          className={cn(
            'flex-row items-center px-4 py-3 border-b border-slate-700',
            isAllSelected ? 'bg-cyan-500/10' : 'active:bg-slate-700/50'
          )}
        >
          <View
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center mr-3',
              isAllSelected ? 'bg-cyan-500' : 'bg-slate-700'
            )}
          >
            <Users size={20} color={isAllSelected ? '#ffffff' : '#67e8f9'} />
          </View>
          <View className="flex-1">
            <Text className={cn('font-semibold', isAllSelected ? 'text-cyan-400' : 'text-white')}>
              @everyone
            </Text>
            <Text className="text-slate-400 text-sm">Notify all team members</Text>
          </View>
          {isAllSelected && (
            <View className="w-6 h-6 rounded-full bg-cyan-500 items-center justify-center">
              <Check size={14} color="#ffffff" />
            </View>
          )}
        </Pressable>

        {/* Player list */}
        <ScrollView
          className="max-h-48"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {otherPlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            return (
              <Pressable
                key={player.id}
                onPress={() => handleSelectPlayer(player.id)}
                className={cn(
                  'flex-row items-center px-4 py-3 border-b border-slate-700/50',
                  isSelected ? 'bg-cyan-500/10' : 'active:bg-slate-700/50'
                )}
              >
                {player.avatar ? (
                  <Image
                    source={{ uri: player.avatar }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-slate-600 items-center justify-center">
                    <Text className="text-white font-semibold text-sm">
                      {getPlayerInitials(player)}
                    </Text>
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className={cn('font-medium', isSelected ? 'text-cyan-400' : 'text-white')}>
                    {getPlayerName(player)}
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    #{player.number} • {player.position}
                  </Text>
                </View>
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-cyan-500 items-center justify-center">
                    <Check size={14} color="#ffffff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Helper text */}
        <View className="px-4 py-2 bg-slate-800/50">
          <Text className="text-slate-500 text-xs text-center">
            {isAllSelected
              ? 'Everyone will be notified'
              : selectedPlayerIds.length > 0
              ? `${selectedPlayerIds.length} ${selectedPlayerIds.length === 1 ? 'person' : 'people'} selected`
              : 'Select who to notify'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
