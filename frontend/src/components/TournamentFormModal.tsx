import React, { useState } from 'react';
import { Modal, ErrorAlert, Spinner } from './ui';
import { tournamentsApi } from '../lib/api';
import { type Tournament } from '../types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  tournament?: Tournament | null;
  onSaved: () => void;
}

export function TournamentFormModal({ open, onClose, tournament, onSaved }: Props) {
  const isEdit = !!tournament;
  const [form, setForm] = useState({
    name: tournament?.name || '',
    sport: tournament?.sport || 'Football',
    description: tournament?.description || '',
    season: tournament?.season || '',
    start_date: tournament?.start_date ? tournament.start_date.split('T')[0] : '',
    end_date: tournament?.end_date ? tournament.end_date.split('T')[0] : '',
    registration_deadline: tournament?.registration_deadline ? tournament.registration_deadline.split('T')[0] : '',
    max_teams: tournament?.max_teams || 8,
    format: tournament?.format || 'single_elimination',
    status: tournament?.status || 'draft',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.start_date || !form.end_date) {
      setError('Name, start date and end date are required.');
      return;
    }
    if (form.end_date <= form.start_date) {
      setError('End date must be after start date.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        registration_deadline: form.registration_deadline
          ? new Date(form.registration_deadline).toISOString()
          : undefined,
        max_teams: Number(form.max_teams),
      };
      if (isEdit && tournament) {
        await tournamentsApi.update(tournament.id, payload);
        toast.success('Tournament updated');
      } else {
        await tournamentsApi.create(payload);
        toast.success('Tournament created');
      }
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Tournament' : 'New Tournament'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group sm:col-span-2">
            <label className="form-label">Tournament Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Sport</label>
            <select className="form-input" value={form.sport} onChange={(e) => set('sport', e.target.value)}>
              {['Football', 'Basketball', 'Cricket', 'Volleyball', 'Badminton'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Season / Edition</label>
            <input className="form-input" value={form.season} onChange={(e) => set('season', e.target.value)} placeholder="2025" />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input type="date" className="form-input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input type="date" className="form-input" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Registration Deadline</label>
            <input type="date" className="form-input" value={form.registration_deadline} onChange={(e) => set('registration_deadline', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Max Teams</label>
            <select className="form-input" value={form.max_teams} onChange={(e) => set('max_teams', Number(e.target.value))}>
              {[4, 8, 16, 32].map((n) => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Format</label>
            <select className="form-input" value={form.format} onChange={(e) => set('format', e.target.value)}>
              <option value="single_elimination">Single Elimination (Knockout)</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="form-group sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input h-20 resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {isEdit ? 'Save Changes' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
