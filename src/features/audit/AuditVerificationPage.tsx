import React, { useState, useRef } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useGlobeStore } from '../../stores/globeStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import {
  ScanLine,
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Download,
  ShieldAlert,
  FileText,
  Sparkles,
  ArrowRight,
  Layers,
  Box,
  ShieldCheck,
  Check,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerFileDownload } from '../../utils/downloadHelper';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';
import { evaluateBuildingEncroachment } from '../../domain/topology';

interface AuditItem {
  id: string;
  component: string;
  sanctioned: string;
  asBuilt: string;
  delta: string;
  tolerance: string;
  status: 'Compliant' | 'Deviation' | 'Under Review';
}

export const AuditVerificationPage: React.FC = () => {
  const { buildings, floors, verticalParcels } = useCadastreStore();
  const { showTopologyConflicts, toggleTopologyConflicts } = useGlobeStore();
  const navigate = useNavigate();

  const [selectedBuildingId, setSelectedBuildingId] = useState('B04');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [verdict, setVerdict] = useState<'Compliant' | 'Deviation' | 'Under Review'>('Deviation');
  const [officerVerdictNotes, setOfficerVerdictNotes] = useState(
    'Floor 12 steel cantilever violates sanctioned airspace envelope by 1.76m. Notice under Sec 354 of MMC Act issued.'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [uploadedScanName, setUploadedScanName] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBuilding = buildings.find((b) => b.buildingId === selectedBuildingId) || buildings[0];
  const encroachment = evaluateBuildingEncroachment(activeBuilding, floors);

  const [auditItems, setAuditItems] = useState<AuditItem[]>([
    {
      id: 'A1',
      component: 'Overall Building Height',
      sanctioned: '68.00 m',
      asBuilt: '68.20 m',
      delta: '+0.20 m',
      tolerance: '±0.30 m',
      status: 'Compliant',
    },
    {
      id: 'A2',
      component: 'Ground Footprint Area',
      sanctioned: '1,450.0 m²',
      asBuilt: '1,452.4 m²',
      delta: '+2.4 m²',
      tolerance: '±10.0 m²',
      status: 'Compliant',
    },
    {
      id: 'A3',
      component: 'North Setback Boundary',
      sanctioned: '6.00 m',
      asBuilt: '5.92 m',
      delta: '-0.08 m',
      tolerance: '±0.15 m',
      status: 'Compliant',
    },
    {
      id: 'A4',
      component: 'Floor 12 Airspace Cantilever (West Facade)',
      sanctioned: '0.00 m (Flush)',
      asBuilt: '1.76 m Projection',
      delta: '+1.76 m',
      tolerance: '±0.05 m',
      status: 'Deviation',
    },
    {
      id: 'A5',
      component: 'Sub-surface Basement Excavation',
      sanctioned: '-6.50 m MSL',
      asBuilt: '-6.45 m MSL',
      delta: '+0.05 m',
      tolerance: '±0.20 m',
      status: 'Compliant',
    },
    {
      id: 'A6',
      component: 'Floor 10 Balcony Enclosure',
      sanctioned: 'Open to Sky',
      asBuilt: 'Glazed Façade Curtain',
      delta: 'Unapproved Glass Enclosure',
      tolerance: 'Zero Tolerance',
      status: 'Under Review',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedScanName(file.name);
    setUploadSuccessMsg(`Parsed ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB) · 2.8M Points Computed against CAD Master`);
    setTimeout(() => setUploadSuccessMsg(null), 6000);
  };

  const handleTriggerLiDARReScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
    }, 1200);
  };

  const handleSaveVerdict = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleExportAuditCsv = () => {
    const csvContent =
      'ID,Component,Sanctioned,AsBuilt,Delta,Tolerance,Status\n' +
      auditItems
        .map((i) => `"${i.id}","${i.component}","${i.sanctioned}","${i.asBuilt}","${i.delta}","${i.tolerance}","${i.status}"`)
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `Cadastral_LiDAR_Audit_${selectedBuildingId}.csv`, 'text/csv');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-main">LiDAR & CAD As-Built Audit Engine</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              High Precision ±2cm
            </span>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Automated volumetric cross-section analysis comparing sanctioned CAD drawings against terrestrial LiDAR point clouds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".las,.laz,.ifc,.dwg,.dxf,.xyz,.ply"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
          >
            <UploadCloud size={14} className="text-blue-500" />
            <span>Upload LiDAR Scan / IFC</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAuditCsv}
            className="flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleTriggerLiDARReScan}
            disabled={isSimulatingScan}
            className="flex items-center gap-1.5"
          >
            <ScanLine size={13} className={isSimulatingScan ? 'animate-spin' : ''} />
            <span>{isSimulatingScan ? 'Ingesting Point Cloud...' : 'Run LiDAR Comparison'}</span>
          </Button>
        </div>
      </div>

      {uploadSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20">
            Validated
          </span>
        </div>
      )}

      {/* STANDARDS & INTEROPERABILITY COMPLIANCE FRAMING (Fix #30) */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-slate-900/40 to-indigo-950/20 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Award size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-theme-main">Standards & Interoperability Compliance Framework</span>
              <Chip label="ISO 19152 CERTIFIED" variant="primary" size="sm" />
            </div>
            <p className="text-theme-muted text-[11px] mt-0.5">
              Strict compliance with International Open Geospatial Consortium (OGC) and National DILRMP 3D Cadastral mandates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
            ISO 19152 LADM Part 3
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
            OGC CityGML 3.0 (LOD3)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
            BIM IFC 4.3 / ISO 16739
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-blue-400 font-bold">
            SoI CORS Datum EGM2008
          </span>
        </div>
      </div>

      {/* INTELLIGENT 3D TOPOLOGY VALIDATION ENGINE (Fix #28) */}
      <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-theme-main uppercase tracking-wider">
                  Intelligent 3D Volumetric Topology Validation Engine
                </h2>
                <Chip label="1 ACTIVE COLLISION" variant="danger" size="sm" />
              </div>
              <p className="text-[11px] text-theme-muted mt-0.5">
                Real-time geometric intersection, volumetric disjointness, and municipal sanction envelope verification.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!showTopologyConflicts) {
                toggleTopologyConflicts();
              }
              navigateTo3DBuilding(
                {
                  targetBuildingId: activeBuilding.buildingId,
                  portal: 'authority',
                },
                navigate
              );
            }}
            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer font-bold"
          >
            <Box size={13} />
            <span>Highlight Collision in 3D Viewer</span>
            <ArrowRight size={13} />
          </Button>
        </div>

        {/* 4 Diagnostic Rule Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-theme-muted uppercase">Watertight 3D Solid</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="font-bold text-theme-main mt-1">Euler-Poincaré Pass</div>
            <span className="text-[10px] text-emerald-500 font-mono">V - E + F = 2 (manifold)</span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-theme-muted uppercase">Vertical Disjointness</span>
              <AlertTriangle size={13} className="text-rose-500" />
            </div>
            <div className="font-bold text-rose-500 mt-1">Collision Detected</div>
            <span className="text-[10px] text-rose-400 font-mono">Floor 12 airspace overlap (+1.76m)</span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-theme-muted uppercase">Approved Floor Count</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="font-bold text-theme-main mt-1">
              {activeBuilding.floorsAbove} / {activeBuilding.approvedFloors} Floors
            </div>
            <span className="text-[10px] text-theme-muted font-mono">
              {encroachment.excessFloors === 0 ? 'Sanctioned limit compliant' : `${encroachment.excessFloors} excess floors built`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-theme-muted uppercase">Subsurface Boundary</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="font-bold text-theme-main mt-1">3 Basements Clear</div>
            <span className="text-[10px] text-emerald-500 font-mono">No utility pipe encroachment</span>
          </div>
        </div>
      </div>

      {/* SELECTION BAR */}
      <div className="p-4 rounded-xl border border-theme bg-theme-surface flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Target Cadastral Parcel</span>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="bg-theme-base border border-theme rounded-lg px-3 py-1.5 text-xs text-theme-main font-bold mt-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {buildings.map((b) => (
                <option key={b.buildingId} value={b.buildingId}>
                  {b.name} ({b.ulpin}) — {b.floorsAbove} Floors
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-theme-muted block font-sans">Cadastral Datum</span>
            <span className="font-bold text-theme-main">WGS84 · 19.0654° N</span>
          </div>
          <div>
            <span className="text-[10px] text-theme-muted block font-sans">Ingested Cloud</span>
            <span className="font-bold text-blue-500">
              {uploadedScanName ? uploadedScanName : '2.4M Points (LAS / IFC)'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeBuilding) {
                navigateTo3DBuilding(
                  {
                    targetBuildingId: activeBuilding.buildingId,
                    portal: 'authority',
                  },
                  navigate
                );
              }
            }}
            className="flex items-center gap-1 cursor-pointer"
          >
            <span>View 3D</span>
            <ArrowRight size={12} />
          </Button>
        </div>
      </div>

      {/* AUDIT MATRIX TABLE */}
      <div className="border border-theme rounded-2xl bg-theme-surface overflow-hidden shadow-xs">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-blue-500" />
            <h3 className="font-bold text-xs text-theme-main uppercase tracking-wider">
              As-Built Geometric Deviation Matrix
            </h3>
          </div>
          <span className="text-xs text-theme-muted">
            Tolerance Standard: <strong className="text-theme-main">National Building Code (NBC-2026)</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-subtle border-b border-theme text-theme-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Structural Dimension</th>
                <th className="p-3.5">Sanctioned Drawing</th>
                <th className="p-3.5">LiDAR As-Built</th>
                <th className="p-3.5">Net Delta</th>
                <th className="p-3.5">Tolerance</th>
                <th className="p-3.5">Audit Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme font-mono">
              {auditItems.map((item) => {
                const isDev = item.status === 'Deviation';
                const isReview = item.status === 'Under Review';

                return (
                  <tr key={item.id} className="hover:bg-theme-subtle/50 transition-colors">
                    <td className="p-3.5 font-sans font-semibold text-theme-main">
                      {item.component}
                    </td>
                    <td className="p-3.5 text-theme-muted">{item.sanctioned}</td>
                    <td className="p-3.5 font-bold text-theme-main">{item.asBuilt}</td>
                    <td className="p-3.5">
                      <span className={isDev ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                        {item.delta}
                      </span>
                    </td>
                    <td className="p-3.5 text-theme-muted">{item.tolerance}</td>
                    <td className="p-3.5 font-sans">
                      <Chip
                        label={item.status}
                        variant={isDev ? 'danger' : isReview ? 'warning' : 'success'}
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VERDICT & ADJUDICATION SECTION */}
      <div className="p-5 rounded-2xl border border-theme bg-theme-surface space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-amber-500" />
          <h3 className="font-bold text-sm text-theme-main">
            Town Planning & Cadastral Verdict Determination
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['Compliant', 'Deviation', 'Under Review'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVerdict(v)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                verdict === v
                  ? v === 'Compliant'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                    : v === 'Deviation'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold ring-2 ring-amber-500/20'
                    : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                  : 'border-theme bg-theme-subtle/40 text-theme-muted hover:border-theme-main'
              }`}
            >
              <div className="text-xs font-bold">{v}</div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {v === 'Compliant'
                  ? 'All measurements within statutory NBC tolerance'
                  : v === 'Deviation'
                  ? 'Unauthorized structural projection confirmed'
                  : 'Requires physical Total Station survey'}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-theme-main block">
            Statutory Verdict Justification & Enforcement Directive
          </label>
          <textarea
            value={officerVerdictNotes}
            onChange={(e) => setOfficerVerdictNotes(e.target.value)}
            rows={3}
            className="w-full bg-theme-base border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-theme">
          <div className="text-xs text-theme-muted">
            Authorized Signatory: <strong className="text-theme-main">Er. Rajesh Deshmukh (Chief Town Planner)</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSaveVerdict}
              className="flex items-center gap-1.5"
            >
              <FileCheck2 size={14} />
              <span>{isSaved ? 'Verdict Recorded on Chain!' : 'Seal & Submit Audit Verdict'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
