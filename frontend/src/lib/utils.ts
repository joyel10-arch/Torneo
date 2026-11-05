import { type TournamentStatus, type MatchStatus } from '../types';

// Status label and styling helpers
export function getTournamentStatusLabel(status: TournamentStatus): string {
  const labels: Record<TournamentStatus, string> = {
    draft: 'Draft',
    registration_open: 'Registration Open',
    registration_closed: 'Registration Closed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export function getTournamentStatusClass(status: TournamentStatus): string {
  const classes: Record<TournamentStatus, string> = {
    draft: 'badge-neutral',
    registration_open: 'badge-teal',
    registration_closed: 'badge-warning',
    in_progress: 'badge-magenta',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };
  return classes[status] || 'badge-neutral';
}

export function getMatchStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    scheduled: 'Scheduled',
    in_progress: 'Live',
    completed: 'FT',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
    bye: 'Bye',
  };
  return labels[status] || status;
}

export function getMatchStatusClass(status: MatchStatus): string {
  const classes: Record<MatchStatus, string> = {
    scheduled: 'badge-neutral',
    in_progress: 'badge-magenta',
    completed: 'badge-success',
    postponed: 'badge-warning',
    cancelled: 'badge-error',
    bye: 'badge-teal',
  };
  return classes[status] || 'badge-neutral';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatScore(home?: number, away?: number): string {
  if (home === undefined || home === null || away === undefined || away === null) return 'vs';
  return `${home} – ${away}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

export function goalDifference(scored: number, conceded: number): string {
  const gd = scored - conceded;
  return gd > 0 ? `+${gd}` : `${gd}`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.substring(0, max) + '…';
}

export function downloadBlob(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
