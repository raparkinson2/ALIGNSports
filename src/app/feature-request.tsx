import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lightbulb, Send, CheckCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { useTeamStore, getPlayerName } from '@/lib/store';

const FEEDBACK_EMAIL = 'sell.hold.given@myclkd.id';

export default function FeatureRequestScreen() {
  const router = useRouter();
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your feature request.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the feature you would like to see.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Build the email
    const subject = encodeURIComponent(`Feature Request: ${title.trim()}`);
    const body = encodeURIComponent(
      `Feature Request\n` +
      `================\n\n` +
      `Title: ${title.trim()}\n\n` +
      `Description:\n${description.trim()}\n\n` +
      `---\n` +
      `Submitted by: ${currentPlayer ? getPlayerName(currentPlayer) : 'Unknown'}\n` +
      `Team: ${teamName}\n` +
      `Date: ${new Date().toLocaleDateString()}`
    );

    const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setIsSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'Could not open email app. Please make sure you have an email app installed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRequest = () => {
    setTitle('');
    setDescription('');
    setIsSubmitted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (isSubmitted) {
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
            className="flex-row items-center px-5 pt-2 pb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center mr-3"
            >
              <ArrowLeft size={20} color="#67e8f9" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-slate-400 text-sm font-medium">Settings</Text>
              <Text className="text-white text-2xl font-bold">Feature Request</Text>
            </View>
          </Animated.View>

          <View className="flex-1 items-center justify-center px-8">
            <Animated.View
              entering={FadeInUp.delay(100).springify()}
              className="items-center"
            >
              <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center mb-6">
                <CheckCircle size={40} color="#22c55e" />
              </View>
              <Text className="text-white text-2xl font-bold text-center mb-3">
                Email Ready!
              </Text>
              <Text className="text-slate-400 text-center text-base mb-8">
                Your email app should have opened with your feature request. Just hit send to submit it!
              </Text>

              <Pressable
                onPress={handleNewRequest}
                className="bg-slate-800 rounded-xl py-4 px-8 mb-4 active:bg-slate-700"
              >
                <Text className="text-cyan-400 font-semibold text-base">Submit Another Request</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="py-3"
              >
                <Text className="text-slate-400 font-medium">Go Back</Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          className="flex-row items-center px-5 pt-2 pb-4"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-slate-800/80 items-center justify-center mr-3"
          >
            <ArrowLeft size={20} color="#67e8f9" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-slate-400 text-sm font-medium">Settings</Text>
            <Text className="text-white text-2xl font-bold">Feature Request</Text>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Info Card */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-6"
            >
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
                  <Lightbulb size={20} color="#67e8f9" />
                </View>
                <Text className="text-cyan-400 font-semibold text-lg">Got an idea?</Text>
              </View>
              <Text className="text-slate-300 text-sm leading-5">
                We'd love to hear your suggestions! Fill out the form below and we'll review your feature request.
              </Text>
            </Animated.View>

            {/* Title Input */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="mb-4"
            >
              <Text className="text-slate-400 text-sm font-medium mb-2">Feature Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Add team stats dashboard"
                placeholderTextColor="#64748b"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
                maxLength={100}
              />
              <Text className="text-slate-500 text-xs mt-1 text-right">{title.length}/100</Text>
            </Animated.View>

            {/* Description Input */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="mb-6"
            >
              <Text className="text-slate-400 text-sm font-medium mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the feature you'd like to see. Include any specific details that would help us understand your request..."
                placeholderTextColor="#64748b"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 150 }}
                maxLength={1000}
              />
              <Text className="text-slate-500 text-xs mt-1 text-right">{description.length}/1000</Text>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`rounded-xl py-4 items-center flex-row justify-center ${
                  isSubmitting ? 'bg-cyan-600/50' : 'bg-cyan-500 active:bg-cyan-600'
                }`}
              >
                <Send size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  {isSubmitting ? 'Opening Email...' : 'Submit Request'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Note */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mt-6"
            >
              <Text className="text-slate-500 text-sm text-center">
                Your request will be sent via email. Make sure to hit send in your email app to complete the submission.
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
