import React, { useState, useEffect } from 'react';
import { tournamentsApi, analyticsApi } from '../lib/api';
import { type Tournament } from '../types';
import { PageLoader, EmptyState, ProgressBar, StatCard } from '../components/ui';
import { BarChart2, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getTournamentStatusLabel } from '../lib/utils';

const COLORS = ['#F500A8', '#21E6D1', '#21C58E', '#F5B942', '#FF647C'];

export function AnalyticsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState('');
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsApi.list().then((ts) => {
      setTournaments(ts);
      if (ts.length > 0) setSelected(ts[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    analyticsApi.get(selected).then(setAnalytics).catch(() => setAnalytics(null));
  }, [selected]);

  if (loading) return <PageLoader />;

  const statusData = tournaments.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusData).map(([k, v]) => ({ name: getTournamentStatusLabel(k as Tournament['status']), value: v }));

  const progressData = tournaments.map((t) => ({
    name: t.name.split(' ').slice(0, 2).join(' '),
    completion: t.completion_pct,
    completed: t.completed_matches,
    total: t.total_matches,
  }));

  const t = analytics as { tournament_name?: string; team_count?: number; total_matches?: number; completed_matches?: number; completion_pct?: number; total_goals?: number; avg_goals_per_match?: number; round_distribution?: { round: string; count: number }[] } | null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Tournament performance insights</p></div>
        {selected && (
          <div className="flex gap-2">
            <a href={analyticsApi.exportStandings(selected)} download className="btn-secondary btn-sm">
              <Download className="w-3.5 h-3.5" /> Standings CSV
            </a>
            <a href={analyticsApi.exportFixtures(selected)} download className="btn-secondary btn-sm">
              <Download className="w-3.5 h-3.5" /> Fixtures CSV
            </a>
          </div>
        )}
      </div>

      <select className="form-input w-72" value={selected} onChange={(e) => setSelected(e.target.value)}>
        {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {/* Tournament analytics */}
      {t && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Teams" value={t.team_count || 0} icon={BarChart2} accent="magenta" />
            <StatCard label="Matches Played" value={`${t.completed_matches || 0}/${t.total_matches || 0}`} icon={BarChart2} accent="teal" />
            <StatCard label="Total Goals" value={t.total_goals || 0} icon={BarChart2} accent="success" />
            <StatCard label="Avg Goals/Match" value={(t.avg_goals_per_match as number || 0).toFixed(1)} icon={BarChart2} accent="warning" />
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold text-text-primary mb-1">{t.tournament_name}</h2>
            <ProgressBar value={t.completion_pct as number || 0} label={`Progress: ${t.completion_pct}%`} color="magenta" />
          </div>

          {t.round_distribution && (t.round_distribution as { round: string; count: number }[]).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <h3 className="text-sm font-bold text-text-primary mb-4">Matches by Round</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={t.round_distribution as { round: string; count: number }[]}>
                    <XAxis dataKey="round" tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#30203B', border: '1px solid #493650', borderRadius: 6 }} labelStyle={{ color: '#F8F5FA' }} />
                    <Bar dataKey="count" fill="#F500A8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cross-tournament charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4">Tournament Completion (%)</h3>
          {progressData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={progressData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#30203B', border: '1px solid #493650', borderRadius: 6 }} labelStyle={{ color: '#F8F5FA' }} formatter={(v: number) => [`${v}%`, 'Completion']} />
                <Bar dataKey="completion" fill="#F500A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4">Tournaments by Status</h3>
          {pieData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#493650' }}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#30203B', border: '1px solid #493650', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Matches timeline */}
      {progressData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4">Matches Completed vs Total</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <XAxis dataKey="name" tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B9AFC2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#30203B', border: '1px solid #493650', borderRadius: 6 }} labelStyle={{ color: '#F8F5FA' }} />
              <Legend wrapperStyle={{ color: '#B9AFC2', fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#493650" fill="#493650" fillOpacity={0.3} name="Total" />
              <Area type="monotone" dataKey="completed" stroke="#F500A8" fill="#F500A8" fillOpacity={0.2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
