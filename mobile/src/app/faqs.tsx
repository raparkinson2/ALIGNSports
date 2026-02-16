import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).springify()}
      className="mb-4"
    >
      <View className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
        <Text className="text-green-400 font-semibold mb-2">{question}</Text>
        <Text className="text-slate-400 text-sm leading-5">{answer}</Text>
      </View>
    </Animated.View>
  );
}

export default function FAQsScreen() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How do I check in for a game?',
      answer: 'Go to the Schedule tab, tap on the game you want to check in for, then tap the check-in button next to your name. You can mark yourself as "In" or "Out".',
    },
    {
      question: 'How do I set my unavailable dates?',
      answer: 'Go to More → My Availability. Here you can select dates when you\'ll be unavailable. The app will automatically check you out (mark you as "Out") for any games or practices that fall on your unavailable dates. This saves you time so you don\'t have to manually update your status for each event.',
    },
    {
      question: 'How do I create a poll?',
      answer: 'Go to More → Team Polls and tap the "+" button. You can create single or multiple choice polls, set deadlines, and notify team members.',
    },
    {
      question: "What's the difference between roles?",
      answer: 'Admins have full access to all features including payments and player management. Coaches can edit player profiles and stats. Captains can manage games and lineups. Parents have view-only access to schedule, roster, and payments.',
    },
    {
      question: 'How do I switch between teams?',
      answer: "If you're on multiple teams, go to More → Switch Team. You'll see all teams you belong to and can tap to switch between them.",
    },
    {
      question: 'How do I delete my account?',
      answer: 'Go to More → scroll to the bottom → Delete My Account. You\'ll need to type "DELETE" to confirm. This action is permanent and cannot be undone.',
    },
  ];

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
            <Text className="text-slate-400 text-sm font-medium">Support</Text>
            <Text className="text-white text-2xl font-bold">FAQs</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center">
            <HelpCircle size={20} color="#22c55e" />
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
