'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import { pushPaymentPeriodToSupabase } from '@/lib/realtime-sync';
import { generateId } from '@/lib/utils';
import PaymentPeriodCard from '@/components/payments/PaymentPeriodCard';
import Modal from '@/components/ui/Modal';
import type { PaymentPeriod, PaymentPeriodType } from '@/lib/types';

const PERIOD_TYPES: { value: PaymentPeriodType; label: string }[] = [
  { value: 'league_dues', label: 'League Dues' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'facility_rental', label: 'Facility Rental' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'event', label: 'Event' },
  { value: 'referee', label: 'Referee' },
  { value: 'misc', label: 'Misc' },
];

export default function PaymentsPage() {
  const paymentPeriods = useTeamStore((s) => s.paymentPeriods);
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const addPaymentPeriod = useTeamStore((s) => s.addPaymentPeriod);
  const { isAdmin } = usePermissions();

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<PaymentPeriodType>('misc');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activePlayers = players.filter((p) => p.status === 'active');

  // Summary: total collected / total owed
  const totalOwed = paymentPeriods.reduce((sum, period) => {
    return sum + period.amount * activePlayers.length;
  }, 0);
  const totalCollected = paymentPeriods.reduce((sum, period) => {
    return sum + period.playerPayments.reduce((s2, pp) => {
      if (pp.status === 'paid') return s2 + period.amount;
      if (pp.status === 'partial') return s2 + (pp.amount ?? 0);
      return s2;
    }, 0);
  }, 0);

  const handleAddPeriod = async () => {
    if (!newTitle.trim()) { setFormError('Title is required'); return; }
    if (!newAmount || isNaN(parseFloat(newAmount))) { setFormError('Valid amount is required'); return; }
    if (!activeTeamId) return;

    setSaving(true);
    setFormError(null);

    const period: PaymentPeriod = {
      id: generateId(),
      title: newTitle.trim(),
      amount: parseFloat(newAmount),
      type: newType,
      dueDate: newDueDate || undefined,
      playerPayments: [],
      createdAt: new Date().toISOString(),
    };

    addPaymentPeriod(period);
    await pushPaymentPeriodToSupabase(period, activeTeamId);
    setShowAdd(false);
    setNewTitle('');
    setNewAmount('');
    setNewType('misc');
    setNewDueDate('');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-100">Payments</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#67e8f9]/10 border border-[#67e8f9]/20 text-[#67e8f9] text-sm font-medium hover:bg-[#67e8f9]/20 transition-all"
          >
            <Plus size={15} />
            Add Period
          </button>
        )}
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Collected</p>
          <p className="text-2xl font-bold text-[#22c55e]">${totalCollected.toFixed(0)}</p>
        </div>
        <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Owed</p>
          <p className="text-2xl font-bold text-slate-100">${totalOwed.toFixed(0)}</p>
        </div>
      </div>

      {/* Payment periods */}
      {paymentPeriods.length === 0 ? (
        <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No payment periods yet</p>
          {isAdmin && (
            <p className="text-slate-500 text-xs mt-1">Add a period to track payments</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paymentPeriods.map((period) => (
            <PaymentPeriodCard
              key={period.id}
              period={period}
              players={activePlayers}
              teamSettings={teamSettings}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Add period modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Payment Period" size="md">
        <div className="space-y-4">
          {formError && (
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{formError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Spring League Dues"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount per player ($) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PaymentPeriodType)}
              className="w-full bg-[#0d1526] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40"
            >
              {PERIOD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date <span className="text-slate-500">(optional)</span></label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 [color-scheme:dark]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPeriod}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold hover:bg-[#67e8f9]/90 transition-all text-sm disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add Period'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
