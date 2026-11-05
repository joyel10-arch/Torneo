import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trophy, Search, Filter, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { tournamentsApi } from '../lib/api';
import { type Tournament, type TournamentStatus } from '../types';
import {
  PageLoader, EmptyState, ConfirmDialog, SearchInput,
  StatCard, ProgressBar
} from '../components/ui';
import {
  getTournamentStatusClass, getTournamentStatusLabel,
  formatDate
} from '../lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { TournamentFormModal } from '../components/TournamentFormModal';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'registration_open', label: 'Registration Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function TournamentsPage() {
  const { isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Tournament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const data = await tournamentsApi.list(statusFilter ? { status: statusFilter } : undefined);
      setTournaments(data);
    } catch { toast.error('Failed to load tournaments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tournamentsApi.delete(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const filtered = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.sport.toLowerCase().includes(search.toLowerCase())
  );

  const active = tournaments.filter((t) => t.status === 'in_progress').length;
  const completed = tournaments.filter((t) => t.status === 'completed').length;
  const totalTeams = tournaments.reduce((s, t) => s + t.team_count, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tournaments</h1>
          <p className="page-subtitle">{tournaments.length} total tournaments</p>
        </div>
        {isOrganizer && (
          <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Tournament
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={tournaments.length} icon={Trophy} accent="magenta" />
        <StatCard label="Active" value={active} icon={Trophy} accent="teal" />
        <StatCard label="Completed" value={completed} icon={Trophy} accent="success" />
        <StatCard label="Total Teams" value={totalTeams} icon={Users} accent="warning" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search} onChange={setSearch}
          placeholder="Search tournaments…"
          className="flex-1"
        />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input pl-9 pr-4 py-2 w-full sm:w-48"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description={search ? 'Try a different search term' : 'Create your first tournament to get started'}
          action={isOrganizer ? (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Tournament
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="card p-5 flex flex-col gap-4 hover:border-magenta-neon/40 transition-colors group">
              {/* Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-magenta-neon/15 border border-magenta-neon/30 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-magenta-neon" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-primary truncate">{t.name}</div>
                    <div className="text-xs text-text-secondary">{t.sport}</div>
                  </div>
                </div>
                <span className={getTournamentStatusClass(t.status as TournamentStatus)}>
                  {getTournamentStatusLabel(t.status as TournamentStatus)}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Teams', value: `${t.team_count}/${t.max_teams}` },
                  { label: 'Matches', value: `${t.completed_matches}/${t.total_matches}` },
                  { label: 'Format', value: t.format === 'single_elimination' ? 'KO' : 'RR' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted-dark rounded p-2">
                    <div className="text-sm font-bold text-text-primary tabular-nums">{value}</div>
                    <div className="text-2xs text-text-secondary uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <ProgressBar value={t.completion_pct} color="magenta" label={`Progress: ${t.completion_pct}%`} />

              {/* Dates */}
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Start: {formatDate(t.start_date)}</span>
                <span>End: {formatDate(t.end_date)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-muted-border">
                <Link to={`/tournaments/${t.id}`} className="btn-secondary btn-sm flex-1 justify-center">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                {isOrganizer && (
                  <>
                    <button
                      onClick={() => { setEditTarget(t); setShowForm(true); }}
                      className="btn-ghost btn-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="btn-ghost btn-sm text-status-error hover:bg-status-error/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TournamentFormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          tournament={editTarget}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Tournament"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
