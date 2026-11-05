import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Account and application settings</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-text-primary">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-magenta-neon/20 border-2 border-magenta-neon/40 flex items-center justify-center">
            <span className="text-2xl font-black text-magenta-neon">
              {user?.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{user?.full_name}</div>
            <div className="text-sm text-text-secondary">{user?.email}</div>
            <span className={`badge mt-1 ${user?.role === 'admin' ? 'badge-magenta' : user?.role === 'organizer' ? 'badge-teal' : 'badge-neutral'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="card p-6 space-y-3">
        <h2 className="text-base font-bold text-text-primary">Application Info</h2>
        {[
          { label: 'Application', value: 'Torneo — Sports Tournament Platform' },
          { label: 'Version', value: '1.0.0' },
          { label: 'Backend', value: 'FastAPI + SQLAlchemy + SQLite' },
          { label: 'Frontend', value: 'React + Vite + TypeScript + Tailwind CSS' },
          { label: 'DSA Algorithms', value: 'Bubble Sort, Binary Search, Binary Tree, Graph (BFS/DFS)' },
          { label: 'Course Outcomes', value: 'CO3 (Sorting/Searching) · CO4 (Trees) · CO5 (Graphs)' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-2 border-b border-muted-border/50 text-sm">
            <dt className="text-text-secondary">{label}</dt>
            <dd className="text-text-primary font-medium text-right">{value}</dd>
          </div>
        ))}
      </div>

      {/* Theme info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-text-primary">Design System</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[
            { name: 'Midnight', color: '#16051F' },
            { name: 'Neon Magenta', color: '#F500A8' },
            { name: 'Electric Teal', color: '#21E6D1' },
            { name: 'Deep Teal', color: '#073B3A' },
            { name: 'Muted Purple', color: '#30203B' },
            { name: 'Lavender', color: '#F4EFF7' },
            { name: 'Success', color: '#21C58E' },
            { name: 'Error', color: '#FF647C' },
          ].map(({ name, color }) => (
            <div key={name} className="text-center">
              <div className="w-full h-10 rounded-lg border border-muted-border mb-1.5" style={{ backgroundColor: color }} />
              <div className="text-2xs text-text-secondary">{name}</div>
              <div className="text-2xs text-text-secondary/60 font-mono">{color}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
