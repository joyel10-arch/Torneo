import React, { useState } from 'react';
import { Modal, ErrorAlert, Spinner } from './ui';
import { matchesApi } from '../lib/api';
import { type Match } from '../types';
import toast from 'react-hot-toast';

interface Props {
  match: Match;
  onClose: () => void;
  onSaved: () => void;
  isKnockout?: boolean; // false = round-robin (draws allowed, no penalties needed)
}

export function ResultModal({ match, onClose, onSaved, isKnockout = true }: Props) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homePen, setHomePen] = useState('');
  const [awayPen, setAwayPen] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDraw = homeScore !== '' && awayScore !== '' && homeScore === awayScore;
  // Show penalty section only in knockout mode when there's a draw
  const showPenalties = isKnockout && isDraw;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setError('Please enter valid non-negative scores');
      return;
    }

    const payload: Record<string, number | undefined> = { home_score: hs, away_score: as_ };

    if (showPenalties) {
      const hp = parseInt(homePen);
      const ap = parseInt(awayPen);
      if (isNaN(hp) || isNaN(ap) || hp < 0 || ap < 0) {
        setError('Please enter valid penalty scores for the draw');
        return;
      }
      if (hp === ap) {
        setError('Penalty scores cannot be equal');
        return;
      }
      payload.home_penalties = hp;
      payload.away_penalties = ap;
    }

    setLoading(true);
    try {
      await matchesApi.submitResult(match.id, payload);
      toast.success('Result recorded!');
      onSaved();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Enter Match Result" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="text-center p-3 bg-muted-dark rounded-lg">
          <div className="text-sm font-semibold text-text-primary mb-1">
            {match.round_name || `Round ${match.round_number}`}
          </div>
          <div className="text-xs text-text-secondary">
            {match.home_team_name} vs {match.away_team_name}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 form-group text-center">
            <label className="form-label text-center block">{match.home_team_name}</label>
            <input
              type="number"
              min="0"
              className="form-input text-center text-2xl font-black h-14"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              required
              placeholder="0"
            />
          </div>
          <div className="text-2xl font-black text-text-secondary mt-6">–</div>
          <div className="flex-1 form-group text-center">
            <label className="form-label text-center block">{match.away_team_name}</label>
            <input
              type="number"
              min="0"
              className="form-input text-center text-2xl font-black h-14"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              required
              placeholder="0"
            />
          </div>
        </div>

        {isDraw && !isKnockout && (
          <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-lg">
            <div className="text-xs text-status-success font-semibold">⚽ Draw — Both teams get 1 point (Round Robin)</div>
          </div>
        )}

        {showPenalties && (
          <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg space-y-3">
            <div className="text-xs text-status-warning font-semibold">Draw detected — Penalty shootout required</div>
            <div className="flex items-center gap-4">
              <div className="flex-1 form-group text-center">
                <label className="form-label text-center block">Pen: {match.home_team_name}</label>
                <input
                  type="number" min="0"
                  className="form-input text-center font-bold"
                  value={homePen}
                  onChange={(e) => setHomePen(e.target.value)}
                  required placeholder="0"
                />
              </div>
              <div className="text-text-secondary mt-5">–</div>
              <div className="flex-1 form-group text-center">
                <label className="form-label text-center block">Pen: {match.away_team_name}</label>
                <input
                  type="number" min="0"
                  className="form-input text-center font-bold"
                  value={awayPen}
                  onChange={(e) => setAwayPen(e.target.value)}
                  required placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner size="sm" />}
            Save Result
          </button>
        </div>
      </form>
    </Modal>
  );
}
