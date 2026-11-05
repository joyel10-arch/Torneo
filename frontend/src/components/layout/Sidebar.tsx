import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, Calendar, GitBranch,
  BarChart3, MapPin, FlaskConical, Bell, Settings,
  ChevronLeft, ChevronRight, Target, TrendingUp,
  History, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationsApi } from '../../lib/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tournaments', label: 'Tournaments', icon: Trophy },
  { path: '/teams', label: 'Teams', icon: Users },
  { path: '/fixtures', label: 'Fixtures', icon: Calendar },
  { path: '/bracket', label: 'Bracket', icon: GitBranch },
  { path: '/standings', label: 'Standings', icon: TrendingUp },
  { path: '/history', label: 'Match History', icon: History },
  { path: '/venues', label: 'Venues', icon: MapPin },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/dsa-lab', label: 'DSA Lab', icon: FlaskConical },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onToggle, onMobileClose }: Omit<SidebarProps, 'mobileOpen'>) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.list(true)
      .then((notifs) => setUnreadCount(notifs.length))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full bg-muted-dark border-r border-muted-border">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-muted-border gap-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-magenta-neon flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-base font-black text-text-primary tracking-tight leading-none">TORNEO</div>
              <div className="text-2xs text-text-secondary font-medium">Sports Platform</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded bg-magenta-neon flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors lg:flex hidden"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={onMobileClose}
          className="p-1.5 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onMobileClose}
              className={`${isActive ? 'nav-item-active' : 'nav-item'} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className={`w-5 h-5 ${isActive ? 'text-magenta-neon' : ''}`} />
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-magenta-neon text-white text-2xs font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className={`p-3 border-t border-muted-border ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted transition-colors group mb-1">
            <div className="w-8 h-8 rounded-full bg-magenta-neon/20 border border-magenta-neon/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-magenta-neon">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">{user.full_name}</div>
              <div className="text-xs text-text-secondary capitalize">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`nav-item w-full text-status-error hover:text-status-error hover:bg-status-error/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-sidebar'
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex flex-col h-screen w-sidebar transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} onMobileClose={onMobileClose} />
      </aside>
    </>
  );
}

export function TopBar({
  onMobileMenuOpen,
  pageTitle,
}: {
  onMobileMenuOpen: () => void;
  pageTitle?: string;
}) {
  return (
    <header className="h-14 border-b border-muted-border bg-muted-dark/80 backdrop-blur-sm flex items-center px-4 gap-3 sticky top-0 z-30">
      <button
        onClick={onMobileMenuOpen}
        className="p-1.5 rounded hover:bg-muted text-text-secondary hover:text-text-primary transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      {pageTitle && (
        <h1 className="text-base font-semibold text-text-primary lg:hidden">{pageTitle}</h1>
      )}
      <div className="ml-auto flex items-center gap-2">
        <div className="px-2 py-1 rounded bg-muted text-xs text-text-secondary border border-muted-border">
          Every Match. Every Move. Every Champion.
        </div>
      </div>
    </header>
  );
}
