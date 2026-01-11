import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, ImageIcon, X, Search } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTeamStore, ChatMessage } from '@/lib/store';
import { cn } from '@/lib/cn';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

// GIPHY API key
const GIPHY_API_KEY = 'mUSMkXeohjZdAa2fSpTRGq7ljx5h00fI';

interface GiphyGif {
  id: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
}

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
  const hasMedia = message.imageUrl || message.gifUrl;

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
          {/* Media-only message (no background) */}
          {hasMedia && !message.message && (
            <View style={{ maxWidth: 250 }}>
              <View className="rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: message.imageUrl || message.gifUrl }}
                  style={{
                    width: 250,
                    height: 200,
                    borderRadius: 16,
                  }}
                  contentFit="contain"
                  autoplay={true}
                />
              </View>
              {message.gifUrl && (
                <View className="flex-row justify-end mt-1 mr-1">
                  <Image
                    source={{ uri: 'https://giphy.com/static/img/poweredby_giphy.png' }}
                    style={{ width: 100, height: 13 }}
                    contentFit="contain"
                  />
                </View>
              )}
            </View>
          )}
          {/* Media with text or text-only message */}
          {(message.message || !hasMedia) && (
            <View
              className={cn(
                'rounded-2xl overflow-hidden',
                !hasMedia && 'px-4 py-2.5',
                isOwnMessage
                  ? 'bg-cyan-500 rounded-br-sm'
                  : 'bg-slate-700 rounded-bl-sm'
              )}
              style={hasMedia ? { maxWidth: 250 } : undefined}
            >
              {/* Image or GIF with text */}
              {hasMedia && (
                <Image
                  source={{ uri: message.imageUrl || message.gifUrl }}
                  style={{
                    width: 250,
                    height: 200,
                  }}
                  contentFit="contain"
                  autoplay={true}
                />
              )}
              {/* Text message */}
              {message.message && (
                <View className={hasMedia ? 'px-4 py-2.5' : ''}>
                  <Text className={cn('text-base', isOwnMessage ? 'text-white' : 'text-slate-100')}>
                    {message.message}
                  </Text>
                </View>
              )}
            </View>
          )}
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
  const [isGifModalVisible, setIsGifModalVisible] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
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

  // Load trending GIFs when modal opens
  useEffect(() => {
    if (isGifModalVisible && gifs.length === 0) {
      loadTrendingGifs();
    }
  }, [isGifModalVisible]);

  const loadTrendingGifs = async () => {
    setIsLoadingGifs(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }
    setIsLoadingGifs(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setIsLoadingGifs(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isGifModalVisible) {
        searchGifs(gifSearchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [gifSearchQuery, isGifModalVisible]);

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

  const handlePickImage = async () => {
    if (!currentPlayerId) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentPlayerId,
        message: '',
        imageUrl: result.assets[0].uri,
        createdAt: new Date().toISOString(),
      };
      addChatMessage(newMessage);
    }
  };

  const handleSelectGif = (gif: GiphyGif) => {
    if (!currentPlayerId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentPlayerId,
      message: '',
      gifUrl: gif.images.fixed_height.url,
      createdAt: new Date().toISOString(),
    };
    addChatMessage(newMessage);
    setIsGifModalVisible(false);
    setGifSearchQuery('');
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
          <Text className="text-white text-2xl font-bold">{teamName} Team Chat</Text>
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
            <View className="flex-row items-center">
              {/* Image Picker Button */}
              <Pressable
                onPress={handlePickImage}
                className="w-11 h-11 rounded-full items-center justify-center bg-slate-800 mr-2 active:bg-slate-700"
              >
                <ImageIcon size={20} color="#67e8f9" />
              </Pressable>

              {/* GIF Button */}
              <Pressable
                onPress={() => setIsGifModalVisible(true)}
                className="w-11 h-11 rounded-full items-center justify-center bg-slate-800 mr-2 active:bg-slate-700"
              >
                <Text className="text-cyan-400 font-bold text-xs">GIF</Text>
              </Pressable>

              <View className="flex-1 bg-slate-800 rounded-2xl px-4 mr-2 min-h-[44px] justify-center">
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Type a message..."
                  placeholderTextColor="#64748b"
                  className="text-white text-base py-2.5"
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

      {/* GIF Picker Modal */}
      <Modal
        visible={isGifModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsGifModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f172a']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <SafeAreaView className="flex-1" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-slate-700/50">
              <Pressable
                onPress={() => {
                  setIsGifModalVisible(false);
                  setGifSearchQuery('');
                }}
                className="p-2 -ml-2"
              >
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Choose a GIF</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View className="px-5 py-3">
              <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                <Search size={20} color="#64748b" />
                <TextInput
                  value={gifSearchQuery}
                  onChangeText={setGifSearchQuery}
                  placeholder="Search GIFs..."
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-base ml-3"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* GIF Grid */}
            {!GIPHY_API_KEY ? (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-slate-400 text-center text-lg font-medium mb-2">
                  GIF Search Not Configured
                </Text>
                <Text className="text-slate-500 text-center text-sm">
                  To enable GIFs, add your GIPHY API key in the ENV tab:{'\n\n'}
                  EXPO_PUBLIC_GIPHY_API_KEY{'\n\n'}
                  Get a free key at developers.giphy.com
                </Text>
              </View>
            ) : isLoadingGifs ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#67e8f9" />
              </View>
            ) : (
              <FlatList
                data={gifs}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 10 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectGif(item)}
                    className="flex-1 m-1 active:opacity-80"
                  >
                    <Image
                      source={{ uri: item.images.fixed_height.url }}
                      style={{
                        width: '100%',
                        aspectRatio: parseInt(item.images.fixed_height.width) / parseInt(item.images.fixed_height.height),
                        borderRadius: 8,
                        minHeight: 100,
                      }}
                      contentFit="cover"
                    />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center py-20">
                    <Text className="text-slate-400">No GIFs found</Text>
                  </View>
                }
              />
            )}

            {/* Powered by GIPHY */}
            <View className="px-5 py-3 border-t border-slate-700/50 items-center">
              <Image
                source={{ uri: 'https://giphy.com/static/img/poweredby_giphy.png' }}
                style={{ width: 150, height: 20 }}
                contentFit="contain"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
