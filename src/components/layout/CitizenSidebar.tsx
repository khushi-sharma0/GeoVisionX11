import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Home,
  FileBadge,
  Eye,
  ShieldCheck,
  Receipt,
  FileQuestion,
  MessageSquareWarning,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CitizenSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const citizenNavItems = [
  { to: '/citizen/my-properties', label: 'My 3D Properties', icon: Home },
  { to: '/citizen/search', label: 'Search Registry', icon: Search },
  { to: '/citizen/passport', label: 'Digital Property Passport', icon: FileBadge, badge: 'QR' },
  { to: '/citizen/3d-view', label: '3D Spatial Explorer', icon: Eye, badge: '3D' },
  { to: '/citizen/ownership', label: 'Ownership Details', icon: ShieldCheck },
  { to: '/citizen/tax', label: 'Cadastral Tax Assessment', icon: Receipt },
  { to: '/citizen/disputes', label: 'Report Boundary Dispute', icon: FileQuestion },
  { to: '/citizen/complaints', label: 'Complaint Tracking', icon: MessageSquareWarning },
];

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`border-r border-theme bg-theme-surface flex flex-col justify-between transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 py-3 overflow-y-auto">
        {!collapsed && (
          <div className="px-4 mb-2 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
            Citizen Property Portal
          </div>
        )}

        <nav className="space-y-1 px-2">
          {citizenNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
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
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-400 font-semibold">
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

      <div className="p-2 border-t border-theme">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 text-theme-muted hover:text-theme-main hover:bg-theme-subtle rounded-md transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
