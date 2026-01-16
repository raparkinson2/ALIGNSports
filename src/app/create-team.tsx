import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, User, Mail, Lock, Users, Check, ShieldQuestion, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Sport, SPORT_NAMES, SECURITY_QUESTIONS, SecurityQuestion } from '@/lib/store';
import { cn } from '@/lib/cn';
import Svg, { Path, Circle as SvgCircle, Line, Ellipse } from 'react-native-svg';

// Sport Icons
function HockeyIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3L4 17L8 21L12 21L12 17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M4 17L12 17" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx="18" cy="19" rx="4" ry="2" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function BaseballIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M7 5C8 7 8 9 7 12C6 15 6 17 7 19" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M17 5C16 7 16 9 17 12C18 15 18 17 17 19" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function BasketballIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth={1.5} />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={1.5} />
      <Path d="M8 3.5C6 6 5 9 5 12C5 15 6 18 8 20.5" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M16 3.5C18 6 19 9 19 12C19 15 18 18 16 20.5" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function SoccerIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 8L15 10.5L13.5 14.5H10.5L9 10.5L12 8Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" fill={color} />
      <Line x1="12" y1="8" x2="12" y2="3.5" stroke={color} strokeWidth={1.5} />
      <Line x1="15" y1="10.5" x2="20" y2="9" stroke={color} strokeWidth={1.5} />
      <Line x1="13.5" y1="14.5" x2="17" y2="19" stroke={color} strokeWidth={1.5} />
      <Line x1="10.5" y1="14.5" x2="7" y2="19" stroke={color} strokeWidth={1.5} />
      <Line x1="9" y1="10.5" x2="4" y2="9" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function SportIcon({ sport, color, size = 24 }: { sport: Sport; color: string; size?: number }) {
  switch (sport) {
    case 'hockey': return <HockeyIcon color={color} size={size} />;
    case 'baseball': return <BaseballIcon color={color} size={size} />;
    case 'basketball': return <BasketballIcon color={color} size={size} />;
    case 'soccer': return <SoccerIcon color={color} size={size} />;
  }
}

export default function CreateTeamScreen() {
  const router = useRouter();
  const registerAdmin = useTeamStore((s) => s.registerAdmin);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const setTeamName = useTeamStore((s) => s.setTeamName);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const isLoggedIn = useTeamStore((s) => s.isLoggedIn);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const players = useTeamStore((s) => s.players);

  // Check if user came from Apple Sign In (already logged in with a player created)
  const isAppleUser = isLoggedIn && currentPlayerId && players.length > 0;

  const [step, setStep] = useState(isAppleUser ? 4 : 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<SecurityQuestion | ''>('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [sport, setSport] = useState<Sport>('hockey');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      if (!password.trim()) {
        setError('Please create a password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(3);
    } else if (step === 3) {
      if (!securityQuestion) {
        setError('Please select a security question');
        return;
      }
      if (!securityAnswer.trim()) {
        setError('Please enter your answer');
        return;
      }
      if (securityAnswer.trim().length < 2) {
        setError('Answer must be at least 2 characters');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(4);
    } else if (step === 4) {
      if (!teamNameInput.trim()) {
        setError('Please enter a team name');
        return;
      }
      handleCreateTeam();
    }
  };

  const handleCreateTeam = () => {
    setIsLoading(true);

    setTimeout(() => {
      // First set the sport
      setTeamSettings({ sport });

      // If user came from Apple Sign In, they're already registered
      // Just set the team name and navigate
      if (isAppleUser) {
        setTeamName(teamNameInput.trim());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
        setIsLoading(false);
        return;
      }

      // Otherwise register the admin with email/password
      const result = registerAdmin(name.trim(), email.trim(), password, teamNameInput.trim());

      if (result.success) {
        // Get the current state to find the newly created player
        const currentState = useTeamStore.getState();
        const newPlayer = currentState.players.find(p => p.email?.toLowerCase() === email.trim().toLowerCase());
        if (newPlayer && securityQuestion) {
          updatePlayer(newPlayer.id, {
            securityQuestion: securityQuestion as SecurityQuestion,
            securityAnswer: securityAnswer.trim().toLowerCase(),
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Failed to create team');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />

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
            className="flex-row items-center px-5 pt-2 pb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Apple users start at step 4 and can't go back to steps 1-3
                if (step > 1 && !isAppleUser) {
                  setStep(step - 1);
                  setError('');
                } else {
                  router.back();
                }
              }}
              className="flex-row items-center"
            >
              <ChevronLeft size={24} color="#67e8f9" />
              <Text className="text-cyan-400 text-base ml-1">Back</Text>
            </Pressable>
          </Animated.View>

          {/* Progress Indicator - hide for Apple users who only see step 4 */}
          {!isAppleUser && (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="px-6 mb-6"
            >
              <View className="flex-row items-center justify-center">
                {[1, 2, 3, 4].map((s) => (
                  <View key={s} className="flex-row items-center">
                    <View
                      className={cn(
                        'w-8 h-8 rounded-full items-center justify-center',
                        step >= s ? 'bg-cyan-500' : 'bg-slate-700'
                      )}
                    >
                      {step > s ? (
                        <Check size={16} color="white" />
                      ) : (
                        <Text className={cn('font-bold', step >= s ? 'text-white' : 'text-slate-400')}>
                          {s}
                        </Text>
                      )}
                    </View>
                    {s < 4 && (
                      <View
                        className={cn(
                          'w-8 h-1 mx-1',
                          step > s ? 'bg-cyan-500' : 'bg-slate-700'
                        )}
                      />
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <User size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Your Info</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Tell us about yourself
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Your Name</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <User size={20} color="#64748b" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Full name"
                      placeholderTextColor="#64748b"
                      autoCapitalize="words"
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Email Address</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Mail size={20} color="#64748b" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <Lock size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Create Password</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Secure your account
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Password</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a password"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Confirm Password</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Step 3: Security Question */}
            {step === 3 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <ShieldQuestion size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Security Question</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    This will help you recover your account
                  </Text>
                </View>

                {/* Security Question Selector */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Select a Question</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowQuestionPicker(true);
                    }}
                    className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4 py-4"
                  >
                    <ShieldQuestion size={20} color="#64748b" />
                    <Text className={`flex-1 px-3 text-base ${securityQuestion ? 'text-white' : 'text-slate-500'}`}>
                      {securityQuestion || 'Choose a security question'}
                    </Text>
                    <ChevronDown size={20} color="#64748b" />
                  </Pressable>
                </View>

                {/* Security Answer */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Your Answer</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Lock size={20} color="#64748b" />
                    <TextInput
                      value={securityAnswer}
                      onChangeText={setSecurityAnswer}
                      placeholder="Enter your answer"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                  <Text className="text-slate-500 text-xs mt-2">
                    Answers are not case-sensitive
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Step 4: Team Info */}
            {step === 4 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <Users size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Team Details</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Set up your team
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-2">Team Name</Text>
                  <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                    <Users size={20} color="#64748b" />
                    <TextInput
                      value={teamNameInput}
                      onChangeText={setTeamNameInput}
                      placeholder="Enter team name"
                      placeholderTextColor="#64748b"
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-3">Sport</Text>
                  <View className="flex-row flex-wrap justify-between">
                    {(Object.keys(SPORT_NAMES) as Sport[]).map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSport(s);
                        }}
                        className={cn(
                          'w-[48%] items-center py-4 rounded-xl mb-3 border',
                          sport === s
                            ? 'bg-cyan-500/20 border-cyan-500/50'
                            : 'bg-slate-800/80 border-slate-700/50'
                        )}
                      >
                        <SportIcon
                          sport={s}
                          size={28}
                          color={sport === s ? '#67e8f9' : '#64748b'}
                        />
                        <Text
                          className={cn(
                            'mt-2 font-medium',
                            sport === s ? 'text-cyan-400' : 'text-slate-400'
                          )}
                        >
                          {SPORT_NAMES[s]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Error Message */}
            {error ? (
              <Animated.View entering={FadeInDown.springify()}>
                <Text className="text-red-400 text-center mb-4">{error}</Text>
              </Animated.View>
            ) : null}

            {/* Continue Button */}
            <Pressable
              onPress={handleNext}
              disabled={isLoading}
              className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 disabled:opacity-50 mb-8"
            >
              <Text className="text-white font-semibold text-lg">
                {isLoading ? 'Creating Team...' : step === 4 ? 'Create Team' : 'Continue'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Security Question Picker Modal */}
      <Modal
        visible={showQuestionPicker}
        animationType="slide"
        transparent
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-slate-900 rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-white text-lg font-bold">Select a Question</Text>
              <Pressable
                onPress={() => setShowQuestionPicker(false)}
                className="px-4 py-2"
              >
                <Text className="text-cyan-400 font-semibold">Done</Text>
              </Pressable>
            </View>
            <ScrollView className="px-5 py-4">
              {SECURITY_QUESTIONS.map((question) => (
                <Pressable
                  key={question}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSecurityQuestion(question);
                    setShowQuestionPicker(false);
                  }}
                  className={`py-4 px-4 rounded-xl mb-2 ${
                    securityQuestion === question
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'bg-slate-800/50'
                  }`}
                >
                  <Text className={`text-base ${securityQuestion === question ? 'text-cyan-400' : 'text-white'}`}>
                    {question}
                  </Text>
                </Pressable>
              ))}
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
