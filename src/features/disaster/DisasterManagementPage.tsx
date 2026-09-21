import React from 'react';
import { useGlobeStore } from '../../stores/globeStore';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Waves,
  ShieldAlert,
  ArrowUpRight,
  Flame,
  LifeBuoy,
  Building2,
  Users,
} from 'lucide-react';

export const DisasterManagementPage: React.FC = () => {
  const { floodActive, setFloodActive, floodLevelM, setFloodLevelM } = useGlobeStore();
  const { buildings, floors, units } = useCadastreStore();
  const navigate = useNavigate();

  // Calculate inundated infrastructure
  const inundatedBuildings = buildings.filter(
    (b) => b.baseElevationM <= floodLevelM
  );

  const inundatedBasements = floors.filter(
    (f) => f.code.startsWith('B') && f.baseHeightM < floodLevelM
  );

  const criticalUnits = units.filter((u) => {
    const fl = floors.find((f) => f.floorId === u.floorId);
    return fl && fl.baseHeightM < floodLevelM;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-theme-main">
              3D Disaster Risk & Volumetric Inundation Analysis
            </h1>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Volumetric sea level rise, flash flood modeling, and floor-level evacuation priority routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={<ArrowUpRight size={15} />}
            onClick={() => {
              setFloodActive(true);
              navigate('/authority/globe');
            }}
          >
            Launch 3D Inundation Layer
          </Button>
        </div>
      </div>

      {/* Flood Controls Slider Card */}
      <div className="p-6 rounded-xl border border-theme bg-theme-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Waves size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-theme-main">
                Projected Water Level Inundation Elevation
              </h3>
              <p className="text-xs text-theme-muted">
                Adjust water plane height relative to Mean Sea Level (MSL).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-sky-500">
              +{floodLevelM}.0 m MSL
            </span>
            <Chip
              label={floodActive ? 'ACTIVE FLOOD LAYER' : 'STANDBY'}
              variant={floodActive ? 'primary' : 'neutral'}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={floodLevelM}
            onChange={(e) => {
              setFloodLevelM(Number(e.target.value));
              if (!floodActive) setFloodActive(true);
            }}
            className="w-full h-2 bg-theme-subtle rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-theme-muted">
            <span>0m (Baseline MSL)</span>
            <span>+5m (High Tide Storm Surge)</span>
            <span>+12m (50-Yr Flood Event)</span>
            <span>+25m (Extreme Inundation)</span>
          </div>
        </div>
      </div>

      {/* Impact Assessment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase">Inundated Buildings</span>
            <Building2 size={16} className="text-rose-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-rose-500">
            {inundatedBuildings.length}
          </div>
          <p className="text-xs text-theme-muted">
            Structures whose plinth base is submerged beneath the projected water plane.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase">Submerged Basements</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-500">
            {inundatedBasements.length}
          </div>
          <p className="text-xs text-theme-muted">
            Underground parking, BMS electrical transformers, and pumps at risk.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted uppercase">Affected Citizens</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-blue-500">
            {criticalUnits.length * 4}
          </div>
          <p className="text-xs text-theme-muted">
            Estimated residents in {criticalUnits.length} direct flood line units.
          </p>
        </div>
      </div>

      {/* Evacuation Priority Table */}
      <div className="p-6 rounded-xl border border-theme bg-theme-surface space-y-4">
        <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
          <LifeBuoy size={16} className="text-rose-500" />
          <span>Floor-Level Volumetric Evacuation & Rescue Prioritization</span>
        </h3>

        <div className="divide-y divide-theme border border-theme rounded-lg overflow-hidden text-xs">
          <div className="p-3 bg-theme-subtle flex items-center justify-between font-semibold text-theme-muted">
            <span>Risk Tier & Floor Zone</span>
            <span>Recommended Response Protocol</span>
            <span>Action Status</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div>
                <div className="font-bold text-theme-main">Tier 1: Basements B1 & B2 Submerged</div>
                <div className="text-[11px] text-theme-muted">Sub-surface infrastructure & car parking</div>
              </div>
            </div>
            <span className="text-theme-muted">Immediate pump evacuation; cut main electrical transformers</span>
            <Chip label="CRITICAL" variant="danger" size="sm" />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <div className="font-bold text-theme-main">Tier 2: Ground Floor Retail & Plinth</div>
                <div className="text-[11px] text-theme-muted">Commercial shops, lobbies, security desks</div>
              </div>
            </div>
            <span className="text-theme-muted">Deploy sandbag barriers, relocate retail inventory to Floor 1</span>
            <Chip label="HIGH" variant="warning" size="sm" />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div>
                <div className="font-bold text-theme-main">Tier 3: Upper Floors (Floors 02 to 17)</div>
                <div className="text-[11px] text-theme-muted">Apartments and penthouses isolated</div>
              </div>
            </div>
            <span className="text-theme-muted">Vertical shelter in place; prepare rooftop drone supply drops</span>
            <Chip label="SHELTER IN PLACE" variant="info" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
