import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// ---- Loading Spinner ----
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={`${sizes[size]} border-2 border-muted-border border-t-magenta-neon rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <Spinner size="lg" />
    </div>
  );
}

// ---- Skeleton ----
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-muted-border/50">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-6 rounded w-1/3" />
      <div className="skeleton h-4 rounded w-2/3" />
      <div className="skeleton h-4 rounded w-1/2" />
    </div>
  );
}

// ---- Empty State ----
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state gap-3">
      {Icon && (
        <div className="w-14 h-14 rounded-xl bg-muted border border-muted-border flex items-center justify-center mb-2">
          <Icon className="w-7 h-7 text-text-secondary" />
        </div>
      )}
      <div className="text-lg font-semibold text-text-primary">{title}</div>
      {description && <div className="text-sm text-text-secondary max-w-sm">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ---- Error Display ----
export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{message}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-0.5 hover:bg-status-error/20 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success">
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      <div className="text-sm">{message}</div>
    </div>
  );
}

export function InfoAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-teal-electric/10 border border-teal-electric/30 text-teal-electric">
      <Info className="w-5 h-5 flex-shrink-0" />
      <div className="text-sm">{message}</div>
    </div>
  );
}

// ---- Modal ----
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-muted-dark border border-muted-border rounded-xl shadow-elevated animate-fade-in`}>
        <div className="flex items-center justify-between p-5 border-b border-muted-border">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---- Confirm Dialog ----
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ---- Badge ----
export function StatusBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={className}>{children}</span>;
}

// ---- Stat Card ----
export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'magenta' | 'teal' | 'success' | 'warning';
  sub?: string;
}) {
  const accentColors = {
    magenta: 'text-magenta-neon',
    teal: 'text-teal-electric',
    success: 'text-status-success',
    warning: 'text-status-warning',
  };
  const accentBg = {
    magenta: 'bg-magenta-neon/15 border-magenta-neon/30',
    teal: 'bg-teal-electric/10 border-teal-electric/25',
    success: 'bg-status-success/10 border-status-success/25',
    warning: 'bg-status-warning/10 border-status-warning/25',
  };
  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && accent && (
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${accentBg[accent]}`}>
          <Icon className={`w-5 h-5 ${accentColors[accent]}`} />
        </div>
      )}
      <div>
        <div className="text-2xl font-black text-text-primary tabular-nums">{value}</div>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mt-0.5">{label}</div>
        {sub && <div className="text-xs text-text-secondary mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ---- Progress Bar ----
export function ProgressBar({
  value,
  max = 100,
  color = 'magenta',
  label,
}: {
  value: number;
  max?: number;
  color?: 'magenta' | 'teal' | 'success';
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    magenta: 'bg-magenta-neon',
    teal: 'bg-teal-electric',
    success: 'bg-status-success',
  };
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---- Team Avatar ----
export function TeamAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`${sizes[size]} rounded-full object-cover border border-muted-border`} />;
  }
  const initials = name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  const colors = ['bg-magenta-neon/20 text-magenta-neon', 'bg-teal-electric/20 text-teal-electric', 'bg-status-success/20 text-status-success', 'bg-status-warning/20 text-status-warning'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`${sizes[size]} rounded-full border border-muted-border flex items-center justify-center font-bold flex-shrink-0 ${colors[colorIdx]}`}>
      {initials}
    </div>
  );
}

// ---- Tab navigation ----
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted-dark border border-muted-border rounded-lg p-1 flex-wrap">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-150 ${
            active === id
              ? 'bg-magenta-neon text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-muted'
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}

// ---- Search input ----
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-9 pr-3 py-2 w-full"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3a6 6 0 100 12A6 6 0 009 3zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

// ---- Section Header ----
export function SectionHeader({
  title,
  subtitle,
  action,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${accent ? 'accent-border-l' : ''}`}>
      <div>
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
