import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, Search, Mail, BookOpen } from 'lucide-react';
import { teamsApi } from '../lib/api';
import { type Team } from '../types';
import { PageLoader, EmptyState, ConfirmDialog, SearchInput, TeamAvatar, StatCard } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { TeamFormModal } from '../components/TeamFormModal';
import { formatDate } from '../lib/utils';

export function TeamsPage() {
  const { isOrganizer } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { setTeams(await teamsApi.list()); }
    catch { toast.error('Failed to load teams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teamsApi.delete(deleteTarget.id);
      toast.success('Team deleted');
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.college || '').toLowerCase().includes(search.toLowerCase())
  );

  const sports = [...new Set(teams.map((t) => t.sport))];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">{teams.length} registered teams</p>
        </div>
        {isOrganizer && (
          <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teams" value={teams.length} icon={Users} accent="magenta" />
        <StatCard label="Sports" value={sports.length} icon={BookOpen} accent="teal" />
        {sports.slice(0, 2).map((s) => (
          <StatCard key={s} label={s} value={teams.filter((t) => t.sport === s).length} icon={Users} accent="success" />
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or college…" className="max-w-md" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={search ? 'Try a different search' : 'Add your first team'}
          action={isOrganizer ? (
            <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Team</button>
          ) : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Code</th>
                <th>Sport</th>
                <th>College</th>
                <th>Coach</th>
                <th>Registered</th>
                {isOrganizer && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <TeamAvatar name={t.name} logoUrl={t.logo_url} size="md" />
                      <div>
                        <div className="font-semibold text-text-primary">{t.name}</div>
                        {t.contact_email && (
                          <div className="text-xs text-text-secondary flex items-center gap-1">
                            <Mail className="w-3 h-3" />{t.contact_email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-neutral font-mono">{t.short_code || '—'}</span></td>
                  <td>{t.sport}</td>
                  <td className="text-text-secondary">{t.college || '—'}</td>
                  <td className="text-text-secondary">{t.coach || '—'}</td>
                  <td className="text-text-secondary text-xs">{formatDate(t.created_at)}</td>
                  {isOrganizer && (
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditTarget(t); setShowForm(true); }} className="btn-ghost btn-sm">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="btn-ghost btn-sm text-status-error hover:bg-status-error/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TeamFormModal
          open={showForm}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          team={editTarget}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Delete "${deleteTarget?.name}"? Teams participating in tournaments cannot be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
