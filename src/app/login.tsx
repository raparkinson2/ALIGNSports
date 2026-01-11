import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore } from '@/lib/store';

export default function LoginScreen() {
  const router = useRouter();
  const loginWithEmail = useTeamStore((s) => s.loginWithEmail);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasTeam = players.length > 0;

  const handleLogin = () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    // Simulate slight delay for UX
    setTimeout(() => {
      const result = loginWithEmail(email.trim(), password);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Login failed');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0c4a6e', '#0f172a', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInUp.delay(50).springify()}
            className="items-center pt-12 pb-8"
          >
            <View className="w-20 h-20 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
              <Users size={40} color="#67e8f9" />
            </View>
            <Text className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-1">
              {hasTeam ? 'Welcome Back' : 'Team Manager'}
            </Text>
            <Text className="text-white text-3xl font-bold">
              {hasTeam ? teamName : 'Get Started'}
            </Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-1 px-6"
          >
            {hasTeam ? (
              <>
                <Text className="text-slate-400 text-base mb-6 text-center">
                  Sign in to access your team
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Mail size={20} color="#64748b" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-4">
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <Animated.View entering={FadeInDown.springify()}>
                    <Text className="text-red-400 text-center mb-4">{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Login Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 disabled:opacity-50"
                >
                  <LogIn size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </Pressable>

                {/* Divider */}
                <View className="flex-row items-center my-8">
                  <View className="flex-1 h-px bg-slate-700" />
                  <Text className="text-slate-500 mx-4">or</Text>
                  <View className="flex-1 h-px bg-slate-700" />
                </View>

                {/* Create Account Link */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/register');
                  }}
                  className="bg-slate-800/80 rounded-xl py-4 flex-row items-center justify-center border border-slate-700/50 active:bg-slate-700/80"
                >
                  <UserPlus size={20} color="#67e8f9" />
                  <Text className="text-cyan-400 font-semibold text-base ml-2">
                    Create Account
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-slate-400 text-base mb-8 text-center">
                  Create a new team or join an existing one
                </Text>

                {/* Create Team Button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/create-team');
                  }}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 mb-4"
                >
                  <Users size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Create New Team
                  </Text>
                </Pressable>

                {/* Join Team Button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/register');
                  }}
                  className="bg-slate-800/80 rounded-xl py-4 flex-row items-center justify-center border border-slate-700/50 active:bg-slate-700/80"
                >
                  <UserPlus size={20} color="#67e8f9" />
                  <Text className="text-cyan-400 font-semibold text-base ml-2">
                    I Was Invited to a Team
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
