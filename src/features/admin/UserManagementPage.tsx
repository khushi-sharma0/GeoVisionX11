import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  UserX,
  UserCheck,
  Building,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore, AccountRecord } from '../../stores/authStore';
import { UserRole } from '../../domain/types';
import { ROLE_DEFINITIONS, canAccessRoute } from '../../domain/rbac';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string; dept: string }[] = [
  {
    role: 'Authority',
    label: 'Director General (DoLR)',
    desc: 'Statutory Apex Authority, national dispute adjudications & policy decisions',
    dept: 'Department of Land Resources, Ministry of Rural Development',
  },
  {
    role: 'SurveyOfficer',
    label: 'Survey Officer (DILRMP)',
    desc: 'Cadastral Geodesist, drone LiDAR pilot, boundary adjustments & GIS imports',
    dept: 'Survey of India / DILRMP Spatial Data Division',
  },
  {
    role: 'MunicipalOfficer',
    label: 'Municipal Officer (BMC)',
    desc: 'Town planning enforcement, sanction vs built audits & deviation penalties',
    dept: 'Brihanmumbai Municipal Corporation (BMC)',
  },
  {
    role: 'SystemAdministrator',
    label: 'System Admin (NIC)',
    desc: 'Full system oversight, account creation, API connectors & telemetry audit',
    dept: 'National Informatics Centre / 3D ULPIN Systems Directorate',
  },
  {
    role: 'Citizen',
    label: 'Property Owner / Citizen',
    desc: 'Property passport view, grievance submission, tax payments & 3D viewer',
    dept: 'Maharashtra Land Administration Portal',
  },
];

export const UserManagementPage: React.FC = () => {
  const { role: currentRole, accounts, createAccount, updateAccount, toggleAccountStatus, resetAccountPassword } =
    useAuthStore();

  // Route security guard: Only System Administrator can access
  const isAuthorized = currentRole === 'SystemAdministrator';

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SurveyOfficer');
  const [jurisdiction, setJurisdiction] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Success Confirmation State
  const [createdSuccess, setCreatedSuccess] = useState<AccountRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Table Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editJurisdiction, setEditJurisdiction] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('SurveyOfficer');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  // Password Reset Alert
  const [resetFeedback, setResetFeedback] = useState<{ id: string; tempPass: string } | null>(null);

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="p-8 border-red-500/30 bg-red-500/5 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-theme-main">Access Restricted — Statutory Admin Level Only</h2>
          <p className="text-sm text-theme-muted max-w-md mx-auto">
            User Account Management and RBAC Credential Provisioning is strictly restricted to the{' '}
            <span className="font-semibold text-theme-main">System Administrator (NIC)</span> role.
            Your active role (<span className="text-blue-500 font-semibold">{ROLE_DEFINITIONS[currentRole].displayName}</span>)
            does not possess account provisioning authorization.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-theme text-xs"
            >
              Return to Authorized Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const selectedRoleDef = ROLE_DEFINITIONS[selectedRole];

  const handleGenerateRandomPass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`Gov#${res}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid official Email or Username is required.');
      return;
    }

    const effectivePass = password.trim() || `Gov#Temp${Math.floor(1000 + Math.random() * 9000)}`;

    const newAcc = createAccount({
      name: fullName.trim(),
      email: email.trim(),
      role: selectedRole,
      jurisdiction: jurisdiction.trim() || undefined,
      temporaryPassword: effectivePass,
      status,
    });

    setCreatedSuccess(newAcc);
    setFullName('');
    setEmail('');
    setJurisdiction('');
    setPassword('');
    setStatus('Active');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPass = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleOpenEdit = (acc: AccountRecord) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditEmail(acc.email);
    setEditJurisdiction(acc.jurisdiction);
    setEditRole(acc.role);
    setEditStatus(acc.status);
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    updateAccount(editingAccount.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      jurisdiction: editJurisdiction.trim(),
      role: editRole,
      status: editStatus,
      department: ROLE_DEFINITIONS[editRole].department,
      designation: ROLE_DEFINITIONS[editRole].displayName,
    });
    setEditingAccount(null);
  };

  const handleResetPassword = (id: string) => {
    const tempPass = resetAccountPassword(id);
    setResetFeedback({ id, tempPass });
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 uppercase tracking-wider">
            <Shield size={14} />
            National Cadastral Directory &amp; RBAC Controller
          </div>
          <h1 className="text-2xl font-bold text-theme-main">User Management &amp; Provisioning</h1>
          <p className="text-xs text-theme-muted mt-0.5">
            Provision statutory cadastral officer accounts, manage roles, configure jurisdiction zones, and enforce role-based access permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-md bg-theme-subtle border border-theme text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-theme-muted">Active Directory:</span>
            <span className="font-semibold text-theme-main">{accounts.length} Registered Accounts</span>
          </div>
        </div>
      </div>

      {/* Success Confirmation Banner */}
      {createdSuccess && (
        <Card className="p-5 border-emerald-500/40 bg-emerald-500/10 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">Account Provisioned Successfully</h3>
                <p className="text-xs text-emerald-200/80">
                  The cadastral user has been created with automated role matrix permissions.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreatedSuccess(null)}
              className="text-xs text-emerald-300 hover:text-emerald-100"
            >
              Dismiss
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-black/20 border border-emerald-500/20 text-xs">
            <div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">Official Login ID</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-white text-sm">{createdSuccess.id}</span>
                <button
                  type="button"
                  onClick={() => handleCopyId(createdSuccess.id)}
                  className="p-1 hover:bg-white/10 rounded text-emerald-300"
                  title="Copy Login ID"
                >
                  {copiedId ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">User &amp; Assigned Role</div>
              <div className="font-medium text-white mt-0.5">{createdSuccess.name}</div>
              <div className="text-[11px] text-emerald-200/70">{ROLE_DEFINITIONS[createdSuccess.role].displayName}</div>
            </div>

            <div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">Temporary Password</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-white font-semibold">{createdSuccess.temporaryPassword}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPass(createdSuccess.temporaryPassword || '')}
                  className="p-1 hover:bg-white/10 rounded text-emerald-300"
                  title="Copy Temporary Password"
                >
                  {copiedPass ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Password Reset Alert Banner */}
      {resetFeedback && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <KeyRound size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Temporary Password Reset for {resetFeedback.id}:</span>{' '}
              <span className="font-mono font-semibold text-white bg-black/30 px-2 py-0.5 rounded border border-amber-500/30">
                {resetFeedback.tempPass}
              </span>
              <span className="text-amber-200/70 ml-2">(Advise user to change on first login)</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetFeedback(null)}
            className="text-xs text-amber-300 hover:text-amber-100"
          >
            Dismiss
          </Button>
        </Card>
      )}

      {/* Grid: Create Account Form + Automated RBAC Matrix Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <Card className="p-6 border-theme bg-theme-surface space-y-5">
            <div className="flex items-center gap-2 border-b border-theme pb-3">
              <UserPlus size={18} className="text-theme-primary" />
              <div>
                <h2 className="text-sm font-bold text-theme-main">Create New Statutory Cadastral Account</h2>
                <p className="text-[11px] text-theme-muted">
                  Fill in credentials. Role capabilities will be bound automatically per DoLR/DILRMP security guidelines.
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-main flex items-center gap-1.5">
                    <Users size={13} className="text-theme-muted" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Er. Devendra Patil"
                    className="w-full px-3 py-2 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    required
                  />
                </div>

                {/* Email / Username */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-main flex items-center gap-1.5">
                    <Mail size={13} className="text-theme-muted" />
                    Email / Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patil.d@dilrmp.gov.in"
                    className="w-full px-3 py-2 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    required
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-main flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-theme-muted" />
                    Role Selection <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-theme-muted">Auto-binds permission matrix</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary cursor-pointer font-medium"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label} — ({opt.dept})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-theme-muted italic">
                  {ROLE_OPTIONS.find((r) => r.role === selectedRole)?.desc}
                </p>
              </div>

              {/* Jurisdiction / Zone (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-main flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-theme-muted" />
                    Assigned Jurisdiction / Cadastral Zone
                  </span>
                  <span className="text-[10px] text-theme-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. Mumbai Suburban / BKC G-Block Cadastral Zone 4"
                  className="w-full px-3 py-2 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password / Temporary Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-theme-main flex items-center gap-1.5">
                      <Lock size={13} className="text-theme-muted" />
                      Temporary Password
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPass}
                      className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for auto-generated"
                      className="w-full px-3 py-2 pr-9 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-theme-muted hover:text-theme-main"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-main">Account Status</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-main">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Active'}
                        onChange={() => setStatus('Active')}
                        className="text-theme-primary focus:ring-theme-primary"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-muted">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Inactive'}
                        onChange={() => setStatus('Inactive')}
                        className="text-theme-primary focus:ring-theme-primary"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-neutral-400"></span> Inactive / Pending KYC
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFullName('');
                    setEmail('');
                    setJurisdiction('');
                    setPassword('');
                  }}
                  className="text-xs border-theme"
                >
                  Reset Form
                </Button>
                <Button type="submit" variant="primary" className="text-xs flex items-center gap-1.5">
                  <UserPlus size={14} />
                  Provision Account &amp; Assign Permissions
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Role Permissions Matrix Preview Column */}
        <div className="lg:col-span-5">
          <Card className="p-6 border-theme bg-theme-surface space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold text-theme-main">Automated Role Permission Matrix</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">
                {selectedRole}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-theme-subtle border border-theme space-y-1">
              <div className="text-xs font-bold text-theme-main">{selectedRoleDef.displayName}</div>
              <div className="text-[11px] text-theme-muted">{selectedRoleDef.department}</div>
              <div className="text-[10px] text-blue-500 font-medium mt-1">{selectedRoleDef.badge}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
                Statutory Capabilities Granted:
              </div>

              <div className="space-y-1.5 divide-y divide-theme/30 text-[11px]">
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">3D Cesium Cadastral Viewer</span>
                  <span className="font-semibold text-emerald-500">Full Access</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">3D Property Passport Download</span>
                  <span className="font-semibold text-emerald-500">Authorized</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">LiDAR / GIS Point Cloud Access</span>
                  <span className="font-medium text-theme-main">{selectedRoleDef.capabilities.lidarGisData}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">Modify Cadastral Footprints</span>
                  <span
                    className={`font-semibold ${
                      selectedRoleDef.capabilities.editFootprint ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                  >
                    {selectedRoleDef.capabilities.editFootprint ? 'Yes (Survey Override)' : 'Restricted (Read-Only)'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">LiDAR vs Sanction Audit Verification</span>
                  <span className="font-medium text-theme-main">
                    {selectedRoleDef.capabilities.auditVerificationDashboard}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">Per-Floor Discrepancy Action</span>
                  <span className="font-medium text-theme-main">
                    {selectedRoleDef.capabilities.perFloorDiscrepancyAudit}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">Disputes Tribunal Adjudication</span>
                  <span className="font-medium text-theme-main">
                    {selectedRoleDef.capabilities.disputesPage}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-theme-muted">User Account Provisioning</span>
                  <span
                    className={`font-semibold ${
                      selectedRoleDef.capabilities.userManagement ? 'text-blue-500' : 'text-neutral-400'
                    }`}
                  >
                    {selectedRoleDef.capabilities.userManagement ? 'Authorized (NIC Admin)' : 'No Access'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-blue-500/5 border border-blue-500/20 text-[11px] text-theme-muted">
              <div className="font-semibold text-theme-main mb-1">Route Accessibility:</div>
              <div className="flex flex-wrap gap-1">
                {selectedRoleDef.allowedRoutes.map((rt) => (
                  <span
                    key={rt}
                    className="px-1.5 py-0.5 rounded bg-theme-subtle border border-theme text-[10px] font-mono"
                  >
                    {rt.replace('/authority/', '').replace('/citizen/', '')}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Manage Accounts Table Section */}
      <Card className="p-6 border-theme bg-theme-surface space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-theme pb-4">
          <div>
            <h2 className="text-base font-bold text-theme-main">Manage Existing Accounts</h2>
            <p className="text-xs text-theme-muted">
              Comprehensive registry of active government officers, surveyors, administrators, and property owners.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-2.5 top-2.5 text-theme-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md bg-theme-subtle border border-theme text-theme-main focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="Authority">Director General</option>
              <option value="SurveyOfficer">Survey Officer</option>
              <option value="MunicipalOfficer">Municipal Officer</option>
              <option value="SystemAdministrator">System Admin</option>
              <option value="Citizen">Citizen</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-subtle text-theme-muted uppercase tracking-wider text-[10px] font-semibold border-b border-theme">
              <tr>
                <th className="py-2.5 px-3">Official User &amp; ID</th>
                <th className="py-2.5 px-3">Role &amp; Department</th>
                <th className="py-2.5 px-3">Jurisdiction Zone</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date Created</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme/40 text-theme-main">
              {filteredAccounts.map((acc) => {
                const roleDef = ROLE_DEFINITIONS[acc.role];
                return (
                  <tr key={acc.id} className="hover:bg-theme-subtle/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-theme-main">{acc.name}</div>
                      <div className="text-[10px] text-theme-muted flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono bg-theme-subtle px-1 rounded border border-theme">{acc.id}</span>
                        <span>•</span>
                        <span>{acc.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500">
                        <Shield size={11} />
                        {roleDef?.displayName || acc.role}
                      </div>
                      <div className="text-[10px] text-theme-muted truncate max-w-[200px] mt-0.5">
                        {acc.department}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-xs text-theme-main">{acc.jurisdiction || 'Pan-India'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          acc.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            acc.status === 'Active' ? 'bg-emerald-400' : 'bg-neutral-400'
                          }`}
                        ></span>
                        {acc.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[11px] text-theme-muted">
                      {new Date(acc.dateCreated).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-theme-muted">
                      {acc.lastLogin === 'Never'
                        ? 'Never'
                        : new Date(acc.lastLogin).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 rounded hover:bg-theme-subtle text-theme-muted hover:text-theme-main"
                          title="Edit Account"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(acc.id)}
                          className="p-1.5 rounded hover:bg-amber-500/10 text-theme-muted hover:text-amber-400"
                          title="Reset Password"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Toggle Status / Deactivate */}
                        <button
                          onClick={() => toggleAccountStatus(acc.id)}
                          className={`p-1.5 rounded ${
                            acc.status === 'Active'
                              ? 'hover:bg-red-500/10 text-theme-muted hover:text-red-400'
                              : 'hover:bg-emerald-500/10 text-theme-muted hover:text-emerald-400'
                          }`}
                          title={acc.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {acc.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-theme-muted">
                    No cadastral accounts matched the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-theme-surface border border-theme rounded-xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-theme-primary" />
                <h3 className="text-sm font-bold text-theme-main">Edit User Account: {editingAccount.id}</h3>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-theme-muted hover:text-theme-main text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-theme-main">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-theme-subtle border border-theme text-theme-main"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-theme-main">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-theme-subtle border border-theme text-theme-main"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-theme-main">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded bg-theme-subtle border border-theme text-theme-main"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-theme-main">Assigned Jurisdiction Zone</label>
                <input
                  type="text"
                  value={editJurisdiction}
                  onChange={(e) => setEditJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-theme-subtle border border-theme text-theme-main"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-theme-main">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 rounded bg-theme-subtle border border-theme text-theme-main"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-theme">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingAccount(null)}
                className="text-xs border-theme"
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} className="text-xs">
                Save Account Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
