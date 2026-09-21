import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { GovHeader } from '../components/layout/GovHeader';
import { AuthoritySidebar } from '../components/layout/AuthoritySidebar';
import { useAuthStore } from '../stores/authStore';
import { ChevronRight } from 'lucide-react';

export const AuthorityLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuthStore();
  const location = useLocation();

  // Role guard enforcement: only Citizen is routed to citizen portal
  if (role === 'Citizen') {
    return <Navigate to="/citizen/my-properties" replace />;
  }

  // Derive breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => {
    const formatted = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { name: formatted, path: `/${pathParts.slice(0, idx + 1).join('/')}` };
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-base text-theme-main">
      <GovHeader sidebarOpen={!collapsed} setSidebarOpen={(open) => setCollapsed(!open)} />

      <div className="flex flex-1 overflow-hidden">
        <AuthoritySidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-theme-base">
          {/* Breadcrumb Bar */}
          <div className="h-8 border-b border-theme bg-theme-surface/50 px-5 flex items-center gap-1.5 text-xs text-theme-muted">
            <span className="font-semibold text-theme-main">GeoVision</span>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.path}>
                <ChevronRight size={12} className="text-theme-muted/60" />
                <span className={i === breadcrumbs.length - 1 ? 'text-theme-main font-medium' : ''}>
                  {b.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
