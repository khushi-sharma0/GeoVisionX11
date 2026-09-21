import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { computeCheckDigits } from '../../domain/ulpin';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { generatePropertyPassportPdf } from '../../utils/pdfGenerator';
import { triggerFileDownload } from '../../utils/downloadHelper';
import { ShieldCheck, Download, Printer, Box, QrCode, Building, CheckCircle2 } from 'lucide-react';

export const CitizenPassportPage: React.FC = () => {
  const { units, buildings, floors, parcels } = useCadastreStore();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();

  const requestedUlpin = searchParams.get('ulpin');
  const heroUnit = (requestedUlpin ? units.find((u) => u.ulpin3d === requestedUlpin) : null) || units.find((u) => u.unitId === 'U302') || units[0];
  const floor = floors.find((f) => f.floorId === heroUnit?.floorId);
  const building = buildings.find((b) => b.buildingId === floor?.buildingId);
  const parcel = parcels.find((p) => p.parcelId === building?.parcelId);

  const flatNumberDisplay = heroUnit?.flatNumber ?? '302';
  const ulpinDisplay = heroUnit?.ulpin3d ?? 'MH-MUM-98213-B04-F12-U302';

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/citizen/passport?ulpin=${encodeURIComponent(ulpinDisplay)}`
    : `https://geovision.gov.in/verify/${encodeURIComponent(ulpinDisplay)}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">Digital Property Passport (3D ULPIN)</h1>
          <p className="text-xs text-theme-muted mt-1">
            Official Statutory Title Document issued under the National Land Record Modernisation Programme.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={14} />}
            onClick={() => {
              const content = JSON.stringify(heroUnit, null, 2);
              const blob = new Blob([content], { type: 'application/json' });
              triggerFileDownload(blob, `PASSPORT_${heroUnit?.ulpin3d || 'UNIT'}.json`, 'application/json');
            }}
          >
            JSON-LD
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Download size={14} />}
            onClick={() => {
              if (heroUnit) {
                generatePropertyPassportPdf(heroUnit, building, floor, parcel);
              }
            }}
          >
            Download Official PDF
          </Button>
        </div>
      </div>

      {/* Official Certificate Box */}
      <div className="border-2 border-theme rounded-2xl bg-theme-surface p-8 shadow-xl space-y-8 relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] text-9xl font-extrabold select-none">
          GOI
        </div>

        {/* Certificate Header */}
        <div className="text-center pb-6 border-b border-theme space-y-2">
          <div className="w-12 h-12 mx-auto rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            GOI
          </div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-theme-muted">
            Government of India · Ministry of Rural Development
          </h2>
          <h3 className="text-lg font-extrabold text-theme-main">
            Department of Land Resources (DoLR) — 3D Cadastral Division
          </h3>
          <p className="text-xs font-mono text-theme-muted">
            National Spatial Data Infrastructure · ISO 19152 LADM 3D Compliant
          </p>
        </div>

        {/* 3D ULPIN Ribbon */}
        <div className="p-4 rounded-xl bg-theme-subtle border border-theme flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider">
              Assigned 3D Unique Land Parcel Identification Number
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 select-all tracking-tight">
              {ulpinDisplay}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <Chip label="STATUTORY CERTIFICATE" variant="success" size="sm" icon={<ShieldCheck size={12} />} />
              <span className="text-xs font-mono text-theme-muted">
                Checksum: <strong>{computeCheckDigits(ulpinDisplay)}</strong>
              </span>
            </div>
          </div>

          {/* Real Functional QR Code */}
          <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
            <QRCodeSVG
              value={verificationUrl}
              size={112}
              level="M"
              includeMargin={false}
            />
            <span className="text-[9px] font-mono font-bold text-gray-800 mt-1.5 uppercase tracking-tight">
              Scan to Verify Title
            </span>
          </div>
        </div>

        {/* Property Geometry & Airspace Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl border border-theme bg-theme-subtle/40 space-y-3">
            <h4 className="font-bold text-theme-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Box size={14} className="text-blue-500" />
              <span>Spatial Prism Attributes</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Structure Name:</span>
                <span className="font-bold text-theme-main">{building?.name ?? 'Platinum Horizon Tower'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Unit / Flat Number:</span>
                <span className="font-mono font-bold">Flat {flatNumberDisplay}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Floor Elevation Level:</span>
                <span className="font-mono font-bold">Level 12 (Floor {floor?.code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Absolute Spatial Elevation:</span>
                <span className="font-mono text-blue-500 font-bold">+51.7m to +55.3m MSL</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-theme-muted">Enclosed Volumetric Airspace:</span>
                <span className="font-mono font-bold text-emerald-500">513.0 m³</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-theme bg-theme-subtle/40 space-y-3">
            <h4 className="font-bold text-theme-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building size={14} className="text-emerald-500" />
              <span>Cadastral Title & Registry Deed</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Title Holder:</span>
                <span className="font-bold text-theme-main">{heroUnit.ownerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Citizen Aadhaar / PAN:</span>
                <span className="font-mono">{user.role === 'Citizen' ? 'Linked & Verified (e-KYC)' : heroUnit.ownerId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Built-Up Area:</span>
                <span className="font-mono">{heroUnit.builtUpAreaSqm} m² (1,533.8 sq ft)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/40">
                <span className="text-theme-muted">Municipal Tax Status:</span>
                <Chip label={heroUnit.taxStatus} variant="success" size="sm" />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-theme-muted">Endorsing Authority:</span>
                <span className="font-semibold text-theme-main">{heroUnit.approvedBy || 'Director of Land Records'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Seal and Sign-off */}
        <div className="pt-6 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-theme-muted">
          <div>
            <div>Digitally Signed by Competent Cadastral Authority</div>
            <div className="font-mono text-[10px]">DoLR-PKI-CERT-2025-081294</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-theme-main">National Cadastral Registry of India</div>
            <div className="text-[10px]">Statutory Document under Information Technology Act 2000</div>
          </div>
        </div>
      </div>
    </div>
  );
};
