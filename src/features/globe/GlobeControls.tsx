import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCcw,
  RotateCw,
  Box,
  Building2,
  Grid3X3,
  Cpu,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Compass,
  Mountain,
} from 'lucide-react';
import { useGlobeStore } from '../../stores/globeStore';
import { useCadastreStore } from '../../stores/cadastreStore';
import { FloorPlanAiMeshModal } from './FloorPlanAiMeshModal';

export const GlobeControls: React.FC = () => {
  const {
    isExploded,
    toggleExploded,
    undergroundVisible,
    toggleUnderground,
    demDsmActive,
    toggleDemDsm,
    floorPlanActive,
    toggleFloorPlan,
    aiMeshActive,
    toggleAiMesh,
    layerVisibility,
    toggleLayer,
    utilityPipesVisible,
    toggleUtilityPipes,
    utilityWaterVisible,
    toggleUtilityWater,
    utilitySewerVisible,
    toggleUtilitySewer,
    utilityGasVisible,
    toggleUtilityGas,
    utilityElectricVisible,
    toggleUtilityElectric,
    utilityTelecomVisible,
    toggleUtilityTelecom,
    renderMode,
    setRenderMode,
    isOrbiting,
    toggleOrbiting,
    triggerCameraAction,
  } = useGlobeStore();

  const {
    selectedBuildingId,
    selectedFloorId,
    buildings,
    floors,
    units,
    parcels,
    selectFloor,
  } = useCadastreStore();

  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'floorPlan' | 'aiMesh' | null>(null);

  const selectedBuilding = buildings.find((b) => b.buildingId === selectedBuildingId);
  const selectedParcel = selectedBuilding
    ? parcels.find((p) => p.parcelId === selectedBuilding.parcelId)
    : null;
  const buildingFloors = selectedBuilding
    ? floors.filter((f) => f.buildingId === selectedBuilding.buildingId)
    : [];
  const selectedFloor = buildingFloors.find((f) => f.floorId === selectedFloorId) || buildingFloors[0];
  const floorUnits = selectedFloor ? units.filter((u) => u.floorId === selectedFloor.floorId) : [];

  const handleResetCamera = () => {
    triggerCameraAction('reset');
  };

  const handleZoomIn = () => {
    triggerCameraAction('zoomIn');
  };

  const handleZoomOut = () => {
    triggerCameraAction('zoomOut');
  };

  const handleToggle2D3D = () => {
    triggerCameraAction('topDown');
  };

  // Keyboard navigation shortcuts: +/= to zoom in, -/_ to zoom out, r/R to reset, o/O to orbit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetCamera();
      } else if (e.key === 'o' || e.key === 'O') {
        toggleOrbiting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerCameraAction, toggleOrbiting]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleOpenFloorPlan = () => {
    toggleFloorPlan();
    if (selectedBuilding) {
      setModalMode('floorPlan');
    }
  };

  const handleOpenAiMesh = () => {
    toggleAiMesh();
    if (selectedBuilding) {
      setModalMode('aiMesh');
    }
  };

  return (
    <>
      {/* 1. TOP-CENTER PILL OVERLAY (Selected Building & Underground Infra Toggle) */}
      {selectedBuilding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400">
              <Building2 size={12} />
            </div>
            <span className="font-semibold text-slate-100">{selectedBuilding.name}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              (ULPIN: {selectedBuilding.ulpin || selectedParcel?.ulpin2d})
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700 mx-1" />

          {/* View Underground Infra Toggle */}
          <button
            onClick={toggleUnderground}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              undergroundVisible
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                undergroundVisible ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'
              }`}
            />
            <span>Underground Utilities</span>
          </button>
        </div>
      )}

      {/* 2. COMPACT LAYER TOGGLE POPOVER (Positioned beneath search bar) */}
      <div className="absolute top-16 left-4 z-20">
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 shadow-xl text-xs font-semibold hover:border-blue-500 transition-all cursor-pointer"
        >
          <Layers size={14} className="text-blue-400" />
          <span>Layers & Overlays</span>
          {isLayersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isLayersOpen && (
          <div className="mt-2 w-64 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3.5 space-y-3 animate-in fade-in">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
              Cadastral Visibility
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.parcel}
                  onChange={() => toggleLayer('parcel')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Parcels</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.building}
                  onChange={() => toggleLayer('building')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Buildings</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.units}
                  onChange={() => toggleLayer('units')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Units</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.sewerage}
                  onChange={() => toggleLayer('sewerage')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Utilities</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.basemapLabels}
                  onChange={() => toggleLayer('basemapLabels')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Streets</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={layerVisibility.buildingLabels}
                  onChange={() => toggleLayer('buildingLabels')}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-0"
                />
                <span>Names</span>
              </label>
            </div>

            {/* Subsurface 3D Utility Networks */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Subsurface Utilities (3D)</span>
              <button
                onClick={toggleUtilityPipes}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-normal cursor-pointer"
              >
                {utilityPipesVisible ? 'Hide All' : 'Show All'}
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_#0284c7]" />
                  <span>Water Supply</span>
                </div>
                <input
                  type="checkbox"
                  checked={utilityWaterVisible}
                  onChange={toggleUtilityWater}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-800 shadow-[0_0_6px_#78350f]" />
                  <span>Sewer & Drainage</span>
                </div>
                <input
                  type="checkbox"
                  checked={utilitySewerVisible}
                  onChange={toggleUtilitySewer}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-amber-700 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  <span>PNG City Gas</span>
                </div>
                <input
                  type="checkbox"
                  checked={utilityGasVisible}
                  onChange={toggleUtilityGas}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-amber-400 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#dc2626]" />
                  <span>Electric Power (33kV)</span>
                </div>
                <input
                  type="checkbox"
                  checked={utilityElectricVisible}
                  onChange={toggleUtilityElectric}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-red-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#059669]" />
                  <span>Telecom Optical Fiber</span>
                </div>
                <input
                  type="checkbox"
                  checked={utilityTelecomVisible}
                  onChange={toggleUtilityTelecom}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-800">
              Survey Elevation Datums
            </div>
            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white select-none py-1">
              <div className="flex items-center gap-2">
                <Mountain size={13} className="text-amber-400" />
                <span className="text-xs">DEM/DSM Hypsometric</span>
              </div>
              <input
                type="checkbox"
                checked={demDsmActive}
                onChange={toggleDemDsm}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-0 cursor-pointer"
              />
            </label>
            {demDsmActive && (
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                  <span>0m MSL</span>
                  <span>45m</span>
                  <span>95m+</span>
                </div>
                <div className="h-2 rounded-full w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600" />
                <div className="text-slate-400 text-[9px] flex items-center justify-between">
                  <span>Surface Model</span>
                  <span className="text-amber-400 font-mono">CORS EGM2008</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. VERTICAL QUICK FLOOR SELECTOR (Docked cleanly on left center - never overlaps top/bottom controls) */}
      {buildingFloors.length > 0 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl max-h-64 overflow-y-auto">
          <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider pb-1 border-b border-slate-800">
            Levels
          </span>
          {buildingFloors.slice().reverse().map((fl) => {
            const isSelected = fl.floorId === selectedFloorId;
            return (
              <button
                key={fl.floorId}
                onClick={() => selectFloor(fl.floorId)}
                className={`w-9 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-[0_0_8px_#2563eb]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`${fl.label} (${fl.code})`}
              >
                {fl.code}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. BOTTOM-LEFT QUICK ACTION BUTTONS: Floor Plan & AI Mesh */}
      <div className="absolute bottom-6 left-4 z-20 flex items-center gap-2">
        <button
          onClick={handleOpenFloorPlan}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border shadow-xl transition-all cursor-pointer ${
            floorPlanActive
              ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_#2563eb]/50'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
          }`}
          title="Toggle 3D Floor Plan and Open 2D Diagram"
        >
          <Grid3X3 size={14} />
          <span>Floor Plan</span>
        </button>

        <button
          onClick={handleOpenAiMesh}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border shadow-xl transition-all cursor-pointer ${
            aiMeshActive
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_#06b6d4]/50'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
          }`}
          title="Toggle 3D AI Mesh Wireframe and Open Reconstruction Preview"
        >
          <Cpu size={14} />
          <span>AI Mesh</span>
        </button>
      </div>

      {/* 5. BOTTOM-CENTER FLOATING ACTION TOOLBAR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl text-xs max-w-[92vw] overflow-x-auto">
        {/* Render Mode Switcher (Realistic / Wireframe / Blueprint) */}
        <div className="flex items-center bg-slate-800/90 rounded-full p-0.5 border border-slate-700">
          {(['realistic', 'wireframe', 'blueprint'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                renderMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Switch to ${mode} 3D rendering`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Zoom In & Zoom Out Quick Controls */}
        <div className="flex items-center bg-slate-800/90 rounded-full p-0.5 border border-slate-700">
          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center w-6 h-6 rounded-full text-slate-300 hover:text-white hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
            title="+"
            aria-label="+"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center w-6 h-6 rounded-full text-slate-300 hover:text-white hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
            title="-"
            aria-label="-"
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset camera to city overview (R)"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Explode Floors */}
        <button
          onClick={toggleExploded}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
            isExploded
              ? 'bg-blue-600 text-white font-semibold shadow-[0_0_8px_#2563eb]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle vertical floor explosion"
        >
          <Layers size={13} />
          <span>Explode</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Wireframe quick toggle */}
        <button
          onClick={toggleAiMesh}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            aiMeshActive
              ? 'bg-cyan-600 text-white font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle wireframe mesh overlay"
        >
          <Box size={13} />
          <span className="hidden sm:inline">Mesh</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* DEM/DSM Hypsometric Elevation Model quick toggle */}
        <button
          onClick={toggleDemDsm}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            demDsmActive
              ? 'bg-amber-600 text-white font-semibold shadow-[0_0_8px_#d97706]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle DEM/DSM Hypsometric Surface Model"
        >
          <Mountain size={13} />
          <span className="hidden sm:inline">DEM/DSM</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Fullscreen */}
        <button
          onClick={handleToggleFullscreen}
          className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Toggle fullscreen"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* 6. RIGHT-HAND FLOATING NAVIGATION CONTROLS */}
      <div className="absolute bottom-20 right-4 z-30 flex flex-col items-center bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-1 gap-1">
        {/* Compass / Reset Overview */}
        <button
          onClick={handleResetCamera}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 active:scale-90 transition-all cursor-pointer shadow-sm group"
          title="Align North / Reset Camera (R)"
          aria-label="Reset North"
        >
          <Compass size={17} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
        </button>

        {/* 2D / 3D Pitch View Toggle */}
        <button
          onClick={handleToggle2D3D}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 active:scale-90 transition-all cursor-pointer shadow-sm font-mono text-[10px] font-bold text-blue-400 hover:text-blue-300"
          title="Toggle 2D Top-Down / 3D Perspective"
          aria-label="Toggle 2D/3D Pitch"
        >
          2D/3D
        </button>

        {/* 360° Turntable Orbit Toggle */}
        <button
          onClick={toggleOrbiting}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm group ${
            isOrbiting
              ? 'bg-blue-600 text-white shadow-[0_0_12px_#2563eb]'
              : 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-90'
          }`}
          title={isOrbiting ? 'Stop 360° Turntable Orbit (O)' : 'Start 360° Turntable Orbit (O)'}
          aria-label="360 Orbit"
        >
          <RotateCw
            size={15}
            className={isOrbiting ? 'animate-spin text-white' : 'text-slate-300 group-hover:rotate-90 transition-transform'}
          />
        </button>
      </div>

      {/* Floor Plan / AI Mesh Modal */}
      {modalMode && selectedBuilding && (
        <FloorPlanAiMeshModal
          isOpen={true}
          onClose={() => setModalMode(null)}
          mode={modalMode}
          building={selectedBuilding}
          floor={selectedFloor}
          units={floorUnits}
        />
      )}
    </>
  );
};
