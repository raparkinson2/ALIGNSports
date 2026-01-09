import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Linking } from 'react-native';
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
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  useTeamStore,
  PaymentPeriod,
  PaymentMethod,
  PaymentApp,
  Player,
} from '@/lib/store';
import { cn } from '@/lib/cn';
import { format, parseISO } from 'date-fns';

const PAYMENT_APP_INFO: Record<PaymentApp, { name: string; color: string; urlScheme: (username: string, amount?: number) => string }> = {
  venmo: {
    name: 'Venmo',
    color: '#3D95CE',
    urlScheme: (username, amount) => `venmo://paycharge?txn=pay&recipients=${username}${amount ? `&amount=${amount}` : ''}`,
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
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web for PayPal
        if (method.app === 'paypal') {
          await Linking.openURL(`https://paypal.me/${method.username}`);
        } else {
          Alert.alert(
            `${info.name} Not Installed`,
            `Please install ${info.name} to make payments, or contact the team admin for alternative payment methods.`
          );
        }
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
  onToggle: () => void;
  isAdmin: boolean;
}

function PlayerPaymentRow({ player, status, onToggle, isAdmin }: PlayerPaymentRowProps) {
  return (
    <Pressable
      onPress={isAdmin ? onToggle : undefined}
      disabled={!isAdmin}
      className={cn(
        'flex-row items-center p-3 rounded-xl mb-2',
        status === 'paid' ? 'bg-green-500/20' : status === 'partial' ? 'bg-amber-500/20' : 'bg-slate-800/60'
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
          status === 'paid' ? 'text-green-400' : status === 'partial' ? 'text-amber-400' : 'text-slate-400'
        )}>
          {status === 'paid' ? 'Paid' : status === 'partial' ? 'Partial' : 'Unpaid'}
        </Text>
      </View>
      {status === 'paid' ? (
        <CheckCircle2 size={24} color="#22c55e" />
      ) : status === 'partial' ? (
        <AlertCircle size={24} color="#f59e0b" />
      ) : (
        <Circle size={24} color="#64748b" />
      )}
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
  const updatePlayerPayment = useTeamStore((s) => s.updatePlayerPayment);
  const isAdmin = useTeamStore((s) => s.isAdmin);
  const canManageTeam = useTeamStore((s) => s.canManageTeam);

  const [isPaymentMethodModalVisible, setIsPaymentMethodModalVisible] = useState(false);
  const [isNewPeriodModalVisible, setIsNewPeriodModalVisible] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  // Payment method form
  const [selectedApp, setSelectedApp] = useState<PaymentApp>('venmo');
  const [paymentUsername, setPaymentUsername] = useState('');
  const [paymentDisplayName, setPaymentDisplayName] = useState('');

  // New period form
  const [periodTitle, setPeriodTitle] = useState('');
  const [periodAmount, setPeriodAmount] = useState('');

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

    const activePlayers = players.filter((p) => p.status === 'active');
    const newPeriod: PaymentPeriod = {
      id: Date.now().toString(),
      title: periodTitle.trim(),
      amount: parseFloat(periodAmount),
      playerPayments: activePlayers.map((p) => ({
        playerId: p.id,
        status: 'unpaid',
      })),
      createdAt: new Date().toISOString(),
    };

    addPaymentPeriod(newPeriod);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPeriodTitle('');
    setPeriodAmount('');
    setIsNewPeriodModalVisible(false);
  };

  const handleTogglePayment = (periodId: string, playerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'unpaid' ? 'paid' : currentStatus === 'paid' ? 'partial' : 'unpaid';
    updatePlayerPayment(periodId, playerId, nextStatus as 'unpaid' | 'paid' | 'partial');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectedPeriod = paymentPeriods.find((p) => p.id === selectedPeriodId);

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
                            <Text className="text-green-400 font-bold">${period.amount}</Text>
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
                  {selectedApp === 'venmo' ? 'Venmo Username' : selectedApp === 'paypal' ? 'PayPal.me Username' : 'Zelle Email/Phone'}
                </Text>
                <TextInput
                  value={paymentUsername}
                  onChangeText={setPaymentUsername}
                  placeholder={selectedApp === 'zelle' ? 'email@example.com' : '@username'}
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
        onRequestClose={() => setIsNewPeriodModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Pressable onPress={() => setIsNewPeriodModalVisible(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">New Payment Period</Text>
              <Pressable onPress={handleCreatePeriod}>
                <Text className="text-cyan-400 font-semibold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
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
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Payment Period Detail Modal */}
      <Modal
        visible={!!selectedPeriodId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPeriodId(null)}
      >
        <View className="flex-1 bg-slate-900">
          <SafeAreaView className="flex-1">
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
                <View className="bg-green-500/20 rounded-xl p-4 mb-6">
                  <Text className="text-green-400 text-2xl font-bold">
                    ${selectedPeriod.amount}
                  </Text>
                  <Text className="text-green-300 text-sm">per player</Text>
                </View>

                <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  {isAdmin() ? 'Tap to toggle payment status' : 'Payment Status'}
                </Text>

                {selectedPeriod.playerPayments.map((pp) => {
                  const player = players.find((p) => p.id === pp.playerId);
                  if (!player) return null;

                  return (
                    <PlayerPaymentRow
                      key={pp.playerId}
                      player={player}
                      status={pp.status}
                      onToggle={() => handleTogglePayment(selectedPeriod.id, pp.playerId, pp.status)}
                      isAdmin={isAdmin()}
                    />
                  );
                })}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
