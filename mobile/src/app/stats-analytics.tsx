import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, TrendingUp, UserCheck, BarChart3, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore } from '@/lib/store';

export default function StatsAnalyticsScreen() {
  const router = useRouter();
  const showTeamStats = useTeamStore((s) => s.teamSettings.showTeamStats !== false);

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
            <Text className="text-slate-400 text-sm font-medium">Teams</Text>
            <Text className="text-white text-2xl font-bold">Stats and Analytics</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center">
            <TrendingUp size={20} color="#67e8f9" />
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Attendance */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/attendance');
              }}
              className="flex-row items-center py-4 px-4 bg-slate-800/60 rounded-xl mb-3 active:bg-slate-700/80"
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-cyan-500/20">
                <UserCheck size={20} color="#67e8f9" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-white">Attendance</Text>
                <Text className="text-slate-400 text-sm">Track check-ins and attendance rates</Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </Animated.View>

          {/* View Team Stats */}
          {showTeamStats && (
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/team-stats');
                }}
                className="flex-row items-center py-4 px-4 bg-slate-800/60 rounded-xl mb-3 active:bg-slate-700/80"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center bg-cyan-500/20">
                  <BarChart3 size={20} color="#67e8f9" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-white">View Team Stats</Text>
                  <Text className="text-slate-400 text-sm">View player and team statistics</Text>
                </View>
                <ChevronRight size={20} color="#64748b" />
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
