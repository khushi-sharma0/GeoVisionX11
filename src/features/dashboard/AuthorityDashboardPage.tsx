import React from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  Building,
  FileCheck2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
  KeyRound,
} from 'lucide-react';
import { evaluateBuildingEncroachment } from '../../domain/topology';

export const AuthorityDashboardPage: React.FC = () => {
  const { buildings, floors, units, parcels, selectBuilding, setSelectedCityId } = useCadastreStore();
  const { role, accounts } = useAuthStore();
  const navigate = useNavigate();

  // Find flagged buildings
  const flagged = buildings.filter((b) => evaluateBuildingEncroachment(b, floors).hasEncroachment);
  const pendingUnits = units.filter((u) => u.verificationStatus === 'Pending Approval');
  const verifiedUnits = units.filter((u) => u.verificationStatus === 'Verified');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono text-blue-400 font-bold">
              National Cadastral Operations Center
            </span>
            <Chip label="ONLINE" variant="success" size="sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            3D Cadastre Administration & Oversight
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Coordinating municipal 3D digital twins, autonomous vertical parcel delineation,
            statutory 3D ULPIN issuance, and volumetric conflict resolution across pilot jurisdictions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="accent"
            className="bg-blue-600 hover:bg-blue-500 text-white"
            icon={<Globe2 size={16} />}
            onClick={() => {
              setSelectedCityId('mumbai');
              selectBuilding('B04');
              navigate('/authority/globe');
            }}
          >
            Launch 3D Cesium Explorer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-semibold uppercase">Structures Registered</span>
            <Building size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-theme-main mt-2">
            {buildings.length}
          </div>
          <span className="text-[11px] text-theme-muted">
            Across 4 municipal jurisdictions
          </span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-semibold uppercase">Vertical Units (3D ULPIN)</span>
            <FileCheck2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-500 mt-2">
            {units.length}
          </div>
          <span className="text-[11px] text-theme-muted">
            {verifiedUnits.length} Verified · {pendingUnits.length} Pending
          </span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-semibold uppercase">Vertical Encroachments</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-500 mt-2">
            {flagged.length}
          </div>
          <span className="text-[11px] text-rose-500/80 font-medium">
            Requires immediate municipal audit
          </span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-semibold uppercase">Volumetric Airspace Tax</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-theme-main mt-2">
            ₹42.8 Cr
          </div>
          <span className="text-[11px] text-theme-muted">
            FY 2024-25 Realized Assessments
          </span>
        </div>
      </div>

      {/* Action Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-theme-main">Primary Cadastral Operations</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* System Admin Account Provisioning Quick Launch (Visible only to System Administrator) */}
            {role === 'SystemAdministrator' && (
              <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 hover:shadow-md transition-all space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {accounts.length} ACCOUNTS ACTIVE
                    </span>
                    <Chip label="ADMIN ONLY" variant="success" size="sm" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-theme-main">
                    User Management &amp; Credential Provisioning
                  </h4>
                  <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                    Create new cadastral officer accounts, automatically bind statutory permission sets (DoLR, DILRMP, BMC, NIC, Citizen), and manage login credentials.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  icon={<ArrowUpRight size={14} />}
                  onClick={() => navigate('/authority/users')}
                >
                  Manage Cadastral User Accounts &amp; Provision New User
                </Button>
              </div>
            )}

            {/* Hero Tower BKC */}
            <div className="p-5 rounded-xl border border-blue-500/40 bg-theme-surface hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Globe2 size={16} />
                </div>
                <Chip label="FEATURED" variant="primary" size="sm" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-theme-main">
                  Platinum Horizon Tower (BKC Mumbai)
                </h4>
                <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                  Full 17-floor vertical stack with Unit 302 Digital Property Passport, QR verification, and exploded view.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="w-full"
                icon={<ArrowUpRight size={14} />}
                onClick={() => {
                  setSelectedCityId('mumbai');
                  selectBuilding('B04');
                  navigate('/authority/globe');
                }}
              >
                Inspect in 3D Cesium Explorer
              </Button>
            </div>

            {/* AI Pipeline */}
            <div className="p-5 rounded-xl border border-theme bg-theme-surface hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Cpu size={16} />
                </div>
                <Chip label="ACTIVE" variant="success" size="sm" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-theme-main">
                  AI 3D Segmentation Engine
                </h4>
                <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                  Extract building footprints from point clouds, segment floors, and generate compliant 3D ULPIN codes.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                icon={<ArrowUpRight size={14} />}
                onClick={() => navigate('/authority/ai-pipeline')}
              >
                Launch AI Pipeline
              </Button>
            </div>
          </div>

          {/* Encroachment Alert Banner */}
          {flagged.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400">
                    Municipal Notice: Flagged Vertical Encroachments
                  </h4>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Structure <strong>{flagged[0].name}</strong> (Pune) exceeds sanctioned floor height by +2 floors.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs py-1"
                onClick={() => {
                  setSelectedCityId('pune');
                  selectBuilding(flagged[0]?.buildingId || 'B01');
                  navigate('/authority/globe');
                }}
              >
                Inspect On Globe
              </Button>
            </div>
          )}
        </div>

        {/* Recent 3D ULPIN Registry Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-theme-main">Recent 3D ULPIN Registrations</h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-0.5 px-2"
              onClick={() => navigate('/authority/ulpin-registry')}
            >
              View All
            </Button>
          </div>

          <div className="border border-theme rounded-xl bg-theme-surface divide-y divide-theme overflow-hidden">
            {units.slice(0, 5).map((u) => (
              <div key={u.ulpin3d} className="p-3 text-xs space-y-1 hover:bg-theme-subtle/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-500">{u.ulpin3d}</span>
                  <Chip
                    label={u.verificationStatus}
                    variant={u.verificationStatus === 'Verified' ? 'success' : 'warning'}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between text-theme-muted text-[11px]">
                  <span>Flat {u.flatNumber || u.unitId} · {u.ownerName}</span>
                  <span>{u.builtUpAreaSqm} m²</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
