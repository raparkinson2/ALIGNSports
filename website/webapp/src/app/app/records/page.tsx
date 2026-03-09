'use client';

import React, { useState } from 'react';
import { Trophy, Plus, Trash2 } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import { pushTeamSettingsToSupabase } from '@/lib/realtime-sync';
import { formatRecord, generateId } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Player, Sport } from '@/lib/types';
import { getPlayerName } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import type { HockeyStats, HockeyGoalieStats, BaseballStats, BasketballStats, SoccerStats, LacrosseStats } from '@/lib/types';

// ─── All-time leaders helpers ──────────────────────────────────────────────

interface LeaderEntry {
  player: Player;
  value: number;
  label: string;
}

function getLeaders(players: Player[], getValue: (p: Player) => number, label: string): LeaderEntry[] {
  return players
    .filter((p) => p.status === 'active')
    .map((p) => ({ player: p, value: getValue(p), label }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-400', 'text-orange-600'];
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

export default function RecordsPage() {
  const teamName = useTeamStore((s) => s.teamName);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const players = useTeamStore((s) => s.players);
  const setTeamSettings = useTeamStore((s) => s.setTeamSettings);
  const addChampionship = useTeamStore((s) => s.addChampionship);
  const removeChampionship = useTeamStore((s) => s.removeChampionship);
  const { isAdmin } = usePermissions();

  const [showAddChamp, setShowAddChamp] = useState(false);
  const [champYear, setChampYear] = useState(new Date().getFullYear().toString());
  const [champTitle, setChampTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const record = teamSettings.record;
  const recordStr = formatRecord(record, teamSettings.sport);
  const championships = teamSettings.championships ?? [];
  const seasonHistory = teamSettings.seasonHistory ?? [];
  const sport = teamSettings.sport;

  // Build leader categories based on sport
  const leaderCategories: Array<{ title: string; entries: LeaderEntry[] }> = (() => {
    switch (sport) {
      case 'hockey':
        return [
          { title: 'Goals', entries: getLeaders(players, (p) => (p.stats as HockeyStats)?.goals ?? 0, 'G') },
          { title: 'Assists', entries: getLeaders(players, (p) => (p.stats as HockeyStats)?.assists ?? 0, 'A') },
          { title: 'Points', entries: getLeaders(players, (p) => ((p.stats as HockeyStats)?.goals ?? 0) + ((p.stats as HockeyStats)?.assists ?? 0), 'PTS') },
        ];
      case 'baseball':
      case 'softball':
        return [
          { title: 'Home Runs', entries: getLeaders(players, (p) => (p.stats as BaseballStats)?.homeRuns ?? 0, 'HR') },
          { title: 'RBI', entries: getLeaders(players, (p) => (p.stats as BaseballStats)?.rbi ?? 0, 'RBI') },
          { title: 'Hits', entries: getLeaders(players, (p) => (p.stats as BaseballStats)?.hits ?? 0, 'H') },
        ];
      case 'basketball':
        return [
          { title: 'Points', entries: getLeaders(players, (p) => (p.stats as BasketballStats)?.points ?? 0, 'PTS') },
          { title: 'Rebounds', entries: getLeaders(players, (p) => (p.stats as BasketballStats)?.rebounds ?? 0, 'REB') },
          { title: 'Assists', entries: getLeaders(players, (p) => (p.stats as BasketballStats)?.assists ?? 0, 'AST') },
        ];
      case 'soccer':
        return [
          { title: 'Goals', entries: getLeaders(players, (p) => (p.stats as SoccerStats)?.goals ?? 0, 'G') },
          { title: 'Assists', entries: getLeaders(players, (p) => (p.stats as SoccerStats)?.assists ?? 0, 'A') },
        ];
      case 'lacrosse':
        return [
          { title: 'Goals', entries: getLeaders(players, (p) => (p.stats as LacrosseStats)?.goals ?? 0, 'G') },
          { title: 'Assists', entries: getLeaders(players, (p) => (p.stats as LacrosseStats)?.assists ?? 0, 'A') },
          { title: 'Ground Balls', entries: getLeaders(players, (p) => (p.stats as LacrosseStats)?.groundBalls ?? 0, 'GB') },
        ];
      default:
        return [];
    }
  })();

  const handleAddChampionship = async () => {
    if (!champTitle.trim()) return;
    setSaving(true);
    const newChamp = { id: generateId(), year: champYear, title: champTitle.trim() };
    addChampionship(newChamp);
    if (activeTeamId) {
      const updatedSettings = {
        ...teamSettings,
        championships: [...championships, newChamp],
      };
      await pushTeamSettingsToSupabase(activeTeamId, teamName, updatedSettings);
    }
    setShowAddChamp(false);
    setChampTitle('');
    setSaving(false);
  };

  const handleRemoveChampionship = async (id: string) => {
    removeChampionship(id);
    if (activeTeamId) {
      const updatedSettings = {
        ...teamSettings,
        championships: championships.filter((c) => c.id !== id),
      };
      await pushTeamSettingsToSupabase(activeTeamId, teamName, updatedSettings);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-5">Records</h1>

      {/* Season record — big display */}
      <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-6 mb-5 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          {teamSettings.currentSeasonName ?? 'Current Season'}
        </p>
        <p className="text-5xl font-black text-slate-100 tracking-tight">{recordStr}</p>
        <p className="text-xs text-slate-500 mt-2">
          {sport === 'hockey' ? 'W-L-T' : sport === 'soccer' || sport === 'lacrosse' ? 'W-L-T' : 'W-L'}
        </p>
      </div>

      {/* Championships */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Championships</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAddChamp(true)}
              className="flex items-center gap-1 text-xs text-[#67e8f9] hover:text-[#67e8f9]/80 transition-colors"
            >
              <Plus size={13} />
              Add
            </button>
          )}
        </div>
        {championships.length === 0 ? (
          <p className="text-slate-500 text-sm">No championships recorded yet</p>
        ) : (
          <div className="space-y-2">
            {championships.map((champ) => (
              <div
                key={champ.id}
                className="flex items-center gap-3 bg-[#0f1a2e] border border-yellow-500/20 rounded-xl px-4 py-3"
              >
                <Trophy size={18} className="text-yellow-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100">{champ.title}</p>
                  <p className="text-xs text-slate-400">{champ.year}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveChampionship(champ.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
                    aria-label="Remove championship"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Season history */}
      {seasonHistory.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Season History</h2>
          <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Season</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Sport</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {seasonHistory.map((season) => (
                  <tr key={season.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3 text-slate-200">{season.seasonName}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{season.sport}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">
                      {formatRecord(season.teamRecord, season.sport)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* All-time leaders */}
      {leaderCategories.some((cat) => cat.entries.length > 0) && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">All-Time Leaders</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaderCategories.map((cat) => (
              cat.entries.length > 0 && (
                <div key={cat.title} className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">{cat.title}</h3>
                  <div className="space-y-2.5">
                    {cat.entries.map((entry, idx) => (
                      <div key={entry.player.id} className="flex items-center gap-2">
                        <span className={cn('text-xs font-bold w-6 shrink-0', MEDAL_COLORS[idx])}>
                          {MEDAL_LABELS[idx]}
                        </span>
                        <Avatar player={entry.player} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {getPlayerName(entry.player)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-100 shrink-0">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Add Championship Modal */}
      <Modal isOpen={showAddChamp} onClose={() => setShowAddChamp(false)} title="Add Championship" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Year</label>
            <input
              type="text"
              value={champYear}
              onChange={(e) => setChampYear(e.target.value)}
              placeholder="2024"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={champTitle}
              onChange={(e) => setChampTitle(e.target.value)}
              placeholder="e.g. Division Champions"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddChamp(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 transition-all text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={handleAddChampionship}
              disabled={saving || !champTitle.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold hover:bg-[#67e8f9]/90 transition-all text-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
