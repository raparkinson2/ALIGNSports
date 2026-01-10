import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  DollarSign,
  Plus,
  X,
  Check,
  ChevronRight,
  CreditCard,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  ExternalLink,
  Calendar,
  ChevronLeft,
  Edit3,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useTeamStore,
  PaymentPeriod,
  PaymentMethod,
  PaymentApp,
  Player,
  PaymentEntry,
} from '@/lib/store';
import { cn } from '@/lib/cn';
import { format, parseISO } from 'date-fns';

const PAYMENT_APP_INFO: Record<PaymentApp, {
  name: string;
  color: string;
  urlScheme: (username: string, amount?: number) => string;
  webFallback?: (username: string) => string;
}> = {
  venmo: {
    name: 'Venmo',
    color: '#3D95CE',
    urlScheme: (username, amount) => `venmo://paycharge?txn=pay&recipients=${username}${amount ? `&amount=${amount}` : ''}`,
    webFallback: (username) => `https://venmo.com/${username.replace('@', '')}`,
  },
  paypal: {
    name: 'PayPal',
    color: '#003087',
    urlScheme: (username) => `https://paypal.me/${username}`,
  },
  zelle: {
    name: 'Zelle',
    color: '#6D1ED4',
    urlScheme: (username) => `zelle://transfer?recipient=${encodeURIComponent(username)}`,
    // Zelle has no web fallback - it's bank-specific
  },
  cashapp: {
    name: 'Cash App',
    color: '#00D632',
    urlScheme: (username, amount) => `cashapp://cash.app/pay/${username.replace('$', '')}${amount ? `?amount=${amount}` : ''}`,
    webFallback: (username) => `https://cash.app/${username.replace('$', '')}`,
  },
};

interface PaymentMethodButtonProps {
  method: PaymentMethod;
  amount?: number;
}

function PaymentMethodButton({ method, amount }: PaymentMethodButtonProps) {
  const info = PAYMENT_APP_INFO[method.app];

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = info.urlScheme(method.username, amount);

    try {
      // For PayPal, always use the HTTPS URL directly (no app scheme)
      if (method.app === 'paypal') {
        await Linking.openURL(url);
        return;
      }

      // For Venmo and Cash App, try app first, then fall back to web
      if (method.app === 'venmo' || method.app === 'cashapp') {
        try {
          // Try to open the app directly
          await Linking.openURL(url);
        } catch {
          // If app fails, use web fallback
          if (info.webFallback) {
            await Linking.openURL(info.webFallback(method.username));
          }
        }
        return;
      }

      // For Zelle, show helpful message with recipient info
      if (method.app === 'zelle') {
        Alert.alert(
          'Zelle Payment',
          `Send payment to: ${method.username}\n\nOpen your bank app and use Zelle to send money to this recipient.`,
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error) {
      Alert.alert('Error', `Could not open ${info.name}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-center py-3 px-4 rounded-xl mr-2 mb-2 active:opacity-80"
      style={{ backgroundColor: info.color }}
    >
      <ExternalLink size={16} color="white" />
      <Text className="text-white font-semibold ml-2">{method.displayName || info.name}</Text>
    </Pressable>
  );
}

interface PlayerPaymentRowProps {
  player: Player;
  status: 'unpaid' | 'paid' | 'partial';
  paidAmount?: number;
  totalAmount: number;
  onPress: () => void;
}

function PlayerPaymentRow({ player, status, paidAmount, totalAmount, onPress }: PlayerPaymentRowProps) {
  const balance = totalAmount - (paidAmount ?? 0);

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center p-4 rounded-xl mb-2 active:opacity-80',
        status === 'paid' ? 'bg-green-500/20' : status === 'partial' ? 'bg-amber-500/20' : 'bg-slate-800/60'
      )}
    >
      <Image
        source={{ uri: player.avatar }}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        contentFit="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-base">{player.name}</Text>
        <Text className={cn(
          'text-sm mt-0.5',
          status === 'paid' ? 'text-green-400' : status === 'partial' ? 'text-amber-400' : 'text-slate-400'
        )}>
          {status === 'paid'
            ? `Paid $${paidAmount ?? totalAmount}`
            : status === 'partial'
              ? `$${paidAmount ?? 0} paid - $${balance} remaining`
              : `$${totalAmount} due`}
        </Text>
      </View>

      <View className="items-end">
        {status === 'paid' ? (
          <CheckCircle2 size={28} color="#22c55e" />
        ) : status === 'partial' ? (
          <AlertCircle size={28} color="#f59e0b" />
        ) : (
          <Circle size={28} color="#64748b" />
        )}
      </View>
      <ChevronRight size={20} color="#64748b" className="ml-2" />
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const paymentPeriods = useTeamStore((s) => s.paymentPeriods);
  const addPaymentPeriod = useTeamStore((s) => s.addPaymentPeriod);
  const removePaymentPeriod = useTeamStore((s) => s.removePaymentPeriod);
  const addPaymentEntry = useTeamStore((s) => s.addPaymentEntry);
  const removePaymentEntry = useTeamStore((s) => s.removePaymentEntry);
  const updatePaymentPeriod = useTeamStore((s) => s.updatePaymentPeriod);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);

  const [isPaymentMethodModalVisible, setIsPaymentMethodModalVisible] = useState(false);
  const [isNewPeriodModalVisible, setIsNewPeriodModalVisible] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);

  // Add payment entry form
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date());
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Payment method form
  const [selectedApp, setSelectedApp] = useState<PaymentApp>('venmo');
  const [paymentUsername, setPaymentUsername] = useState('');
  const [paymentDisplayName, setPaymentDisplayName] = useState('');

  // New period form
  const [periodTitle, setPeriodTitle] = useState('');
  const [periodAmount, setPeriodAmount] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Edit period amount
  const [isEditAmountModalVisible, setIsEditAmountModalVisible] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editPeriodAmount, setEditPeriodAmount] = useState('');

  const paymentMethods = teamSettings.paymentMethods ?? [];

  const handleAddPaymentMethod = () => {
    if (!paymentUsername.trim()) return;

    const newMethod: PaymentMethod = {
      app: selectedApp,
      username: paymentUsername.trim(),
      displayName: paymentDisplayName.trim() || PAYMENT_APP_INFO[selectedApp].name,
    };

    setTeamSettings({
      paymentMethods: [...paymentMethods, newMethod],
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaymentUsername('');
    setPaymentDisplayName('');
    setIsPaymentMethodModalVisible(false);
  };

  const handleRemovePaymentMethod = (index: number) => {
    Alert.alert('Remove Payment Method', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newMethods = paymentMethods.filter((_, i) => i !== index);
          setTeamSettings({ paymentMethods: newMethods });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleCreatePeriod = () => {
    if (!periodTitle.trim() || !periodAmount.trim()) return;
    if (selectedPlayerIds.length === 0) {
      Alert.alert('No Players Selected', 'Please select at least one player for this payment period.');
      return;
    }

    const newPeriod: PaymentPeriod = {
      id: Date.now().toString(),
      title: periodTitle.trim(),
      amount: parseFloat(periodAmount),
      playerPayments: selectedPlayerIds.map((playerId) => ({
        playerId,
        status: 'unpaid' as const,
        entries: [],
      })),
      createdAt: new Date().toISOString(),
    };

    addPaymentPeriod(newPeriod);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPeriodTitle('');
    setPeriodAmount('');
    setSelectedPlayerIds([]);
    setIsNewPeriodModalVisible(false);
  };

  const handleUpdatePeriodAmount = () => {
    if (!editingPeriodId || !editPeriodAmount.trim()) return;
    const amount = parseFloat(editPeriodAmount);
    if (isNaN(amount) || amount <= 0) return;

    updatePaymentPeriod(editingPeriodId, { amount });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditAmountModalVisible(false);
    setEditingPeriodId(null);
    setEditPeriodAmount('');
  };

  const handleAddPaymentEntry = () => {
    if (!selectedPeriodId || !selectedPlayerId || !newPaymentAmount.trim()) return;
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const entry: PaymentEntry = {
      id: Date.now().toString(),
      amount,
      date: newPaymentDate.toISOString(),
      note: newPaymentNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addPaymentEntry(selectedPeriodId, selectedPlayerId, entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewPaymentAmount('');
    setNewPaymentNote('');
    setNewPaymentDate(new Date());
  };

  const handleDeletePaymentEntry = (entryId: string) => {
    if (!selectedPeriodId || !selectedPlayerId) return;
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removePaymentEntry(selectedPeriodId, selectedPlayerId, entryId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const selectedPeriod = paymentPeriods.find((p) => p.id === selectedPeriodId);
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const selectedPlayerPayment = selectedPeriod?.playerPayments.find((pp) => pp.playerId === selectedPlayerId);

  // Check if current user can view this player's details
  const canViewPlayerDetails = (playerId: string) => {
    return canManageTeam() || playerId === currentPlayerId;
  };

  // Get current player's payment status across all periods
  const myPaymentStatus = paymentPeriods.map((period) => {
    const myPayment = period.playerPayments.find((pp) => pp.playerId === currentPlayerId);
    return {
      period,
      payment: myPayment,
    };
  }).filter((item) => item.payment);

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
          className="px-5 pt-2 pb-4"
        >
          <View className="flex-row items-center">
            <DollarSign size={20} color="#22c55e" />
            <Text className="text-green-400 text-sm font-medium ml-2">Payments</Text>
          </View>
          <Text className="text-white text-3xl font-bold">Team Dues</Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Payment Methods Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <CreditCard size={16} color="#67e8f9" />
                <Text className="text-cyan-400 font-semibold ml-2">Payment Methods</Text>
              </View>
              {isAdmin() && (
                <Pressable
                  onPress={() => setIsPaymentMethodModalVisible(true)}
                  className="bg-cyan-500/20 rounded-full p-2"
                >
                  <Plus size={16} color="#67e8f9" />
                </Pressable>
              )}
            </View>

            {paymentMethods.length === 0 ? (
              <View className="bg-slate-800/50 rounded-xl p-6 items-center mb-6">
                <CreditCard size={32} color="#64748b" />
                <Text className="text-slate-400 text-center mt-2">
                  {isAdmin() ? 'Add payment methods for your team' : 'No payment methods configured'}
                </Text>
              </View>
            ) : (
              <View className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <Text className="text-slate-400 text-sm mb-3">Tap to pay:</Text>
                <View className="flex-row flex-wrap">
                  {paymentMethods.map((method, index) => (
                    <View key={index} className="relative">
                      <PaymentMethodButton method={method} />
                      {isAdmin() && (
                        <Pressable
                          onPress={() => handleRemovePaymentMethod(index)}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                        >
                          <X size={10} color="white" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Payment Periods - Admin Only */}
          {(isAdmin() || canManageTeam()) && (
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Users size={16} color="#a78bfa" />
                  <Text className="text-purple-400 font-semibold ml-2">Payment Tracking</Text>
                </View>
                {isAdmin() && (
                  <Pressable
                    onPress={() => setIsNewPeriodModalVisible(true)}
                    className="bg-purple-500/20 rounded-full p-2"
                  >
                    <Plus size={16} color="#a78bfa" />
                  </Pressable>
                )}
              </View>

              {paymentPeriods.length === 0 ? (
                <View className="bg-slate-800/50 rounded-xl p-6 items-center">
                  <DollarSign size={32} color="#64748b" />
                  <Text className="text-slate-400 text-center mt-2">
                    {isAdmin() ? 'Create a payment period to track dues' : 'No payment periods'}
                  </Text>
                </View>
              ) : (
                paymentPeriods.map((period, index) => {
                  const paidCount = period.playerPayments.filter((pp) => pp.status === 'paid').length;
                  const totalCount = period.playerPayments.length;

                  return (
                    <Animated.View
                      key={period.id}
                      entering={FadeInDown.delay(200 + index * 50).springify()}
                    >
                      <Pressable
                        onPress={() => setSelectedPeriodId(period.id)}
                        className="bg-slate-800/80 rounded-xl p-4 mb-3 border border-slate-700/50 active:bg-slate-700/80"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-white font-semibold text-lg">{period.title}</Text>
                            <View className="flex-row items-center">
                              <Text className="text-green-400 font-bold">${period.amount}</Text>
                              {isAdmin() && (
                                <Pressable
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditingPeriodId(period.id);
                                    setEditPeriodAmount(period.amount.toString());
                                    setIsEditAmountModalVisible(true);
                                  }}
                                  className="ml-3 bg-green-500/20 rounded-lg px-2.5 py-1.5 flex-row items-center"
                                >
                                  <Edit3 size={14} color="#22c55e" />
                                  <Text className="text-green-400 text-xs font-medium ml-1">Edit</Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                          <View className="items-end">
                            <View className="flex-row items-center">
                              <Text className="text-slate-400 text-sm mr-2">
                                {paidCount}/{totalCount} paid
                              </Text>
                              <ChevronRight size={18} color="#64748b" />
                            </View>
                            <View className="w-24 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                              <View
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(paidCount / totalCount) * 100}%` }}
                              />
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* My Payment Status - For regular players */}
          {!isAdmin() && !canManageTeam() && myPaymentStatus.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View className="flex-row items-center mb-3">
                <DollarSign size={16} color="#22c55e" />
                <Text className="text-green-400 font-semibold ml-2">My Payment Status</Text>
              </View>

              {myPaymentStatus.map(({ period, payment }, index) => (
                <Animated.View
                  key={period.id}
                  entering={FadeInDown.delay(200 + index * 50).springify()}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedPeriodId(period.id);
                      setSelectedPlayerId(currentPlayerId);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      'rounded-xl p-4 mb-3 border active:opacity-80',
                      payment?.status === 'paid' ? 'bg-green-500/20 border-green-500/30' :
                      payment?.status === 'partial' ? 'bg-amber-500/20 border-amber-500/30' :
                      'bg-slate-800/80 border-slate-700/50'
                    )}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-lg">{period.title}</Text>
                        <Text className="text-slate-400 text-sm">Amount Due: ${period.amount}</Text>
                      </View>
                      <View className="items-end">
                        {payment?.status === 'paid' ? (
                          <>
                            <CheckCircle2 size={28} color="#22c55e" />
                            <Text className="text-green-400 font-semibold mt-1">Paid</Text>
                          </>
                        ) : payment?.status === 'partial' ? (
                          <>
                            <AlertCircle size={28} color="#f59e0b" />
                            <Text className="text-amber-400 font-semibold mt-1">
                              ${payment.amount ?? 0} / ${period.amount}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Circle size={28} color="#64748b" />
                            <Text className="text-slate-400 font-semibold mt-1">Unpaid</Text>
                          </>
                        )}
                      </View>
                      <ChevronRight size={20} color="#64748b" className="ml-2" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={isPaymentMethodModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPaymentMethodModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsPaymentMethodModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Add Payment Method</Text>
              <Pressable onPress={handleAddPaymentMethod}>
                <Text className="text-cyan-400 font-semibold">Add</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
              <Text className="text-slate-400 text-sm mb-3">Select App</Text>
              <View className="flex-row mb-6">
                {(Object.keys(PAYMENT_APP_INFO) as PaymentApp[]).map((app) => (
                  <Pressable
                    key={app}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedApp(app);
                    }}
                    className={cn(
                      'flex-1 py-3 rounded-xl mr-2 items-center border',
                      selectedApp === app
                        ? 'border-cyan-500'
                        : 'bg-slate-800 border-slate-700'
                    )}
                    style={selectedApp === app ? { backgroundColor: PAYMENT_APP_INFO[app].color + '30' } : undefined}
                  >
                    <Text
                      className={cn('font-medium', selectedApp === app ? 'text-white' : 'text-slate-400')}
                    >
                      {PAYMENT_APP_INFO[app].name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">
                  {selectedApp === 'venmo' ? 'Venmo Username' :
                   selectedApp === 'paypal' ? 'PayPal.me Username' :
                   selectedApp === 'cashapp' ? 'Cash App $Cashtag' :
                   'Zelle Email/Phone'}
                </Text>
                <TextInput
                  value={paymentUsername}
                  onChangeText={setPaymentUsername}
                  placeholder={selectedApp === 'zelle' ? 'email@example.com' : selectedApp === 'cashapp' ? '$username' : '@username'}
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Display Name (Optional)</Text>
                <TextInput
                  value={paymentDisplayName}
                  onChangeText={setPaymentDisplayName}
                  placeholder="e.g., Team Treasurer"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* New Payment Period Modal */}
      <Modal
        visible={isNewPeriodModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsNewPeriodModalVisible(false);
          setSelectedPlayerIds([]);
        }}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => {
                setIsNewPeriodModalVisible(false);
                setSelectedPlayerIds([]);
              }}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">New Payment Period</Text>
              <Pressable onPress={handleCreatePeriod}>
                <Text className="text-cyan-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Title</Text>
                <TextInput
                  value={periodTitle}
                  onChangeText={setPeriodTitle}
                  placeholder="e.g., Season Dues - Spring 2025"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              <View className="mb-5">
                <Text className="text-slate-400 text-sm mb-2">Amount ($)</Text>
                <TextInput
                  value={periodAmount}
                  onChangeText={setPeriodAmount}
                  placeholder="0.00"
                  placeholderTextColor="#64748b"
                  keyboardType="decimal-pad"
                  className="bg-slate-800 rounded-xl px-4 py-3 text-white text-lg"
                />
              </View>

              {/* Player Selection */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400 text-sm">Select Players</Text>
                  <Text className="text-cyan-400 text-sm font-medium">
                    {selectedPlayerIds.length} selected
                  </Text>
                </View>

                {/* Quick Select Buttons */}
                <View className="flex-row mb-4">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const activeIds = players.filter((p) => p.status === 'active').map((p) => p.id);
                      setSelectedPlayerIds(activeIds);
                    }}
                    className="bg-green-500/20 rounded-xl px-4 py-2 mr-2"
                  >
                    <Text className="text-green-400 font-medium">All Active</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const reserveIds = players.filter((p) => p.status === 'reserve').map((p) => p.id);
                      setSelectedPlayerIds(reserveIds);
                    }}
                    className="bg-slate-600/50 rounded-xl px-4 py-2 mr-2"
                  >
                    <Text className="text-slate-300 font-medium">All Reserve</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlayerIds(players.map((p) => p.id));
                    }}
                    className="bg-cyan-500/20 rounded-xl px-4 py-2 mr-2"
                  >
                    <Text className="text-cyan-400 font-medium">All</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlayerIds([]);
                    }}
                    className="bg-slate-700/50 rounded-xl px-4 py-2"
                  >
                    <Text className="text-slate-400 font-medium">None</Text>
                  </Pressable>
                </View>

                {/* Player List */}
                {players.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <Pressable
                      key={player.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (isSelected) {
                          setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== player.id));
                        } else {
                          setSelectedPlayerIds([...selectedPlayerIds, player.id]);
                        }
                      }}
                      className={cn(
                        'flex-row items-center p-3 rounded-xl mb-2 border',
                        isSelected
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-slate-800/60 border-slate-700/50'
                      )}
                    >
                      <Image
                        source={{ uri: player.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-medium">{player.name}</Text>
                        <Text className={cn(
                          'text-xs',
                          player.status === 'active' ? 'text-green-400' : 'text-slate-400'
                        )}>
                          {player.status === 'active' ? 'Active' : 'Reserve'} · #{player.number}
                        </Text>
                      </View>
                      <View className={cn(
                        'w-6 h-6 rounded-full border-2 items-center justify-center',
                        isSelected ? 'bg-green-500 border-green-500' : 'border-slate-500'
                      )}>
                        {isSelected && <Check size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Payment Period Detail Modal */}
      <Modal
        visible={!!selectedPeriodId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (selectedPlayerId) {
            setSelectedPlayerId(null);
          } else {
            setSelectedPeriodId(null);
          }
        }}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            {/* Show Player Detail View OR Period List */}
            {selectedPlayerId && selectedPlayer && selectedPeriod ? (
              <>
                {/* Player Detail Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
                  <Pressable onPress={() => setSelectedPlayerId(null)} className="flex-row items-center">
                    <ChevronLeft size={24} color="#64748b" />
                    <Text className="text-slate-400 ml-1">Back</Text>
                  </Pressable>
                  <Text className="text-white text-lg font-semibold">Payment Details</Text>
                  <View style={{ width: 60 }} />
                </View>

                <ScrollView className="flex-1 px-5 pt-6">
                  {/* Player Info */}
                  <View className="items-center mb-6">
                    <Image
                      source={{ uri: selectedPlayer.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                      contentFit="cover"
                    />
                    <Text className="text-white text-xl font-bold mt-3">{selectedPlayer.name}</Text>
                    <Text className="text-slate-400">{selectedPeriod.title}</Text>
                  </View>

                  {/* Balance Summary */}
                  <View className={cn(
                    'rounded-2xl p-5 mb-6 border',
                    selectedPlayerPayment?.status === 'paid'
                      ? 'bg-green-500/20 border-green-500/30'
                      : selectedPlayerPayment?.status === 'partial'
                        ? 'bg-amber-500/20 border-amber-500/30'
                        : 'bg-slate-800 border-slate-700'
                  )}>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-slate-400">Total Due</Text>
                      <Text className="text-white text-xl font-bold">${selectedPeriod.amount}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-slate-400">Paid</Text>
                      <Text className="text-green-400 text-xl font-bold">${selectedPlayerPayment?.amount ?? 0}</Text>
                    </View>
                    <View className="h-px bg-slate-700 my-2" />
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-400">Balance</Text>
                      <Text className={cn(
                        'text-xl font-bold',
                        (selectedPeriod.amount - (selectedPlayerPayment?.amount ?? 0)) <= 0
                          ? 'text-green-400'
                          : 'text-amber-400'
                      )}>
                        ${Math.max(0, selectedPeriod.amount - (selectedPlayerPayment?.amount ?? 0))}
                      </Text>
                    </View>
                  </View>

                  {/* Add Payment Section - Only for Admins/Captains */}
                  {canManageTeam() && (
                    <View className="bg-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-700/50">
                      <Text className="text-cyan-400 font-semibold mb-4">Add Payment</Text>

                      {/* Amount Input */}
                      <View className="mb-4">
                        <Text className="text-slate-400 text-sm mb-2">Amount</Text>
                        <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                          <Text className="text-white text-xl font-bold mr-1">$</Text>
                          <TextInput
                            value={newPaymentAmount}
                            onChangeText={setNewPaymentAmount}
                            placeholder="0.00"
                            placeholderTextColor="#64748b"
                            keyboardType="decimal-pad"
                            className="flex-1 text-white text-xl font-bold"
                          />
                        </View>
                      </View>

                      {/* Date Input */}
                      <View className="mb-4">
                        <Text className="text-slate-400 text-sm mb-2">Date</Text>
                        <Pressable
                          onPress={() => setShowDatePicker(true)}
                          className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3"
                        >
                          <Calendar size={20} color="#64748b" />
                          <Text className="text-white ml-3">{format(newPaymentDate, 'MMM d, yyyy')}</Text>
                        </Pressable>
                        {showDatePicker && (
                          <DateTimePicker
                            value={newPaymentDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, date) => {
                              setShowDatePicker(Platform.OS === 'ios');
                              if (date) setNewPaymentDate(date);
                            }}
                            themeVariant="dark"
                          />
                        )}
                      </View>

                      {/* Note Input */}
                      <View className="mb-4">
                        <Text className="text-slate-400 text-sm mb-2">Note (optional)</Text>
                        <TextInput
                          value={newPaymentNote}
                          onChangeText={setNewPaymentNote}
                          placeholder="e.g., Venmo payment"
                          placeholderTextColor="#64748b"
                          className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                        />
                      </View>

                      {/* Add Button */}
                      <Pressable
                        onPress={handleAddPaymentEntry}
                        className="bg-green-500 rounded-xl py-3 active:bg-green-600"
                      >
                        <Text className="text-white text-center font-semibold">Add Payment</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Payment History */}
                  <View className="mb-6">
                    <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                      Payment History
                    </Text>

                    {(selectedPlayerPayment?.entries ?? []).length === 0 ? (
                      <View className="bg-slate-800/40 rounded-xl p-6 items-center">
                        <DollarSign size={32} color="#64748b" />
                        <Text className="text-slate-400 mt-2">No payments recorded</Text>
                      </View>
                    ) : (
                      (selectedPlayerPayment?.entries ?? [])
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <View
                            key={entry.id}
                            className="flex-row items-center bg-slate-800/60 rounded-xl p-4 mb-2 border border-slate-700/50"
                          >
                            <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center">
                              <DollarSign size={20} color="#22c55e" />
                            </View>
                            <View className="flex-1 ml-3">
                              <Text className="text-white font-semibold">${entry.amount}</Text>
                              <Text className="text-slate-400 text-sm">
                                {format(parseISO(entry.date), 'MMM d, yyyy')}
                                {entry.note && ` • ${entry.note}`}
                              </Text>
                            </View>
                            {canManageTeam() && (
                              <Pressable
                                onPress={() => handleDeletePaymentEntry(entry.id)}
                                className="p-2"
                              >
                                <Trash2 size={18} color="#ef4444" />
                              </Pressable>
                            )}
                          </View>
                        ))
                    )}
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                {/* Period Detail Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
                  <Pressable onPress={() => setSelectedPeriodId(null)}>
                    <X size={24} color="#64748b" />
                  </Pressable>
                  <Text className="text-white text-lg font-semibold">
                    {selectedPeriod?.title || 'Payment Period'}
                  </Text>
                  {isAdmin() && selectedPeriod && (
                    <Pressable
                      onPress={() => {
                        Alert.alert('Delete Period', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              removePaymentPeriod(selectedPeriod.id);
                              setSelectedPeriodId(null);
                            },
                          },
                        ]);
                      }}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </Pressable>
                  )}
                </View>

                {selectedPeriod && (
                  <ScrollView className="flex-1 px-5 pt-6">
                    {isAdmin() && !isEditAmountModalVisible && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditingPeriodId(selectedPeriod.id);
                          setEditPeriodAmount(selectedPeriod.amount.toString());
                          setIsEditAmountModalVisible(true);
                        }}
                        className="bg-green-500/20 rounded-xl p-4 mb-6 flex-row items-center justify-between active:bg-green-500/30"
                      >
                        <View>
                          <Text className="text-green-400 text-2xl font-bold">
                            ${selectedPeriod.amount}
                          </Text>
                          <Text className="text-green-300 text-sm">per player</Text>
                        </View>
                        <View className="bg-green-500/30 rounded-lg px-3 py-2 flex-row items-center">
                          <Edit3 size={16} color="#22c55e" />
                          <Text className="text-green-400 text-sm font-medium ml-1.5">Edit</Text>
                        </View>
                      </Pressable>
                    )}
                    {isAdmin() && isEditAmountModalVisible && editingPeriodId === selectedPeriod.id && (
                      <View className="bg-green-500/20 rounded-xl p-4 mb-6 border border-green-500/50">
                        <Text className="text-green-300 text-sm mb-2">Edit Amount Due</Text>
                        <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3 mb-3">
                          <Text className="text-white text-2xl font-bold mr-1">$</Text>
                          <TextInput
                            value={editPeriodAmount}
                            onChangeText={setEditPeriodAmount}
                            placeholder="0.00"
                            placeholderTextColor="#64748b"
                            keyboardType="decimal-pad"
                            autoFocus
                            className="flex-1 text-white text-2xl font-bold"
                          />
                        </View>
                        <View className="flex-row">
                          <Pressable
                            onPress={() => {
                              setIsEditAmountModalVisible(false);
                              setEditingPeriodId(null);
                              setEditPeriodAmount('');
                            }}
                            className="flex-1 bg-slate-700 rounded-xl py-3 mr-2"
                          >
                            <Text className="text-slate-300 text-center font-semibold">Cancel</Text>
                          </Pressable>
                          <Pressable
                            onPress={handleUpdatePeriodAmount}
                            className="flex-1 bg-green-500 rounded-xl py-3 ml-2"
                          >
                            <Text className="text-white text-center font-semibold">Save</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                    {!isAdmin() && (
                      <View className="bg-green-500/20 rounded-xl p-4 mb-6">
                        <Text className="text-green-400 text-2xl font-bold">
                          ${selectedPeriod.amount}
                        </Text>
                        <Text className="text-green-300 text-sm">per player</Text>
                      </View>
                    )}

                    <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                      Tap a player to view/add payments
                    </Text>

                    {selectedPeriod.playerPayments.map((pp) => {
                      const player = players.find((p) => p.id === pp.playerId);
                      if (!player) return null;

                      // Only show players the current user can view
                      if (!canViewPlayerDetails(pp.playerId)) return null;

                      return (
                        <PlayerPaymentRow
                          key={pp.playerId}
                          player={player}
                          status={pp.status}
                          paidAmount={pp.amount}
                          totalAmount={selectedPeriod.amount}
                          onPress={() => {
                            setSelectedPlayerId(pp.playerId);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Edit Period Amount Modal */}
      <Modal
        visible={isEditAmountModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsEditAmountModalVisible(false);
          setEditingPeriodId(null);
          setEditPeriodAmount('');
        }}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => {
                setIsEditAmountModalVisible(false);
                setEditingPeriodId(null);
                setEditPeriodAmount('');
              }}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Edit Amount Due</Text>
              <Pressable onPress={handleUpdatePeriodAmount}>
                <Text className="text-cyan-400 font-semibold">Save</Text>
              </Pressable>
            </View>

            <View className="px-5 pt-6">
              <Text className="text-slate-400 text-sm mb-2">Amount ($)</Text>
              <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                <Text className="text-white text-2xl font-bold mr-1">$</Text>
                <TextInput
                  value={editPeriodAmount}
                  onChangeText={setEditPeriodAmount}
                  placeholder="0.00"
                  placeholderTextColor="#64748b"
                  keyboardType="decimal-pad"
                  autoFocus
                  className="flex-1 text-white text-2xl font-bold"
                />
              </View>
              <Text className="text-slate-500 text-sm mt-3">
                This will update the amount due for all players in this period.
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
