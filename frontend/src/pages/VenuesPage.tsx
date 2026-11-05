import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import { venuesApi } from '../lib/api';
import { type Venue } from '../types';
import { PageLoader, EmptyState, ConfirmDialog, StatCard, Modal, ErrorAlert, Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

function VenueFormModal({ open, onClose, venue, onSaved }: {
  open: boolean; onClose: () => void; venue?: Venue | null; onSaved: () => void;
}) {
  const isEdit = !!venue;
  const [form, setForm] = useState({
    name: venue?.name || '', location: venue?.location || '',
    capacity: venue?.capacity?.toString() || '', notes: venue?.notes || '',
    is_available: venue?.is_available ?? true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Venue name is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, capacity: form.capacity ? parseInt(form.capacity) : undefined };
      if (isEdit && venue) { await venuesApi.update(venue.id, payload); toast.success('Venue updated'); }
      else { await venuesApi.create(payload); toast.success('Venue created'); }
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Venue' : 'Add Venue'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Venue Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Location / Address</label>
            <input className="form-input" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input type="number" className="form-input" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="5000" />
          </div>
          <div className="form-group flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} />
              <span className="text-sm text-text-primary">Available for booking</span>
            </label>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Notes</label>
            <textarea className="form-input h-16 resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner size="sm" />}{isEdit ? 'Save' : 'Add Venue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function VenuesPage() {
  const { isOrganizer } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Venue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { setVenues(await venuesApi.list()); }
    catch { toast.error('Failed to load venues'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await venuesApi.delete(deleteTarget.id);
      toast.success('Venue deleted');
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Delete failed');
    } finally { setDeleting(false); }
  };

  if (loading) return <PageLoader />;
  const available = venues.filter((v) => v.is_available).length;
  const totalCap = venues.reduce((s, v) => s + (v.capacity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Venues</h1><p className="page-subtitle">{venues.length} venues registered</p></div>
        {isOrganizer && (
          <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Venue
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Venues" value={venues.length} icon={MapPin} accent="magenta" />
        <StatCard label="Available" value={available} icon={MapPin} accent="teal" />
        <StatCard label="Total Capacity" value={totalCap.toLocaleString()} icon={MapPin} accent="success" />
        <StatCard label="Matches Hosted" value={venues.reduce((s, v) => s + v.match_count, 0)} icon={MapPin} accent="warning" />
      </div>

      {venues.length === 0 ? (
        <EmptyState icon={MapPin} title="No venues" description="Add venues to assign to matches"
          action={isOrganizer ? <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Venue</button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v) => (
            <div key={v.id} className="card p-5 space-y-3 hover:border-teal-electric/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-electric/10 border border-teal-electric/25 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-electric" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">{v.name}</div>
                    <div className="text-xs text-text-secondary">{v.location || '—'}</div>
                  </div>
                </div>
                <span className={v.is_available ? 'badge-success' : 'badge-error'}>
                  {v.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-muted-dark rounded p-2">
                  <div className="text-sm font-bold text-text-primary">{v.capacity?.toLocaleString() || '—'}</div>
                  <div className="text-2xs text-text-secondary">Capacity</div>
                </div>
                <div className="bg-muted-dark rounded p-2">
                  <div className="text-sm font-bold text-text-primary">{v.match_count}</div>
                  <div className="text-2xs text-text-secondary">Matches</div>
                </div>
              </div>

              {v.notes && <p className="text-xs text-text-secondary">{v.notes}</p>}

              {isOrganizer && (
                <div className="flex gap-2 pt-1 border-t border-muted-border">
                  <button onClick={() => { setEditTarget(v); setShowForm(true); }} className="btn-secondary btn-sm flex-1">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(v)} className="btn-ghost btn-sm text-status-error hover:bg-status-error/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VenueFormModal open={showForm} onClose={() => { setShowForm(false); setEditTarget(null); }}
          venue={editTarget} onSaved={() => { setShowForm(false); setEditTarget(null); load(); }} />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Venue" message={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" isLoading={deleting} />
    </div>
  );
}
