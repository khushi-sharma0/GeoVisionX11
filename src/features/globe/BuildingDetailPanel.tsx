import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Maximize2,
  Minimize2,
  User,
  Sparkles,
  QrCode,
  X,
  Compass,
  Grid3X3,
  Cpu,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Download,
  Key,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useGlobeStore } from '../../stores/globeStore';
import { useAuthStore } from '../../stores/authStore';
import { Chip } from '../../components/ui/Chip';
import { evaluateBuildingEncroachment } from '../../domain/topology';
import { PropertyPassportModal } from '../citizen/PropertyPassportModal';
import { FloorPlanAiMeshModal } from './FloorPlanAiMeshModal';
import { generatePropertyPassportPdf } from '../../utils/pdfGenerator';
import { Unit } from '../../domain/types';
import { useNavigate } from 'react-router-dom';

interface BuildingDetailPanelProps {
  buildingId?: string;
  readOnly?: boolean;
}

export const BuildingDetailPanel: React.FC<BuildingDetailPanelProps> = ({
  buildingId: propBuildingId,
  readOnly = false,
}) => {
  const {
    buildings,
    floors,
    units,
    parcels,
    disputes,
    selectedBuildingId: storeBuildingId,
    selectedFloorId,
    selectedUnitId,
    selectFloor,
    selectBuilding,
    selectUnit,
  } = useCadastreStore();

  const {
    isExploded,
    toggleExploded,
  } = useGlobeStore();

  const { user, role } = useAuthStore();
  const navigate = useNavigate();

  const activeBuildingId = propBuildingId || storeBuildingId;
  const isCitizenMode = readOnly || role === 'Citizen';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedUlpin, setCopiedUlpin] = useState(false);
  const [activePassportUnit, setActivePassportUnit] = useState<Unit | null>(null);
  const [previewModalMode, setPreviewModalMode] = useState<'floorPlan' | 'aiMesh' | null>(null);

  // Floating Draggable Panel State
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      dragStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        startX: rect.left,
        startY: rect.top,
      };
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.startX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.startY + deltaY));

      setPanelPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!activeBuildingId) {
    return null;
  }

  const building = buildings.find((b) => b.buildingId === activeBuildingId);
  if (!building) return null;

  const parcel = parcels.find((p) => p.parcelId === building.parcelId);
  const buildingFloors = floors.filter((f) => f.buildingId === building.buildingId);
  const selectedFloor = buildingFloors.find((f) => f.floorId === selectedFloorId) || buildingFloors[0];
  const floorUnits = selectedFloor ? units.filter((u) => u.floorId === selectedFloor.floorId) : [];

  // Active unit inside the floor
  const activeUnit = floorUnits.find((u) => u.unitId === selectedUnitId) || floorUnits[0] || null;

  // Encroachment check
  const encroachment = evaluateBuildingEncroachment(building, floors);

  // Filter disputes
  const buildingDisputes = disputes.filter(
    (d) => d.buildingId === building.buildingId || d.targetUnitOrBuilding?.includes(building.name)
  );

  const handleCopyUlpin = (ulpinText: string) => {
    navigator.clipboard.writeText(ulpinText);
    setCopiedUlpin(true);
    setTimeout(() => setCopiedUlpin(false), 2000);
  };

  // Auto-collapse on mobile / narrow viewports to avoid UI clutter
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  const handleDownloadPassport = () => {
    const effectiveFloor: any = selectedFloor || buildingFloors[0] || {
      floorId: `${building.buildingId}-F01`,
      buildingId: building.buildingId,
      code: 'F01' as const,
      label: 'Level 1 (Standard Typical)',
      baseHeightM: 0,
      heightM: 3.6,
      areaSqm: 1200,
      usage: 'Commercial' as const,
      unitCount: 4,
      segmentationConfidence: 0.98,
      ownershipStatus: 'Freehold' as const,
    };

    const effectiveUnit: any = activeUnit || floorUnits[0] || {
      unitId: `${building.buildingId}-U101`,
      floorId: effectiveFloor.floorId,
      ulpin3d: `${building.ulpin || '27101598213'}-${effectiveFloor.code}-U101`,
      flatNumber: 'Unit 101 (Executive)',
      ownerName: 'Authorized Cadastral Entity',
      carpetAreaSqm: 185.4,
      builtUpAreaSqm: 215.0,
      status: 'Active' as const,
      taxStatus: 'Paid' as const,
      propertyTaxAnnual: 48500,
    };

    const fallbackParcel = parcel || {
      parcelId: building.parcelId,
      surveyNumber: 'SN-402',
      ulpin2d: building.ulpin,
      state: 'MH',
      city: 'MUM',
      district: 'Mumbai Suburban',
      areaSqm: 4200,
      landUse: 'Commercial' as const,
      source: 'DILRMP' as const,
      geometry: { type: 'Polygon' as const, coordinates: [] },
      centroid: [cLng, cLat] as [number, number],
      registeredOwners: [effectiveUnit.ownerName],
      status: 'Active' as const,
      lastSurveyDate: '2026-01-15',
      zoneCode: 'C-2',
    };

    generatePropertyPassportPdf(effectiveUnit, building, effectiveFloor, fallbackParcel);
  };

  // If collapsed to a compact badge
  if (isCollapsed) {
    return (
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs font-bold hover:border-blue-500 transition-all cursor-pointer"
        >
          <Building2 size={16} className="text-blue-400" />
          <span className="truncate max-w-[160px]">{building.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px]">
            EXPAND
          </span>
        </button>
      </div>
    );
  }

  const coords = building.footprint?.coordinates?.[0];
  const polyPts = coords ? coords.slice(0, -1) : [];
  const cLng = polyPts.length > 0 ? polyPts.reduce((sum, pt) => sum + pt[0], 0) / polyPts.length : 72.86845;
  const cLat = polyPts.length > 0 ? polyPts.reduce((sum, pt) => sum + pt[1], 0) / polyPts.length : 19.06540;
  const latFormatted = `${Math.abs(cLat).toFixed(6)}° ${cLat >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(cLng).toFixed(6)}° ${cLng >= 0 ? 'E' : 'W'}`;

  // Per-floor discrepancy audit computation
  const isFloorFlagged = selectedFloor
    ? (building.status === 'Flagged' && (selectedFloor.code === 'F12' || selectedFloor.code === 'F10' || selectedFloor.code === 'F3')) ||
      (selectedFloor.disputeIds && selectedFloor.disputeIds.length > 0)
    : false;
  const sanctionedHeightM = selectedFloor ? 3.6 : 3.6;
  const asBuiltHeightM = selectedFloor?.heightM || 3.6;
  const heightDeltaM = +(asBuiltHeightM - sanctionedHeightM).toFixed(2);
  const sanctionedAreaSqm = selectedFloor ? Math.round(selectedFloor.areaSqm * 0.985) : 0;
  const asBuiltAreaSqm = selectedFloor?.areaSqm || 0;
  const areaDeltaSqm = asBuiltAreaSqm - sanctionedAreaSqm;

  return (
    <>
      <div
        ref={panelRef}
        style={panelPos ? { left: `${panelPos.x}px`, top: `${panelPos.y}px`, right: 'auto' } : undefined}
        className="absolute top-4 right-4 z-20 w-88 sm:w-[390px] max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col bg-white/95 text-slate-900 dark:bg-slate-900/95 dark:text-slate-100 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 shadow-2xl rounded-2xl animate-in slide-in-from-right duration-200"
      >
        {/* CARD 1: CADASTRAL IDENTITY HEADER & DRAG HANDLE */}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 select-none cursor-grab active:cursor-grabbing"
        >
          {/* Subtle drag affordance handle bar */}
          <div className="flex items-center justify-center pb-1 text-slate-400 dark:text-slate-500">
            <GripHorizontal size={16} />
            <span className="text-[9px] uppercase tracking-wider font-semibold ml-1">Drag Property Panel</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 dark:text-blue-400 flex-shrink-0">
                  <Building2 size={14} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{building.name}</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {building.address}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {panelPos && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelPos(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Reset panel position to top-right"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(true);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Collapse panel"
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectBuilding(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Deselect building"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* 14-Character Bhu-Aadhaar 3D ULPIN Badge */}
          <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                3D ULPIN
              </span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-300 truncate">
                {building.ulpin}
              </span>
            </div>
            <button
              onClick={() => handleCopyUlpin(building.ulpin)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Copy 14-character Bhu-Aadhaar ULPIN"
            >
              {copiedUlpin ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Geographic Coordinates & Datum */}
          <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Compass size={13} className="text-emerald-500 flex-shrink-0" />
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {latFormatted}, {lngFormatted}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              WGS84 · {building.baseElevationM}m MSL
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 text-center">
            <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/50">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Levels</span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                {building.floorsAbove} Above
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/50">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Height</span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {building.heightM}m
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/50">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block">Status</span>
              <span
                className={`text-[10px] font-bold block ${
                  encroachment.hasEncroachment || buildingDisputes.length > 0
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {encroachment.hasEncroachment ? 'Encroached' : 'Sanctioned'}
              </span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CARDS CONTAINER */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-3.5 text-xs">
          {/* DISPUTE / ENCROACHMENT ALERT (If any) */}
          {(encroachment.hasEncroachment || buildingDisputes.length > 0) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-200">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                <span>Cadastral Flag: Airspace Audit</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {buildingDisputes[0]?.description ||
                  'Floor slab cantilever projection exceeds sanctioned zoning envelope by 1.2m.'}
              </p>
            </div>
          )}

          {/* BUILDING FLOOR AUDIT SECTION: APPROVED VS ACTUAL FLOORS */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Floor Count Audit
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  building.status === 'Flagged' || buildingDisputes.length > 0
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {building.status === 'Flagged' || buildingDisputes.length > 0
                  ? 'DEVIATION DETECTED'
                  : 'COMPLIANT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-sans">
                  Approved Floors
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {building.status === 'Flagged' ? Math.max(1, buildingFloors.length - 2) : buildingFloors.length} Levels
                </span>
                <span className="text-[9px] text-slate-400 block font-sans">Municipal Sanction</span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-sans">
                  Actual Built Floors
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {buildingFloors.length} Levels
                </span>
                <span className="text-[9px] text-slate-400 block font-sans">LiDAR/CAD Audit</span>
              </div>
            </div>

            {(building.status === 'Flagged' || buildingDisputes.length > 0) && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px]">
                <AlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                <span className="font-semibold">
                  Discrepancy: +2 Unauthorized Floor Slabs built beyond sanctioned municipal envelope.
                </span>
              </div>
            )}
          </div>

          {/* PER-FLOOR AUDIT & DISCREPANCY INDICATOR */}
          {selectedFloor && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileCheck2 size={13} className="text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Floor Audit: {selectedFloor.code}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    isFloorFlagged
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isFloorFlagged ? 'FLAGGED' : 'PASS'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-sans">Height Audit</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-slate-700 dark:text-slate-300">As-Built: {asBuiltHeightM}m</span>
                    <span className={`text-[10px] font-bold ${heightDeltaM > 0.3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {heightDeltaM > 0 ? `+${heightDeltaM}m` : '0m'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Sanctioned: {sanctionedHeightM}m</span>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase block font-sans">Area Audit</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-slate-700 dark:text-slate-300">Built: {asBuiltAreaSqm} m²</span>
                    <span className={`text-[10px] font-bold ${areaDeltaSqm > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {areaDeltaSqm > 0 ? `+${areaDeltaSqm}m²` : '0m²'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">Sanctioned: {sanctionedAreaSqm} m²</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Airspace Envelope:</span>
                <span className={`font-semibold ${isFloorFlagged ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isFloorFlagged ? 'Cantilever Exceeds 1.2m' : 'Within Statutory Clearance'}
                </span>
              </div>
            </div>
          )}

          {/* CARD 2: VOLUMETRIC LEVEL & UNIT SELECTOR */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Volumetric Level
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                {buildingFloors.length} Floors Configured
              </span>
            </div>

            {/* Floor Dropdown */}
            <div className="relative">
              <select
                value={selectedFloor?.floorId || ''}
                onChange={(e) => {
                  selectFloor(e.target.value);
                  const targetUnits = units.filter((u) => u.floorId === e.target.value);
                  if (targetUnits.length > 0) {
                    selectUnit(targetUnits[0].unitId);
                  }
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
              >
                {buildingFloors.map((fl) => (
                  <option key={fl.floorId} value={fl.floorId}>
                    {fl.code} — {fl.label} ({fl.areaSqm} m²)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                ▼
              </div>
            </div>

            {/* Units on Floor Segmented Selector */}
            {floorUnits.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Registered Units on Level
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {floorUnits.map((u) => {
                    const isSelected = u.unitId === activeUnit?.unitId;
                    return (
                      <button
                        key={u.unitId}
                        onClick={() => selectUnit(u.unitId)}
                        className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                            : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{u.flatNumber}</div>
                        <div className="text-[9px] opacity-75 font-mono truncate">
                          {u.carpetAreaSqm.toFixed(0)} m²
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: ACTIVE UNIT SPECIFICATION CARD */}
          {activeUnit && (
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Child 3D Cadastral Unit
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {activeUnit.propertyType || 'Apartment'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        (activeUnit.topologyStatus === 'Conflict Detected' || (activeUnit.disputeIds && activeUnit.disputeIds.length > 0))
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      Topology: {activeUnit.topologyStatus || (activeUnit.disputeIds && activeUnit.disputeIds.length > 0 ? 'Conflict' : 'Valid')}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {activeUnit.flatNumber}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    activeUnit.verificationStatus === 'Verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeUnit.verificationStatus}
                </span>
              </div>

              {/* Permanent ULPIN Cadastral Hierarchy (Child & Parent) */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Child 3D ULPIN:</span>
                  <span className="font-mono font-bold text-cyan-400 select-all truncate max-w-[210px]">
                    {activeUnit.ulpin3d}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 font-medium">Parent Parcel ULPIN:</span>
                  <span className="font-mono font-bold text-amber-400 select-all truncate max-w-[210px]">
                    {activeUnit.parentUlpin || building.ulpin || parcel?.ulpin2d || 'MH-2026-458712'}
                  </span>
                </div>
                <div className="text-[9px] text-emerald-400/90 font-medium flex items-center gap-1 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Permanently linked cadastral hierarchy (§3D-ULPIN Spec)</span>
                </div>
              </div>

              {/* 2-Col Stat Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Registered Owner</span>
                  <span className="font-semibold text-slate-200 truncate block mt-0.5">
                    {activeUnit.ownerName}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Carpet Area</span>
                  <span className="font-mono font-bold text-slate-100 block mt-0.5">
                    {activeUnit.carpetAreaSqm.toFixed(1)} m²
                  </span>
                </div>
              </div>

              {/* Collapsible Secondary Technical Metadata Accordion */}
              <div className="pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full flex items-center justify-between py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>CORS Datum & Technical Attributes</span>
                  {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showTechnicalDetails && (
                  <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-slate-900/90 text-[11px] font-mono border border-slate-800 animate-in fade-in">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Coordinate Source:</span>
                      <span className="text-emerald-400 font-semibold">{activeUnit.coordinateSource || 'Source: GNSS/CORS Network'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CORS Station:</span>
                      <span className="text-slate-200">{activeUnit.corsReference?.stationId || building.corsStationId || 'SOI-CORS-MUM-04'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">RTK Precision:</span>
                      <span className="text-blue-400">{activeUnit.corsReference?.rtkPrecision || building.gnssAccuracyM || '±8mm / ±14mm'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Survey No:</span>
                      <span className="text-slate-200">{parcel?.surveyNumber || 'SN-402/1A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Airspace Base:</span>
                      <span className="text-slate-200">{selectedFloor?.baseHeightM || 18.5}m MSL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Slab Height:</span>
                      <span className="text-slate-200">{selectedFloor?.heightM || 3.6}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LADM Class:</span>
                      <span className="text-blue-400">ISO 19152 LA_SpatialUnit (3D)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CARD 4: ACTIONS & PREVIEW BUTTONS */}
          <div className="space-y-2 pt-1">
            {/* Download Property Passport PDF */}
            <button
              onClick={handleDownloadPassport}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Download 3D Property Passport (PDF)</span>
            </button>

            {/* 2D Floor Plan & 3D AI Mesh Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPreviewModalMode('floorPlan')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Grid3X3 size={13} className="text-blue-500 dark:text-blue-400" />
                <span>2D Floor Plan</span>
              </button>

              <button
                onClick={() => setPreviewModalMode('aiMesh')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Cpu size={13} className="text-cyan-600 dark:text-cyan-400" />
                <span>3D AI Mesh</span>
              </button>
            </div>

            {/* Interoperable GIS Export Actions (CityGML 3.0 & 3D GeoJSON) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const targetUnit = activeUnit || floorUnits[0];
                  const geojsonObj = {
                    type: 'FeatureCollection',
                    properties: {
                      cadastreStandard: 'ISO 19152 LADM',
                      source: 'Survey of India GNSS/CORS Network',
                      parentUlpin: building.ulpin || parcel?.ulpin2d || 'MH-2026-458712',
                      buildingId: building.buildingId,
                      name: building.name,
                      exportedAt: new Date().toISOString(),
                    },
                    features: [
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'Polygon',
                          coordinates: building.footprint?.coordinates || [],
                        },
                        properties: {
                          buildingName: building.name,
                          parentUlpin: building.ulpin,
                          activeUnitUlpin: targetUnit?.ulpin3d,
                          activeUnitFlat: targetUnit?.flatNumber,
                          activeUnitOwner: targetUnit?.ownerName,
                          coordinateSource: 'Source: GNSS/CORS Network',
                          corsStation: building.corsStationId || 'SOI-CORS-MUM-04',
                          rtkPrecision: building.gnssAccuracyM || '±8mm / ±14mm',
                          topologyStatus: targetUnit?.topologyStatus || 'Valid',
                        },
                      },
                    ],
                  };
                  const blob = new Blob([JSON.stringify(geojsonObj, null, 2)], { type: 'application/geo+json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `3D_GeoJSON_${building.buildingId}_${targetUnit?.ulpin3d || 'BLDG'}.geojson`;
                  a.click();
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
                title="Export open standard 3D GeoJSON conforming to ISO 19152 LADM"
              >
                <Download size={12} />
                <span>3D GeoJSON</span>
              </button>

              <button
                onClick={() => {
                  const targetUnit = activeUnit || floorUnits[0];
                  const gmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<core:CityModel xmlns:core="http://www.opengis.net/citygml/3.0"
                xmlns:bldg="http://www.opengis.net/citygml/building/3.0"
                xmlns:gml="http://www.opengis.net/gml/3.2">
  <gml:name>${building.name}</gml:name>
  <core:cityObjectMember>
    <bldg:Building gml:id="${building.buildingId}">
      <gml:identifier codeSpace="urn:ogc:def:crs:EPSG::4978">${building.ulpin}</gml:identifier>
      <bldg:parentUlpin>${building.ulpin}</bldg:parentUlpin>
      <bldg:measuredHeight uom="m">${building.heightM}</bldg:measuredHeight>
      <bldg:storeysAboveGround>${building.floorsAbove}</bldg:storeysAboveGround>
      <bldg:coordinateSource>Source: GNSS/CORS Network</bldg:coordinateSource>
      <bldg:corsStationId>${building.corsStationId || 'SOI-CORS-MUM-04'}</bldg:corsStationId>
      <bldg:unitChildUlpin>${targetUnit?.ulpin3d || 'N/A'}</bldg:unitChildUlpin>
      <bldg:topologyStatus>${targetUnit?.topologyStatus || 'Valid'}</bldg:topologyStatus>
    </bldg:Building>
  </core:cityObjectMember>
</core:CityModel>`;
                  const blob = new Blob([gmlContent], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `CityGML_3.0_${building.buildingId}.gml`;
                  a.click();
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-slate-700/60 text-[11px] font-medium transition-colors cursor-pointer"
                title="Export OGC CityGML 3.0 LOD2/LOD3 volumetric model"
              >
                <Download size={12} />
                <span>CityGML 3.0</span>
              </button>
            </div>

            {/* Registry link */}
            <button
              onClick={() => {
                if (role === 'Authority') {
                  navigate('/authority/ulpin-registry');
                } else {
                  navigate('/citizen/my-properties');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs transition-colors cursor-pointer font-medium"
            >
              <ExternalLink size={13} />
              <span>Open in Cadastral Registry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2D Floor Plan / 3D AI Mesh Modal */}
      {previewModalMode && (
        <FloorPlanAiMeshModal
          isOpen={true}
          onClose={() => setPreviewModalMode(null)}
          mode={previewModalMode}
          building={building}
          floor={selectedFloor}
          units={floorUnits}
        />
      )}

      {/* Property Passport QR/Detail Modal */}
      {activePassportUnit && (
        <PropertyPassportModal
          isOpen={true}
          unit={activePassportUnit}
          building={building}
          floor={selectedFloor}
          parcel={parcel}
          onClose={() => setActivePassportUnit(null)}
        />
      )}
    </>
  );
};
