import React, { useState, useRef } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { PropertyPassportModal } from './PropertyPassportModal';
import { useNavigate } from 'react-router-dom';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';
import {
  Home,
  QrCode,
  Globe2,
  FileCheck2,
  ShieldCheck,
  Receipt,
  ArrowUpRight,
  Maximize2,
  Box,
  UploadCloud,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const CitizenMyPropertiesPage: React.FC = () => {
  const { units, buildings, floors, parcels } = useCadastreStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [passportOpen, setPassportOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; size: string; date: string; type: string }>>([
    { name: 'Registered_Sale_Deed_Indexed_2023.pdf', size: '3.4 MB', date: '14 Oct 2023', type: 'Conveyance Deed' },
    { name: 'Architectural_Sanction_Plan_L12.dwg', size: '8.1 MB', date: '22 Jan 2024', type: 'Sanctioned Floor Layout' },
  ]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc = {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'Citizen Submitted Record',
    };
    setUploadedDocs((prev) => [newDoc, ...prev]);
    setUploadNotice(`Document "${file.name}" uploaded and submitted to Land Records Office.`);
    setTimeout(() => setUploadNotice(null), 5000);
  };

  // Hero Unit 302
  const heroUnit = units.find((u) => u.unitId === 'U302') || units[0];
  const floor = floors.find((f) => f.floorId === heroUnit?.floorId);
  const building = buildings.find((b) => b.buildingId === floor?.buildingId);
  const parcel = parcels.find((p) => p.parcelId === building?.parcelId);

  const flatNumberDisplay = heroUnit?.flatNumber ?? '302';
  const ulpinDisplay = heroUnit?.ulpin3d ?? 'MH-MUM-98213-B04-F12-U302';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-800/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Citizen Cadastral Title Portal
            </span>
            <Chip label="AADHAAR LINKED" variant="success" size="sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl leading-relaxed">
            Registered owner of 1 authenticated 3D cadastral parcel. Your vertical ownership
            prism is recorded in the National Cadastral Registry with verifiable statutory status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleDocUpload}
          />
          <Button
            variant="outline"
            className="border-emerald-600/50 text-emerald-200 hover:bg-emerald-800/30"
            icon={<UploadCloud size={15} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Deed / Plan
          </Button>
          <Button
            variant="accent"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            icon={<QrCode size={15} />}
            onClick={() => setPassportOpen(true)}
          >
            Digital Property Passport
          </Button>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20">
            Pending Registrar Verification
          </span>
        </div>
      )}

      {/* Property Hero Card */}
      <div className="p-6 rounded-2xl border border-theme bg-theme-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Home size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-theme-main">
                  Flat {flatNumberDisplay} · {building?.name ?? 'Platinum Horizon Tower'}
                </h2>
                <Chip label="TITLE VERIFIED" variant="success" size="sm" icon={<ShieldCheck size={12} />} />
              </div>
              <p className="text-xs text-theme-muted font-mono mt-0.5">
                3D ULPIN: <strong className="text-blue-500 select-all">{ulpinDisplay}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Globe2 size={14} />}
              onClick={() => {
                navigateTo3DBuilding(
                  {
                    targetBuildingId: building?.buildingId || 'B04',
                    targetFloorId: floor?.floorId,
                    targetUnitId: heroUnit?.unitId,
                    portal: 'citizen',
                  },
                  navigate
                );
              }}
            >
              View 3D Spatial Prism
            </Button>
          </div>
        </div>

        {/* 3D Property Geometry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-theme-subtle border border-theme">
            <span className="text-[10px] uppercase font-bold text-theme-muted">Elevation & Floor Level</span>
            <div className="text-base font-bold font-mono text-theme-main mt-1">Floor 12 (12th Level)</div>
            <span className="text-blue-500 font-mono mt-0.5 inline-block">+51.7m to +55.3m MSL</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-subtle border border-theme">
            <span className="text-[10px] uppercase font-bold text-theme-muted">Built-up / Carpet Area</span>
            <div className="text-base font-bold font-mono text-theme-main mt-1">142.5 m² / 118.0 m²</div>
            <span className="text-theme-muted">1,533.8 sq. ft. Built-up</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-subtle border border-theme">
            <span className="text-[10px] uppercase font-bold text-theme-muted">Enclosed Volumetric Airspace</span>
            <div className="text-base font-bold font-mono text-emerald-500 mt-1">513.0 m³</div>
            <span className="text-theme-muted">Legally exclusive vertical air rights</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-subtle border border-theme">
            <span className="text-[10px] uppercase font-bold text-theme-muted">Municipal Tax Status</span>
            <div className="text-base font-bold font-mono text-theme-main mt-1">₹34,200 / Year</div>
            <span className="text-emerald-500 font-semibold">Paid (Valid till March 2026)</span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents & Title Records Repository */}
      <div className="p-5 rounded-2xl border border-theme bg-theme-surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-500" />
            <h3 className="font-bold text-xs text-theme-main uppercase tracking-wider">
              Statutory Deeds & Architectural Submissions
            </h3>
          </div>
          <span className="text-[11px] text-theme-muted">
            {uploadedDocs.length} Verified Documents Linked to ULPIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {uploadedDocs.map((doc, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-theme-subtle border border-theme flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <FileCheck2 size={16} />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-theme-main truncate">{doc.name}</div>
                  <div className="text-[10px] text-theme-muted flex items-center gap-2 mt-0.5">
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex-shrink-0">
                Indexed
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Property Passport Modal */}
      {passportOpen && (
        <PropertyPassportModal
          isOpen={passportOpen}
          onClose={() => setPassportOpen(false)}
          unit={heroUnit}
          building={building}
          floor={floor}
          parcel={parcel}
        />
      )}
    </div>
  );
};
