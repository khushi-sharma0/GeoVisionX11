import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  Building,
  FileCheck2,
  Database,
  Cpu,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  Scale,
  ScanLine,
  Shield,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canAccessRoute, getRoleDefinition } from '../../domain/rbac';

interface AuthoritySidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const allNavItems = [
  { to: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/authority/users', label: 'User Management', icon: Users, badge: 'Admin' },
  { to: '/authority/globe', label: '3D Globe Explorer', icon: Globe2, badge: '3D' },
  { to: '/authority/audit', label: 'LiDAR / CAD Audit', icon: ScanLine, badge: 'Audit' },
  { to: '/authority/complaints', label: 'Citizen Grievances', icon: MessageSquareWarning, badge: 'Live' },
  { to: '/authority/disputes', label: 'Disputes Tribunal', icon: Scale },
  { to: '/authority/properties', label: 'Property Explorer', icon: Building },
  { to: '/authority/ulpin-registry', label: '3D ULPIN Registry', icon: FileCheck2 },
  { to: '/authority/gis', label: 'GIS Data Management', icon: Database },
  { to: '/authority/ai-pipeline', label: 'AI Processing Engine', icon: Cpu },
  { to: '/authority/analytics', label: 'Cadastral Analytics', icon: BarChart3 },
  { to: '/authority/disaster', label: 'Disaster Management', icon: AlertTriangle },
  { to: '/authority/reports', label: 'Official Reports', icon: FileText },
  { to: '/authority/settings', label: 'System & Connectors', icon: Settings },
];

export const AuthoritySidebar: React.FC<AuthoritySidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { role, user } = useAuthStore();
  const roleDef = getRoleDefinition(role);

  // Filter navigation items strictly against role permissions
  const authorizedNavItems = allNavItems.filter((item) => canAccessRoute(role, item.to));

  return (
    <aside
      className={`border-r border-theme bg-theme-surface flex flex-col justify-between transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 py-3 overflow-y-auto">
        {/* Section title & Role Badge */}
        {!collapsed && (
          <div className="px-4 mb-3 space-y-1.5">
            <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
              Cadastral Authority
            </div>
            <div className="p-2 rounded-lg bg-theme-subtle border border-theme flex items-center gap-2">
              <div className="p-1 rounded bg-blue-500/10 text-blue-500 flex-shrink-0">
                <Shield size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-theme-main truncate" title={roleDef.displayName}>
                  {roleDef.displayName}
                </div>
                <div className="text-[9px] text-blue-500 font-medium truncate" title={roleDef.badge}>
                  {roleDef.badge}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="space-y-1 px-2">
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-500/20 text-blue-400 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User designation info & collapse button */}
      <div className="p-2 border-t border-theme space-y-1">
        {!collapsed && (
          <div className="px-2 py-1 text-[10px] text-theme-muted truncate" title={user.name}>
            Signed in as: <strong className="text-theme-main">{user.name}</strong>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 text-theme-muted hover:text-theme-main hover:bg-theme-subtle rounded-md transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
