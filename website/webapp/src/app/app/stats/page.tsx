'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTeamStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type {
  Player, Sport,
  HockeyStats, HockeyGoalieStats,
  BaseballStats, BaseballPitcherStats,
  BasketballStats,
  SoccerStats, SoccerGoalieStats,
  LacrosseStats, LacrosseGoalieStats,
} from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { getPlayerName } from '@/lib/types';

// ─── Column definitions per sport/stat type ───────────────────────────────────

type StatCol = { key: string; label: string; getValue: (p: Player) => number };

function hockeySkaterCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.stats as HockeyStats)?.gamesPlayed ?? 0 },
    { key: 'g', label: 'G', getValue: (p) => (p.stats as HockeyStats)?.goals ?? 0 },
    { key: 'a', label: 'A', getValue: (p) => (p.stats as HockeyStats)?.assists ?? 0 },
    { key: 'pts', label: 'PTS', getValue: (p) => ((p.stats as HockeyStats)?.goals ?? 0) + ((p.stats as HockeyStats)?.assists ?? 0) },
    { key: 'pm', label: '+/-', getValue: (p) => (p.stats as HockeyStats)?.plusMinus ?? 0 },
    { key: 'pim', label: 'PIM', getValue: (p) => (p.stats as HockeyStats)?.pim ?? 0 },
  ];
}

function hockeyGoalieCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.goalieStats as HockeyGoalieStats)?.games ?? 0 },
    { key: 'w', label: 'W', getValue: (p) => (p.goalieStats as HockeyGoalieStats)?.wins ?? 0 },
    { key: 'l', label: 'L', getValue: (p) => (p.goalieStats as HockeyGoalieStats)?.losses ?? 0 },
    { key: 't', label: 'T', getValue: (p) => (p.goalieStats as HockeyGoalieStats)?.ties ?? 0 },
    { key: 'ga', label: 'GA', getValue: (p) => (p.goalieStats as HockeyGoalieStats)?.goalsAgainst ?? 0 },
    {
      key: 'svpct', label: 'SV%', getValue: (p) => {
        const gs = p.goalieStats as HockeyGoalieStats;
        if (!gs) return 0;
        const shots = gs.shotsAgainst ?? 0;
        if (shots === 0) return 0;
        return Math.round(((gs.saves ?? 0) / shots) * 1000) / 1000;
      },
    },
  ];
}

function baseballBatterCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.stats as BaseballStats)?.gamesPlayed ?? 0 },
    { key: 'ab', label: 'AB', getValue: (p) => (p.stats as BaseballStats)?.atBats ?? 0 },
    { key: 'h', label: 'H', getValue: (p) => (p.stats as BaseballStats)?.hits ?? 0 },
    {
      key: 'avg', label: 'AVG', getValue: (p) => {
        const bs = p.stats as BaseballStats;
        if (!bs) return 0;
        const ab = bs.atBats ?? 0;
        if (ab === 0) return 0;
        return Math.round(((bs.hits ?? 0) / ab) * 1000) / 1000;
      },
    },
    { key: 'rbi', label: 'RBI', getValue: (p) => (p.stats as BaseballStats)?.rbi ?? 0 },
    { key: 'hr', label: 'HR', getValue: (p) => (p.stats as BaseballStats)?.homeRuns ?? 0 },
    { key: 'r', label: 'R', getValue: (p) => (p.stats as BaseballStats)?.runs ?? 0 },
    { key: 'bb', label: 'BB', getValue: (p) => (p.stats as BaseballStats)?.walks ?? 0 },
    { key: 'k', label: 'K', getValue: (p) => (p.stats as BaseballStats)?.strikeouts ?? 0 },
  ];
}

function baseballPitcherCols(): StatCol[] {
  return [
    { key: 'gs', label: 'GS', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.starts ?? 0 },
    { key: 'w', label: 'W', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.wins ?? 0 },
    { key: 'l', label: 'L', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.losses ?? 0 },
    { key: 'ip', label: 'IP', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.innings ?? 0 },
    {
      key: 'era', label: 'ERA', getValue: (p) => {
        const ps = p.pitcherStats as BaseballPitcherStats;
        if (!ps) return 0;
        const ip = ps.innings ?? 0;
        if (ip === 0) return 0;
        return Math.round(((ps.earnedRuns ?? 0) / ip) * 9 * 100) / 100;
      },
    },
    { key: 'k', label: 'K', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.strikeouts ?? 0 },
    { key: 'bb', label: 'BB', getValue: (p) => (p.pitcherStats as BaseballPitcherStats)?.walks ?? 0 },
  ];
}

function basketballCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.stats as BasketballStats)?.gamesPlayed ?? 0 },
    { key: 'pts', label: 'PTS', getValue: (p) => (p.stats as BasketballStats)?.points ?? 0 },
    { key: 'reb', label: 'REB', getValue: (p) => (p.stats as BasketballStats)?.rebounds ?? 0 },
    { key: 'ast', label: 'AST', getValue: (p) => (p.stats as BasketballStats)?.assists ?? 0 },
    { key: 'stl', label: 'STL', getValue: (p) => (p.stats as BasketballStats)?.steals ?? 0 },
    { key: 'blk', label: 'BLK', getValue: (p) => (p.stats as BasketballStats)?.blocks ?? 0 },
  ];
}

function soccerFieldCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.stats as SoccerStats)?.gamesPlayed ?? 0 },
    { key: 'g', label: 'G', getValue: (p) => (p.stats as SoccerStats)?.goals ?? 0 },
    { key: 'a', label: 'A', getValue: (p) => (p.stats as SoccerStats)?.assists ?? 0 },
    { key: 'yc', label: 'YC', getValue: (p) => (p.stats as SoccerStats)?.yellowCards ?? 0 },
  ];
}

function soccerGoalieCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.goalieStats as SoccerGoalieStats)?.games ?? 0 },
    { key: 'w', label: 'W', getValue: (p) => (p.goalieStats as SoccerGoalieStats)?.wins ?? 0 },
    { key: 'l', label: 'L', getValue: (p) => (p.goalieStats as SoccerGoalieStats)?.losses ?? 0 },
    { key: 't', label: 'T', getValue: (p) => (p.goalieStats as SoccerGoalieStats)?.ties ?? 0 },
    { key: 'ga', label: 'GA', getValue: (p) => (p.goalieStats as SoccerGoalieStats)?.goalsAgainst ?? 0 },
    {
      key: 'svpct', label: 'SV%', getValue: (p) => {
        const gs = p.goalieStats as SoccerGoalieStats;
        if (!gs) return 0;
        const shots = gs.shotsAgainst ?? 0;
        if (shots === 0) return 0;
        return Math.round(((gs.saves ?? 0) / shots) * 1000) / 1000;
      },
    },
  ];
}

function lacrosseFieldCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.stats as LacrosseStats)?.gamesPlayed ?? 0 },
    { key: 'g', label: 'G', getValue: (p) => (p.stats as LacrosseStats)?.goals ?? 0 },
    { key: 'a', label: 'A', getValue: (p) => (p.stats as LacrosseStats)?.assists ?? 0 },
    { key: 'gb', label: 'GB', getValue: (p) => (p.stats as LacrosseStats)?.groundBalls ?? 0 },
    { key: 'ct', label: 'CT', getValue: (p) => (p.stats as LacrosseStats)?.causedTurnovers ?? 0 },
    { key: 'sog', label: 'SOG', getValue: (p) => (p.stats as LacrosseStats)?.shotsOnGoal ?? 0 },
  ];
}

function lacrosseGoalieCols(): StatCol[] {
  return [
    { key: 'gp', label: 'GP', getValue: (p) => (p.goalieStats as LacrosseGoalieStats)?.games ?? 0 },
    { key: 'w', label: 'W', getValue: (p) => (p.goalieStats as LacrosseGoalieStats)?.wins ?? 0 },
    { key: 'l', label: 'L', getValue: (p) => (p.goalieStats as LacrosseGoalieStats)?.losses ?? 0 },
    { key: 'sv', label: 'SV', getValue: (p) => (p.goalieStats as LacrosseGoalieStats)?.saves ?? 0 },
    { key: 'ga', label: 'GA', getValue: (p) => (p.goalieStats as LacrosseGoalieStats)?.goalsAgainst ?? 0 },
  ];
}

interface TableSection {
  title: string;
  players: Player[];
  cols: StatCol[];
}

function getTableSections(sport: Sport, players: Player[]): TableSection[] {
  const active = players.filter((p) => p.status === 'active');

  const isGoalie = (p: Player) => {
    const positions = p.positions && p.positions.length > 0 ? p.positions : [p.position];
    return positions.some((pos) =>
      sport === 'hockey' || sport === 'soccer' || sport === 'lacrosse'
        ? pos === 'G' || pos === 'GK'
        : false
    );
  };
  const isPitcher = (p: Player) => {
    const positions = p.positions && p.positions.length > 0 ? p.positions : [p.position];
    return positions.includes('P');
  };

  switch (sport) {
    case 'hockey': {
      const skaters = active.filter((p) => !isGoalie(p));
      const goalies = active.filter(isGoalie);
      return [
        { title: 'Skaters', players: skaters, cols: hockeySkaterCols() },
        ...(goalies.length > 0 ? [{ title: 'Goalies', players: goalies, cols: hockeyGoalieCols() }] : []),
      ];
    }
    case 'baseball':
    case 'softball': {
      const pitchers = active.filter(isPitcher);
      const batters = active.filter((p) => !isPitcher(p));
      return [
        { title: 'Batters', players: batters, cols: baseballBatterCols() },
        ...(pitchers.length > 0 ? [{ title: 'Pitchers', players: pitchers, cols: baseballPitcherCols() }] : []),
      ];
    }
    case 'basketball':
      return [{ title: 'Players', players: active, cols: basketballCols() }];
    case 'soccer': {
      const gks = active.filter((p) => {
        const pos = p.positions && p.positions.length > 0 ? p.positions : [p.position];
        return pos.includes('GK');
      });
      const field = active.filter((p) => {
        const pos = p.positions && p.positions.length > 0 ? p.positions : [p.position];
        return !pos.includes('GK');
      });
      return [
        { title: 'Field Players', players: field, cols: soccerFieldCols() },
        ...(gks.length > 0 ? [{ title: 'Goalkeepers', players: gks, cols: soccerGoalieCols() }] : []),
      ];
    }
    case 'lacrosse': {
      const lGoalies = active.filter((p) => {
        const pos = p.positions && p.positions.length > 0 ? p.positions : [p.position];
        return pos.includes('G');
      });
      const lField = active.filter((p) => {
        const pos = p.positions && p.positions.length > 0 ? p.positions : [p.position];
        return !pos.includes('G');
      });
      return [
        { title: 'Field Players', players: lField, cols: lacrosseFieldCols() },
        ...(lGoalies.length > 0 ? [{ title: 'Goalies', players: lGoalies, cols: lacrosseGoalieCols() }] : []),
      ];
    }
    default:
      return [];
  }
}

interface StatsTableProps {
  section: TableSection;
}

function StatsTable({ section }: StatsTableProps) {
  const [sortKey, setSortKey] = useState<string>(section.cols[1]?.key ?? section.cols[0]?.key ?? 'gp');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedPlayers = useMemo(() => {
    const col = section.cols.find((c) => c.key === sortKey);
    if (!col) return section.players;
    return [...section.players].sort((a, b) => {
      const aVal = col.getValue(a);
      const bVal = col.getValue(b);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [section.players, section.cols, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (section.players.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{section.title}</h2>
      <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-slate-500 font-medium w-40">Player</th>
                {section.cols.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-slate-500 font-medium cursor-pointer hover:text-slate-300 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {col.label}
                      {sortKey === col.key ? (
                        sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, idx) => (
                <tr
                  key={player.id}
                  className={cn(
                    'border-b border-white/[0.05] last:border-0',
                    idx % 2 === 0 ? '' : 'bg-white/[0.02]'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar player={player} size="sm" />
                      <div className="min-w-0">
                        <p className="text-slate-100 font-medium text-xs truncate">{getPlayerName(player)}</p>
                        {player.number && (
                          <p className="text-slate-500 text-[10px]">#{player.number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {section.cols.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3 text-right font-mono text-xs',
                        sortKey === col.key ? 'text-slate-100' : 'text-slate-400'
                      )}
                    >
                      {col.getValue(player)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const players = useTeamStore((s) => s.players);
  const teamSettings = useTeamStore((s) => s.teamSettings);

  const sections = useMemo(() => getTableSections(teamSettings.sport, players), [teamSettings.sport, players]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-5">Stats</h1>

      {sections.length === 0 || sections.every((s) => s.players.length === 0) ? (
        <div className="bg-[#0f1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No stats recorded yet</p>
        </div>
      ) : (
        sections.map((section) => (
          <StatsTable key={section.title} section={section} />
        ))
      )}
    </div>
  );
}
