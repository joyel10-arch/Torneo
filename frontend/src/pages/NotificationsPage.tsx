import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../lib/api';
import { type Notification } from '../types';
import { PageLoader, EmptyState } from '../components/ui';
import { formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<string, string> = {
  tournament_created: '🏆',
  fixtures_generated: '📅',
  result_finalized: '✅',
  match_reminder: '⏰',
  ranking_updated: '📊',
  team_registered: '👥',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setNotifications(await notificationsApi.list()); }
    catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try { await notificationsApi.markRead(id); load(); }
    catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try { await notificationsApi.markAllRead(); toast.success('All marked as read'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <PageLoader />;
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Notifications will appear here for tournament events" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 flex items-start gap-4 transition-colors ${!n.is_read ? 'border-magenta-neon/30 bg-magenta-neon/5' : ''}`}>
              <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-text-primary text-sm">{n.title}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-text-secondary">{formatRelativeTime(n.created_at)}</span>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-magenta-neon flex-shrink-0" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{n.message}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="btn-ghost btn-sm flex-shrink-0" title="Mark as read">
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
