import React from 'react';
import { Search, Sun, Moon, LogOut, Shield, UserCheck } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useNavigate } from 'react-router-dom';

interface GovHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const GovHeader: React.FC<GovHeaderProps> = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, role, logout } = useAuthStore();
  const { searchQuery, setSearchQuery } = useCadastreStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-theme bg-theme-surface flex items-center justify-between px-4 z-40 sticky top-0 transition-colors">
      {/* Left: Brand lockup */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {/* Logo Image */}
<img
  src="/logo.png"
  alt="VisionX11 Logo"
  className="w-8 h-8 object-contain rounded bg-white/5"
/>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm text-theme-main">GeoVision</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/30">
                3D Cadastre
              </span>
            </div>
            <span className="text-[10px] text-theme-muted hidden sm:inline-block">
              Department of Land Resources · Ministry of Rural Development
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Cadastral Search */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-theme-muted" />
          <input
            type="text"
            placeholder="Search by 3D ULPIN, Survey No, Owner, or Parcel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (role === 'Authority') {
                  navigate('/authority/ulpin-registry');
                } else {
                  navigate('/citizen/search');
                }
              }
            }}
            className="w-full bg-theme-subtle border border-theme rounded-md pl-9 pr-4 py-1.5 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Authenticated Role Status Badge (No mid-session role switching) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-theme-subtle border border-theme text-xs">
          {role === 'Authority' ? (
            <Shield size={13} className="text-blue-500" />
          ) : (
            <UserCheck size={13} className="text-emerald-500" />
          )}
          <span className="font-bold text-[11px] text-theme-main">{role} Portal</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-theme-muted hover:text-theme-main hover:bg-theme-subtle rounded-md border border-theme transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Identity Info */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-theme text-xs">
          <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-500/20">
            {user.avatarInitials}
          </div>
          <div className="leading-tight text-left">
            <div className="font-medium text-theme-main truncate max-w-[130px]">{user.name}</div>
            <div className="text-[10px] text-theme-muted truncate max-w-[130px]">{user.designation}</div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-theme-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-md border border-theme transition-colors cursor-pointer"
          title="Sign out of Cadastral Portal"
        >
          <LogOut size={13} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
