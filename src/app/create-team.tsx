import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, User, Mail, Lock, Users, Check, ShieldQuestion, ChevronDown, Palette, Plus, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Sport, SPORT_NAMES, SECURITY_QUESTIONS, SecurityQuestion } from '@/lib/store';
import { cn } from '@/lib/cn';
import Svg, { Path, Circle as SvgCircle, Line, Ellipse } from 'react-native-svg';

// Preset jersey colors for quick selection
const PRESET_COLORS = [
  { name: 'White', color: '#ffffff' },
  { name: 'Black', color: '#1a1a1a' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Navy', color: '#1e3a5f' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Teal', color: '#0d9488' },
  { name: 'Maroon', color: '#7f1d1d' },
  { name: 'Gold', color: '#ca8a04' },
];

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
  const players = useTeamStore((s) => s.players);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<SecurityQuestion | ''>('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [sport, setSport] = useState<Sport>('hockey');
  const [jerseyColors, setJerseyColors] = useState<{ name: string; color: string }[]>([
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#1a1a1a' },
  ]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('At least one lowercase letter');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) errors.push('At least one special symbol');
    return errors;
  };

  const passwordErrors = password.length > 0 ? validatePassword(password) : [];
  const isPasswordValid = passwordErrors.length === 0 && password.length > 0;

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
      // Check if email is already in use
      const existingPlayer = players.find(p => p.email?.toLowerCase() === email.trim().toLowerCase());
      if (existingPlayer) {
        setError('An account with this email already exists. Please sign in instead.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      if (!password.trim()) {
        setError('Please create a password');
        return;
      }
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setError('Password does not meet requirements');
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(5);
    } else if (step === 5) {
      if (jerseyColors.length < 1) {
        setError('Please add at least one jersey color');
        return;
      }
      handleCreateTeam();
    }
  };

  const handleAddJerseyColor = (preset: { name: string; color: string }) => {
    // Check if already added
    if (jerseyColors.some(c => c.name === preset.name)) {
      // Remove it
      setJerseyColors(jerseyColors.filter(c => c.name !== preset.name));
    } else {
      // Add it
      setJerseyColors([...jerseyColors, preset]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveJerseyColor = (name: string) => {
    setJerseyColors(jerseyColors.filter(c => c.name !== name));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateTeam = () => {
    setIsLoading(true);

    setTimeout(() => {
      // First set the sport and jersey colors
      setTeamSettings({ sport, jerseyColors });

      // Register the admin with email/password
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
                if (step > 1) {
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

          {/* Progress Indicator */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="px-6 mb-6"
          >
            <View className="flex-row items-center justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <View key={s} className="flex-row items-center">
                  <View
                    className={cn(
                      'w-7 h-7 rounded-full items-center justify-center',
                      step >= s ? 'bg-cyan-500' : 'bg-slate-700'
                    )}
                  >
                    {step > s ? (
                      <Check size={14} color="white" />
                    ) : (
                      <Text className={cn('font-bold text-sm', step >= s ? 'text-white' : 'text-slate-400')}>
                        {s}
                      </Text>
                    )}
                  </View>
                  {s < 5 && (
                    <View
                      className={cn(
                        'w-6 h-1 mx-0.5',
                        step > s ? 'bg-cyan-500' : 'bg-slate-700'
                      )}
                    />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

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

                {/* Password Requirements */}
                <View className="mb-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <Text className="text-slate-400 text-sm mb-2">Password must have:</Text>
                  {[
                    { label: 'At least 8 characters', met: password.length >= 8 },
                    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
                    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
                    { label: 'At least one special symbol', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
                  ].map((req) => (
                    <View key={req.label} className="flex-row items-center mt-1">
                      <View className={cn(
                        'w-4 h-4 rounded-full items-center justify-center mr-2',
                        password.length > 0 && req.met ? 'bg-green-500' : 'bg-slate-600'
                      )}>
                        {password.length > 0 && req.met && <Check size={10} color="white" />}
                      </View>
                      <Text className={cn(
                        'text-sm',
                        password.length > 0 && req.met ? 'text-green-400' : 'text-slate-500'
                      )}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
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
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <Text className="text-red-400 text-sm mt-2">Passwords do not match</Text>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && isPasswordValid && (
                    <Text className="text-green-400 text-sm mt-2">Passwords match</Text>
                  )}
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

            {/* Step 5: Jersey Colors */}
            {step === 5 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <Palette size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Jersey Colors</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Select your team's jersey colors
                  </Text>
                </View>

                {/* Selected Colors */}
                {jerseyColors.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Selected Colors</Text>
                    <View className="flex-row flex-wrap">
                      {jerseyColors.map((color) => (
                        <View
                          key={color.name}
                          className="flex-row items-center bg-slate-800/80 rounded-full px-3 py-2 mr-2 mb-2 border border-slate-700/50"
                        >
                          <View
                            className="w-5 h-5 rounded-full mr-2"
                            style={{
                              backgroundColor: color.color,
                              borderWidth: color.color === '#ffffff' ? 1 : 0,
                              borderColor: '#64748b',
                            }}
                          />
                          <Text className="text-white text-sm">{color.name}</Text>
                          <Pressable
                            onPress={() => handleRemoveJerseyColor(color.name)}
                            className="ml-2 p-1"
                          >
                            <X size={14} color="#ef4444" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Available Colors */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-3">Tap to add colors</Text>
                  <View className="flex-row flex-wrap justify-between">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected = jerseyColors.some(c => c.name === preset.name);
                      return (
                        <Pressable
                          key={preset.name}
                          onPress={() => handleAddJerseyColor(preset)}
                          className={cn(
                            'w-[31%] items-center py-3 rounded-xl mb-3 border',
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-500/50'
                              : 'bg-slate-800/80 border-slate-700/50'
                          )}
                        >
                          <View
                            className="w-10 h-10 rounded-full mb-2"
                            style={{
                              backgroundColor: preset.color,
                              borderWidth: preset.color === '#ffffff' ? 2 : 0,
                              borderColor: '#64748b',
                            }}
                          />
                          <Text
                            className={cn(
                              'text-xs font-medium',
                              isSelected ? 'text-cyan-400' : 'text-slate-400'
                            )}
                          >
                            {preset.name}
                          </Text>
                          {isSelected && (
                            <View className="absolute top-1 right-1">
                              <Check size={14} color="#67e8f9" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
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
                {isLoading ? 'Creating Team...' : step === 5 ? 'Create Team' : 'Continue'}
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
