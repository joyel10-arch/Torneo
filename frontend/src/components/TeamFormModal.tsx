import React, { useState } from 'react';
import { Modal, ErrorAlert, Spinner } from './ui';
import { teamsApi } from '../lib/api';
import { type Team } from '../types';
import toast from 'react-hot-toast';

interface Props { open: boolean; onClose: () => void; team?: Team | null; onSaved: () => void; }

export function TeamFormModal({ open, onClose, team, onSaved }: Props) {
  const isEdit = !!team;
  const [form, setForm] = useState({
    name: team?.name || '', short_code: team?.short_code || '',
    sport: team?.sport || 'Football', college: team?.college || '',
    coach: team?.coach || '', contact_email: team?.contact_email || '',
    logo_url: team?.logo_url || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Team name is required'); return; }
    setLoading(true);
    try {
      if (isEdit && team) { await teamsApi.update(team.id, form); toast.success('Team updated'); }
      else { await teamsApi.create(form); toast.success('Team created'); }
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Team' : 'Add Team'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Team Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Short Code</label>
            <input className="form-input font-mono uppercase" maxLength={5} value={form.short_code} onChange={(e) => set('short_code', e.target.value.toUpperCase())} placeholder="e.g. THE" />
          </div>
          <div className="form-group">
            <label className="form-label">Sport</label>
            <select className="form-input" value={form.sport} onChange={(e) => set('sport', e.target.value)}>
              {['Football', 'Basketball', 'Cricket', 'Volleyball'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">College / Institution</label>
            <input className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Coach / Manager</label>
            <input className="form-input" value={form.coach} onChange={(e) => set('coach', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input type="email" className="form-input" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Logo URL</label>
            <input className="form-input" value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {isEdit ? 'Save Changes' : 'Add Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
