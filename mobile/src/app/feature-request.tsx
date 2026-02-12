import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lightbulb, Send, CheckCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react-native';
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
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);

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
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
                maxLength={100}
              />
              <Text className="text-slate-500 text-xs mt-1 text-right">{title.length}/100</Text>
            </Animated.View>

            {/* Description Input */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="mb-4"
            >
              <Text className="text-slate-400 text-sm font-medium mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the feature you'd like to see. Include any specific details that would help us understand your request..."
                placeholderTextColor="#64748b"
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 150 }}
                maxLength={1000}
              />
              <Text className="text-slate-500 text-xs mt-1 text-right">{description.length}/1000</Text>
            </Animated.View>

            {/* Reason for Request Input */}
            <Animated.View
              entering={FadeInDown.delay(250).springify()}
              className="mb-4"
            >
              <Text className="text-slate-400 text-sm font-medium mb-2">Reason for request (optional)</Text>
              <TextInput
                value={reasonForRequest}
                onChangeText={setReasonForRequest}
                placeholder="How will this feature help users and improve the app?"
                placeholderTextColor="#64748b"
                autoCapitalize="sentences"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
                maxLength={500}
              />
              <Text className="text-slate-500 text-xs mt-1 text-right">{reasonForRequest.length}/500</Text>
            </Animated.View>

            {/* Contact Email Input */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mb-6"
            >
              <Text className="text-slate-400 text-sm font-medium mb-2">Your email (optional)</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="email@example.com"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="bg-slate-800 rounded-xl px-4 py-4 text-white text-base"
              />
              <Text className="text-slate-500 text-xs mt-1">So we can follow up on your request</Text>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(350).springify()}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`rounded-xl py-4 items-center flex-row justify-center ${
                  isSubmitting ? 'bg-cyan-600/50' : 'bg-cyan-500 active:bg-cyan-600'
                }`}
              >
                <Send size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  {isSubmitting ? 'Sending...' : 'Submit Request'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Note */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className="mt-6"
            >
              <Text className="text-slate-500 text-sm text-center">
                Your feature request will be sent directly to our development team.
              </Text>
            </Animated.View>

            {/* Notices Section */}
            <Animated.View
              entering={FadeInDown.delay(450).springify()}
              className="mt-8"
            >
              <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Notices
              </Text>

              {/* Privacy Policy */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsPrivacyExpanded(!isPrivacyExpanded);
                }}
                className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 active:bg-slate-700/80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-slate-700/50 items-center justify-center mr-3">
                      <FileText size={20} color="#94a3b8" />
                    </View>
                    <Text className="text-white font-semibold">Privacy Policy</Text>
                  </View>
                  {isPrivacyExpanded ? (
                    <ChevronUp size={20} color="#64748b" />
                  ) : (
                    <ChevronDown size={20} color="#64748b" />
                  )}
                </View>

                {isPrivacyExpanded && (
                  <View className="mt-4 pt-4 border-t border-slate-700/50">
                    <Text className="text-cyan-400 font-bold text-lg mb-1">ALIGN Sports Privacy Policy</Text>
                    <Text className="text-slate-500 text-xs mb-4">Effective Date: February 11, 2026 | Developer: ALIGN Apps</Text>

                    <Text className="text-white font-semibold mt-3 mb-2">1. Introduction</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      ALIGN Sports ("we," "our," or "us") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the ALIGN Sports mobile application and related services (the "Services").{'\n\n'}By using the Services, you agree to the practices described in this Privacy Policy.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">2. Information We Collect</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-2">We may collect the following categories of information:</Text>
                    <Text className="text-slate-300 text-sm font-medium mt-2">Personal Information</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-2">• Name{'\n'}• Email address{'\n'}• Phone number (if provided){'\n'}• Date of birth (if provided){'\n'}• Account login credentials</Text>
                    <Text className="text-slate-300 text-sm font-medium mt-2">Usage Information</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-2">• Features used{'\n'}• Team and scheduling activity{'\n'}• RSVP responses{'\n'}• In-app interactions</Text>
                    <Text className="text-slate-300 text-sm font-medium mt-2">Device Information</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-2">• Device type{'\n'}• Operating system{'\n'}• IP address{'\n'}• App version{'\n'}• Push notification token</Text>
                    <Text className="text-slate-300 text-sm font-medium mt-2">Camera and Media Data</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">• Photos or videos captured within the app{'\n'}• Media uploaded by users{'\n'}• Team-related images or announcements{'\n\n'}We only access camera functionality when required for specific features within the app.</Text>

                    <Text className="text-white font-semibold mt-3 mb-2">3. How We Use Your Information</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We use collected information to:{'\n'}• Provide and operate the app{'\n'}• Manage teams, schedules, invites, and announcements{'\n'}• Send push notifications related to team activity{'\n'}• Improve functionality and user experience{'\n'}• Monitor performance and usage trends{'\n'}• Ensure platform security{'\n'}• Prevent fraud or misuse{'\n\n'}We do not sell your personal data.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">4. Camera Permissions and Media Use</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      ALIGN Sports may request access to your device camera for features that allow:{'\n'}• Uploading team photos{'\n'}• Capturing images for announcements{'\n'}• Sharing media within teams{'\n\n'}Important:{'\n'}• Camera access is only used when you choose to use a feature requiring it{'\n'}• You may disable camera access at any time in your device settings{'\n'}• Media is stored securely and only shared within the intended team or group
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">5. Push Notifications</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We may send push notifications for:{'\n'}• Game reminders{'\n'}• Schedule updates{'\n'}• Team announcements{'\n'}• RSVP confirmations{'\n\n'}You may disable push notifications at any time in your device settings.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">6. Information Sharing</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We do not sell your information.{'\n\n'}We may share data with:{'\n'}• Cloud hosting providers{'\n'}• Analytics providers{'\n'}• Infrastructure service providers{'\n\n'}These third parties are contractually obligated to protect your information.{'\n\n'}We may also disclose information:{'\n'}• If required by law{'\n'}• To protect rights, safety, or property{'\n'}• In connection with a business transfer (e.g., merger or acquisition)
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">7. Data Retention</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We retain personal data only as long as necessary to:{'\n'}• Provide the Services{'\n'}• Comply with legal obligations{'\n'}• Resolve disputes{'\n'}• Enforce agreements{'\n\n'}You may request deletion of your account and associated data.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">8. Your Rights and Controls</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      You may:{'\n'}• Request access to your personal data{'\n'}• Correct inaccurate information{'\n'}• Request account deletion{'\n'}• Withdraw consent for certain communications{'\n'}• Disable camera or notification permissions via device settings{'\n\n'}To make a request, contact us at the email below.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">9. Children's Privacy</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      ALIGN Sports is not intended for children under 13.{'\n\n'}We do not knowingly collect personal information from children under 13. If we become aware that we have collected such data, we will delete it promptly.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">10. International Users</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      If you access ALIGN Sports from outside the United States, your information may be transferred to and processed in the United States.{'\n\n'}By using the Services, you consent to this transfer.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">11. Data Security</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We implement reasonable administrative, technical, and physical safeguards to protect your information.{'\n\n'}However, no electronic transmission or storage system can be guaranteed 100% secure.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">12. Changes to This Privacy Policy</Text>
                    <Text className="text-slate-400 text-sm leading-5 mb-3">
                      We may update this Privacy Policy from time to time.{'\n\n'}Changes will be reflected by updating the Effective Date above. Continued use of the Services constitutes acceptance of the updated policy.
                    </Text>

                    <Text className="text-white font-semibold mt-3 mb-2">13. Contact Information</Text>
                    <Text className="text-slate-400 text-sm leading-5">
                      If you have questions about this Privacy Policy, contact:{'\n\n'}Email: support@alignsports.com
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
