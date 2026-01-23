import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Users, User, ChevronRight, X, KeyRound, ShieldQuestion, Phone } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Player, getPlayerName } from '@/lib/store';
import { formatPhoneInput, unformatPhone } from '@/lib/phone';
import { signInWithEmail, resetPassword as supabaseResetPassword } from '@/lib/supabase-auth';

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
  const loginWithPhone = useTeamStore((s) => s.loginWithPhone);
  const players = useTeamStore((s) => s.players);
  const teamName = useTeamStore((s) => s.teamName);
  const setCurrentPlayerId = useTeamStore((s) => s.setCurrentPlayerId);
  const setIsLoggedIn = useTeamStore((s) => s.setIsLoggedIn);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const findPlayerByEmail = useTeamStore((s) => s.findPlayerByEmail);
  const findPlayerByPhone = useTeamStore((s) => s.findPlayerByPhone);

  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'identifier' | 'security' | 'password'>('identifier');
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);

  const hasTeam = players.length > 0;

  // Check if any players have passwords set (new auth system)
  const hasPasswordAuth = players.some(p => p.password);

  // Players without passwords (legacy)
  const legacyPlayers = players.filter(p => !p.password);

  // Helper to detect if input is phone or email
  const isPhoneNumber = (value: string): boolean => {
    const digitsOnly = value.replace(/\D/g, '');
    // If it starts with digits and has mostly digits, treat as phone
    return digitsOnly.length >= 7 && !/[@]/.test(value);
  };

  // Format input as user types (phone formatting if it looks like a phone)
  const handleIdentifierChange = (text: string) => {
    // If it contains @, it's definitely an email - don't format
    if (text.includes('@')) {
      setIdentifier(text);
      return;
    }

    // If it's all digits or phone-like characters, format as phone
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length === text.replace(/[\s\-\(\)]/g, '').length) {
      setIdentifier(formatPhoneInput(text));
    } else {
      setIdentifier(text);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetIdentifier('');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setResetStep('identifier');
    setFoundPlayer(null);
  };

  const handleFindAccount = async () => {
    const trimmedInput = resetIdentifier.trim();

    // For email, send Supabase password reset
    if (!isPhoneNumber(trimmedInput) && trimmedInput.includes('@')) {
      setIsLoading(true);
      const result = await supabaseResetPassword(trimmedInput);
      setIsLoading(false);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Check Your Email',
          'We sent a password reset link to your email. Please check your inbox and follow the instructions.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        );
        return;
      }
    }

    // Fallback to local security question flow
    let player: Player | undefined;

    if (isPhoneNumber(trimmedInput)) {
      player = findPlayerByPhone(unformatPhone(trimmedInput));
    } else {
      player = findPlayerByEmail(trimmedInput);
    }

    if (player) {
      setFoundPlayer(player);
      // If player has a security question, go to security step; otherwise skip to password
      if (player.securityQuestion && player.securityAnswer) {
        setResetStep('security');
      } else {
        setResetStep('password');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Account Not Found', 'No account found with this email or phone number. Please check and try again.');
    }
  };

  const handleVerifySecurityAnswer = () => {
    if (!securityAnswer.trim()) {
      Alert.alert('Answer Required', 'Please enter your answer to the security question.');
      return;
    }
    if (foundPlayer && foundPlayer.securityAnswer) {
      if (securityAnswer.trim().toLowerCase() === foundPlayer.securityAnswer.toLowerCase()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResetStep('password');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Incorrect Answer', 'The answer you provided does not match. Please try again.');
      }
    }
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please make sure your passwords match.');
      return;
    }
    if (foundPlayer) {
      updatePlayer(foundPlayer.id, { password: newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password Reset', 'Your password has been reset. You can now sign in with your new password.');
      setShowForgotPassword(false);
      setIdentifier(resetIdentifier);
      setPassword('');
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();

      // Try Supabase authentication first (for email)
      if (!isPhoneNumber(trimmedIdentifier)) {
        const supabaseResult = await signInWithEmail(trimmedIdentifier, password);

        if (supabaseResult.success) {
          // Also update local store for offline capability
          const localResult = loginWithEmail(trimmedIdentifier, password);
          if (localResult.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Check if user belongs to multiple teams
            if (localResult.multipleTeams) {
              router.replace('/select-team');
            } else {
              router.replace('/(tabs)');
            }
            setIsLoading(false);
            return;
          }
          // If local store doesn't have the user, still proceed
          // The user exists in Supabase but may need to sync locally
          setCurrentPlayerId('');
          setIsLoggedIn(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/(tabs)');
          setIsLoading(false);
          return;
        }
      }

      // Fallback to local authentication (for phone or if Supabase fails)
      const result = isPhoneNumber(trimmedIdentifier)
        ? loginWithPhone(unformatPhone(trimmedIdentifier), password)
        : loginWithEmail(trimmedIdentifier, password);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Check if user belongs to multiple teams
        if (result.multipleTeams) {
          router.replace('/select-team');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Something went wrong. Please try again.');
    }

    setIsLoading(false);
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
            <Text className="text-slate-300 text-lg text-center px-10 leading-relaxed">
              Sign in or create a new team to get started
            </Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-1 px-6"
          >
            {/* Email/Phone Input */}
            <View className="mb-4">
              <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                {isPhoneNumber(identifier) ? (
                  <Phone size={20} color="#64748b" />
                ) : (
                  <Mail size={20} color="#64748b" />
                )}
                <TextInput
                  value={identifier}
                  onChangeText={handleIdentifierChange}
                  placeholder="Email or phone number"
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

            {/* Forgot Password Link */}
            <Pressable
              onPress={handleForgotPassword}
              className="py-3 mt-2"
            >
              <Text className="text-cyan-400 text-center text-sm">Forgot Password?</Text>
            </Pressable>

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
                Invited to Join a Team
              </Text>
            </Pressable>
          </Animated.View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-slate-900 rounded-t-3xl">
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
                <Text className="text-white text-lg font-bold">Reset Password</Text>
                <Pressable
                  onPress={() => setShowForgotPassword(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
                >
                  <X size={18} color="#94a3b8" />
                </Pressable>
              </View>

              <View className="px-5 py-6">
                {resetStep === 'identifier' ? (
                  <>
                    {/* Identifier Step */}
                    <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center self-center mb-4">
                      <Mail size={32} color="#67e8f9" />
                    </View>
                    <Text className="text-white text-center text-lg font-semibold mb-2">
                      Find Your Account
                    </Text>
                    <Text className="text-slate-400 text-center mb-6">
                      Enter the email or phone number associated with your account
                    </Text>

                    <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4 mb-4">
                      {isPhoneNumber(resetIdentifier) ? (
                        <Phone size={20} color="#64748b" />
                      ) : (
                        <Mail size={20} color="#64748b" />
                      )}
                      <TextInput
                        value={resetIdentifier}
                        onChangeText={(text) => {
                          if (text.includes('@')) {
                            setResetIdentifier(text);
                          } else {
                            const digitsOnly = text.replace(/\D/g, '');
                            if (digitsOnly.length > 0 && digitsOnly.length === text.replace(/[\s\-\(\)]/g, '').length) {
                              setResetIdentifier(formatPhoneInput(text));
                            } else {
                              setResetIdentifier(text);
                            }
                          }
                        }}
                        placeholder="Email or phone number"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="flex-1 py-4 px-3 text-white text-base"
                      />
                    </View>

                    <Pressable
                      onPress={handleFindAccount}
                      disabled={!resetIdentifier.trim()}
                      className="bg-cyan-500 rounded-xl py-4 items-center active:bg-cyan-600 disabled:opacity-50"
                    >
                      <Text className="text-white font-semibold text-base">Find Account</Text>
                    </Pressable>
                  </>
                ) : resetStep === 'security' ? (
                  <>
                    {/* Security Question Step */}
                    <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center self-center mb-4">
                      <ShieldQuestion size={32} color="#f59e0b" />
                    </View>
                    <Text className="text-white text-center text-lg font-semibold mb-2">
                      Security Question
                    </Text>
                    <Text className="text-slate-400 text-center mb-2">
                      Account found for {getPlayerName(foundPlayer!)}
                    </Text>
                    <Text className="text-slate-300 text-center mb-6 font-medium">
                      {foundPlayer?.securityQuestion}
                    </Text>

                    <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4 mb-2">
                      <Lock size={20} color="#64748b" />
                      <TextInput
                        value={securityAnswer}
                        onChangeText={setSecurityAnswer}
                        placeholder="Your answer"
                        placeholderTextColor="#64748b"
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="flex-1 py-4 px-3 text-white text-base"
                      />
                    </View>
                    <Text className="text-slate-500 text-xs mb-4">
                      Answers are not case-sensitive
                    </Text>

                    <Pressable
                      onPress={handleVerifySecurityAnswer}
                      disabled={!securityAnswer.trim()}
                      className="bg-cyan-500 rounded-xl py-4 items-center active:bg-cyan-600 disabled:opacity-50 mb-3"
                    >
                      <Text className="text-white font-semibold text-base">Verify Answer</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setResetStep('identifier');
                        setSecurityAnswer('');
                      }}
                      className="py-3"
                    >
                      <Text className="text-slate-400 text-center">Try a different email or phone</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* Password Reset Step */}
                    <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center self-center mb-4">
                      <KeyRound size={32} color="#22c55e" />
                    </View>
                    <Text className="text-white text-center text-lg font-semibold mb-2">
                      Create New Password
                    </Text>
                    <Text className="text-slate-400 text-center mb-6">
                      Account found for {getPlayerName(foundPlayer!)}. Enter your new password below.
                    </Text>

                    <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4 mb-4">
                      <Lock size={20} color="#64748b" />
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New password"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        className="flex-1 py-4 px-3 text-white text-base"
                      />
                    </View>

                    <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4 mb-4">
                      <Lock size={20} color="#64748b" />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm password"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        className="flex-1 py-4 px-3 text-white text-base"
                      />
                    </View>

                    {newPassword.length > 0 && newPassword.length < 6 && (
                      <Text className="text-amber-400 text-sm mb-4">Password must be at least 6 characters</Text>
                    )}
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <Text className="text-red-400 text-sm mb-4">Passwords do not match</Text>
                    )}

                    <Pressable
                      onPress={handleResetPassword}
                      disabled={newPassword.length < 6 || newPassword !== confirmPassword}
                      className="bg-cyan-500 rounded-xl py-4 items-center active:bg-cyan-600 disabled:opacity-50 mb-3"
                    >
                      <Text className="text-white font-semibold text-base">Reset Password</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setResetStep('identifier')}
                      className="py-3"
                    >
                      <Text className="text-slate-400 text-center">Try a different email or phone</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
