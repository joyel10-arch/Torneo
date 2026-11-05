import React, { useState, useEffect } from 'react';
import { tournamentsApi, rankingsApi } from '../lib/api';
import { type Tournament, type StandingEntry } from '../types';
import { PageLoader, EmptyState, TeamAvatar, ProgressBar } from '../components/ui';
import { TrendingUp } from 'lucide-react';
import { goalDifference } from '../lib/utils';

export function StandingsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState('');
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    tournamentsApi.list().then((ts) => {
      setTournaments(ts);
      if (ts.length > 0) setSelected(ts[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingStandings(true);
    rankingsApi.getStandings(selected).then(setStandings).catch(() => setStandings([])).finally(() => setLoadingStandings(false));
  }, [selected]);

  if (loading) return <PageLoader />;
  const maxPts = Math.max(...standings.map((s) => s.points), 1);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Standings</h1><p className="page-subtitle">League table computed via Bubble Sort</p></div>
      </div>

      <select className="form-input w-72" value={selected} onChange={(e) => setSelected(e.target.value)}>
        {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loadingStandings ? <PageLoader /> : standings.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No standings" description="Complete some matches to see standings" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-muted-border bg-muted-dark flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-electric" />
            <span className="text-sm font-bold text-text-primary">{tournaments.find((t) => t.id === selected)?.name}</span>
            <span className="text-xs text-text-secondary ml-2">Sorted: Points → GD → GF → Name (Bubble Sort)</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th><th>Team</th><th className="text-center">MP</th>
                <th className="text-center">W</th><th className="text-center">D</th><th className="text-center">L</th>
                <th className="text-center">GS</th><th className="text-center">GC</th><th className="text-center">GD</th>
                <th className="text-center text-magenta-neon">Pts</th>
                <th className="w-28 hidden md:table-cell">Points Bar</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.team_id} className={i === 0 ? 'bg-magenta-neon/5' : ''}>
                  <td className="text-center font-black text-magenta-neon tabular-nums">{s.rank}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={s.team_name} logoUrl={s.logo_url} size="sm" />
                      <span className="font-semibold">{s.team_name}</span>
                      {i === 0 && <span className="text-xs">🏆</span>}
                    </div>
                  </td>
                  {[s.matches_played, s.wins, s.draws, s.losses, s.goals_scored, s.goals_conceded].map((v, j) => (
                    <td key={j} className="text-center tabular-nums text-text-secondary">{v}</td>
                  ))}
                  <td className={`text-center font-semibold tabular-nums ${(s.goals_scored - s.goals_conceded) > 0 ? 'text-status-success' : (s.goals_scored - s.goals_conceded) < 0 ? 'text-status-error' : 'text-text-secondary'}`}>
                    {goalDifference(s.goals_scored, s.goals_conceded)}
                  </td>
                  <td className="text-center text-xl font-black text-magenta-neon tabular-nums">{s.points}</td>
                  <td className="hidden md:table-cell pr-4"><ProgressBar value={s.points} max={maxPts} color={i === 0 ? 'magenta' : 'teal'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
