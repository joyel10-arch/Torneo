import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { rankingsApi } from '../../lib/api';
import { type StandingEntry } from '../../types';
import { PageLoader, EmptyState, TeamAvatar, ProgressBar } from '../ui';
import { goalDifference } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props { tournamentId: string; }

export function StandingsTab({ tournamentId }: Props) {
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await rankingsApi.getStandings(tournamentId);
      setStandings(data);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [tournamentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    toast.success('Standings refreshed');
  };

  if (loading) return <PageLoader />;
  if (!standings.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No standings yet"
        description="Standings are calculated after matches are completed"
      />
    );
  }

  const maxPoints = Math.max(...standings.map((s) => s.points), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-text-secondary">Sorted using <span className="text-teal-electric font-semibold">Bubble Sort</span> · Points → GD → GF → Name</div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-ghost btn-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Team</th>
              <th className="text-center">MP</th>
              <th className="text-center">W</th>
              <th className="text-center">D</th>
              <th className="text-center">L</th>
              <th className="text-center">GS</th>
              <th className="text-center">GC</th>
              <th className="text-center">GD</th>
              <th className="text-center font-bold text-magenta-neon">Pts</th>
              <th className="w-32 hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const gd = s.goals_scored - s.goals_conceded;
              const isTop = idx === 0;
              return (
                <tr key={s.team_id} className={isTop ? 'bg-magenta-neon/5' : ''}>
                  <td className="text-center">
                    <span className={`text-sm font-black tabular-nums ${isTop ? 'text-magenta-neon' : 'text-text-secondary'}`}>
                      {s.rank}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={s.team_name} logoUrl={s.logo_url} size="sm" />
                      <span className={`font-semibold ${isTop ? 'text-magenta-neon' : 'text-text-primary'}`}>
                        {s.team_name}
                      </span>
                      {isTop && <span className="text-magenta-neon text-xs">🏆</span>}
                    </div>
                  </td>
                  {[s.matches_played, s.wins, s.draws, s.losses, s.goals_scored, s.goals_conceded].map((v, i) => (
                    <td key={i} className="text-center tabular-nums text-text-secondary">{v}</td>
                  ))}
                  <td className={`text-center tabular-nums font-semibold ${gd > 0 ? 'text-status-success' : gd < 0 ? 'text-status-error' : 'text-text-secondary'}`}>
                    {goalDifference(s.goals_scored, s.goals_conceded)}
                  </td>
                  <td className="text-center">
                    <span className="text-lg font-black text-magenta-neon tabular-nums">{s.points}</span>
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="pr-2">
                      <ProgressBar value={s.points} max={maxPoints} color={isTop ? 'magenta' : 'teal'} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-text-secondary px-1">
        MP = Matches Played · W = Wins · D = Draws · L = Losses · GS = Goals Scored · GC = Goals Conceded · GD = Goal Difference · Pts = Points
      </div>
    </div>
  );
}
