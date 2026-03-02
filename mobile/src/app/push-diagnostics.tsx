import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff, Smartphone } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTeamStore } from '@/lib/store';
import { BACKEND_URL } from '@/lib/config';

type DiagnosticEntry = {
  id: string;
  player_id: string;
  platform: string;
  os_version: string;
  app_version: string;
  permission_status: string;
  token_obtained: boolean;
  token_prefix: string | null;
  error_message: string | null;
  backend_url_seen: string | null;
  timestamp: string;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

function statusColor(entry: DiagnosticEntry): string {
  if (entry.token_obtained) return '#22c55e';
  if (entry.permission_status === 'starting') return '#94a3b8';
  if (entry.permission_status === 'granted' && !entry.token_obtained) return '#f59e0b';
  return '#ef4444';
}

function StatusIcon({ entry }: { entry: DiagnosticEntry }) {
  if (entry.token_obtained) return <CheckCircle size={16} color="#22c55e" />;
  if (entry.permission_status === 'starting') return <Clock size={16} color="#94a3b8" />;
  return <XCircle size={16} color="#ef4444" />;
}

export default function PushDiagnosticsScreen() {
  const router = useRouter();
  const players = useTeamStore((s) => s.players);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerName = useCallback(
    (playerId: string): string => {
      const p = players.find((pl) => pl.id === playerId);
      if (p) return `${p.firstName} ${p.lastName}`.trim();
      // strip "player-" prefix for team/admin IDs
      return playerId.replace(/^player-/, '').slice(0, 20);
    },
    [players]
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/registration-diagnostics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { diagnostics: DiagnosticEntry[]; count: number };
      setDiagnostics(json.diagnostics || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load diagnostics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Summary stats
  const successful = diagnostics.filter((d) => d.token_obtained);
  const failed = diagnostics.filter((d) => !d.token_obtained && d.permission_status !== 'starting');
  const uniquePlayers = new Set(diagnostics.filter((d) => d.token_obtained).map((d) => d.player_id)).size;

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView edges={['top']} className="bg-slate-900">
        <View className="flex-row items-center px-4 py-3 border-b border-slate-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-lg font-bold flex-1">Push Diagnostics</Text>
          <Pressable onPress={() => load(true)} className="p-2">
            <RefreshCw size={18} color="#94a3b8" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#94a3b8" />
        }
      >
        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(0).springify()} className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-green-400 text-2xl font-bold">{successful.length}</Text>
            <Text className="text-slate-400 text-xs mt-1">Successful</Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-red-400 text-2xl font-bold">{failed.length}</Text>
            <Text className="text-slate-400 text-xs mt-1">Failed</Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-blue-400 text-2xl font-bold">{uniquePlayers}</Text>
            <Text className="text-slate-400 text-xs mt-1">Users w/ Token</Text>
          </View>
        </Animated.View>

        {loading && (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text className="text-slate-400 mt-3 text-sm">Loading diagnostics...</Text>
          </View>
        )}

        {error && !loading && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
            <Text className="text-red-400 font-semibold">Failed to load</Text>
            <Text className="text-red-300 text-sm mt-1">{error}</Text>
          </View>
        )}

        {!loading && !error && diagnostics.length === 0 && (
          <View className="items-center py-16">
            <Smartphone size={40} color="#475569" />
            <Text className="text-slate-400 mt-3">No diagnostics yet</Text>
          </View>
        )}

        {!loading && diagnostics.map((entry, i) => (
          <Animated.View
            key={entry.id}
            entering={FadeInDown.delay(i * 30).springify()}
            className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700/60"
          >
            {/* Header row */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <StatusIcon entry={entry} />
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                  {playerName(entry.player_id)}
                </Text>
              </View>
              <Text className="text-slate-500 text-xs">{formatTime(entry.timestamp)}</Text>
            </View>

            {/* Status pill */}
            <View className="flex-row flex-wrap gap-2 mb-2">
              <View
                style={{ backgroundColor: statusColor(entry) + '22', borderColor: statusColor(entry) + '55' }}
                className="px-2 py-0.5 rounded-full border"
              >
                <Text style={{ color: statusColor(entry) }} className="text-xs font-medium">
                  {entry.token_obtained ? 'token obtained' : entry.permission_status}
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600">
                <Text className="text-slate-300 text-xs">{entry.platform}</Text>
              </View>
              {entry.os_version !== 'unknown' && (
                <View className="px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600">
                  <Text className="text-slate-300 text-xs">{entry.os_version}</Text>
                </View>
              )}
              {entry.app_version !== 'unknown' && (
                <View className="px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600">
                  <Text className="text-slate-300 text-xs">v{entry.app_version}</Text>
                </View>
              )}
            </View>

            {/* Token prefix */}
            {entry.token_prefix && (
              <View className="bg-slate-900/60 rounded-xl px-3 py-2 mb-2">
                <Text className="text-slate-500 text-xs mb-0.5">Token prefix</Text>
                <Text className="text-green-300 text-xs font-mono" numberOfLines={1}>
                  {entry.token_prefix}…
                </Text>
              </View>
            )}

            {/* Error */}
            {entry.error_message && entry.error_message !== 'Registration started' && (
              <View className="bg-red-500/10 rounded-xl px-3 py-2 mb-2">
                <Text className="text-slate-500 text-xs mb-0.5">Error</Text>
                <Text className="text-red-300 text-xs" numberOfLines={2}>
                  {entry.error_message}
                </Text>
              </View>
            )}

            {/* Backend URL */}
            {entry.backend_url_seen && (
              <View className="flex-row items-center gap-1.5 mt-1">
                {entry.backend_url_seen.includes('vibecode') ? (
                  <Wifi size={11} color="#94a3b8" />
                ) : (
                  <WifiOff size={11} color="#ef4444" />
                )}
                <Text className="text-slate-600 text-xs" numberOfLines={1}>
                  {entry.backend_url_seen}
                </Text>
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
