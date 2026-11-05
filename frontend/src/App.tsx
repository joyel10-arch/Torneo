import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { FixturesPage } from './pages/FixturesPage';
import { StandingsPage } from './pages/StandingsPage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { VenuesPage } from './pages/VenuesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DSALabPage } from './pages/DSALabPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PageLoader } from './components/ui';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="tournaments/new" element={<TournamentsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="fixtures" element={<FixturesPage />} />
        <Route path="bracket" element={<FixturesPage />} />
        <Route path="standings" element={<StandingsPage />} />
        <Route path="history" element={<MatchHistoryPage />} />
        <Route path="venues" element={<VenuesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="dsa-lab" element={<DSALabPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#30203B',
              color: '#F8F5FA',
              border: '1px solid #493650',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#21C58E', secondary: '#30203B' } },
            error: { iconTheme: { primary: '#FF647C', secondary: '#30203B' } },
            duration: 4000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
