'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { cn, generateId } from '@/lib/utils';
import { pushPlayerToSupabase } from '@/lib/realtime-sync';
import { useTeamStore } from '@/lib/store';
import { SPORT_POSITIONS, SPORT_POSITION_NAMES } from '@/lib/types';
import type { Player, PlayerRole, PlayerStatus } from '@/lib/types';

interface AddEditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: Player | null;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  number: '',
  position: '',
  positions: [] as string[],
  email: '',
  phone: '',
  status: 'active' as PlayerStatus,
  roles: [] as PlayerRole[],
  isInjured: false,
  isSuspended: false,
  statusEndDate: '',
};

export default function AddEditPlayerModal({ isOpen, onClose, player }: AddEditPlayerModalProps) {
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const addPlayer = useTeamStore((s) => s.addPlayer);
  const updatePlayer = useTeamStore((s) => s.updatePlayer);

  const sport = teamSettings.sport;
  const positions = SPORT_POSITIONS[sport] ?? [];
  const positionNames = SPORT_POSITION_NAMES[sport] ?? {};

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setForm({
        firstName: player.firstName,
        lastName: player.lastName,
        number: player.number ?? '',
        position: player.position ?? '',
        positions: player.positions ?? [],
        email: player.email ?? '',
        phone: player.phone ?? '',
        status: player.status,
        roles: player.roles ?? [],
        isInjured: player.isInjured ?? false,
        isSuspended: player.isSuspended ?? false,
        statusEndDate: player.statusEndDate ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [player, isOpen]);

  const togglePosition = (pos: string) => {
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter((p) => p !== pos)
        : [...prev.positions, pos],
    }));
  };

  const toggleRole = (role: PlayerRole) => {
    // Admin can't remove their own admin role
    if (role === 'admin' && player?.id === currentPlayerId && player?.roles.includes('admin')) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim()) { setError('First name is required'); return; }
    if (!activeTeamId) { setError('No active team'); return; }

    setSaving(true);
    setError(null);

    try {
      const primaryPos = form.positions[0] ?? form.position;
      const updatedPlayer: Player = {
        id: player?.id ?? generateId(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        number: form.number.trim(),
        position: primaryPos,
        positions: form.positions,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        status: form.status,
        roles: form.roles,
        isInjured: form.isInjured,
        isSuspended: form.isSuspended,
        statusEndDate: form.statusEndDate || undefined,
        avatar: player?.avatar,
        stats: player?.stats,
        goalieStats: player?.goalieStats,
        pitcherStats: player?.pitcherStats,
        gameLogs: player?.gameLogs ?? [],
        unavailableDates: player?.unavailableDates ?? [],
      };

      if (player) {
        updatePlayer(player.id, updatedPlayer);
      } else {
        addPlayer(updatedPlayer);
      }
      await pushPlayerToSupabase(updatedPlayer, activeTeamId);
      onClose();
    } catch (err) {
      setError('Failed to save player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={player ? 'Edit Player' : 'Add Player'}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</p>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">First Name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
        </div>

        {/* Jersey number */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Jersey Number</label>
          <input
            type="text"
            value={form.number}
            onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
            placeholder="e.g. 17"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
          />
        </div>

        {/* Positions */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Position(s)</label>
          <div className="flex flex-wrap gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => togglePosition(pos)}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                  form.positions.includes(pos)
                    ? 'border-[#67e8f9]/50 bg-[#67e8f9]/10 text-[#67e8f9]'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                )}
              >
                {pos}
                {positionNames[pos] && (
                  <span className="ml-1 text-[10px] opacity-60">({positionNames[pos]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
          <div className="flex gap-2">
            {(['active', 'reserve'] as PlayerStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((p) => ({ ...p, status: s }))}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all',
                  form.status === s
                    ? s === 'active'
                      ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
                      : 'border-slate-500/50 bg-slate-500/10 text-slate-400'
                    : 'border-white/10 text-slate-500 hover:border-white/20'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Roles</label>
          <div className="flex flex-wrap gap-2">
            {(['admin', 'captain', 'coach', 'parent'] as PlayerRole[]).map((role) => {
              const isSelfAdmin = role === 'admin' && player?.id === currentPlayerId && player?.roles.includes('admin');
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  disabled={isSelfAdmin}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-sm font-medium capitalize transition-all',
                    form.roles.includes(role)
                      ? 'border-[#a78bfa]/50 bg-[#a78bfa]/10 text-[#a78bfa]'
                      : 'border-white/10 text-slate-400 hover:border-white/20',
                    isSelfAdmin && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {role}
                  {isSelfAdmin && ' (you)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email / Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email <span className="text-slate-500">(optional)</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone <span className="text-slate-500">(optional)</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>
        </div>

        {/* Injury / Suspension toggles */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isInjured}
              onChange={(e) => setForm((p) => ({ ...p, isInjured: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-orange-500"
            />
            <span className="text-sm text-slate-300">Injured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isSuspended}
              onChange={(e) => setForm((p) => ({ ...p, isSuspended: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-rose-500"
            />
            <span className="text-sm text-slate-300">Suspended</span>
          </label>
        </div>

        {(form.isInjured || form.isSuspended) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status End Date <span className="text-slate-500">(optional)</span></label>
            <input
              type="date"
              value={form.statusEndDate}
              onChange={(e) => setForm((p) => ({ ...p, statusEndDate: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 [color-scheme:dark]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold hover:bg-[#67e8f9]/90 transition-all text-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : player ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
