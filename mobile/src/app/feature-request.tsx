import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lightbulb, Send, CheckCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTeamStore, getPlayerName } from '@/lib/store';

const FEEDBACK_EMAIL = 'rob@alignapps.com';

export default function FeatureRequestScreen() {
  const router = useRouter();
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reasonForRequest, setReasonForRequest] = useState('');
  const [contactEmail, setContactEmail] = useState(currentPlayer?.email || '');
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

    try {
      // Build the email body
      const emailBody =
        `Feature Request\n` +
        `================\n\n` +
        `Title: ${title.trim()}\n\n` +
        `Description:\n${description.trim()}\n\n` +
        `Reason for Request:\n${reasonForRequest.trim() || 'Not provided'}\n\n` +
        `---\n` +
        `Submitted by: ${currentPlayer ? getPlayerName(currentPlayer) : 'Unknown'}\n` +
        `Contact Email: ${contactEmail.trim() || 'Not provided'}\n` +
        `Team: ${teamName}\n` +
        `Date: ${new Date().toLocaleDateString()}`;

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
            to: [FEEDBACK_EMAIL],
            subject: `Feature Request: ${title.trim()}`,
            body: emailBody,
            teamName: teamName,
          }),
        }
      );

      if (response.ok) {
        setIsSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send feature request');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send feature request. Please try again later.');
      console.error('Feature request send error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRequest = () => {
    setTitle('');
    setDescription('');
    setReasonForRequest('');
    setContactEmail(currentPlayer?.email || '');
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
                Request Sent!
              </Text>
              <Text className="text-slate-400 text-center text-base mb-8">
                Thank you for your suggestion! We'll review your feature request and consider it for future updates.
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
              className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-4"
            >
              <View className="flex-row items-center mb-1">
                <View className="w-9 h-9 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
                  <Lightbulb size={18} color="#67e8f9" />
                </View>
                <Text className="text-cyan-400 font-semibold text-base">Got an idea?</Text>
              </View>
              <Text className="text-slate-300 text-sm leading-5">
                We'd love to hear your suggestions! Fill out the form below and we'll review your feature request.
              </Text>
            </Animated.View>

            {/* Title Input */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="mb-2"
            >
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Feature Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Add team stats dashboard"
                placeholderTextColor="#94a3b8"
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-3.5 text-white text-base"
                maxLength={100}
              />
              <Text className="text-slate-600 text-[10px] text-right">{title.length}/100</Text>
            </Animated.View>

            {/* Description Input */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="mb-2"
            >
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the feature you'd like to see. Include any specific details that would help us understand your request..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-3.5 text-white text-base"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
                maxLength={1000}
              />
              <Text className="text-slate-600 text-[10px] text-right">{description.length}/1000</Text>
            </Animated.View>

            {/* Reason for Request Input */}
            <Animated.View
              entering={FadeInDown.delay(250).springify()}
              className="mb-2"
            >
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Reason for request (optional)</Text>
              <TextInput
                value={reasonForRequest}
                onChangeText={setReasonForRequest}
                placeholder="How will this feature help users and improve the app?"
                placeholderTextColor="#94a3b8"
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-3.5 text-white text-base"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 80 }}
                maxLength={500}
              />
              <Text className="text-slate-600 text-[10px] text-right">{reasonForRequest.length}/500</Text>
            </Animated.View>

            {/* Contact Email Input */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mb-4"
            >
              <Text className="text-slate-300 text-sm font-medium mb-1.5">Your email (optional)</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="email@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="bg-slate-800 rounded-xl px-4 py-3.5 text-white text-base"
              />
              <Text className="text-slate-500 text-xs">So we can follow up on your request</Text>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(350).springify()}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className={`rounded-xl py-4 items-center flex-row justify-center ${
                  isSubmitting || !title.trim() || !description.trim() ? 'bg-cyan-600/40' : 'bg-cyan-500 active:bg-cyan-600'
                }`}
                style={(!isSubmitting && title.trim() && description.trim()) ? {
                  shadowColor: '#22d3ee',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                } : undefined}
              >
                <Send size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  {isSubmitting ? 'Sending...' : 'Submit Request'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Note */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className="mt-3"
            >
              <Text className="text-slate-500 text-xs text-center">
                Your feature request will be sent directly to our development team.
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
