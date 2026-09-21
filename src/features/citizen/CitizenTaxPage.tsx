import React, { useState } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Receipt, CheckCircle2, Download, Printer, ShieldCheck, Calculator } from 'lucide-react';

export const CitizenTaxPage: React.FC = () => {
  const { units } = useCadastreStore();
  const [taxPaid, setTaxPaid] = useState(true);
  const heroUnit = units.find((u) => u.unitId === 'U302') || units[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">3D Volumetric Property Tax Assessment</h1>
          <p className="text-xs text-theme-muted mt-1">
            Municipal assessment integrating base footprint land valuation with vertical floor height and air rights index.
          </p>
        </div>
      </div>

      {/* Tax Status Card */}
      <div className="p-6 rounded-2xl border border-theme bg-theme-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-theme-main">
                  FY 2024-2025 Municipal Assessment
                </h3>
                <Chip label="PAID IN FULL" variant="success" size="sm" icon={<ShieldCheck size={12} />} />
              </div>
              <p className="text-xs text-theme-muted font-mono mt-0.5">
                Assessment Order No: MCGM/REV/3D/2024-91283
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Breakdown of 3D Volumetric Calculation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
            <Calculator size={14} className="text-blue-500" />
            <span>Volumetric Airspace Tax Computation Formula</span>
          </h4>

          <div className="divide-y divide-theme border border-theme rounded-xl overflow-hidden text-xs bg-theme-subtle/30">
            <div className="p-3.5 flex justify-between">
              <span className="text-theme-muted">Base Land Share Assessment (142.5 m² @ Ready Reckoner):</span>
              <span className="font-mono font-medium">₹22,000</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <div>
                <span className="text-theme-muted">Vertical Elevation Factor (Floor 12: +51.7m MSL):</span>
                <span className="text-[10px] text-theme-muted block">Height factor 1.15× multiplier for premium skyline air rights</span>
              </div>
              <span className="font-mono font-medium">+₹7,800</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-theme-muted">Basement Parking Bay B2-48 Cess:</span>
              <span className="font-mono font-medium">+₹4,400</span>
            </div>
            <div className="p-4 flex justify-between bg-theme-subtle font-bold text-sm">
              <span className="text-theme-main">Total Annual Cadastral Tax:</span>
              <span className="font-mono text-emerald-500">₹34,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
