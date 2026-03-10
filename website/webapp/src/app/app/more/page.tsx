'use client';

import React, { useState, useMemo } from 'react';
import {
  Link as LinkIcon, BarChart2, Plus, Trash2, X,
  Bell, Mail, HelpCircle, Zap, Bug, Megaphone, ChevronRight,
  Check, ExternalLink, Calendar, LogOut, RefreshCw, UserPlus,
  Globe,
} from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { usePermissions } from '@/hooks/usePermissions';
import {
  pushPollToSupabase, deletePollFromSupabase,
  pushTeamLinkToSupabase, deleteTeamLinkFromSupabase,
  pushPlayerToSupabase, pushTeamSettingsToSupabase,
} from '@/lib/realtime-sync';
import { generateId, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import type { Poll, PollOption, TeamLink, Player } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase-auth';

// ── Availability Calendar ─────────────────────────────────────────────────────

function AvailabilitySection({ player, activeTeamId }: { player: Player; activeTeamId: string | null }) {
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [saving, setSaving] = useState(false);

  const unavailable = player.unavailableDates ?? [];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isUnavailable = (d: number) => unavailable.includes(toDateStr(d));
  const isPast = (d: number) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const toggleDay = async (d: number) => {
    if (isPast(d)) return;
    const ds = toDateStr(d);
    const newDates = isUnavailable(d)
      ? unavailable.filter(x => x !== ds)
      : [...unavailable, ds];
    setSaving(true);
    updatePlayer(player.id, { unavailableDates: newDates });
    if (activeTeamId) await pushPlayerToSupabase({ ...player, unavailableDates: newDates }, activeTeamId);
    setSaving(false);
  };

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <span className="text-sm font-semibold text-slate-200">{monthName}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-600 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const past = isPast(d);
          const unavail = isUnavailable(d);
          const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          return (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              disabled={past || saving}
              className={cn(
                'aspect-square rounded-lg text-xs font-medium transition-all',
                past ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                unavail
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : isToday
                  ? 'bg-[#67e8f9]/10 border border-[#67e8f9]/30 text-[#67e8f9]'
                  : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              )}
            >
              {d}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 mt-3 text-center">Tap dates to mark yourself as unavailable (red)</p>
    </div>
  );
}

// ── Team Polls ─────────────────────────────────────────────────────────────────

function PollsSection({ activeTeamId, currentPlayerId, isAdmin }: { activeTeamId: string | null; currentPlayerId: string | null; isAdmin: boolean }) {
  const polls = useTeamStore((s) => s.polls);
  const setPolls = useTeamStore((s) => s.setPolls);

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const activePolls = polls.filter(p => p.isActive);
  const closedPolls = polls.filter(p => !p.isActive);

  const handleCreate = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2 || !activeTeamId || !currentPlayerId) return;
    setSaving(true);
    const pollOptions: PollOption[] = options
      .filter(o => o.trim())
      .map(text => ({ id: generateId(), text: text.trim(), votes: [] }));
    const poll: Poll = {
      id: generateId(),
      question: question.trim(),
      options: pollOptions,
      createdBy: currentPlayerId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
      isActive: true,
      allowMultipleVotes: allowMultiple,
    };
    const newPolls = [poll, ...polls];
    setPolls(newPolls);
    await pushPollToSupabase(poll, activeTeamId);
    setSaving(false);
    setShowCreate(false);
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setExpiresAt('');
  };

  const handleVote = async (poll: Poll, optionId: string) => {
    if (!currentPlayerId || !activeTeamId) return;
    const updatedPoll = {
      ...poll,
      options: poll.options.map(o => {
        if (o.id === optionId) {
          const hasVoted = o.votes.includes(currentPlayerId);
          return { ...o, votes: hasVoted ? o.votes.filter(v => v !== currentPlayerId) : [...o.votes, currentPlayerId] };
        }
        if (!poll.allowMultipleVotes) {
          return { ...o, votes: o.votes.filter(v => v !== currentPlayerId) };
        }
        return o;
      }),
    };
    const newPolls = polls.map(p => p.id === poll.id ? updatedPoll : p);
    setPolls(newPolls);
    await pushPollToSupabase(updatedPoll, activeTeamId);
  };

  const handleDelete = async (pollId: string) => {
    const newPolls = polls.filter(p => p.id !== pollId);
    setPolls(newPolls);
    await deletePollFromSupabase(pollId);
  };

  const handleClose = async (poll: Poll) => {
    if (!activeTeamId) return;
    const updated = { ...poll, isActive: false };
    const newPolls = polls.map(p => p.id === poll.id ? updated : p);
    setPolls(newPolls);
    await pushPollToSupabase(updated, activeTeamId);
  };

  const PollCard = ({ poll }: { poll: Poll }) => {
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
    const hasVoted = poll.options.some(o => o.votes.includes(currentPlayerId ?? ''));
    const showResults = !poll.isActive || hasVoted;

    return (
      <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-slate-100">{poll.question}</p>
          {isAdmin && poll.isActive && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleClose(poll)} className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 border border-white/10 transition-all">Close</button>
              <button onClick={() => handleDelete(poll.id)} className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
            </div>
          )}
          {isAdmin && !poll.isActive && (
            <button onClick={() => handleDelete(poll.id)} className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
          )}
        </div>

        <div className="space-y-2">
          {poll.options.map(option => {
            const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
            const myVote = option.votes.includes(currentPlayerId ?? '');
            return (
              <button
                key={option.id}
                onClick={() => poll.isActive && handleVote(poll, option.id)}
                disabled={!poll.isActive}
                className={cn(
                  'w-full relative rounded-xl px-3 py-2 text-left text-sm transition-all overflow-hidden',
                  poll.isActive ? 'hover:bg-white/[0.05] cursor-pointer' : 'cursor-default',
                  myVote ? 'border border-[#67e8f9]/30' : 'border border-white/[0.06]'
                )}
              >
                {showResults && (
                  <div
                    className={cn('absolute inset-0 rounded-xl transition-all', myVote ? 'bg-[#67e8f9]/10' : 'bg-white/[0.03]')}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-2">
                  <span className={cn('font-medium', myVote ? 'text-[#67e8f9]' : 'text-slate-300')}>
                    {option.text}
                    {myVote && <Check size={12} className="inline ml-1.5" />}
                  </span>
                  {showResults && <span className="text-xs text-slate-500 shrink-0">{pct}% ({option.votes.length})</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-600">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {!poll.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">Closed</span>}
          {poll.expiresAt && poll.isActive && (
            <span className="text-xs text-slate-600">Expires {new Date(poll.expiresAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {isAdmin && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#67e8f9]/10 border border-[#67e8f9]/20 text-[#67e8f9] text-sm font-medium hover:bg-[#67e8f9]/20 transition-all mb-4"
        >
          <Plus size={15} />
          Create Poll
        </button>
      )}

      {activePolls.length === 0 && closedPolls.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">No polls yet</div>
      )}

      {activePolls.length > 0 && (
        <div className="space-y-3 mb-4">
          {activePolls.map(poll => <PollCard key={poll.id} poll={poll} />)}
        </div>
      )}

      {closedPolls.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Closed</p>
          <div className="space-y-3 opacity-70">
            {closedPolls.map(poll => <PollCard key={poll.id} poll={poll} />)}
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Poll" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Question *</label>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the team..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm"
                  />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-all">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button onClick={() => setOptions([...options, ''])} className="mt-2 text-xs text-[#67e8f9] hover:text-[#67e8f9]/80 transition-colors">
                + Add option
              </button>
            )}
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-sm text-slate-300">Allow multiple votes</span>
            <button onClick={() => setAllowMultiple(v => !v)} className={cn('w-10 h-5.5 rounded-full transition-all relative', allowMultiple ? 'bg-[#67e8f9]' : 'bg-slate-700')}>
              <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', allowMultiple ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Expires <span className="text-slate-500">(optional)</span></label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm [color-scheme:dark]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 transition-all text-sm font-medium">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !question.trim() || options.filter(o => o.trim()).length < 2} className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold hover:bg-[#67e8f9]/90 transition-all text-sm disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Team Links ─────────────────────────────────────────────────────────────────

function TeamLinksSection({ activeTeamId, currentPlayerId, isAdmin }: { activeTeamId: string | null; currentPlayerId: string | null; isAdmin: boolean }) {
  const teamLinks = useTeamStore((s) => s.teamLinks);
  const setTeamLinks = useTeamStore((s) => s.setTeamLinks);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim() || !activeTeamId || !currentPlayerId) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    setSaving(true);
    const link: TeamLink = {
      id: generateId(),
      title: title.trim(),
      url: finalUrl,
      createdBy: currentPlayerId,
      createdAt: new Date().toISOString(),
    };
    const newLinks = [...teamLinks, link];
    setTeamLinks(newLinks);
    await pushTeamLinkToSupabase(link, activeTeamId);
    setSaving(false);
    setShowAdd(false);
    setTitle('');
    setUrl('');
  };

  const handleDelete = async (linkId: string) => {
    const newLinks = teamLinks.filter(l => l.id !== linkId);
    setTeamLinks(newLinks);
    await deleteTeamLinkFromSupabase(linkId);
  };

  return (
    <div>
      {teamLinks.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-sm mb-4">No team links yet</div>
      )}
      <div className="space-y-2 mb-4">
        {teamLinks.map(link => (
          <div key={link.id} className="flex items-center gap-3 bg-[#0f1a2e] border border-white/10 rounded-xl px-4 py-3">
            <Globe size={15} className="text-[#67e8f9] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{link.title}</p>
              <p className="text-xs text-slate-500 truncate">{link.url}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-500 hover:text-[#67e8f9] hover:bg-[#67e8f9]/10 transition-all">
                <ExternalLink size={13} />
              </a>
              {isAdmin && (
                <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {isAdmin && (
        <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all text-sm font-medium">
          <Plus size={15} />
          Add Link
        </button>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Team Link" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. League Website" className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">URL *</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:text-slate-200 transition-all">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !title.trim() || !url.trim()} className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold text-sm hover:bg-[#67e8f9]/90 transition-all disabled:opacity-60">
              {saving ? 'Saving...' : 'Add Link'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Notification Settings ─────────────────────────────────────────────────────

function NotificationsSection({ player, activeTeamId }: { player: Player; activeTeamId: string | null }) {
  const updatePlayer = useTeamStore((s) => s.updatePlayer);
  const prefs = player.notificationPreferences ?? {
    gameInvites: true, gameReminderDayBefore: true, gameReminderHoursBefore: true,
    chatMessages: true, chatMentions: true, paymentReminders: true,
  };

  const toggle = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    updatePlayer(player.id, { notificationPreferences: updated });
    if (activeTeamId) await pushPlayerToSupabase({ ...player, notificationPreferences: updated }, activeTeamId);
  };

  const items = [
    { key: 'gameInvites' as const, label: 'Game Invites', sub: 'Get notified when added to a game' },
    { key: 'gameReminderDayBefore' as const, label: 'Game Reminder (Day Before)', sub: '24 hour game reminder' },
    { key: 'gameReminderHoursBefore' as const, label: 'Game Reminder (2 Hours)', sub: '2 hour game reminder' },
    { key: 'chatMessages' as const, label: 'Chat Messages', sub: 'New messages in team chat' },
    { key: 'chatMentions' as const, label: 'Chat @Mentions', sub: 'When someone @mentions you' },
    { key: 'paymentReminders' as const, label: 'Payment Reminders', sub: 'Payment due reminders' },
  ];

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0f1a2e] border border-white/10 rounded-xl">
          <div>
            <p className="text-sm font-medium text-slate-200">{item.label}</p>
            <p className="text-xs text-slate-500">{item.sub}</p>
          </div>
          <button
            onClick={() => toggle(item.key)}
            className={cn(
              'w-11 h-6 rounded-full transition-all relative shrink-0',
              prefs[item.key] ? 'bg-[#67e8f9]' : 'bg-slate-700'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
              prefs[item.key] ? 'left-[22px]' : 'left-0.5'
            )} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Email Team Modal ────────────────────────────────────────────────────────────

function EmailTeamModal({ isOpen, onClose, players }: { isOpen: boolean; onClose: () => void; players: Player[] }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const emails = players
    .filter(p => p.status === 'active' && p.email)
    .map(p => p.email!)
    .join(',');

  const handleSend = () => {
    const mailto = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Team" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Team announcement..." className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
          <textarea rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#67e8f9]/40 text-sm resize-none" />
        </div>
        <p className="text-xs text-slate-500">Opens your email client to send to {players.filter(p => p.status === 'active' && p.email).length} active players.</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:text-slate-200 transition-all">Cancel</button>
          <button onClick={handleSend} className="flex-1 py-2.5 rounded-xl bg-[#67e8f9] text-[#080c14] font-bold text-sm hover:bg-[#67e8f9]/90 transition-all">Open Email Client</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1526] border border-white/[0.07] rounded-2xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  sub,
  color = 'text-slate-400',
  onClick,
  href,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  color?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer',
      danger && 'hover:bg-rose-500/[0.05]'
    )}>
      <div className={cn('w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0', danger && 'bg-rose-500/10')}>
        <Icon size={16} className={danger ? 'text-rose-400' : color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-rose-400' : 'text-slate-200')}>{label}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
      <ChevronRight size={14} className="text-slate-600" />
    </div>
  );

  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MorePage() {
  const players = useTeamStore((s) => s.players);
  const currentPlayerId = useTeamStore((s) => s.currentPlayerId);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const teams = useTeamStore((s) => s.teams);
  const teamName = useTeamStore((s) => s.teamName);
  const switchTeam = useTeamStore((s) => s.switchTeam);
  const logout = useTeamStore((s) => s.logout);
  const { isAdmin, canManage } = usePermissions();
  const router = useRouter();

  const currentPlayer = players.find(p => p.id === currentPlayerId) ?? null;

  const [activeTab, setActiveTab] = useState<'home' | 'availability' | 'polls' | 'links' | 'notifications'>('home');
  const [showEmailTeam, setShowEmailTeam] = useState(false);

  const otherTeams = useMemo(() => teams.filter(t => t.id !== activeTeamId), [teams, activeTeamId]);

  const handleSignOut = async () => {
    await signOut();
    logout();
    router.push('/login');
  };

  // Sub-pages
  if (activeTab === 'availability' && currentPlayer) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setActiveTab('home')} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-slate-100">My Availability</h1>
        </div>
        <div className="bg-[#0d1526] border border-white/[0.07] rounded-2xl p-4">
          <AvailabilitySection player={currentPlayer} activeTeamId={activeTeamId} />
        </div>
        {(currentPlayer.unavailableDates?.length ?? 0) > 0 && (
          <div className="mt-4 bg-[#0d1526] border border-white/[0.07] rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Marked Unavailable</h3>
            <div className="flex flex-wrap gap-2">
              {[...currentPlayer.unavailableDates!].sort().map(d => (
                <span key={d} className="text-xs px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  {new Date(d + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'polls') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setActiveTab('home')} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-slate-100">Team Polls</h1>
        </div>
        <PollsSection activeTeamId={activeTeamId} currentPlayerId={currentPlayerId} isAdmin={isAdmin} />
      </div>
    );
  }

  if (activeTab === 'links') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setActiveTab('home')} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-slate-100">Team Links</h1>
        </div>
        <TeamLinksSection activeTeamId={activeTeamId} currentPlayerId={currentPlayerId} isAdmin={isAdmin} />
      </div>
    );
  }

  if (activeTab === 'notifications' && currentPlayer) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setActiveTab('home')} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold text-slate-100">Notifications</h1>
        </div>
        <NotificationsSection player={currentPlayer} activeTeamId={activeTeamId} />
      </div>
    );
  }

  // Home / main view
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-5">More</h1>

      {/* Current player card */}
      {currentPlayer && (
        <div className="bg-[#0d1526] border border-white/[0.07] rounded-2xl p-4 mb-4 flex items-center gap-4">
          <Avatar player={currentPlayer} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100 text-base truncate">{currentPlayer.firstName} {currentPlayer.lastName}</p>
            <p className="text-sm text-slate-400 truncate">{teamName}</p>
            {currentPlayer.number && <p className="text-xs text-slate-500">#{currentPlayer.number}</p>}
          </div>
        </div>
      )}

      {/* Teams section */}
      {otherTeams.length > 0 && (
        <Section title="Teams">
          <div className="-m-4">
            {otherTeams.map(team => (
              <button
                key={team.id}
                onClick={() => switchTeam(team.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                  <RefreshCw size={15} className="text-[#67e8f9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{team.teamName}</p>
                  <p className="text-xs text-slate-500 capitalize">{team.teamSettings.sport}</p>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Team section */}
      <Section title="Team">
        <div className="-m-4">
          <MenuItem icon={Calendar} label="My Availability" sub="Set dates you're unavailable" color="text-[#67e8f9]" onClick={() => setActiveTab('availability')} />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={BarChart2} label="Team Polls" sub="Vote on team decisions" color="text-[#a78bfa]" onClick={() => setActiveTab('polls')} />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={LinkIcon} label="Team Links" sub="Useful links for the team" color="text-[#22c55e]" onClick={() => setActiveTab('links')} />
        </div>
      </Section>

      {/* Communication section */}
      <Section title="Communication &amp; Alerts">
        <div className="-m-4">
          <MenuItem icon={Bell} label="Notification Settings" sub="Manage what notifications you receive" color="text-amber-400" onClick={() => setActiveTab('notifications')} />
          {(isAdmin || canManage) && (
            <>
              <div className="border-t border-white/[0.05]" />
              <MenuItem icon={Mail} label="Email Team" sub="Send an email to active players" color="text-[#67e8f9]" onClick={() => setShowEmailTeam(true)} />
            </>
          )}
        </div>
      </Section>

      {/* Create new team */}
      <Section title="Account">
        <div className="-m-4">
          <MenuItem
            icon={UserPlus}
            label="Create New Team"
            sub="Start a new team on AlignApps"
            color="text-[#f97316]"
            href="https://alignapps.com"
          />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={LogOut} label="Sign Out" danger onClick={handleSignOut} />
        </div>
      </Section>

      {/* Support */}
      <Section title="Support">
        <div className="-m-4">
          <MenuItem icon={HelpCircle} label="FAQs" sub="Frequently asked questions" color="text-slate-400" href="https://alignapps.com/faq" />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={Zap} label="Feature Request" sub="Suggest a new feature" color="text-[#67e8f9]" href="https://alignapps.com/feature-request" />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={Bug} label="Report Bug" sub="Let us know about an issue" color="text-rose-400" href="https://alignapps.com/bug-report" />
          <div className="border-t border-white/[0.05]" />
          <MenuItem icon={Megaphone} label="Notices" sub="App announcements and updates" color="text-amber-400" href="https://alignapps.com/notices" />
        </div>
      </Section>

      <p className="text-center text-xs text-slate-700 pb-4">AlignApps © {new Date().getFullYear()}</p>

      <EmailTeamModal isOpen={showEmailTeam} onClose={() => setShowEmailTeam(false)} players={players} />
    </div>
  );
}
