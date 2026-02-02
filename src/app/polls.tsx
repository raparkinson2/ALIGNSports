import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  X,
  Check,
  Trash2,
  BarChart3,
  Clock,
  User,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Poll, PollOption, getPlayerName, Player } from '@/lib/store';

function CreatePollModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (question: string, options: string[], allowMultiple: boolean) => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.filter((o) => o.trim().length > 0);

    if (!trimmedQuestion) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (validOptions.length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    onSave(trimmedQuestion, validOptions, allowMultiple);
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    onClose();
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
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
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={handleClose}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Create Poll</Text>
              <Pressable onPress={handleSave}>
                <Text className="text-cyan-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Question</Text>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="What do you want to ask?"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                  multiline
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Options</Text>
                {options.map((option, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <TextInput
                      value={option}
                      onChangeText={(value) => handleOptionChange(index, value)}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor="#64748b"
                      className="flex-1 bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                    />
                    {options.length > 2 && (
                      <Pressable
                        onPress={() => handleRemoveOption(index)}
                        className="ml-2 w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
                      >
                        <Trash2 size={18} color="#f87171" />
                      </Pressable>
                    )}
                  </View>
                ))}
                {options.length < 6 && (
                  <Pressable
                    onPress={handleAddOption}
                    className="flex-row items-center py-3 px-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700"
                  >
                    <Plus size={18} color="#67e8f9" />
                    <Text className="text-cyan-400 ml-2">Add Option</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAllowMultiple(!allowMultiple);
                }}
                className="flex-row items-center justify-between py-4 px-4 bg-slate-800/50 rounded-xl mb-6"
              >
                <Text className="text-white">Allow multiple selections</Text>
                <View
                  className={`w-6 h-6 rounded-md items-center justify-center ${
                    allowMultiple ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  {allowMultiple && <Check size={16} color="white" />}
                </View>
              </Pressable>

              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PollCard({
  poll,
  currentPlayerId,
  onVote,
  onDelete,
  players,
  canManage,
}: {
  poll: Poll;
  currentPlayerId: string | null;
  onVote: (pollId: string, optionId: string) => void;
  onDelete: (pollId: string) => void;
  players: Player[];
  canManage: boolean;
}) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const creatorPlayer = players.find((p) => p.id === poll.createdBy);
  const creatorName = creatorPlayer ? getPlayerName(creatorPlayer) : 'Unknown';

  const hasVoted = poll.options.some((opt) => opt.votes.includes(currentPlayerId || ''));

  const getVoterNames = (votes: string[]) => {
    return votes
      .map((v) => {
        const player = players.find((p) => p.id === v);
        return player ? getPlayerName(player) : 'Unknown';
      })
      .join(', ');
  };

  return (
    <Animated.View entering={FadeInDown.springify()} className="mb-4">
      <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-white text-lg font-semibold">{poll.question}</Text>
            <View className="flex-row items-center mt-1">
              <User size={12} color="#94a3b8" />
              <Text className="text-slate-400 text-xs ml-1">{creatorName}</Text>
              <Text className="text-slate-600 mx-2">·</Text>
              <Text className="text-slate-400 text-xs">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          {canManage && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete(poll.id);
              }}
              className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center"
            >
              <Trash2 size={16} color="#f87171" />
            </Pressable>
          )}
        </View>

        <View className="space-y-2">
          {poll.options.map((option) => {
            const voteCount = option.votes.length;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isSelected = option.votes.includes(currentPlayerId || '');

            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onVote(poll.id, option.id);
                }}
                className="relative overflow-hidden rounded-xl mb-2"
              >
                <View
                  className={`absolute inset-0 ${isSelected ? 'bg-cyan-500/30' : 'bg-slate-700/50'}`}
                />
                <View
                  className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-cyan-500/40' : 'bg-slate-600/40'}`}
                  style={{ width: `${percentage}%` }}
                />
                <View className="relative flex-row items-center justify-between px-4 py-3">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                        isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-500'
                      }`}
                    >
                      {isSelected && <Check size={12} color="white" />}
                    </View>
                    <Text className={`flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {option.text}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-sm ml-2">
                    {voteCount} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
                {voteCount > 0 && (
                  <View className="px-4 pb-2">
                    <Text className="text-slate-500 text-xs" numberOfLines={1}>
                      {getVoterNames(option.votes)}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {poll.allowMultipleVotes && (
          <View className="flex-row items-center mt-2">
            <BarChart3 size={12} color="#94a3b8" />
            <Text className="text-slate-500 text-xs ml-1">Multiple selections allowed</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function PollsScreen() {
  const router = useRouter();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const polls = useTeamStore((s) => s.polls);
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const addPoll = useTeamStore((s) => s.addPoll);
  const removePoll = useTeamStore((s) => s.removePoll);
  const votePoll = useTeamStore((s) => s.votePoll);
  const unvotePoll = useTeamStore((s) => s.unvotePoll);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);

  const canManage = canManageTeam();

  const handleCreatePoll = (question: string, options: string[], allowMultiple: boolean) => {
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question,
      options: options.map((text, index) => ({
        id: `option-${Date.now()}-${index}`,
        text,
        votes: [],
      })),
      createdBy: currentPlayerId || '',
      createdAt: new Date().toISOString(),
      isActive: true,
      allowMultipleVotes: allowMultiple,
    };
    addPoll(newPoll);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!currentPlayerId) return;

    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return;

    // Toggle vote
    if (option.votes.includes(currentPlayerId)) {
      unvotePoll(pollId, optionId, currentPlayerId);
    } else {
      votePoll(pollId, optionId, currentPlayerId);
    }
  };

  const handleDeletePoll = (pollId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removePoll(pollId);
  };

  // Sort polls by creation date (newest first)
  const sortedPolls = [...polls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <Animated.View entering={FadeIn.delay(50)} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center mr-3"
              >
                <ChevronLeft size={24} color="#67e8f9" />
              </Pressable>
              <Text className="text-white text-2xl font-bold">Team Polls</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCreateModalVisible(true);
              }}
              className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center"
            >
              <Plus size={24} color="white" />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {sortedPolls.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-slate-800/50 items-center justify-center mb-4">
                <BarChart3 size={40} color="#64748b" />
              </View>
              <Text className="text-slate-400 text-lg font-medium mb-2">No Polls Yet</Text>
              <Text className="text-slate-500 text-center px-8">
                Create a poll to get your team's input on decisions
              </Text>
            </View>
          ) : (
            sortedPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                currentPlayerId={currentPlayerId}
                onVote={handleVote}
                onDelete={handleDeletePoll}
                players={players}
                canManage={canManage}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <CreatePollModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreatePoll}
      />
    </View>
  );
}
