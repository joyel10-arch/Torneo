import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, CheckCircle } from 'lucide-react';
import { matchesApi, venuesApi } from '../../lib/api';
import { type Match, type Venue } from '../../types';
import { EmptyState, PageLoader, TeamAvatar, ErrorAlert } from '../ui';
import { getMatchStatusClass, getMatchStatusLabel, formatDateTime, formatScore } from '../../lib/utils';
import toast from 'react-hot-toast';
import { ResultModal } from '../ResultModal';

interface Props { tournamentId: string; isOrganizer: boolean; tournamentFormat?: string; }

export function FixturesTab({ tournamentId, isOrganizer, tournamentFormat }: Props) {
  const isKnockout = tournamentFormat === 'single_elimination' || !tournamentFormat;
  const [matches, setMatches] = useState<Match[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundFilter, setRoundFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resultMatch, setResultMatch] = useState<Match | null>(null);
  const [scheduleMatch, setScheduleMatch] = useState<Match | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduled_at: '', venue_id: '' });
  const [scheduling, setScheduling] = useState(false);

  const load = async () => {
    try {
      const [ms, vs] = await Promise.all([
        matchesApi.listForTournament(tournamentId),
        venuesApi.list(),
      ]);
      setMatches(ms);
      setVenues(vs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tournamentId]);

  const handleSchedule = async () => {
    if (!scheduleMatch) return;
    setScheduling(true);
    try {
      await matchesApi.update(scheduleMatch.id, {
        scheduled_at: scheduleForm.scheduled_at ? new Date(scheduleForm.scheduled_at).toISOString() : undefined,
        venue_id: scheduleForm.venue_id || undefined,
      });
      toast.success('Match scheduled');
      setScheduleMatch(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Schedule failed');
    } finally { setScheduling(false); }
  };

  if (loading) return <PageLoader />;

  const rounds = [...new Set(matches.map((m) => m.round_name || `Round ${m.round_number}`))];
  const filtered = matches.filter((m) => {
    if (roundFilter && (m.round_name || `Round ${m.round_number}`) !== roundFilter) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="form-input text-sm py-1.5 w-40" value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
          <option value="">All Rounds</option>
          {rounds.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="form-input text-sm py-1.5 w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['scheduled', 'completed', 'in_progress', 'postponed', 'bye'].map((s) => (
            <option key={s} value={s}>{getMatchStatusLabel(s as Match['status'])}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No fixtures" description="Generate a bracket to see fixtures" />
      ) : (
        <div className="space-y-2">
          {/* Group by round */}
          {rounds.filter((r) => !roundFilter || r === roundFilter).map((round) => {
            const roundMatches = filtered.filter((m) => (m.round_name || `Round ${m.round_number}`) === round);
            if (!roundMatches.length) return null;
            return (
              <div key={round} className="card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted-dark border-b border-muted-border flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-magenta-neon" />
                  <span className="text-sm font-bold text-text-primary">{round}</span>
                  <span className="text-xs text-text-secondary ml-1">({roundMatches.length} matches)</span>
                </div>
                <div className="divide-y divide-muted-border/50">
                  {roundMatches.map((m) => (
                    <div key={m.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted-dark/40 transition-colors">
                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-sm font-semibold truncate ${m.winner_id === m.home_team_id ? 'text-magenta-neon' : 'text-text-primary'}`}>
                          {m.home_team_name || 'TBD'}
                        </span>
                        <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                      </div>

                      {/* Score */}
                      <div className="text-center flex-shrink-0 w-24">
                        <div className="text-lg font-black tabular-nums text-text-primary">
                          {m.status === 'completed' ? formatScore(m.home_score, m.away_score) : '–'}
                        </div>
                        <span className={`${getMatchStatusClass(m.status)} text-2xs`}>
                          {getMatchStatusLabel(m.status)}
                        </span>
                        {m.home_penalties != null && (
                          <div className="text-2xs text-text-secondary">(pen: {m.home_penalties}–{m.away_penalties})</div>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                        <span className={`text-sm font-semibold truncate ${m.winner_id === m.away_team_id ? 'text-magenta-neon' : 'text-text-primary'}`}>
                          {m.away_team_name || 'TBD'}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="hidden md:flex flex-col items-end text-2xs text-text-secondary flex-shrink-0 w-32">
                        {m.scheduled_at && <span>{formatDateTime(m.scheduled_at)}</span>}
                        {m.venue_name && <span>{m.venue_name}</span>}
                      </div>

                      {/* Actions */}
                      {isOrganizer && !m.is_bye && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          {m.status !== 'completed' && (
                            <button
                              onClick={() => { setScheduleMatch(m); setScheduleForm({ scheduled_at: m.scheduled_at?.split('T')[0] || '', venue_id: m.venue_id || '' }); }}
                              className="btn-ghost btn-sm"
                              title="Schedule"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {m.status !== 'completed' && m.home_team_id && m.away_team_id && (
                            <button
                              onClick={() => setResultMatch(m)}
                              className="btn-primary btn-sm"
                              title="Enter Result"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setScheduleMatch(null)} />
          <div className="relative card-elevated p-5 w-full max-w-sm space-y-4 animate-fade-in">
            <h3 className="font-bold text-text-primary">Schedule Match</h3>
            <p className="text-sm text-text-secondary">{scheduleMatch.home_team_name} vs {scheduleMatch.away_team_name}</p>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input type="datetime-local" className="form-input" value={scheduleForm.scheduled_at} onChange={(e) => setScheduleForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Venue</label>
              <select className="form-input" value={scheduleForm.venue_id} onChange={(e) => setScheduleForm((f) => ({ ...f, venue_id: e.target.value }))}>
                <option value="">Select venue</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setScheduleMatch(null)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={handleSchedule} disabled={scheduling} className="btn-primary btn-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {resultMatch && (
        <ResultModal
          match={resultMatch}
          isKnockout={isKnockout}
          onClose={() => setResultMatch(null)}
          onSaved={() => { setResultMatch(null); load(); }}
        />
      )}
    </div>
  );
}
