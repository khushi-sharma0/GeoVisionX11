import React from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, FileText, CheckCircle2, History, Download } from 'lucide-react';

export const CitizenOwnershipPage: React.FC = () => {
  const { units, buildings, floors } = useCadastreStore();
  const { user } = useAuthStore();

  const heroUnit = units.find((u) => u.unitId === 'U302') || units[0];
  const floor = floors.find((f) => f.floorId === heroUnit?.floorId);
  const building = buildings.find((b) => b.buildingId === floor?.buildingId);

  const ownerNameDisplay = heroUnit?.ownerName ?? user.name;
  const ulpinDisplay = heroUnit?.ulpin3d ?? 'MH-MUM-98213-B04-F12-U302';

  const transferHistory = [
    {
      date: '18 Nov 2021',
      event: 'Original Title Conveyance (Sale Deed)',
      parties: 'From Platinum Horizon Developers LLP to Aditya Vikram Singhania',
      regNumber: 'BOM/SDR/2021/88921',
      status: 'Registered',
    },
    {
      date: '04 Mar 2024',
      event: '3D Cadastral Volumetric Delineation',
      parties: 'Department of Land Resources (DoLR) 3D ULPIN Assignment',
      regNumber: '3D-CAD-MUM-98213-04',
      status: 'Statutory Endorsement',
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">Statutory Ownership & Title Deed</h1>
          <p className="text-xs text-theme-muted mt-1">
            Certified title chain, encumbrance certificate, and volumetric spatial ownership records.
          </p>
        </div>
      </div>

      {/* Title Summary Card */}
      <div className="p-6 rounded-2xl border border-theme bg-theme-surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-theme-main">Clear & Marketable Title</h3>
              <p className="text-xs text-theme-muted">No encumbrances, lis pendens, or municipal liens found.</p>
            </div>
          </div>
          <Chip label="UNENCUMBERED" variant="success" size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-theme text-xs">
          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">Primary Title Holder:</span>
            <div className="font-bold text-theme-main mt-0.5">{ownerNameDisplay}</div>
          </div>
          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">3D ULPIN:</span>
            <div className="font-mono font-bold text-blue-500 mt-0.5 truncate">{ulpinDisplay}</div>
          </div>
          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">Cadastral Share:</span>
            <div className="font-mono font-bold text-theme-main mt-0.5">142.5 m² (0.84% Undivided Land Share)</div>
          </div>
        </div>
      </div>

      {/* Transfer History Timeline */}
      <div className="p-6 rounded-2xl border border-theme bg-theme-surface space-y-4">
        <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
          <History size={16} className="text-blue-500" />
          <span>Chain of Title & Registration History</span>
        </h3>

        <div className="divide-y divide-theme border border-theme rounded-lg overflow-hidden text-xs">
          {transferHistory.map((t, i) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-theme-main">{t.event}</span>
                  <Chip label={t.status} variant="success" size="sm" />
                </div>
                <p className="text-theme-muted">{t.parties}</p>
                <p className="text-[11px] font-mono text-theme-muted">Doc Reg No: {t.regNumber} · Date: {t.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
