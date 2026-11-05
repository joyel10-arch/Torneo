import React, { useState, useEffect } from 'react';
import { tournamentsApi, matchesApi } from '../lib/api';
import { type Tournament, type Match } from '../types';
import { PageLoader, EmptyState, TeamAvatar } from '../components/ui';
import { History, Filter } from 'lucide-react';
import { formatScore, formatDateTime, getMatchStatusClass, getMatchStatusLabel } from '../lib/utils';

export function MatchHistoryPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsApi.list().then((ts) => {
      setTournaments(ts);
      if (ts.length > 0) setSelected(ts[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    matchesApi.listForTournament(selected, { status: 'completed' }).then(setMatches).catch(() => setMatches([]));
  }, [selected]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Match History</h1><p className="page-subtitle">Completed match results</p></div>
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <select className="form-input pl-9 w-64" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState icon={History} title="No completed matches" description="Results will appear here once matches are played" />
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Round</th><th>Home Team</th><th className="text-center">Score</th>
                <th>Away Team</th><th>Winner</th><th>Date</th><th>Venue</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td><span className="badge-magenta">{m.round_name || `R${m.round_number}`}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                      <span className={m.winner_id === m.home_team_id ? 'text-magenta-neon font-semibold' : ''}>{m.home_team_name || 'TBD'}</span>
                    </div>
                  </td>
                  <td className="text-center font-black tabular-nums text-lg">{formatScore(m.home_score, m.away_score)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                      <span className={m.winner_id === m.away_team_id ? 'text-magenta-neon font-semibold' : ''}>{m.away_team_name || 'TBD'}</span>
                    </div>
                  </td>
                  <td className="text-status-success font-semibold">{m.winner_name || '—'}</td>
                  <td className="text-text-secondary text-xs">{formatDateTime(m.scheduled_at)}</td>
                  <td className="text-text-secondary text-xs">{m.venue_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
