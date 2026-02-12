import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export default function NoticesScreen() {
  const router = useRouter();
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(true);

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
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
            <Text className="text-white text-2xl font-bold">Notices</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Privacy Policy */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPrivacyExpanded(!isPrivacyExpanded);
              }}
              className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 active:bg-slate-700/80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
                    <FileText size={20} color="#67e8f9" />
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
                    ALIGN Sports ("we," "our," or "us"), operated by ALIGN Apps, provides a team management platform that allows users to manage schedules, track availability, send invites, post announcements, and communicate within teams (the "Services").{'\n\n'}This Privacy Policy explains how we collect, use, disclose, store, and protect information when you use the ALIGN Sports mobile application.{'\n\n'}By using the Services, you agree to the practices described in this Privacy Policy.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">2. Information We Collect</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">A. Information You Provide</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-2">• Name{'\n'}• Email address{'\n'}• Phone number (if provided){'\n'}• Team information{'\n'}• RSVP responses and availability data{'\n'}• Photos or media you upload{'\n'}• Account credentials</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">B. Automatically Collected Information</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-2">• Device type{'\n'}• Operating system{'\n'}• App version{'\n'}• IP address{'\n'}• Push notification token{'\n'}• In-app usage activity</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">C. Camera and Media Access</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">If you choose to use features that require it, we may access:{'\n'}• Your device camera (to capture photos){'\n'}• Your photo library (to upload images){'\n\n'}Camera and media access are only used when you initiate those features.</Text>

                  <Text className="text-white font-semibold mt-3 mb-2">3. How We Use Your Information</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    We use collected information to:{'\n'}• Create and manage user accounts{'\n'}• Operate scheduling, RSVP, and team communication features{'\n'}• Send push notifications (game reminders, invites, announcements){'\n'}• Improve app functionality and performance{'\n'}• Maintain security and prevent fraud or misuse{'\n'}• Respond to support inquiries{'\n\n'}We do not sell personal information.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">4. Permissions and Device Controls</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">Camera</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-2">Used only when you choose to capture or upload media within the app. You may disable camera access at any time in your device settings.</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">Photo Library</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-2">Used only when uploading images into team features. Access may be disabled at any time in device settings.</Text>
                  <Text className="text-slate-300 text-sm font-medium mt-2">Push Notifications</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">Used to send schedule reminders, RSVP updates, and announcements. Notifications may be disabled in device settings at any time.</Text>

                  <Text className="text-white font-semibold mt-3 mb-2">5. Data Sharing</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    We may share information with service providers that help operate the app, such as:{'\n'}• Cloud hosting providers{'\n'}• Infrastructure providers{'\n'}• Analytics or crash reporting services (if applicable){'\n\n'}These providers process data only to operate or improve the Services and are required to safeguard your information.{'\n\n'}We may disclose information:{'\n'}• If required by law{'\n'}• To protect rights, safety, or property{'\n'}• In connection with a merger, acquisition, or business transfer{'\n\n'}We do not sell user data.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">6. Data Retention</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    We retain personal information only as long as necessary to:{'\n'}• Provide the Services{'\n'}• Comply with legal obligations{'\n'}• Resolve disputes{'\n'}• Enforce agreements{'\n\n'}When an account is deleted, associated personal data is permanently removed as described below.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">7. Delete Your Account</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    You can permanently delete your ALIGN Sports account directly within the app:{'\n\n'}More → Delete My Account → Delete{'\n\n'}To confirm deletion, you must type DELETE when prompted.{'\n\n'}When your account is deleted:{'\n'}• You are removed from the app{'\n'}• All personal data associated with your account is permanently deleted{'\n'}• This action cannot be undone{'\n'}• To use the app again, you must create a new account{'\n\n'}If you cannot access the app and need assistance, contact: support@alignsports.com
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">8. Data Security</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    We implement reasonable administrative, technical, and physical safeguards to protect personal information.{'\n\n'}Data is transmitted using secure methods where applicable.{'\n\n'}However, no method of electronic transmission or storage is completely secure, and absolute security cannot be guaranteed.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">9. Your Rights and Choices</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    Depending on your location, you may have the right to:{'\n'}• Access your personal information{'\n'}• Correct inaccurate information{'\n'}• Request deletion of your account and associated data{'\n'}• Withdraw consent where applicable{'\n'}• Disable device permissions (camera, notifications){'\n\n'}Requests may be submitted to: support@alignsports.com
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">10. Children's Privacy</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    ALIGN Sports is not intended for children under 13.{'\n\n'}We do not knowingly collect personal information from children under 13. If such data is discovered, it will be deleted promptly.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">11. International Users</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    If you access the Services from outside the United States, your information may be transferred to and processed in the United States.{'\n\n'}By using the Services, you consent to this transfer.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">12. Changes to This Privacy Policy</Text>
                  <Text className="text-slate-400 text-sm leading-5 mb-3">
                    We may update this Privacy Policy from time to time. Updates will be reflected by revising the Effective Date above.{'\n\n'}Continued use of the Services after changes constitutes acceptance of the updated policy.
                  </Text>

                  <Text className="text-white font-semibold mt-3 mb-2">13. Contact Information</Text>
                  <Text className="text-slate-400 text-sm leading-5">
                    ALIGN Apps{'\n'}Email: support@alignsports.com
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
