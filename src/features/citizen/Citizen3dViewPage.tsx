import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CesiumViewer } from '../globe/CesiumViewer';
import { GlobeControls } from '../globe/GlobeControls';
import { BuildingDetailPanel } from '../globe/BuildingDetailPanel';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useGlobeStore } from '../../stores/globeStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Home, QrCode, ArrowLeft, ShieldCheck } from 'lucide-react';

export const Citizen3dViewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    buildings,
    parcels,
    selectBuilding,
    selectFloor,
    selectUnit,
    setSelectedCityId,
    selectedBuildingId,
    selectedUnitId,
  } = useCadastreStore();
  const { isExploded, toggleExploded } = useGlobeStore();
  const navigate = useNavigate();

  const activeBuilding = buildings.find((b) => b.buildingId === selectedBuildingId);

  useEffect(() => {
    const qBuildingId = searchParams.get('buildingId');
    const qFloorId = searchParams.get('floorId');
    const qUnitId = searchParams.get('unitId');

    if (qBuildingId) {
      const targetB = buildings.find(
        (b) =>
          b.buildingId.toLowerCase() === qBuildingId.toLowerCase() ||
          b.name.toLowerCase().includes(qBuildingId.toLowerCase())
      );
      if (targetB) {
        const p = parcels.find((item) => item.parcelId === targetB.parcelId);
        if (p) {
          if (p.city === 'MUM') setSelectedCityId('mumbai');
          else if (p.city === 'PUN') setSelectedCityId('pune');
          else if (p.city === 'DEL') setSelectedCityId('delhi');
          else if (p.city === 'AMD') setSelectedCityId('ahmedabad');
        }
        selectBuilding(targetB.buildingId);
        if (qFloorId) selectFloor(qFloorId);
        if (qUnitId) selectUnit(qUnitId);
        return;
      }
    }

    // If no building selected yet, fallback to hero property
    if (!selectedBuildingId) {
      setSelectedCityId('mumbai');
      selectBuilding('B04');
      selectFloor('FL-MUM-B04-12');
      selectUnit('U302');
      if (!isExploded) {
        toggleExploded();
      }
    }
  }, [searchParams, buildings, parcels]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] overflow-hidden">
      {/* 3D Map */}
      <CesiumViewer />
      <GlobeControls />

      {/* Citizen Property Details 3D Panel */}
      <BuildingDetailPanel readOnly={true} />

      {/* Floating Citizen Header Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-theme-surface/90 backdrop-blur-md border border-theme px-3.5 py-2 rounded-xl shadow-lg text-xs">
        <button
          onClick={() => navigate('/citizen/my-properties')}
          className="flex items-center gap-1.5 text-theme-muted hover:text-theme-main transition-colors mr-2 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>My Properties</span>
        </button>
        <div className="w-px h-4 bg-theme-muted/30" />
        <div className="flex items-center gap-1.5 font-bold text-theme-main">
          <ShieldCheck size={15} className="text-emerald-500" />
          <span>{activeBuilding ? activeBuilding.name : 'Citizen 3D Spatial Prism'}</span>
        </div>
        <Chip
          label={selectedUnitId ? `UNIT ${selectedUnitId.replace('U', '')} VERIFIED` : '3D CADASTRE'}
          variant="success"
          size="sm"
        />
      </div>
    </div>
  );
};
