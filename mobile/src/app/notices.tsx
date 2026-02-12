import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export default function NoticesScreen() {
  const router = useRouter();
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(true);

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
      </SafeAreaView>
    </View>
  );
}
