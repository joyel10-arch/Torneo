import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy, Users, Calendar, GitBranch, TrendingUp, History,
  Settings, Download, Play, ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';
import { tournamentsApi, teamsApi, bracketApi, analyticsApi } from '../lib/api';
import { type Tournament, type TournamentTeam } from '../types';
import {
  PageLoader, EmptyState, ProgressBar, StatCard, TeamAvatar,
  ErrorAlert, ConfirmDialog, Tabs, SectionHeader, InfoAlert
} from '../components/ui';
import { getTournamentStatusClass, getTournamentStatusLabel, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { TournamentFormModal } from '../components/TournamentFormModal';
import { FixturesTab } from '../components/tournament/FixturesTab';
import { BracketTab } from '../components/tournament/BracketTab';
import { StandingsTab } from '../components/tournament/StandingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Trophy },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'bracket', label: 'Bracket', icon: GitBranch },
  { id: 'standings', label: 'Standings', icon: TrendingUp },
];

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOrganizer } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [allTeams, setAllTeams] = useState<{ id: string; name: string }[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [addingTeam, setAddingTeam] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const [t, ts, at] = await Promise.all([
        tournamentsApi.get(id),
        teamsApi.listForTournament(id),
        teamsApi.list(),
      ]);
      setTournament(t);
      setTeams(ts);
      setAllTeams(at);
      // Load analytics silently
      try {
        const an = await tournamentsApi.get(id); // reuse same endpoint
        setAnalytics(an);
      } catch { /* ignore */ }
    } catch {
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleGenerateBracket = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const result = await bracketApi.generate(id);
      toast.success(`Bracket generated! ${result.match_count} matches created.`);
      setShowGenerate(false);
      load();
      setActiveTab('bracket');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddTeam = async (teamId: string) => {
    if (!id || !teamId) return;
    try {
      await teamsApi.registerForTournament(id, teamId);
      toast.success('Team registered');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed');
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!id) return;
    try {
      await teamsApi.removeFromTournament(id, teamId);
      toast.success('Team removed');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Remove failed');
    }
  };

  if (loading) return <PageLoader />;
  if (!tournament) return <ErrorAlert message="Tournament not found" />;

  const unregisteredTeams = allTeams.filter(
    (at) => !teams.some((tt) => tt.team_id === at.id)
  );
  const canGenerate = teams.length >= 2 && tournament.status !== 'completed';
  const exportBase = analyticsApi.exportStandings(id!);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary">
        <Link to="/tournaments" className="hover:text-teal-electric transition-colors">Tournaments</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-text-primary font-medium">{tournament.name}</span>
      </nav>

      {/* Tournament header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-magenta-neon/15 border border-magenta-neon/30 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-7 h-7 text-magenta-neon" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-text-primary">{tournament.name}</h1>
                <span className={getTournamentStatusClass(tournament.status)}>
                  {getTournamentStatusLabel(tournament.status)}
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-1">{tournament.description || tournament.sport}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-secondary">
                <span>⚽ {tournament.sport}</span>
                <span>📅 {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}</span>
                <span>🏆 {tournament.format === 'single_elimination' ? 'Knockout' : 'Round Robin'}</span>
                {tournament.season && <span>Season: {tournament.season}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isOrganizer && (
              <>
                <button onClick={() => setShowEdit(true)} className="btn-secondary btn-sm">
                  <Settings className="w-3.5 h-3.5" /> Edit
                </button>
                {canGenerate && (
                  <button onClick={() => setShowGenerate(true)} className="btn-primary btn-sm">
                    <Play className="w-3.5 h-3.5" />
                    {tournament.format === 'round_robin' ? 'Generate Schedule' : 'Generate Bracket'}
                  </button>
                )}
              </>
            )}
            <a href={analyticsApi.exportReport(id!)} className="btn-ghost btn-sm" download>
              <Download className="w-3.5 h-3.5" /> Export
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Teams', value: `${tournament.team_count}/${tournament.max_teams}`, color: 'text-magenta-neon' },
            { label: 'Matches', value: `${tournament.completed_matches}/${tournament.total_matches}`, color: 'text-teal-electric' },
            { label: 'Progress', value: `${tournament.completion_pct}%`, color: 'text-status-success' },
            { label: 'Format', value: tournament.format === 'single_elimination' ? 'Knockout' : 'Round Robin', color: 'text-status-warning' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted-dark rounded-lg p-3 text-center">
              <div className={`text-xl font-black tabular-nums ${color}`}>{value}</div>
              <div className="text-xs text-text-secondary uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <ProgressBar value={tournament.completion_pct} color="magenta" label="" />
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-5">
            <SectionHeader title="Tournament Info" />
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Sport', value: tournament.sport },
                { label: 'Season', value: tournament.season || '—' },
                { label: 'Format', value: tournament.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin' },
                { label: 'Start Date', value: formatDate(tournament.start_date) },
                { label: 'End Date', value: formatDate(tournament.end_date) },
                { label: 'Registration Deadline', value: formatDate(tournament.registration_deadline) },
                { label: 'Max Teams', value: tournament.max_teams },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 py-2 border-b border-muted-border/50">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="text-text-primary font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <SectionHeader title="Quick Links" />
              <div className="space-y-2">
                {[
                  { label: 'View Bracket', tab: 'bracket', icon: GitBranch },
                  { label: 'Fixtures', tab: 'fixtures', icon: Calendar },
                  { label: 'Standings', tab: 'standings', icon: TrendingUp },
                ].map(({ label, tab, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="nav-item w-full text-left"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-text-secondary/50" />
                  </button>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <SectionHeader title="Export Data" />
              <div className="space-y-2">
                {[
                  { label: 'Standings CSV', url: analyticsApi.exportStandings(id!) },
                  { label: 'Fixtures CSV', url: analyticsApi.exportFixtures(id!) },
                  { label: 'Full Report CSV', url: analyticsApi.exportReport(id!) },
                ].map(({ label, url }) => (
                  <a key={label} href={url} download className="nav-item w-full text-left">
                    <Download className="w-4 h-4" />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-4">
          <SectionHeader
            title={`Registered Teams (${teams.length}/${tournament.max_teams})`}
            action={
              isOrganizer && unregisteredTeams.length > 0 && tournament.status !== 'completed' ? (
                <div className="flex gap-2">
                  <select
                    value={addingTeam}
                    onChange={(e) => setAddingTeam(e.target.value)}
                    className="form-input text-sm py-1"
                  >
                    <option value="">Select team to add…</option>
                    {unregisteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { if (addingTeam) { handleAddTeam(addingTeam); setAddingTeam(''); } }}
                    className="btn-primary btn-sm"
                    disabled={!addingTeam}
                  >
                    Add
                  </button>
                </div>
              ) : undefined
            }
          />
          {teams.length === 0 ? (
            <EmptyState icon={Users} title="No teams registered" description="Add teams to this tournament" />
          ) : (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>College</th>
                    <th>Seed</th>
                    <th>Registered</th>
                    {isOrganizer && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((tt, idx) => (
                    <tr key={tt.id}>
                      <td className="text-text-secondary tabular-nums">{idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <TeamAvatar name={tt.team_name} logoUrl={tt.logo_url} size="sm" />
                          <span className="font-semibold">{tt.team_name}</span>
                          {tt.short_code && <span className="text-xs text-text-secondary">({tt.short_code})</span>}
                        </div>
                      </td>
                      <td className="text-text-secondary">{tt.college || '—'}</td>
                      <td className="tabular-nums">{tt.seed || '—'}</td>
                      <td className="text-text-secondary text-xs">{new Date(tt.registered_at).toLocaleDateString()}</td>
                      {isOrganizer && (
                        <td>
                          <button
                            onClick={() => handleRemoveTeam(tt.team_id)}
                            className="btn-ghost btn-sm text-status-error hover:bg-status-error/10"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fixtures' && <FixturesTab tournamentId={id!} isOrganizer={isOrganizer} tournamentFormat={tournament.format} />}
      {activeTab === 'bracket' && <BracketTab tournamentId={id!} />}
      {activeTab === 'standings' && <StandingsTab tournamentId={id!} />}

      {/* Modals */}
      {showEdit && (
        <TournamentFormModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          tournament={tournament}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
      <ConfirmDialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onConfirm={handleGenerateBracket}
        title={tournament.format === 'round_robin' ? 'Generate Round-Robin Schedule' : 'Generate Bracket'}
        message={tournament.format === 'round_robin'
          ? `Generate a round-robin schedule for "${tournament.name}" with ${teams.length} teams? Every team will play every other team. Any existing matches will be cleared.`
          : `Generate a knockout bracket for "${tournament.name}" with ${teams.length} teams? Any existing matches will be cleared.`
        }
        confirmLabel="Generate"
        variant="primary"
        isLoading={generating}
      />
    </div>
  );
}
