import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Users, Calendar, CheckCircle2, TrendingUp,
  ArrowRight, Target, Clock, Zap, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { tournamentsApi, matchesApi } from '../lib/api';
import { type Tournament, type Match } from '../types';
import {
  StatCard, PageLoader, EmptyState, TeamAvatar, ProgressBar
} from '../components/ui';
import {
  getTournamentStatusClass, getTournamentStatusLabel,
  formatDate, formatScore, formatRelativeTime, getMatchStatusClass, getMatchStatusLabel
} from '../lib/utils';

export function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ts = await tournamentsApi.list();
        setTournaments(ts);

        // Load matches for in-progress tournaments
        const active = ts.filter((t: Tournament) => t.status === 'in_progress');
        if (active.length > 0) {
          const matchPromises = active.map((t: Tournament) =>
            matchesApi.listForTournament(t.id)
          );
          const results = await Promise.all(matchPromises);
          const allMatches: Match[] = results.flat();
          setRecentMatches(
            allMatches.filter((m) => m.status === 'completed').slice(-5).reverse()
          );
          setUpcomingMatches(
            allMatches.filter((m) => m.status === 'scheduled').slice(0, 5)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PageLoader />;

  const totalTeams = tournaments.reduce((s, t) => s + (t.team_count || 0), 0);
  const totalMatches = tournaments.reduce((s, t) => s + t.total_matches, 0);
  const completedMatches = tournaments.reduce((s, t) => s + t.completed_matches, 0);
  const activeTournaments = tournaments.filter((t) => t.status === 'in_progress');

  // Completion chart data (simulated from real data)
  const chartData = tournaments.slice(0, 6).map((t) => ({
    name: t.name.split(' ').slice(0, 2).join(' '),
    completion: t.completion_pct,
    matches: t.completed_matches,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tournament operations overview</p>
        </div>
        <Link to="/tournaments/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Tournament
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Tournaments"
          value={activeTournaments.length}
          icon={Trophy}
          accent="magenta"
          sub={`${tournaments.length} total`}
        />
        <StatCard
          label="Registered Teams"
          value={totalTeams}
          icon={Users}
          accent="teal"
        />
        <StatCard
          label="Matches Played"
          value={completedMatches}
          icon={CheckCircle2}
          accent="success"
          sub={`of ${totalMatches} total`}
        />
        <StatCard
          label="Upcoming"
          value={upcomingMatches.length}
          icon={Clock}
          accent="warning"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tournaments */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-magenta-neon" />
              Active Tournaments
            </h2>
            <Link to="/tournaments" className="text-sm text-teal-electric hover:text-teal-electric/80 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeTournaments.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No active tournaments"
              description="Create a tournament to get started"
              action={
                <Link to="/tournaments/new" className="btn-primary btn-sm">
                  <Plus className="w-3.5 h-3.5" />
                  Create Tournament
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeTournaments.map((t) => (
                <Link key={t.id} to={`/tournaments/${t.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted-dark transition-colors border border-transparent hover:border-muted-border">
                    <div className="w-10 h-10 rounded-lg bg-magenta-neon/15 border border-magenta-neon/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-magenta-neon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{t.name}</div>
                      <div className="text-xs text-text-secondary">{t.sport} · {t.team_count} teams</div>
                      <div className="mt-1.5">
                        <ProgressBar value={t.completion_pct} label="" color="magenta" />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-magenta-neon tabular-nums">{t.completion_pct}%</div>
                      <div className="text-xs text-text-secondary">{t.completed_matches}/{t.total_matches}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-status-success" />
              Recent Results
            </h2>
            <Link to="/history" className="text-xs text-teal-electric hover:text-teal-electric/80">
              History
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">⚽</div>
              <p className="text-sm text-text-secondary">No results yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-muted-dark border border-muted-border/50">
                  <div className="text-2xs text-text-secondary mb-1.5 font-semibold uppercase tracking-wide">
                    {m.round_name}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <TeamAvatar name={m.home_team_name || 'TBD'} size="sm" />
                      <span className="text-xs font-semibold text-text-primary truncate">{m.home_team_name || 'TBD'}</span>
                    </div>
                    <div className="text-sm font-black text-text-primary tabular-nums whitespace-nowrap">
                      {formatScore(m.home_score, m.away_score)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                      <span className="text-xs font-semibold text-text-primary truncate text-right">{m.away_team_name || 'TBD'}</span>
                      <TeamAvatar name={m.away_team_name || 'TBD'} size="sm" />
                    </div>
                  </div>
                  {m.winner_name && (
                    <div className="mt-1.5 text-2xs text-status-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Winner: {m.winner_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart + Upcoming row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-electric" />
              Tournament Completion
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#30203B', border: '1px solid #493650', borderRadius: 6 }}
                  labelStyle={{ color: '#F8F5FA', fontWeight: 600 }}
                  itemStyle={{ color: '#F500A8' }}
                  formatter={(v: number) => [`${v}%`, 'Completion']}
                />
                <Bar dataKey="completion" fill="#F500A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Upcoming Matches */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-status-warning" />
              Upcoming Fixtures
            </h2>
            <Link to="/fixtures" className="text-xs text-teal-electric hover:text-teal-electric/80">
              All fixtures
            </Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">No upcoming fixtures</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted-dark border border-muted-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">
                      {m.home_team_name || 'TBD'} vs {m.away_team_name || 'TBD'}
                    </div>
                    <div className="text-2xs text-text-secondary mt-0.5">
                      {m.round_name} · {m.scheduled_at ? formatDate(m.scheduled_at) : 'TBC'}
                    </div>
                  </div>
                  <span className="badge-neutral text-2xs">{m.venue_name || 'Venue TBD'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Tournaments Table */}
      {tournaments.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-muted-border flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">All Tournaments</h2>
            <Link to="/tournaments" className="btn-secondary btn-sm">Manage</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sport</th>
                  <th>Status</th>
                  <th>Teams</th>
                  <th>Progress</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id} className="cursor-pointer" onClick={() => window.location.href = `/tournaments/${t.id}`}>
                    <td className="font-semibold text-text-primary">{t.name}</td>
                    <td>{t.sport}</td>
                    <td><span className={getTournamentStatusClass(t.status)}>{getTournamentStatusLabel(t.status)}</span></td>
                    <td className="tabular-nums">{t.team_count}/{t.max_teams}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <ProgressBar value={t.completion_pct} />
                        </div>
                        <span className="text-xs tabular-nums text-text-secondary">{t.completion_pct}%</span>
                      </div>
                    </td>
                    <td className="text-text-secondary">{formatDate(t.start_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
