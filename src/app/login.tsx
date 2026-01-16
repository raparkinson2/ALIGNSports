import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, UserPlus, Users, User, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTeamStore, Player, getPlayerName } from '@/lib/store';

interface PlayerLoginCardProps {
  player: Player;
  index: number;
  onSelect: () => void;
}

function PlayerLoginCard({ player, index, onSelect }: PlayerLoginCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect();
        }}
        className="bg-slate-800/80 rounded-xl p-3 mb-2 border border-slate-700/50 active:bg-slate-700/80"
      >
        <View className="flex-row items-center">
          {player.avatar ? (
            <Image
              source={{ uri: player.avatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-11 h-11 rounded-full bg-cyan-500/20 items-center justify-center">
              <User size={22} color="#67e8f9" />
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold">{getPlayerName(player)}</Text>
            <Text className="text-slate-400 text-sm">#{player.number} - {player.position}</Text>
          </View>
          <ChevronRight size={20} color="#67e8f9" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const loginWithEmail = useTeamStore((s) => s.loginWithEmail);
  const loginWithApple = useTeamStore((s) => s.loginWithApple);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);
  const setCurrentPlayerId = useTeamStore((s) => s.setCurrentPlayerId);
  const setIsLoggedIn = useTeamStore((s) => s.setIsLoggedIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check if Apple Authentication is available on this device
  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
  }, []);

  const hasTeam = players.length > 0;

  // Check if any players have passwords set (new auth system)
  const hasPasswordAuth = players.some(p => p.password);

  // Players without passwords (legacy)
  const legacyPlayers = players.filter(p => !p.password);

  const handleAppleSignIn = async () => {
    try {
      console.log('Starting Apple Sign In...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', {
        user: credential.user ? 'present' : 'missing',
        email: credential.email || 'not provided',
        fullName: credential.fullName?.givenName || 'not provided',
      });

      // Check if this is the first user (creating a new team)
      const isCreatingNewTeam = players.length === 0;

      const result = loginWithApple(
        credential.user,
        credential.email,
        credential.fullName
      );

      console.log('Login result:', result);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.isNewUser && isCreatingNewTeam) {
          // First user - needs to set up team
          router.replace('/create-team');
        } else if (result.isNewUser) {
          // New user joining existing team - go to app, they can edit profile from settings
          router.replace('/(tabs)');
        } else {
          // Existing user - go to app
          router.replace('/(tabs)');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Apple Sign In failed');
      }
    } catch (e: unknown) {
      console.log('Apple Sign In error:', e);
      const error = e as { code?: string };
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled - no error needed
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Apple Sign In failed. Please try again.');
    }
  };

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

  const handleSelectPlayer = (playerId: string) => {
    setCurrentPlayerId(playerId);
    setIsLoggedIn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  // Show player selection for legacy teams (no passwords set)
  if (hasTeam && !hasPasswordAuth) {
    return (
      <View className="flex-1 bg-slate-900">
        <LinearGradient
          colors={['#0c4a6e', '#0f172a', '#0f172a']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1">
          <Animated.View
            entering={FadeInUp.delay(50).springify()}
            className="items-center pt-8 pb-6"
          >
            <View className="w-20 h-20 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
              <Users size={40} color="#67e8f9" />
            </View>
            <Text className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-1">
              Welcome to
            </Text>
            <Text className="text-white text-3xl font-bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{teamName}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="px-5 mb-4"
          >
            <Text className="text-slate-400 text-base mb-2">
              Select your name to continue
            </Text>
          </Animated.View>

          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {players.map((player, index) => (
              <PlayerLoginCard
                key={player.id}
                player={player}
                index={index}
                onSelect={() => handleSelectPlayer(player.id)}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Show player selection modal for legacy players
  if (showPlayerSelect && legacyPlayers.length > 0) {
    return (
      <View className="flex-1 bg-slate-900">
        <LinearGradient
          colors={['#0c4a6e', '#0f172a', '#0f172a']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1">
          <Animated.View
            entering={FadeInUp.delay(50).springify()}
            className="items-center pt-8 pb-6"
          >
            <View className="w-20 h-20 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
              <Users size={40} color="#67e8f9" />
            </View>
            <Text className="text-cyan-400 text-sm font-medium uppercase tracking-wider mb-1">
              Quick Login
            </Text>
            <Text className="text-white text-3xl font-bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{teamName}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="px-5 mb-4"
          >
            <Text className="text-slate-400 text-base mb-2">
              Select your name to continue
            </Text>
          </Animated.View>

          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {legacyPlayers.map((player, index) => (
              <PlayerLoginCard
                key={player.id}
                player={player}
                index={index}
                onSelect={() => handleSelectPlayer(player.id)}
              />
            ))}
          </ScrollView>

          <View className="px-5 pb-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPlayerSelect(false);
              }}
              className="bg-slate-800/80 rounded-xl py-4 flex-row items-center justify-center border border-slate-700/50"
            >
              <Text className="text-slate-400 font-semibold">Back to Sign In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0c4a6e', '#0f172a', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
          {/* Header */}
          <Animated.View
            entering={FadeInUp.delay(50).springify()}
            className="items-center pt-8 pb-6"
          >
            <Image
              source={require('../../assets/align-logo.png')}
              style={{ width: 160, height: 160, marginBottom: 24 }}
              contentFit="contain"
            />
            {!hasTeam && (
              <Text className="text-slate-300 text-lg text-center px-10 leading-relaxed">
                Log in or create a new team to get started
              </Text>
            )}
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-1 px-6"
          >
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

            {/* Sign In with Apple - only when available */}
            {isAppleAuthAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={{ width: '100%', height: 52, marginTop: 12 }}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-slate-700" />
              <Text className="text-slate-500 mx-4">or</Text>
              <View className="flex-1 h-px bg-slate-700" />
            </View>

            {/* Create Team Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-team');
              }}
              className="bg-slate-800/80 rounded-xl py-4 flex-row items-center justify-center border border-slate-700/50 active:bg-slate-700/80 mb-3"
            >
              <Users size={20} color="#67e8f9" />
              <Text className="text-cyan-400 font-semibold text-base ml-2">
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
          </Animated.View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
