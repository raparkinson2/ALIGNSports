import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, Mail, Lock, UserPlus, Check, AlertCircle, ShieldQuestion, ChevronDown, Camera, ImageIcon, SkipForward, Phone } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTeamStore, SECURITY_QUESTIONS, SecurityQuestion } from '@/lib/store';
import { cn } from '@/lib/cn';
import { formatPhoneInput, unformatPhone } from '@/lib/phone';

export default function RegisterScreen() {
  const router = useRouter();
  const findPlayerByEmail = useTeamStore((s) => s.findPlayerByEmail);
  const findPlayerByPhone = useTeamStore((s) => s.findPlayerByPhone);
  const registerInvitedPlayer = useTeamStore((s) => s.registerInvitedPlayer);
  const registerInvitedPlayerByPhone = useTeamStore((s) => s.registerInvitedPlayerByPhone);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const teamName = useTeamStore((s) => s.teamName);
  const players = useTeamStore((s) => s.players);

  const [step, setStep] = useState(1);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<SecurityQuestion | ''>('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<{ id: string; firstName: string; lastName: string; number: string } | null>(null);

  const hasTeam = players.length > 0;

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

  const handleCheckInvitation = () => {
    setError('');

    if (loginMethod === 'email') {
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email');
        return;
      }

      const player = findPlayerByEmail(email.trim());

      if (!player) {
        setError('No invitation found for this email. Please ask your team admin to add you first.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (player.password) {
        setError('An account already exists for this email. Please sign in instead.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setFoundPlayer({ id: player.id, firstName: player.firstName, lastName: player.lastName, number: player.number });
    } else {
      const rawPhone = unformatPhone(phone);
      if (!rawPhone || rawPhone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }

      const player = findPlayerByPhone(rawPhone);

      if (!player) {
        setError('No invitation found for this phone number. Please ask your team admin to add you first.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (player.password) {
        setError('An account already exists for this phone number. Please sign in instead.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setFoundPlayer({ id: player.id, firstName: player.firstName, lastName: player.lastName, number: player.number });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(2);
  };

  const handleCreateAccount = () => {
    setError('');

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

    // Move to security question step
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(3);
  };

  const handleFinishRegistration = () => {
    setError('');

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

    // Move to photo step
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(4);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCompleteRegistration = () => {
    setIsLoading(true);

    setTimeout(() => {
      const result = loginMethod === 'email'
        ? registerInvitedPlayer(email.trim(), password)
        : registerInvitedPlayerByPhone(unformatPhone(phone), password);

      if (result.success && result.playerId) {
        // Save security question, answer, and optional avatar
        updatePlayer(result.playerId, {
          securityQuestion: securityQuestion as SecurityQuestion,
          securityAnswer: securityAnswer.trim().toLowerCase(),
          ...(avatar && { avatar }),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Failed to create account');
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
                if (step === 4) {
                  setStep(3);
                  setError('');
                } else if (step === 3) {
                  setStep(2);
                  setError('');
                } else if (step === 2) {
                  setStep(1);
                  setError('');
                  setFoundPlayer(null);
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

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {/* Step 1: Check Email or Phone */}
            {step === 1 && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8 mt-4">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <UserPlus size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Create Account</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    {hasTeam
                      ? `Join ${teamName}`
                      : 'Enter the email or phone number your team admin used to invite you'}
                  </Text>
                </View>

                {/* Email/Phone Toggle */}
                <View className="flex-row mb-4 bg-slate-800/50 rounded-xl p-1">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLoginMethod('email');
                      setError('');
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-lg flex-row items-center justify-center',
                      loginMethod === 'email' ? 'bg-cyan-500' : 'bg-transparent'
                    )}
                  >
                    <Mail size={18} color={loginMethod === 'email' ? 'white' : '#64748b'} />
                    <Text className={cn(
                      'font-semibold ml-2',
                      loginMethod === 'email' ? 'text-white' : 'text-slate-400'
                    )}>Email</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLoginMethod('phone');
                      setError('');
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-lg flex-row items-center justify-center',
                      loginMethod === 'phone' ? 'bg-cyan-500' : 'bg-transparent'
                    )}
                  >
                    <Phone size={18} color={loginMethod === 'phone' ? 'white' : '#64748b'} />
                    <Text className={cn(
                      'font-semibold ml-2',
                      loginMethod === 'phone' ? 'text-white' : 'text-slate-400'
                    )}>Phone</Text>
                  </Pressable>
                </View>

                {/* Email Input */}
                {loginMethod === 'email' && (
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
                )}

                {/* Phone Input */}
                {loginMethod === 'phone' && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Phone Number</Text>
                    <View className="flex-row items-center bg-slate-800/80 rounded-xl border border-slate-700/50 px-4">
                      <Phone size={20} color="#64748b" />
                      <TextInput
                        value={phone}
                        onChangeText={(text) => setPhone(formatPhoneInput(text))}
                        placeholder="(555)123-4567"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                        className="flex-1 py-4 px-3 text-white text-base"
                      />
                    </View>
                  </View>
                )}

                {/* Info Box */}
                <View className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                  <View className="flex-row items-start">
                    <AlertCircle size={20} color="#67e8f9" />
                    <Text className="text-slate-400 text-sm ml-3 flex-1">
                      Your team admin needs to add you to the team first using this {loginMethod === 'email' ? 'email address' : 'phone number'}. If you haven't been invited yet, ask them to add you.
                    </Text>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <Animated.View entering={FadeInDown.springify()}>
                    <Text className="text-red-400 text-center mb-4">{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Continue Button */}
                <Pressable
                  onPress={handleCheckInvitation}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 mb-4"
                >
                  <Text className="text-white font-semibold text-lg">Check Invitation</Text>
                </Pressable>

                {/* Already have account */}
                <Pressable
                  onPress={() => router.back()}
                  className="py-3"
                >
                  <Text className="text-slate-400 text-center">
                    Already have an account? <Text className="text-cyan-400">Sign In</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Step 2: Create Password */}
            {step === 2 && foundPlayer && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                {/* Found Player Card */}
                <View className="bg-green-500/10 rounded-xl p-4 mb-6 border border-green-500/30">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center">
                      <Check size={20} color="#22c55e" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-green-400 font-semibold">Invitation Found!</Text>
                      <Text className="text-slate-400 text-sm">
                        Welcome, {foundPlayer.firstName} {foundPlayer.lastName} (#{foundPlayer.number})
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <Lock size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Create Password</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Secure your account with a password
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

                <View className="mb-6">
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

                {/* Error Message */}
                {error ? (
                  <Animated.View entering={FadeInDown.springify()}>
                    <Text className="text-red-400 text-center mb-4">{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Create Account Button */}
                <Pressable
                  onPress={handleCreateAccount}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 mb-8"
                >
                  <Text className="text-white font-semibold text-lg">Continue</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Step 3: Security Question */}
            {step === 3 && foundPlayer && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8 mt-4">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <ShieldQuestion size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Security Question</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    This will help you recover your account if you forget your password
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
                <View className="mb-6">
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

                {/* Error Message */}
                {error ? (
                  <Animated.View entering={FadeInDown.springify()}>
                    <Text className="text-red-400 text-center mb-4">{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Continue Button */}
                <Pressable
                  onPress={handleFinishRegistration}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 mb-8"
                >
                  <Text className="text-white font-semibold text-lg">Continue</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Step 4: Profile Photo (Optional) */}
            {step === 4 && foundPlayer && (
              <Animated.View entering={FadeInDown.delay(150).springify()}>
                <View className="items-center mb-8 mt-4">
                  <View className="w-16 h-16 rounded-full bg-cyan-500/20 items-center justify-center mb-4 border-2 border-cyan-500/50">
                    <Camera size={32} color="#67e8f9" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Profile Photo</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Add a photo so your teammates can recognize you
                  </Text>
                </View>

                {/* Photo Preview */}
                <View className="items-center mb-6">
                  {avatar ? (
                    <View className="relative">
                      <Image
                        source={{ uri: avatar }}
                        style={{ width: 120, height: 120, borderRadius: 60 }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() => setAvatar(null)}
                        className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 items-center justify-center"
                      >
                        <Text className="text-white font-bold">X</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="w-32 h-32 rounded-full bg-slate-800 items-center justify-center border-2 border-dashed border-slate-600">
                      <ImageIcon size={40} color="#64748b" />
                    </View>
                  )}
                </View>

                {/* Photo Buttons */}
                <View className="flex-row justify-center mb-6">
                  <Pressable
                    onPress={handleTakePhoto}
                    className="flex-row items-center bg-slate-800/80 rounded-xl px-5 py-3 mr-3 border border-slate-700/50 active:bg-slate-700"
                  >
                    <Camera size={20} color="#67e8f9" />
                    <Text className="text-cyan-400 font-medium ml-2">Camera</Text>
                  </Pressable>

                  <Pressable
                    onPress={handlePickImage}
                    className="flex-row items-center bg-slate-800/80 rounded-xl px-5 py-3 border border-slate-700/50 active:bg-slate-700"
                  >
                    <ImageIcon size={20} color="#67e8f9" />
                    <Text className="text-cyan-400 font-medium ml-2">Gallery</Text>
                  </Pressable>
                </View>

                {/* Error Message */}
                {error ? (
                  <Animated.View entering={FadeInDown.springify()}>
                    <Text className="text-red-400 text-center mb-4">{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Complete Registration Button */}
                <Pressable
                  onPress={handleCompleteRegistration}
                  disabled={isLoading}
                  className="bg-cyan-500 rounded-xl py-4 flex-row items-center justify-center active:bg-cyan-600 disabled:opacity-50 mb-3"
                >
                  <Text className="text-white font-semibold text-lg">
                    {isLoading ? 'Creating Account...' : 'Complete Setup'}
                  </Text>
                </Pressable>

                {/* Skip Button */}
                {!avatar && (
                  <Pressable
                    onPress={handleCompleteRegistration}
                    disabled={isLoading}
                    className="flex-row items-center justify-center py-3 mb-8"
                  >
                    <SkipForward size={18} color="#64748b" />
                    <Text className="text-slate-400 font-medium ml-2">Skip for now</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}
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
