'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { cn, generateId } from '@/lib/utils';
import { pushGameToSupabase } from '@/lib/realtime-sync';
import { useTeamStore } from '@/lib/store';
import type { Game, TeamSettings } from '@/lib/types';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGame?: Game | null;
}

const emptyForm = {
  opponent: '',
  date: '',
  time: '',
  location: '',
  address: '',
  jerseyColor: '',
  notes: '',
  showBeerDuty: false,
};

export default function AddGameModal({ isOpen, onClose, existingGame }: AddGameModalProps) {
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const addGame = useTeamStore((s) => s.addGame);
  const updateGame = useTeamStore((s) => s.updateGame);

  const [form, setForm] = useState(() => {
    if (existingGame) {
      return {
        opponent: existingGame.opponent,
        date: existingGame.date,
        time: existingGame.time,
        location: existingGame.location,
        address: existingGame.address ?? '',
        jerseyColor: existingGame.jerseyColor ?? '',
        notes: existingGame.notes ?? '',
        showBeerDuty: existingGame.showBeerDuty ?? false,
      };
    }
    return emptyForm;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when existingGame changes
  React.useEffect(() => {
    if (existingGame) {
      setForm({
        opponent: existingGame.opponent,
        date: existingGame.date,
        time: existingGame.time,
        location: existingGame.location,
        address: existingGame.address ?? '',
        jerseyColor: existingGame.jerseyColor ?? '',
        notes: existingGame.notes ?? '',
        showBeerDuty: existingGame.showBeerDuty ?? false,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [existingGame, isOpen]);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.opponent.trim()) { setError('Opponent is required'); return; }
    if (!form.date) { setError('Date is required'); return; }
    if (!activeTeamId) { setError('No active team'); return; }

    setSaving(true);
    setError(null);

    try {
      const game: Game = {
        id: existingGame?.id ?? generateId(),
        opponent: form.opponent.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        address: form.address.trim(),
        jerseyColor: form.jerseyColor,
        notes: form.notes.trim() || undefined,
        showBeerDuty: form.showBeerDuty,
        checkedInPlayers: existingGame?.checkedInPlayers ?? [],
        checkedOutPlayers: existingGame?.checkedOutPlayers ?? [],
        invitedPlayers: existingGame?.invitedPlayers ?? [],
        photos: existingGame?.photos ?? [],
        finalScoreUs: existingGame?.finalScoreUs,
        finalScoreThem: existingGame?.finalScoreThem,
        gameResult: existingGame?.gameResult,
        resultRecorded: existingGame?.resultRecorded ?? false,
      };

      if (existingGame) {
        updateGame(game.id, game);
      } else {
        addGame(game);
      }
      await pushGameToSupabase(game, activeTeamId);
      onClose();
    } catch (err) {
      setError('Failed to save game. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingGame ? 'Edit Game' : 'Add Game'}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Opponent *</label>
          <input
            type="text"
            value={form.opponent}
            onChange={(e) => handleChange('opponent', e.target.value)}
            placeholder="Team name"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40 [color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Rink / arena / field name"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Address <span className="text-slate-500">(optional)</span></label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40"
          />
        </div>

        {teamSettings.jerseyColors && teamSettings.jerseyColors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Jersey Color</label>
            <div className="flex flex-wrap gap-2">
              {teamSettings.jerseyColors.map((jc) => (
                <button
                  key={jc.name}
                  type="button"
                  onClick={() => handleChange('jerseyColor', jc.name)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-all',
                    form.jerseyColor === jc.name
                      ? 'border-[#67e8f9]/50 bg-[#67e8f9]/10 text-[#67e8f9]'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  )}
                >
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: jc.color }} />
                  {jc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {teamSettings.showRefreshmentDuty && (
          <div className="flex items-center gap-3">
            <input
              id="beerDuty"
              type="checkbox"
              checked={form.showBeerDuty}
              onChange={(e) => handleChange('showBeerDuty', e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#67e8f9]"
            />
            <label htmlFor="beerDuty" className="text-sm text-slate-300">
              Show refreshment duty for this game
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes <span className="text-slate-500">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any notes for the team..."
            rows={3}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold hover:bg-[#67e8f9]/90 transition-all text-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : existingGame ? 'Save Changes' : 'Add Game'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
