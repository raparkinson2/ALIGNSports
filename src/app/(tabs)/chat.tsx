import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTeamStore, ChatMessage } from '@/lib/store';
import { cn } from '@/lib/cn';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  senderName: string;
  senderAvatar?: string;
  index: number;
  onDelete?: () => void;
}

function MessageBubble({ message, isOwnMessage, senderName, senderAvatar, index, onDelete }: MessageBubbleProps) {
  const messageDate = parseISO(message.createdAt);
  const timeStr = format(messageDate, 'h:mm a');

  const handleLongPress = () => {
    if (isOwnMessage && onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      className={cn('mb-3', isOwnMessage ? 'items-end' : 'items-start')}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        className={cn('flex-row items-end max-w-[80%]', isOwnMessage && 'flex-row-reverse')}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: senderAvatar }}
            style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
            contentFit="cover"
          />
        )}
        <View>
          {!isOwnMessage && (
            <Text className="text-slate-400 text-xs mb-1 ml-1">{senderName}</Text>
          )}
          <View
            className={cn(
              'rounded-2xl px-4 py-2.5',
              isOwnMessage
                ? 'bg-cyan-500 rounded-br-sm'
                : 'bg-slate-700 rounded-bl-sm'
            )}
          >
            <Text className={cn('text-base', isOwnMessage ? 'text-white' : 'text-slate-100')}>
              {message.message}
            </Text>
          </View>
          <Text className={cn('text-slate-500 text-[10px] mt-1', isOwnMessage ? 'mr-1 text-right' : 'ml-1')}>
            {timeStr}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DateSeparator({ date }: { date: Date }) {
  let label = format(date, 'EEEE, MMMM d');
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';

  return (
    <View className="flex-row items-center my-4">
      <View className="flex-1 h-px bg-slate-700" />
      <Text className="text-slate-500 text-xs mx-4">{label}</Text>
      <View className="flex-1 h-px bg-slate-700" />
    </View>
  );
}

export default function ChatScreen() {
  const chatMessages = useTeamStore((s) => s.chatMessages);
  const addChatMessage = useTeamStore((s) => s.addChatMessage);
  const deleteChatMessage = useTeamStore((s) => s.deleteChatMessage);
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const teamName = useTeamStore((s) => s.teamName);
  const markChatAsRead = useTeamStore((s) => s.markChatAsRead);

  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Mark chat as read when entering the screen
  useEffect(() => {
    if (currentPlayerId) {
      markChatAsRead(currentPlayerId);
    }
  }, [currentPlayerId, markChatAsRead]);

  // Also mark as read when new messages arrive (user is viewing)
  useEffect(() => {
    if (currentPlayerId) {
      markChatAsRead(currentPlayerId);
    }
    // Scroll to bottom on new messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages.length, currentPlayerId, markChatAsRead]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !currentPlayerId) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentPlayerId,
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    addChatMessage(newMessage);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessageText('');
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: ChatMessage[] }[] = [];
  let currentDate: string | null = null;

  chatMessages.forEach((msg) => {
    const msgDate = format(parseISO(msg.createdAt), 'yyyy-MM-dd');
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({
        date: parseISO(msg.createdAt),
        messages: [msg],
      });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

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
          className="px-5 pt-2 pb-4 border-b border-slate-800"
        >
          <View className="flex-row items-center">
            <MessageSquare size={20} color="#67e8f9" />
            <Text className="text-cyan-400 text-sm font-medium ml-2">Team Chat</Text>
          </View>
          <Text className="text-white text-2xl font-bold">{teamName}</Text>
          <Text className="text-slate-400 text-sm">{players.length} members</Text>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          >
            {chatMessages.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <View className="bg-slate-800/50 rounded-full p-6 mb-4">
                  <MessageSquare size={48} color="#475569" />
                </View>
                <Text className="text-slate-400 text-center text-lg font-medium">
                  No messages yet
                </Text>
                <Text className="text-slate-500 text-center mt-1">
                  Start the conversation with your team!
                </Text>
              </View>
            ) : (
              groupedMessages.map((group, groupIndex) => (
                <View key={group.date.toISOString()}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((message, msgIndex) => {
                    const sender = players.find((p) => p.id === message.senderId);
                    const isOwnMessage = message.senderId === currentPlayerId;
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        senderName={sender?.name || 'Unknown'}
                        senderAvatar={sender?.avatar}
                        index={groupIndex * 10 + msgIndex}
                        onDelete={isOwnMessage ? () => deleteChatMessage(message.id) : undefined}
                      />
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>

          {/* Input Area */}
          <View className="px-4 pb-4 pt-2 border-t border-slate-800 bg-slate-900/95">
            <View className="flex-row items-end">
              <View className="flex-1 bg-slate-800 rounded-2xl px-4 py-2 mr-2">
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Type a message..."
                  placeholderTextColor="#64748b"
                  className="text-white text-base"
                  multiline
                  maxLength={500}
                  style={{ maxHeight: 100 }}
                />
              </View>
              <Pressable
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                className={cn(
                  'w-11 h-11 rounded-full items-center justify-center',
                  messageText.trim() ? 'bg-cyan-500 active:bg-cyan-600' : 'bg-slate-700'
                )}
              >
                <Send size={20} color={messageText.trim() ? 'white' : '#64748b'} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
