'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmail } from '@/lib/supabase-auth';
import { getSupabaseClient } from '@/lib/supabase';
import { loadTeamFromSupabase } from '@/lib/realtime-sync';
import { useTeamStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface PlayerRow {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface TeamOption {
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-team flow
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'team-select'>('login');

  const setIsLoggedIn = useTeamStore((s) => s.setIsLoggedIn);
  const setCurrentPlayerId = useTeamStore((s) => s.setCurrentPlayerId);
  const setActiveTeamId = useTeamStore((s) => s.setActiveTeamId);
  const setUserEmail = useTeamStore((s) => s.setUserEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithEmail(email.trim(), password);
      if (!result.success || !result.userId) {
        setError(result.error ?? 'Sign in failed');
        setLoading(false);
        return;
      }

      const userId = result.userId;
      const supabase = getSupabaseClient();

      const { data: playerRows, error: playerError } = await supabase
        .from('players')
        .select('id, team_id, first_name, last_name, roles')
        .eq('auth_user_id', userId);

      if (playerError || !playerRows || playerRows.length === 0) {
        setError('No player account found for this email. Phone-only accounts must use the mobile app.');
        setLoading(false);
        return;
      }

      if (playerRows.length === 1) {
        // Single team — proceed directly
        await proceedWithTeam(playerRows[0] as PlayerRow, userId, email.trim());
      } else {
        // Multiple teams — show selector
        const supabaseClient = getSupabaseClient();
        const teamIds = playerRows.map((p: PlayerRow) => p.team_id);
        const { data: teamsData } = await supabaseClient
          .from('teams')
          .select('id, name')
          .in('id', teamIds);

        const teamNameMap: Record<string, string> = {};
        for (const t of teamsData ?? []) {
          teamNameMap[t.id] = t.name;
        }

        const options: TeamOption[] = (playerRows as PlayerRow[]).map((p) => ({
          teamId: p.team_id,
          teamName: teamNameMap[p.team_id] ?? 'Unknown Team',
          playerId: p.id,
          playerName: `${p.first_name} ${p.last_name}`.trim(),
        }));

        setPendingUserId(userId);
        setPendingEmail(email.trim());
        setTeamOptions(options);
        setStep('team-select');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const proceedWithTeam = async (player: PlayerRow, _userId: string, emailValue: string) => {
    const ok = await loadTeamFromSupabase(player.team_id);
    if (!ok) {
      setError('Failed to load team data. Please try again.');
      setLoading(false);
      return;
    }
    setCurrentPlayerId(player.id);
    setActiveTeamId(player.team_id);
    setUserEmail(emailValue);
    setIsLoggedIn(true);
    router.push('/app/schedule');
  };

  const handleTeamSelect = async (option: TeamOption) => {
    if (!pendingUserId || !pendingEmail) return;
    setLoading(true);
    setError(null);
    const playerRow: PlayerRow = {
      id: option.playerId,
      team_id: option.teamId,
      first_name: option.playerName.split(' ')[0] ?? '',
      last_name: option.playerName.split(' ').slice(1).join(' ') ?? '',
      roles: [],
    };
    await proceedWithTeam(playerRow, pendingUserId, pendingEmail);
  };

  if (step === 'team-select') {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0f1a2e] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-100">Select Team</h1>
            <p className="text-slate-400 mt-1 text-sm">You belong to multiple teams. Which would you like to open?</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4 text-rose-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            {teamOptions.map((option) => (
              <button
                key={option.teamId}
                onClick={() => handleTeamSelect(option)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-[#67e8f9]/30 transition-all text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-[#67e8f9]/10 flex items-center justify-center text-lg shrink-0">
                  🏆
                </div>
                <div>
                  <p className="font-medium text-slate-100">{option.teamName}</p>
                  <p className="text-xs text-slate-400">{option.playerName}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setStep('login'); setError(null); }}
            className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f1a2e] border border-white/10 rounded-2xl p-8">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#67e8f9]/10 border border-[#67e8f9]/20 mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ALIGN Sports</h1>
          <p className="text-slate-400 mt-1 text-sm">Team management portal</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-5 text-rose-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-[#080c14] bg-[#67e8f9] hover:bg-[#67e8f9]/90 transition-colors',
              loading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Note */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Phone-only accounts must use the mobile app
        </p>
      </div>
    </div>
  );
}
