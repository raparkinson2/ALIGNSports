import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  Plus,
  X,
  Check,
  Trash2,
  BarChart3,
  User,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  MessageSquare,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useTeamStore, Poll, getPlayerName, Player } from '@/lib/store';

interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  isRequired: boolean;
}

interface PollGroup {
  groupId: string;
  groupName: string;
  polls: Poll[];
  createdBy: string;
  createdAt: string;
}

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  question: PollQuestion;
  index: number;
  onChange: (q: PollQuestion) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddOption = () => {
    if (question.options.length < 6) {
      onChange({ ...question, options: [...question.options, ''] });
    }
  };

  const handleRemoveOption = (optIndex: number) => {
    if (question.options.length > 2) {
      onChange({
        ...question,
        options: question.options.filter((_, i) => i !== optIndex),
      });
    }
  };

  const handleOptionChange = (optIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = value;
    onChange({ ...question, options: newOptions });
  };

  return (
    <View className="mb-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-4 py-3 bg-slate-800/60"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
            <Text className="text-emerald-400 font-bold text-sm">{index + 1}</Text>
          </View>
          <Text className="text-white font-medium flex-1" numberOfLines={1}>
            {question.question || `Question ${index + 1}`}
          </Text>
        </View>
        <View className="flex-row items-center">
          {canRemove && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRemove();
              }}
              className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center mr-2"
            >
              <Trash2 size={16} color="#f87171" />
            </Pressable>
          )}
          {isExpanded ? (
            <ChevronUp size={20} color="#94a3b8" />
          ) : (
            <ChevronDown size={20} color="#94a3b8" />
          )}
        </View>
      </Pressable>

      {isExpanded && (
        <View className="px-4 py-3">
          <View className="mb-3">
            <Text className="text-slate-400 text-xs mb-1.5 uppercase tracking-wide">Question</Text>
            <TextInput
              value={question.question}
              onChangeText={(text) => onChange({ ...question, question: text })}
              placeholder="What do you want to ask?"
              placeholderTextColor="#64748b"
              className="bg-slate-900/60 rounded-xl px-4 py-3 text-white text-base border border-slate-700/50"
              multiline
            />
          </View>

          <View className="mb-3">
            <Text className="text-slate-400 text-xs mb-1.5 uppercase tracking-wide">Options</Text>
            {question.options.map((option, optIndex) => (
              <View key={optIndex} className="flex-row items-center mb-2">
                <TextInput
                  value={option}
                  onChangeText={(value) => handleOptionChange(optIndex, value)}
                  placeholder={`Option ${optIndex + 1}`}
                  placeholderTextColor="#64748b"
                  className="flex-1 bg-slate-900/60 rounded-xl px-4 py-3 text-white text-base border border-slate-700/50"
                />
                {question.options.length > 2 && (
                  <Pressable
                    onPress={() => handleRemoveOption(optIndex)}
                    className="ml-2 w-9 h-9 rounded-full bg-red-500/20 items-center justify-center"
                  >
                    <Trash2 size={16} color="#f87171" />
                  </Pressable>
                )}
              </View>
            ))}
            {question.options.length < 6 && (
              <Pressable
                onPress={handleAddOption}
                className="flex-row items-center py-2.5 px-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-600"
              >
                <Plus size={16} color="#10b981" />
                <Text className="text-emerald-400 ml-2 text-sm">Add Option</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange({ ...question, allowMultiple: !question.allowMultiple });
            }}
            className="flex-row items-center justify-between py-3 px-4 bg-slate-900/40 rounded-xl mb-2"
          >
            <Text className="text-slate-300 text-sm">Allow multiple selections</Text>
            <View
              className={`w-5 h-5 rounded-md items-center justify-center ${
                question.allowMultiple ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              {question.allowMultiple && <Check size={14} color="white" />}
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange({ ...question, isRequired: !question.isRequired });
            }}
            className="flex-row items-center justify-between py-3 px-4 bg-slate-900/40 rounded-xl"
          >
            <Text className="text-slate-300 text-sm">Require answer</Text>
            <View
              className={`w-5 h-5 rounded-md items-center justify-center ${
                question.isRequired ? 'bg-amber-500' : 'bg-slate-600'
              }`}
            >
              {question.isRequired && <Check size={14} color="white" />}
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CreatePollModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (pollName: string, questions: { question: string; options: string[]; allowMultiple: boolean; isRequired: boolean }[], sendNotification: boolean) => void;
}) {
  const [pollName, setPollName] = useState('');
  const [questions, setQuestions] = useState<PollQuestion[]>([
    { id: '1', question: '', options: ['', ''], allowMultiple: false, isRequired: false },
  ]);
  const [sendNotification, setSendNotification] = useState(true);

  const handleAddQuestion = () => {
    if (questions.length < 5) {
      setQuestions([
        ...questions,
        { id: Date.now().toString(), question: '', options: ['', ''], allowMultiple: false, isRequired: false },
      ]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, q: PollQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = q;
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    if (!pollName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Poll Name', 'Please enter a name for your poll.');
      return;
    }

    const validQuestions = questions
      .filter((q) => q.question.trim().length > 0)
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.filter((o) => o.trim().length > 0),
        allowMultiple: q.allowMultiple,
        isRequired: q.isRequired,
      }))
      .filter((q) => q.options.length >= 2);

    if (validQuestions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Questions', 'Please add at least one question with two options.');
      return;
    }

    onSave(pollName.trim(), validQuestions, sendNotification);
    setPollName('');
    setQuestions([{ id: '1', question: '', options: ['', ''], allowMultiple: false, isRequired: false }]);
    setSendNotification(true);
    onClose();
  };

  const handleClose = () => {
    setPollName('');
    setQuestions([{ id: '1', question: '', options: ['', ''], allowMultiple: false, isRequired: false }]);
    setSendNotification(true);
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
                <Text className="text-emerald-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Poll Name */}
              <View className="mb-5">
                <Text className="text-slate-400 text-xs mb-1.5 uppercase tracking-wide">Poll Name *</Text>
                <TextInput
                  value={pollName}
                  onChangeText={setPollName}
                  placeholder="e.g., Team Preferences, Jersey Vote"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800/60 rounded-xl px-4 py-3 text-white text-base border border-slate-700/50"
                />
              </View>

              {/* Questions */}
              <Text className="text-slate-400 text-xs mb-2 uppercase tracking-wide">Questions</Text>
              {questions.map((q, index) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={index}
                  onChange={(updated) => handleQuestionChange(index, updated)}
                  onRemove={() => handleRemoveQuestion(index)}
                  canRemove={questions.length > 1}
                />
              ))}

              {questions.length < 5 && (
                <Pressable
                  onPress={handleAddQuestion}
                  className="flex-row items-center justify-center py-3.5 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mb-4"
                >
                  <Plus size={18} color="#10b981" />
                  <Text className="text-emerald-400 ml-2 font-medium">Add Another Question</Text>
                </Pressable>
              )}

              <View className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 mb-6">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSendNotification(!sendNotification);
                  }}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    {sendNotification ? (
                      <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                        <Bell size={20} color="#10b981" />
                      </View>
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-slate-700/50 items-center justify-center mr-3">
                        <BellOff size={20} color="#64748b" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-white font-medium">Notify Team</Text>
                      <Text className="text-slate-400 text-xs mt-0.5">
                        Send push notification to all team members
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${
                      sendNotification ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    {sendNotification && <Check size={16} color="white" />}
                  </View>
                </Pressable>
              </View>

              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PollDetailModal({
  visible,
  onClose,
  pollGroup,
  players,
  currentPlayerId,
  onVote,
  onDelete,
  canDelete,
}: {
  visible: boolean;
  onClose: () => void;
  pollGroup: PollGroup | null;
  players: Player[];
  currentPlayerId: string | null;
  onVote: (pollId: string, optionId: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  if (!pollGroup) return null;

  const creatorPlayer = players.find((p) => p.id === pollGroup.createdBy);
  const creatorName = creatorPlayer ? getPlayerName(creatorPlayer) : 'Unknown';

  // Count unique voters across all questions in this poll
  const uniqueVoters = new Set<string>();
  pollGroup.polls.forEach((poll) => {
    poll.options.forEach((opt) => {
      opt.votes.forEach((voterId) => uniqueVoters.add(voterId));
    });
  });
  const voterCount = uniqueVoters.size;

  const getVoterNames = (votes: string[]) => {
    return votes
      .map((v) => {
        const player = players.find((p) => p.id === v);
        return player ? getPlayerName(player) : 'Unknown';
      })
      .join(', ');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Poll',
      `Are you sure you want to delete "${pollGroup.groupName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-slate-900">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center">
              <ChevronLeft size={24} color="#10b981" />
            </Pressable>
            <Text className="text-white text-lg font-bold flex-1 text-center" numberOfLines={1}>
              {pollGroup.groupName}
            </Text>
            {canDelete ? (
              <Pressable onPress={handleDelete} className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center">
                <Trash2 size={20} color="#f87171" />
              </Pressable>
            ) : (
              <View className="w-10" />
            )}
          </View>

          {/* Poll Info */}
          <View className="px-5 py-4 border-b border-slate-800/50">
            <View className="flex-row items-center">
              <User size={14} color="#94a3b8" />
              <Text className="text-slate-400 text-sm ml-1.5">{creatorName}</Text>
              <Text className="text-slate-600 mx-2">·</Text>
              <Text className="text-slate-400 text-sm">{voterCount} voter{voterCount !== 1 ? 's' : ''}</Text>
              <Text className="text-slate-600 mx-2">·</Text>
              <Text className="text-slate-400 text-sm">{format(parseISO(pollGroup.createdAt), 'MMM d, yyyy')}</Text>
            </View>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {pollGroup.polls.map((poll, index) => {
              const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

              return (
                <View key={poll.id} className="mb-6">
                  {pollGroup.polls.length > 1 && (
                    <Text className="text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Question {index + 1} of {pollGroup.polls.length}
                    </Text>
                  )}
                  <Text className="text-white text-lg font-semibold mb-4">{poll.question}</Text>

                  {poll.options.map((option) => {
                    const voteCount = option.votes.length;
                    const percentage = pollTotalVotes > 0 ? (voteCount / pollTotalVotes) * 100 : 0;
                    const isSelected = option.votes.includes(currentPlayerId || '');
                    const hasVotes = voteCount > 0;

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
                          className={`absolute inset-0 ${isSelected ? 'bg-emerald-500/25' : 'bg-slate-700/40'}`}
                        />
                        <View
                          className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-emerald-500/50' : 'bg-slate-500/30'}`}
                          style={{ width: `${percentage}%` }}
                        />
                        <View className="relative flex-row items-center justify-between px-4 py-3">
                          <View className="flex-row items-center flex-1">
                            <View
                              className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                                isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-500'
                              }`}
                            >
                              {isSelected && <Check size={12} color="white" />}
                            </View>
                            <Text className={`flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-200'}`}>
                              {option.text}
                            </Text>
                          </View>
                          <Text className={`text-sm ml-2 font-medium ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {voteCount} ({percentage.toFixed(0)}%)
                          </Text>
                        </View>
                        {hasVotes && (
                          <View className="px-4 pb-2.5 pt-0.5">
                            <View className="bg-slate-900/50 rounded-lg px-2.5 py-1.5">
                              <Text className="text-amber-300/90 text-xs font-medium" numberOfLines={2}>
                                {getVoterNames(option.votes)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}

                  {poll.allowMultipleVotes && (
                    <View className="flex-row items-center mt-2">
                      <BarChart3 size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-xs ml-1">Multiple selections allowed</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function PollListItem({
  pollGroup,
  players,
  onPress,
}: {
  pollGroup: PollGroup;
  players: Player[];
  onPress: () => void;
}) {
  const creatorPlayer = players.find((p) => p.id === pollGroup.createdBy);
  const creatorName = creatorPlayer ? getPlayerName(creatorPlayer) : 'Unknown';

  // Count unique voters across all questions in this poll
  const uniqueVoters = new Set<string>();
  pollGroup.polls.forEach((poll) => {
    poll.options.forEach((opt) => {
      opt.votes.forEach((voterId) => uniqueVoters.add(voterId));
    });
  });
  const voterCount = uniqueVoters.size;
  const questionCount = pollGroup.polls.length;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="bg-slate-800/70 rounded-2xl p-4 mb-3 border border-slate-700/50 flex-row items-center"
    >
      <View className="w-12 h-12 rounded-xl bg-emerald-500/20 items-center justify-center mr-4">
        <BarChart3 size={24} color="#10b981" />
      </View>

      <View className="flex-1">
        <Text className="text-white text-base font-semibold mb-1" numberOfLines={1}>
          {pollGroup.groupName}
        </Text>
        <View className="flex-row items-center flex-wrap">
          <View className="flex-row items-center mr-3">
            <User size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-xs ml-1">{creatorName}</Text>
          </View>
          <View className="flex-row items-center mr-3">
            <MessageSquare size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-xs ml-1">{questionCount} question{questionCount !== 1 ? 's' : ''}</Text>
          </View>
          <Text className="text-emerald-400 text-xs">{voterCount} voter{voterCount !== 1 ? 's' : ''}</Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Calendar size={12} color="#64748b" />
          <Text className="text-slate-500 text-xs ml-1">{format(parseISO(pollGroup.createdAt), 'MMM d, yyyy')}</Text>
        </View>
      </View>

      <ChevronRight size={20} color="#64748b" />
    </Pressable>
  );
}

export default function PollsScreen() {
  const router = useRouter();
  const { openPoll } = useLocalSearchParams<{ openPoll?: string }>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const polls = useTeamStore((s) => s.polls);
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const addPoll = useTeamStore((s) => s.addPoll);
  const removePoll = useTeamStore((s) => s.removePoll);
  const votePoll = useTeamStore((s) => s.votePoll);
  const unvotePoll = useTeamStore((s) => s.unvotePoll);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);
  const isAdmin = useTeamStore((s) => s.isAdmin);

  const canManage = canManageTeam();

  // Auto-open poll from notification deep link
  useEffect(() => {
    if (openPoll && !selectedGroupId) {
      setSelectedGroupId(openPoll);
    }
  }, [openPoll]);

  const sendPollNotification = async (pollName: string, pollGroupId: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Poll!',
          body: `"${pollName}" - Cast your vote now!`,
          data: { type: 'poll', pollGroupId },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error sending poll notification:', error);
    }
  };

  const handleCreatePoll = async (
    pollName: string,
    questions: { question: string; options: string[]; allowMultiple: boolean; isRequired: boolean }[],
    sendNotification: boolean
  ) => {
    const timestamp = Date.now();
    const groupId = `group-${timestamp}`;

    questions.forEach((q, qIndex) => {
      const newPoll: Poll = {
        id: `poll-${timestamp}-${qIndex}`,
        question: q.question,
        options: q.options.map((text, index) => ({
          id: `option-${timestamp}-${qIndex}-${index}`,
          text,
          votes: [],
        })),
        createdBy: currentPlayerId || '',
        createdAt: new Date(timestamp).toISOString(),
        isActive: true,
        allowMultipleVotes: q.allowMultiple,
        groupId,
        groupName: pollName,
        isRequired: q.isRequired,
      };
      addPoll(newPoll);
    });

    if (sendNotification) {
      await sendPollNotification(pollName, groupId);
    }

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

  const handleDeletePollGroup = (pollIds: string[]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    pollIds.forEach((id) => removePoll(id));
  };

  // Group polls by groupId or fallback to timestamp-based grouping
  const groupedPolls = polls.reduce((groups, poll) => {
    let groupKey: string;
    let groupName: string;

    if (poll.groupId) {
      groupKey = poll.groupId;
      groupName = poll.groupName || poll.question;
    } else {
      // Fallback for legacy polls without groupId
      const match = poll.id.match(/^poll-(\d+)-/);
      groupKey = match ? `legacy-${match[1]}` : poll.id;
      groupName = poll.question;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupId: groupKey,
        groupName,
        polls: [],
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
      };
    }
    groups[groupKey].polls.push(poll);
    return groups;
  }, {} as Record<string, PollGroup>);

  // Sort each group's polls by index and sort groups by newest first
  const sortedGroups = Object.values(groupedPolls)
    .map((group) => ({
      ...group,
      polls: group.polls.sort((a, b) => {
        const aIndex = parseInt(a.id.split('-').pop() || '0', 10);
        const bIndex = parseInt(b.id.split('-').pop() || '0', 10);
        return aIndex - bIndex;
      }),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Look up the selected group from live data
  const selectedPollGroup = selectedGroupId
    ? sortedGroups.find((g) => g.groupId === selectedGroupId) || null
    : null;

  const canDeleteSelectedPoll = selectedPollGroup
    ? isAdmin() || selectedPollGroup.createdBy === currentPlayerId
    : false;

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
                <ChevronLeft size={24} color="#10b981" />
              </Pressable>
              <Text className="text-white text-2xl font-bold">Team Polls</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCreateModalVisible(true);
              }}
              className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center"
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
          {sortedGroups.length === 0 ? (
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
            sortedGroups.map((group, index) => (
              <Animated.View key={group.groupId} entering={FadeInDown.delay(index * 50).springify()}>
                <PollListItem
                  pollGroup={group}
                  players={players}
                  onPress={() => setSelectedGroupId(group.groupId)}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <CreatePollModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreatePoll}
      />

      <PollDetailModal
        visible={selectedPollGroup !== null}
        onClose={() => setSelectedGroupId(null)}
        pollGroup={selectedPollGroup}
        players={players}
        currentPlayerId={currentPlayerId}
        onVote={handleVote}
        onDelete={() => {
          if (selectedPollGroup) {
            handleDeletePollGroup(selectedPollGroup.polls.map((p) => p.id));
          }
        }}
        canDelete={canDeleteSelectedPoll}
      />
    </View>
  );
}
