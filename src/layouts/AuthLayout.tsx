import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, User, Shield, UserCheck, Compass, Building2, Terminal } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../domain/types';

export const AuthLayout: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // Top-level Role Category Toggle: 'Authority' vs 'Citizen'
  const [activeCategory, setActiveCategory] = useState<'Authority' | 'Citizen'>('Authority');
  
  // Under Authority: specific Officer roles
  const [authoritySubRole, setAuthoritySubRole] = useState<'Authority' | 'SurveyOfficer' | 'MunicipalOfficer' | 'SystemAdministrator'>('Authority');

  // Role Credentials presets
  const rolePresets: Record<string, { username: string; pass: string; title: string; desc: string; icon: any; route: string }> = {
    Authority: {
      username: 'director.general@dolr.gov.in',
      pass: 'cadastre2026',
      title: 'Director General of Land Records',
      desc: 'National oversight, policy validation, 3D ULPIN issuance and cadastre governance.',
      icon: Shield,
      route: '/authority/dashboard',
    },
    SurveyOfficer: {
      username: 'surveyor.ramanathan@dilrmp.gov.in',
      pass: 'lidar2026',
      title: 'Senior Cadastral Geodesist & Drone Pilot',
      desc: 'LiDAR drone scan ingestion, AI 3D building footprint extraction, GIS boundaries.',
      icon: Compass,
      route: '/authority/ai-pipeline',
    },
    MunicipalOfficer: {
      username: 'neha.deshmukh@mcgm.gov.in',
      pass: 'bmc2026',
      title: 'Chief Town Planning & Sanction Officer',
      desc: 'Building approval verification, CAD vs LiDAR discrepancy audits, grievances.',
      icon: Building2,
      route: '/authority/audit',
    },
    SystemAdministrator: {
      username: 'sysadmin.mehra@nic.in',
      pass: 'admin2026',
      title: 'Chief Geomatic Systems Administrator',
      desc: 'Full platform access, audit verification, dispute tracking, database connectors.',
      icon: Terminal,
      route: '/authority/dashboard',
    },
    Citizen: {
      username: 'aditya.singhania@bkc.in',
      pass: 'passkey302',
      title: 'Registered 3D Property Holder',
      desc: 'Inspect vertical properties, download 3D Property Passports, tax & complaints.',
      icon: UserCheck,
      route: '/citizen/my-properties',
    },
  };

  const currentRole: UserRole = activeCategory === 'Citizen' ? 'Citizen' : authoritySubRole;
  const currentPreset = rolePresets[currentRole];

  const [identifier, setIdentifier] = useState(currentPreset.username);
  const [password, setPassword] = useState(currentPreset.pass);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (category: 'Authority' | 'Citizen') => {
    setActiveCategory(category);
    setError(null);
    const nextRole: UserRole = category === 'Citizen' ? 'Citizen' : authoritySubRole;
    const preset = rolePresets[nextRole];
    setIdentifier(preset.username);
    setPassword(preset.pass);
  };

  const handleSubRoleChange = (subRole: 'Authority' | 'SurveyOfficer' | 'MunicipalOfficer' | 'SystemAdministrator') => {
    setAuthoritySubRole(subRole);
    setError(null);
    const preset = rolePresets[subRole];
    setIdentifier(preset.username);
    setPassword(preset.pass);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your authentication credentials');
      return;
    }

    login(currentRole);
    navigate(currentPreset.route);
  };

  const IconComponent = currentPreset.icon;

  return (
    <div className="min-h-screen bg-theme-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-theme-surface border border-theme rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Emblem & Portal Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="VisionX11 Logo"
            className="w-16 h-16 object-contain rounded-2xl shadow-lg border border-theme bg-white/5 p-1 mb-1 mx-auto"
          />
          <h1 className="text-2xl font-bold tracking-tight text-theme-main">
            GeoVision 3D Cadastre
          </h1>
          <p className="text-xs text-theme-muted max-w-sm mx-auto">
            Bhu-Aadhaar 3D ULPIN · Department of Land Resources · Ministry of Rural Development
          </p>
        </div>

        {/* Primary Role Toggle Tab: Authority vs Citizen */}
        <div className="flex rounded-xl bg-theme-subtle p-1 border border-theme">
          <button
            type="button"
            onClick={() => handleCategoryChange('Authority')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'Authority'
                ? 'bg-theme-surface text-theme-primary shadow-sm border border-theme'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            <Shield size={14} />
            <span>Authority & Officials</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('Citizen')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'Citizen'
                ? 'bg-theme-surface text-emerald-600 dark:text-emerald-400 shadow-sm border border-theme'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            <UserCheck size={14} />
            <span>Citizen & Property Owners</span>
          </button>
        </div>

        {/* Sub-role selector for Authority (Survey Officer, Municipal Officer, Admin, DG) */}
        {activeCategory === 'Authority' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Select Official Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSubRoleChange('Authority')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  authoritySubRole === 'Authority'
                    ? 'border-blue-500 bg-blue-500/10 text-theme-main shadow-xs ring-1 ring-blue-500/40'
                    : 'border-theme bg-theme-subtle/60 text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Shield size={13} className="text-blue-500" />
                  <span>Director General</span>
                </div>
                <div className="text-[10px] text-theme-muted truncate mt-0.5">DoLR / Land Records</div>
              </button>

              <button
                type="button"
                onClick={() => handleSubRoleChange('SurveyOfficer')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  authoritySubRole === 'SurveyOfficer'
                    ? 'border-blue-500 bg-blue-500/10 text-theme-main shadow-xs ring-1 ring-blue-500/40'
                    : 'border-theme bg-theme-subtle/60 text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Compass size={13} className="text-blue-500" />
                  <span>Survey Officer</span>
                </div>
                <div className="text-[10px] text-theme-muted truncate mt-0.5">LiDAR Drone & GIS Scans</div>
              </button>

              <button
                type="button"
                onClick={() => handleSubRoleChange('MunicipalOfficer')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  authoritySubRole === 'MunicipalOfficer'
                    ? 'border-blue-500 bg-blue-500/10 text-theme-main shadow-xs ring-1 ring-blue-500/40'
                    : 'border-theme bg-theme-subtle/60 text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-500" />
                  <span>Municipal Officer</span>
                </div>
                <div className="text-[10px] text-theme-muted truncate mt-0.5">BMC Sanctions & Audits</div>
              </button>

              <button
                type="button"
                onClick={() => handleSubRoleChange('SystemAdministrator')}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  authoritySubRole === 'SystemAdministrator'
                    ? 'border-blue-500 bg-blue-500/10 text-theme-main shadow-xs ring-1 ring-blue-500/40'
                    : 'border-theme bg-theme-subtle/60 text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Terminal size={13} className="text-blue-500" />
                  <span>System Admin</span>
                </div>
                <div className="text-[10px] text-theme-muted truncate mt-0.5">Full System Access</div>
              </button>
            </div>
          </div>
        )}

        {/* Selected Role Badge & Description (Only ONE role shown at a time) */}
        <div className="p-3.5 rounded-xl border border-theme bg-theme-subtle/50 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary flex-shrink-0 mt-0.5">
            <IconComponent size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-theme-main flex items-center justify-between">
              <span>{currentPreset.title}</span>
              <span className="text-[10px] font-mono text-theme-muted">
                {activeCategory === 'Citizen' ? 'CITIZEN' : 'GOVT DEPT'}
              </span>
            </div>
            <p className="text-[11px] text-theme-muted mt-0.5 leading-snug">
              {currentPreset.desc}
            </p>
          </div>
        </div>

        {/* Single Login Form for the selected role */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-theme-muted">
              {activeCategory === 'Citizen' ? 'Citizen Email / Mobile / ULPIN' : 'Official Government Email / Officer ID'}
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-theme-subtle border border-theme rounded-lg text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-theme-muted">
              Security Password / Digital Token PIN
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-theme-subtle border border-theme rounded-lg text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
              activeCategory === 'Citizen'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>Sign In as {currentPreset.title.split(' ')[0]}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Selected Role Credentials Helper (Only shows the active role's credentials) */}
        <div className="pt-4 border-t border-theme/60 text-center">
          <div className="text-[11px] text-theme-muted">
            Demo Credentials for <span className="font-semibold text-theme-main">{currentPreset.title}</span>:
          </div>
          <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-theme-subtle border border-theme font-mono text-[11px] text-theme-main">
            <span>{currentPreset.username}</span>
            <span className="text-theme-muted">/</span>
            <span>{currentPreset.pass}</span>
          </div>
        </div>

      </div>
    </div>
  );
};