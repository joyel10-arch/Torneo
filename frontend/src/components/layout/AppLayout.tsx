import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, TopBar } from './Sidebar';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-midnight overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-screen-2xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
