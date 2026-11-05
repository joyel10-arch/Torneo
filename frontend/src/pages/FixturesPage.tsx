import React, { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { tournamentsApi, matchesApi } from '../lib/api';
import { type Match, type Tournament } from '../types';
import { PageLoader, EmptyState, TeamAvatar } from '../components/ui';
import { getMatchStatusClass, getMatchStatusLabel, formatDateTime, formatScore } from '../lib/utils';
import { ResultModal } from '../components/ResultModal';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function FixturesPage() {
  const { isOrganizer } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resultMatch, setResultMatch] = useState<Match | null>(null);

  const load = async () => {
    try {
      const ts = await tournamentsApi.list();
      setTournaments(ts);
      const tid = tournamentFilter || (ts[0]?.id || '');
      if (tid) {
        const ms = await matchesApi.listForTournament(tid, statusFilter ? { status: statusFilter } : undefined);
        setMatches(ms);
      }
    } catch { toast.error('Failed to load fixtures'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tournamentFilter, statusFilter]);

  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.round_name || `Round ${m.round_number}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fixtures & Schedule</h1>
          <p className="page-subtitle">{matches.length} matches</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select className="form-input pl-9 pr-4 py-2 w-64" value={tournamentFilter} onChange={(e) => setTournamentFilter(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
        <div className="relative">
          <select className="form-input pl-9 pr-4 py-2 w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['scheduled', 'completed', 'in_progress', 'postponed'].map((s) => (
              <option key={s} value={s}>{getMatchStatusLabel(s as Match['status'])}</option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Calendar} title="No fixtures" description="Select a tournament or generate a bracket" />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([round, ms]) => (
            <div key={round} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted-dark border-b border-muted-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-magenta-neon" />
                <span className="text-sm font-bold text-text-primary">{round}</span>
                <span className="text-xs text-text-secondary">({ms.length} matches)</span>
              </div>
              <div className="divide-y divide-muted-border/50">
                {ms.map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted-dark/40 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className={`text-sm font-semibold truncate ${m.winner_id === m.home_team_id ? 'text-magenta-neon' : 'text-text-primary'}`}>
                        {m.home_team_name || 'TBD'}
                      </span>
                      <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                    </div>
                    <div className="text-center flex-shrink-0 w-28">
                      <div className="text-lg font-black tabular-nums">
                        {m.status === 'completed' ? formatScore(m.home_score, m.away_score) : '–'}
                      </div>
                      <span className={`${getMatchStatusClass(m.status)} text-2xs`}>{getMatchStatusLabel(m.status)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                      <span className={`text-sm font-semibold truncate ${m.winner_id === m.away_team_id ? 'text-magenta-neon' : 'text-text-primary'}`}>
                        {m.away_team_name || 'TBD'}
                      </span>
                    </div>
                    <div className="hidden lg:flex flex-col items-end text-xs text-text-secondary w-36">
                      {m.scheduled_at && <span>{formatDateTime(m.scheduled_at)}</span>}
                      {m.venue_name && <span>{m.venue_name}</span>}
                    </div>
                    {isOrganizer && m.status !== 'completed' && !m.is_bye && m.home_team_id && m.away_team_id && (
                      <button onClick={() => setResultMatch(m)} className="btn-primary btn-sm flex-shrink-0">
                        Result
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {resultMatch && (
        <ResultModal match={resultMatch} onClose={() => setResultMatch(null)} onSaved={() => { setResultMatch(null); load(); }} />
      )}
    </div>
  );
}
