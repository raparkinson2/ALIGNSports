'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { cn, generateId } from '@/lib/utils';
import { pushEventToSupabase } from '@/lib/realtime-sync';
import { useTeamStore } from '@/lib/store';
import type { Event } from '@/lib/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEvent?: Event | null;
}

type EventType = 'practice' | 'meeting' | 'social' | 'other';

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'practice', label: 'Practice' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  title: '',
  type: 'other' as EventType,
  date: '',
  time: '',
  location: '',
  address: '',
  notes: '',
};

export default function AddEventModal({ isOpen, onClose, existingEvent }: AddEventModalProps) {
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const addEvent = useTeamStore((s) => s.addEvent);
  const updateEvent = useTeamStore((s) => s.updateEvent);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingEvent) {
      setForm({
        title: existingEvent.title,
        type: existingEvent.type,
        date: existingEvent.date,
        time: existingEvent.time,
        location: existingEvent.location,
        address: existingEvent.address ?? '',
        notes: existingEvent.notes ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [existingEvent, isOpen]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.date) { setError('Date is required'); return; }
    if (!activeTeamId) { setError('No active team'); return; }

    setSaving(true);
    setError(null);

    try {
      const event: Event = {
        id: existingEvent?.id ?? generateId(),
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        invitedPlayers: existingEvent?.invitedPlayers ?? [],
        confirmedPlayers: existingEvent?.confirmedPlayers ?? [],
        declinedPlayers: existingEvent?.declinedPlayers ?? [],
      };

      if (existingEvent) {
        updateEvent(event.id, event);
      } else {
        addEvent(event);
      }
      await pushEventToSupabase(event, activeTeamId);
      onClose();
    } catch (err) {
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingEvent ? 'Edit Event' : 'Add Event'}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Event name"
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
          <div className="flex gap-2 flex-wrap">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleChange('type', t.value)}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                  form.type === t.value
                    ? 'border-[#67e8f9]/50 bg-[#67e8f9]/10 text-[#67e8f9]'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
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
            placeholder="Location name"
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
            {saving ? 'Saving...' : existingEvent ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
