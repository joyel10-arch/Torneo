import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ErrorAlert } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@torneo.app');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 surface-gradient opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-magenta-neon mb-4 shadow-glow-magenta">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">TORNEO</h1>
          <p className="text-text-secondary text-sm mt-1">Every Match. Every Move. Every Champion.</p>
        </div>

        {/* Card */}
        <div className="card-elevated p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Sign In</h2>
            <p className="text-sm text-text-secondary mt-1">Access your tournament dashboard</p>
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="border-t border-muted-border pt-4">
            <p className="text-xs text-text-secondary mb-3 font-semibold uppercase tracking-wide">Demo Accounts</p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'admin@torneo.app', pw: 'Admin@123' },
                { label: 'Organizer', email: 'organizer@torneo.app', pw: 'Org@123' },
                { label: 'Viewer', email: 'viewer@torneo.app', pw: 'View@123' },
              ].map(({ label, email: demoEmail, pw }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => { setEmail(demoEmail); setPassword(pw); }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-muted transition-colors group"
                >
                  <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary">{label}</span>
                  <span className="text-xs text-text-secondary/60 font-mono">{demoEmail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
