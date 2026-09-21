import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useGlobeStore } from '../../stores/globeStore';
import { useThemeStore } from '../../stores/themeStore';
import { Building, Floor } from '../../domain/types';
import { CITIES } from '../../data/seed';
import { getBasemapLabelsForCity, BasemapFeatureLabel } from '../../data/basemapLabels';
import { generateCadastreForCoordinates } from '../../data/cadastreRegistryGenerator';
import {
  BKC_UTILITY_PIPELINES,
  BKC_UTILITY_JUNCTIONS,
  isPipelineConnectedToBuilding,
  UtilityType,
} from '../../data/utilityNetwork';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Navigation,
  X,
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Maximize2,
  Minimize2,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Color mapping by floor usage (§4, §6.3)
const USAGE_COLORS: Record<Floor['usage'], Cesium.Color> = {
  Parking: Cesium.Color.fromCssColorString('#64748B'),     // Slate
  Utility: Cesium.Color.fromCssColorString('#F59E0B'),     // Amber
  Retail: Cesium.Color.fromCssColorString('#10B981'),      // Emerald
  Office: Cesium.Color.fromCssColorString('#3B82F6'),      // Blue
  Amenity: Cesium.Color.fromCssColorString('#8B5CF6'),     // Violet
  Residential: Cesium.Color.fromCssColorString('#06B6D4'), // Cyan
};

// Height bracket color palette (Matching user reference Image 1 "Colors by height")
const getHeightColor = (heightM: number): Cesium.Color => {
  if (heightM <= 10) return Cesium.Color.fromCssColorString('#FDE68A'); // 0-10m light amber
  if (heightM <= 25) return Cesium.Color.fromCssColorString('#F59E0B'); // 10-25m amber
  if (heightM <= 50) return Cesium.Color.fromCssColorString('#10B981'); // 25-50m emerald
  if (heightM <= 100) return Cesium.Color.fromCssColorString('#06B6D4'); // 50-100m cyan
  if (heightM <= 200) return Cesium.Color.fromCssColorString('#3B82F6'); // 100-200m blue
  return Cesium.Color.fromCssColorString('#6366F1'); // >200m indigo
};

// Safe viewer and scene validation guard to prevent "Cannot read properties of undefined (reading 'scene')"
export const isViewerValid = (v: Cesium.Viewer | null | undefined): v is Cesium.Viewer => {
  if (!v) return false;
  try {
    return (
      !v.isDestroyed() &&
      Boolean((v as any)._cesiumWidget) &&
      !(v as any)._cesiumWidget.isDestroyed() &&
      Boolean((v as any)._cesiumWidget.scene)
    );
  } catch {
    return false;
  }
};

export const safeRequestRender = (v: Cesium.Viewer | null | undefined): void => {
  if (isViewerValid(v)) {
    try {
      v.scene?.requestRender();
    } catch {
      // Ignored if Cesium is actively destroying or re-rendering
    }
  }
};

interface CesiumViewerProps {
  onBuildingSelect?: (buildingId: string) => void;
  onFloorSelect?: (floorId: string) => void;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  onBuildingSelect,
  onFloorSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const parcelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const buildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const architecturalBuildingEntitiesRef = useRef<Cesium.Entity[]>([]);
  const utilityEntitiesRef = useRef<Cesium.Entity[]>([]);
  const floodEntityRef = useRef<Cesium.Entity | null>(null);
  const conflictEntitiesRef = useRef<Cesium.Entity[]>([]);
  const basemapLabelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const buildingLabelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const buildingLabelMapRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const basemapImageryLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const hoveredBuildingIdRef = useRef<string | null>(null);
  const orbitIntervalRef = useRef<number | null>(null);
  const externalMarkerEntityRef = useRef<Cesium.Entity | null>(null);
  const demDsmEntitiesRef = useRef<Cesium.Entity[]>([]);

  const [tilesetNotice, setTilesetNotice] = useState<string | null>(null);
  const [hoveredBuildingName, setHoveredBuildingName] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  const {
    buildings,
    floors,
    units,
    parcels,
    verticalParcels,
    selectedCityId,
    setSelectedCityId,
    selectedBuildingId,
    selectedFloorId,
    selectedUnitId,
    selectBuilding,
    selectFloor,
    selectUnit,
    targetCameraDestination,
    externalMarker,
  } = useCadastreStore();

  const {
    isExploded,
    explodedProgress,
    undergroundVisible,
    basementVisible,
    utilityPipesVisible,
    utilityWaterVisible,
    utilitySewerVisible,
    utilityGasVisible,
    utilityElectricVisible,
    utilityTelecomVisible,
    floorPlanActive,
    aiMeshActive,
    layerVisibility,
    floodActive,
    floodLevelM,
    demDsmActive,
    showTopologyConflicts,
    colorMode,
    setColorMode,
    renderMode,
    isOrbiting,
    toggleOrbiting,
    cameraAction,
    cameraActionCounter,
    setExplodedProgress,
  } = useGlobeStore();

  const { theme } = useThemeStore();
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Deep-link query param listener (?buildingId=...&unitId=...&floorId=...)
  useEffect(() => {
    const qBuildingId = searchParams.get('buildingId');
    const qUnitId = searchParams.get('unitId');
    const qFloorId = searchParams.get('floorId');

    if (qBuildingId && buildings.length > 0) {
      const targetB = buildings.find(
        (b) =>
          b.buildingId.toLowerCase() === qBuildingId.toLowerCase() ||
          b.name.toLowerCase().includes(qBuildingId.toLowerCase())
      );
      if (targetB) {
        // Resolve city
        const matchingParcel = parcels.find((p) => p.parcelId === targetB.parcelId);
        if (matchingParcel) {
          if (matchingParcel.city === 'MUM') setSelectedCityId('mumbai');
          else if (matchingParcel.city === 'PUN') setSelectedCityId('pune');
          else if (matchingParcel.city === 'DEL') setSelectedCityId('delhi');
          else if (matchingParcel.city === 'AMD') setSelectedCityId('ahmedabad');
        }
        selectBuilding(targetB.buildingId);
        if (qFloorId) selectFloor(qFloorId);
        if (qUnitId) selectUnit(qUnitId);
      }
    }
  }, [searchParams, buildings, parcels, selectBuilding, selectFloor, selectUnit, setSelectedCityId]);

  // 1. Initialize Cesium Viewer once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken;
    }

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });

      viewer.scene.globe.depthTestAgainstTerrain = false;

      // Adjust camera controller limits according to spec §6.2
      const controller = viewer.scene.screenSpaceCameraController;
      controller.enableZoom = true;
      controller.enableTilt = true;
      controller.enableRotate = true;
      controller.enableTranslate = true;
      controller.minimumZoomDistance = 30.0;
      controller.maximumZoomDistance = 20000000.0;
      controller.enableCollisionDetection = false;
      controller.inertiaZoom = 0.8;
      controller.inertiaSpin = 0.85;
      controller.zoomEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
      ];

      // Load base photogrammetry layer or fallback to OSM Buildings (§6.1)
      (async () => {
        const googleKey = import.meta.env.VITE_GOOGLE_3D_TILES_KEY;
        let loadedTileset: Cesium.Cesium3DTileset | null = null;
        if (googleKey) {
          try {
            loadedTileset = await Cesium.createGooglePhotorealistic3DTileset({ key: googleKey });
            if (isViewerValid(viewer)) {
              viewer.scene.primitives.add(loadedTileset);
            }
          } catch (e) {
            console.warn('Google 3D Tiles could not be loaded, falling back:', e);
          }
        }
        if (!loadedTileset) {
          try {
            loadedTileset = await Cesium.createOsmBuildingsAsync();
            if (isViewerValid(viewer)) {
              // Hide generic OSM buildings by default so raw approximate grey boxes do not overlap authoritative surveyed cadastre models
              loadedTileset.show = false;
              viewer.scene.primitives.add(loadedTileset);
            }
          } catch (e) {
            console.warn('OSM Buildings unavailable, running on 3D Cadastral Models:', e);
            setTilesetNotice('Photorealistic 3D Tiles unavailable — running on 3D Cadastral Models.');
          }
        }
        if (!isViewerValid(viewer)) return;
        tilesetRef.current = loadedTileset;

        // Add OpenStreetMap / CARTO Voyager street and place names reference layer to terrain/globe
        try {
          const labelProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c', 'd'],
            maximumLevel: 20,
            credit: '© OpenStreetMap contributors, © CARTO',
          });
          if (isViewerValid(viewer)) {
            const labelLayer = viewer.imageryLayers.addImageryProvider(labelProvider);
            labelLayer.alpha = 1.0;
            basemapImageryLayerRef.current = labelLayer;
          }
        } catch (e) {
          console.warn('Basemap reference layer could not be initialized:', e);
        }

        // Fallback: ensure satellite imagery base exists on the globe if not present
        try {
          if (isViewerValid(viewer) && viewer.imageryLayers.length <= 1) {
            const worldImagery = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
              { enablePickFeatures: false }
            );
            if (isViewerValid(viewer)) {
              viewer.imageryLayers.addImageryProvider(worldImagery, 0);
            }
          }
        } catch (e) {
          console.warn('World base imagery fallback notice:', e);
        }

        safeRequestRender(viewer);
      })();

      // Click / Pick Handler for Units, Floors, and Buildings (with drill-picking support §6.2)
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      // Helper to extract properties from picked Cesium Entity, PropertyBag, or ID string
      const getPickedEntityProperty = (entity: any, propName: string): any => {
        if (!entity) return undefined;
        if (typeof entity.id === 'string') {
          if (propName === 'buildingId' && entity.id.startsWith('bldg-')) {
            return entity.id.replace(/^bldg-(?:selected-)?/, '');
          }
          if (propName === 'floorId' && entity.id.startsWith('floor-')) {
            return entity.id.replace('floor-', '');
          }
          if (propName === 'unitId' && entity.id.startsWith('unit-')) {
            return entity.id.replace('unit-', '');
          }
        }
        const props = entity.properties;
        if (!props) return undefined;
        const val = props[propName];
        if (val !== undefined) {
          if (typeof val?.getValue === 'function') {
            return val.getValue(Cesium.JulianDate.now()) ?? val.getValue();
          }
          return val;
        }
        if (typeof props.getValue === 'function') {
          const bag = props.getValue(Cesium.JulianDate.now()) ?? props.getValue();
          if (bag && bag[propName] !== undefined) return bag[propName];
        }
        return undefined;
      };

      // Mathematical point-to-polygon test using ray-casting (Jordan curve) & minimum boundary segment distance
      const computePointFootprintDistance = (
        clickLng: number,
        clickLat: number,
        polygonCoords: number[][]
      ): { isInside: boolean; distM: number } => {
        if (!polygonCoords || polygonCoords.length < 3) {
          return { isInside: false, distM: Infinity };
        }
        const pts =
          polygonCoords.length > 3 &&
          polygonCoords[0][0] === polygonCoords[polygonCoords.length - 1][0] &&
          polygonCoords[0][1] === polygonCoords[polygonCoords.length - 1][1]
            ? polygonCoords.slice(0, -1)
            : polygonCoords;

        // 1. Point in polygon test (Ray-casting)
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i][0], yi = pts[i][1];
          const xj = pts[j][0], yj = pts[j][1];
          const intersect =
            ((yi > clickLat) !== (yj > clickLat)) &&
            (clickLng < ((xj - xi) * (clickLat - yi)) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) {
          return { isInside: true, distM: 0 };
        }

        // 2. Minimum metric distance to any polygon perimeter edge segment
        const cosLat = Math.cos((clickLat * Math.PI) / 180);
        let minDistance = Infinity;

        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];

          const x1 = (p1[0] - clickLng) * 111320 * cosLat;
          const y1 = (p1[1] - clickLat) * 110540;
          const x2 = (p2[0] - clickLng) * 111320 * cosLat;
          const y2 = (p2[1] - clickLat) * 110540;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const lenSq = dx * dx + dy * dy;
          let t = 0;
          if (lenSq > 0.0001) {
            t = Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / lenSq));
          }
          const projX = x1 + t * dx;
          const projY = y1 + t * dy;
          const dist = Math.hypot(projX, projY);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }

        return { isInside: false, distM: minDistance };
      };

      handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
        if (!isViewerValid(viewer)) return;
        const picked = viewer.scene.pick(movement.position);
        let targetEntity = picked?.id;

        // If the pick ray hits the base photogrammetry mesh or tileset, drill-pick to find overlay building entity (§6.2.1)
        if (!targetEntity || !getPickedEntityProperty(targetEntity, 'buildingId')) {
          const drilled = viewer.scene.drillPick(movement.position, 8);
          for (const obj of drilled) {
            if (obj?.id && getPickedEntityProperty(obj.id, 'buildingId')) {
              targetEntity = obj.id;
              break;
            }
          }
        }

        if (targetEntity) {
          const uId = getPickedEntityProperty(targetEntity, 'unitId');
          const fId = getPickedEntityProperty(targetEntity, 'floorId');
          const bId = getPickedEntityProperty(targetEntity, 'buildingId');

          if (uId) {
            selectUnit(uId);
            if (fId) selectFloor(fId);
            if (bId) selectBuilding(bId);
            safeRequestRender(viewer);
            return;
          } else if (fId) {
            selectFloor(fId);
            if (bId) selectBuilding(bId);
            if (onFloorSelect) onFloorSelect(fId);
            safeRequestRender(viewer);
            return;
          } else if (bId) {
            selectBuilding(bId);
            if (onBuildingSelect) onBuildingSelect(bId);
            safeRequestRender(viewer);
            return;
          }
        }

        // If not directly on a pre-existing entity, resolve 3D ground/feature position
        let cartesian = viewer.scene.pickPosition(movement.position);
        if (!cartesian) {
          const ray = viewer.camera.getPickRay(movement.position);
          if (ray) {
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          }
        }
        if (!cartesian) {
          cartesian = viewer.camera.pickEllipsoid(movement.position);
        }

        if (cartesian) {
          const carto = Cesium.Cartographic.fromCartesian(cartesian);
          const clickLng = Cesium.Math.toDegrees(carto.longitude);
          const clickLat = Cesium.Math.toDegrees(carto.latitude);
          const clickHeight = carto.height;

          // Check if user clicked inside or directly on the footprint perimeter of any registered building
          const allBuildings = useCadastreStore.getState().buildings;
          let matchedBuilding: Building | null = null;
          let closestEdgeDistM = Infinity;

          for (const b of allBuildings) {
            const coords = b.footprint.coordinates[0];
            if (!coords || coords.length < 3) continue;

            const res = computePointFootprintDistance(clickLng, clickLat, coords);
            if (res.isInside) {
              // Exact hit inside building footprint polygon!
              matchedBuilding = b;
              closestEdgeDistM = 0;
              break;
            } else if (res.distM < closestEdgeDistM) {
              closestEdgeDistM = res.distM;
              matchedBuilding = b;
            }
          }

          // If clicked inside polygon OR within 22 meters of the outer facade/perimeter
          if (matchedBuilding && (closestEdgeDistM === 0 || closestEdgeDistM <= 22)) {
            selectBuilding(matchedBuilding.buildingId);
            if (onBuildingSelect) onBuildingSelect(matchedBuilding.buildingId);
            safeRequestRender(viewer);
            return;
          }

          // If clicking on ANY other building in 3D Tiles/Photogrammetry,
          // extract feature properties if available (OSM name, levels, height)
          let featureName: string | undefined;
          let featureLevels: number | undefined;
          let featureHeight: number | undefined;
          let featureAddress: string | undefined;

          if (picked && typeof (picked as any).getProperty === 'function') {
            try {
              featureName = (picked as any).getProperty('name') || (picked as any).getProperty('addr:housename') || undefined;
              const lvl = (picked as any).getProperty('building:levels');
              if (lvl) featureLevels = parseInt(lvl, 10);
              const h = (picked as any).getProperty('height');
              if (h) featureHeight = parseFloat(h);
              const street = (picked as any).getProperty('addr:street');
              if (street) featureAddress = street;
            } catch {
              // ignore
            }
          }

          // Generate authentic BMC / DILRMP / ULPIN / BhuNaksha / SVAMITVA 3D Cadastre
          const dynamicCadastre = generateCadastreForCoordinates(clickLng, clickLat, {
            name: featureName,
            levels: featureLevels,
            height: featureHeight || (clickHeight > 8 && clickHeight < 250 ? Math.round(clickHeight) : undefined),
            address: featureAddress,
          });

          useCadastreStore.getState().addDynamicBuilding(dynamicCadastre);
          if (onBuildingSelect) onBuildingSelect(dynamicCadastre.building.buildingId);
          safeRequestRender(viewer);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Hover handler (with drill-picking and robust property extraction)
      handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
        if (!isViewerValid(viewer)) return;
        const picked = viewer.scene.pick(movement.endPosition);
        let targetEntity = picked?.id;

        if (!targetEntity || !getPickedEntityProperty(targetEntity, 'buildingId')) {
          const drilled = viewer.scene.drillPick(movement.endPosition, 4);
          for (const obj of drilled) {
            if (obj?.id && getPickedEntityProperty(obj.id, 'buildingId')) {
              targetEntity = obj.id;
              break;
            }
          }
        }

        const bId = getPickedEntityProperty(targetEntity, 'buildingId');

        // Dynamically brighten building label on hover and restore previous
        if (bId !== hoveredBuildingIdRef.current) {
          const prevId = hoveredBuildingIdRef.current;
          hoveredBuildingIdRef.current = bId || null;
          const activeSelId = useCadastreStore.getState().selectedBuildingId;

          if (prevId && prevId !== activeSelId) {
            const prevEntity = buildingLabelMapRef.current.get(prevId);
            const prevB = useCadastreStore.getState().buildings.find((item) => item.buildingId === prevId);
            if (prevEntity && prevEntity.label && prevB) {
              prevEntity.label.text = new Cesium.ConstantProperty(prevB.name) as any;
              prevEntity.label.font = new Cesium.ConstantProperty("500 11px 'Plus Jakarta Sans', system-ui, sans-serif") as any;
              prevEntity.label.fillColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#F8FAFC')) as any;
              prevEntity.label.backgroundColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.72)')) as any;
              prevEntity.label.scale = new Cesium.ConstantProperty(1.0) as any;
            }
          }

          if (bId && bId !== activeSelId) {
            const newEntity = buildingLabelMapRef.current.get(bId);
            const newB = useCadastreStore.getState().buildings.find((item) => item.buildingId === bId);
            if (newEntity && newEntity.label && newB) {
              newEntity.label.text = new Cesium.ConstantProperty(`${newB.name} (${newB.heightM}m)`) as any;
              newEntity.label.font = new Cesium.ConstantProperty("bold 12px 'Plus Jakarta Sans', system-ui, sans-serif") as any;
              newEntity.label.fillColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#FDE047')) as any;
              newEntity.label.backgroundColor = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.95)')) as any;
              newEntity.label.scale = new Cesium.ConstantProperty(1.1) as any;
            }
          }
          safeRequestRender(viewer);
        }

        if (targetEntity && targetEntity.properties) {
          const uName = targetEntity.properties.flatNumber?.getValue?.();
          const uOwner = targetEntity.properties.ownerName?.getValue?.();
          const uArea = targetEntity.properties.carpetArea?.getValue?.();
          const floorLabel = targetEntity.properties.floorLabel?.getValue?.();
          const name = targetEntity.properties.name?.getValue?.();
          const b = useCadastreStore.getState().buildings.find((item) => item.buildingId === bId);
          const heightStr = b ? ` · ${b.heightM}m` : '';

          if (uName) {
            setHoveredBuildingName(`${uName} (${uArea ? `${uArea}m²` : ''}) · ${uOwner || 'Registered Unit'}`);
          } else if (floorLabel) {
            setHoveredBuildingName(floorLabel);
          } else {
            setHoveredBuildingName(`${name || b?.name || 'Building'}${heightStr}`);
          }
        } else if (picked && typeof (picked as any).getProperty === 'function') {
          try {
            const osmName = (picked as any).getProperty('name') || (picked as any).getProperty('addr:housename');
            if (osmName) {
              setHoveredBuildingName(`${osmName} · Click to generate 3D Cadastre & ULPIN`);
            } else {
              setHoveredBuildingName('3D Building · Click to inspect BMC / DILRMP 3D Cadastre');
            }
          } catch {
            setHoveredBuildingName(null);
          }
        } else {
          setHoveredBuildingName(null);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      viewerRef.current = viewer;

      // Initial Fly to active city
      const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(city.center[0], city.center[1], 850),
        orientation: {
          heading: Cesium.Math.toRadians(20.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0,
        },
        duration: 1.5,
        complete: () => {
          if (isViewerValid(viewer)) {
            safeRequestRender(viewer);
          }
        },
      });

      safeRequestRender(viewer);
    } catch (err) {
      console.error('Cesium initialization error:', err);
    }

    return () => {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
      basemapLabelEntitiesRef.current = [];
      buildingLabelEntitiesRef.current = [];
      buildingLabelMapRef.current.clear();
      basemapImageryLayerRef.current = null;
      tilesetRef.current = null;
      if (viewerRef.current) {
        try {
          if (!viewerRef.current.isDestroyed()) {
            viewerRef.current.destroy();
          }
        } catch (e) {
          console.warn('Error during Cesium viewer destruction:', e);
        }
        viewerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // 2. Sync Theme with Cesium
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    viewer.scene.backgroundColor =
      theme === 'dark'
        ? Cesium.Color.fromCssColorString('#0B1220')
        : Cesium.Color.fromCssColorString('#F8FAFC');

    safeRequestRender(viewer);
  }, [theme]);

  // 3. Camera Fly-To when Selected City changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    const city = CITIES.find((c) => c.id === selectedCityId);
    if (!city) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(city.center[0], city.center[1], 850),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0,
      },
      duration: 1.8,
      complete: () => {
        if (isViewerValid(viewer) && viewer.scene?.screenSpaceCameraController) {
          viewer.scene.screenSpaceCameraController.enableInputs = true;
        }
      },
    });
  }, [selectedCityId]);

  // 4. Render 2D Cadastral Parcels
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    parcelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    parcelEntitiesRef.current = [];

    if (!layerVisibility.parcel) {
      safeRequestRender(viewer);
      return;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId);
    const cityParcels = parcels.filter((p) => activeCity && p.city === activeCity.code);

    cityParcels.forEach((p) => {
      const coords = p.geometry.coordinates[0];
      const flatCoords: number[] = [];
      coords.forEach((pt) => flatCoords.push(pt[0], pt[1]));

      const isSelected = p.parcelId === selectedBuildingId;

      const entity = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0.2,
          material: Cesium.Color.fromCssColorString('#3B82F6').withAlpha(0.08),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#60A5FA').withAlpha(0.45),
          outlineWidth: 1.5,
        },
        properties: {
          parcelId: p.parcelId,
          surveyNumber: p.surveyNumber,
          ulpin2d: p.ulpin2d,
          areaSqm: p.areaSqm,
          landUse: p.landUse,
        },
      });

      parcelEntitiesRef.current.push(entity);
    });

    safeRequestRender(viewer);
  }, [parcels, selectedCityId, layerVisibility.parcel]);

  // 5. Render Background Buildings (Non-Selected)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    buildingEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    buildingEntitiesRef.current = [];

    if (!layerVisibility.building) {
      safeRequestRender(viewer);
      return;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId);
    const cityBuildings = buildings.filter((b) => {
      const p = parcels.find((parcel) => parcel.parcelId === b.parcelId);
      return p && activeCity && p.city === activeCity.code;
    });

    cityBuildings.forEach((b) => {
      // The selected building is rendered in rich detail via the architectural building effect below!
      if (b.buildingId === selectedBuildingId) {
        return;
      }

      const coords = b.footprint.coordinates[0];
      const flatCoords: number[] = [];
      coords.forEach((pt) => flatCoords.push(pt[0], pt[1]));

      const isFlagged = b.status === 'Flagged';

      let fillColor: Cesium.Color;
      let outlineColor: Cesium.Color;

      if (isFlagged) {
        fillColor = Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.60);
        outlineColor = Cesium.Color.fromCssColorString('#DC2626');
      } else if (renderMode === 'wireframe') {
        fillColor = Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.03);
        outlineColor = Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.98);
      } else if (renderMode === 'blueprint') {
        fillColor = Cesium.Color.fromCssColorString('#0A2540').withAlpha(0.92);
        outlineColor = Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.98);
      } else if (colorMode === 'height') {
        fillColor = getHeightColor(b.heightM).withAlpha(0.70);
        outlineColor = getHeightColor(b.heightM);
      } else {
        // Realistic Mode: High-grade architectural facade tone matching real metropolitan skyline
        fillColor = theme === 'dark'
          ? Cesium.Color.fromCssColorString('#1E293B').withAlpha(0.88)
          : Cesium.Color.fromCssColorString('#CBD5E1').withAlpha(0.88);
        outlineColor = theme === 'dark'
          ? Cesium.Color.fromCssColorString('#475569').withAlpha(0.95)
          : Cesium.Color.fromCssColorString('#64748B').withAlpha(0.95);
      }

      const entity = viewer.entities.add({
        id: `bldg-${b.buildingId}`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0,
          extrudedHeight: b.heightM,
          material: fillColor,
          outline: true,
          outlineColor: outlineColor,
          outlineWidth: renderMode === 'wireframe' ? 3.0 : renderMode === 'blueprint' ? 2.2 : 1.5,
        },
        properties: {
          buildingId: b.buildingId,
          name: b.name,
          parcelId: b.parcelId,
          floors: b.floorsAbove,
          approvedFloors: b.approvedFloors,
          heightM: b.heightM,
        },
      });
      buildingEntitiesRef.current.push(entity);

      // Ensure closed loop for perimeter lines
      const closedCoords =
        coords.length > 2 &&
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
          ? coords
          : [...coords, coords[0]];

      // Crisp Rooftop Perimeter Outline (Guarantees visible distinct shape from top-down & perspective views)
      const roofPositions = Cesium.Cartesian3.fromDegreesArrayHeights(
        closedCoords.map(([lng, lat]) => [lng, lat, b.heightM + 0.3]).flat()
      );
      const roofEdge = viewer.entities.add({
        polyline: {
          positions: roofPositions,
          width: renderMode === 'wireframe' ? 2.8 : 2.2,
          material: outlineColor,
        },
        properties: {
          buildingId: b.buildingId,
          name: b.name,
        },
      });
      buildingEntitiesRef.current.push(roofEdge);

      // Vertical Facade Corner Edges on every vertex
      coords.slice(0, -1).forEach(([cLng, cLat]) => {
        const cornerLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              cLng, cLat, 0.2,
              cLng, cLat, b.heightM + 0.3,
            ]),
            width: 1.2,
            material: outlineColor.withAlpha(0.65),
          },
          properties: {
            buildingId: b.buildingId,
            name: b.name,
          },
        });
        buildingEntitiesRef.current.push(cornerLine);
      });

      // Ground Base Footprint Perimeter
      const groundPositions = Cesium.Cartesian3.fromDegreesArrayHeights(
        closedCoords.map(([lng, lat]) => [lng, lat, 0.3]).flat()
      );
      const groundEdge = viewer.entities.add({
        polyline: {
          positions: groundPositions,
          width: 1.8,
          material: outlineColor.withAlpha(0.70),
        },
        properties: {
          buildingId: b.buildingId,
          name: b.name,
        },
      });
      buildingEntitiesRef.current.push(groundEdge);
    });

    safeRequestRender(viewer);
  }, [buildings, parcels, selectedCityId, selectedBuildingId, layerVisibility.building, colorMode, renderMode]);

  // Helper function to calculate geometric centroid for rooftop label placement
  const computePolygonCentroid = (coords: number[][]): [number, number] => {
    if (!coords || coords.length === 0) return [0, 0];
    let sumLng = 0;
    let sumLat = 0;
    const pts =
      coords.length > 3 &&
      coords[0][0] === coords[coords.length - 1][0] &&
      coords[0][1] === coords[coords.length - 1][1]
        ? coords.slice(0, -1)
        : coords;
    pts.forEach(([lng, lat]) => {
      sumLng += lng;
      sumLat += lat;
    });
    return [sumLng / pts.length, sumLat / pts.length];
  };

  // 5B. RENDER 3D BASEMAP REFERENCE LABELS (Roads, Localities, Highways, Landmarks)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    // Clear previous basemap label entities
    basemapLabelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    basemapLabelEntitiesRef.current = [];

    if (!layerVisibility.basemapLabels) {
      if (basemapImageryLayerRef.current) basemapImageryLayerRef.current.show = false;
      safeRequestRender(viewer);
      return;
    }

    if (basemapImageryLayerRef.current) {
      basemapImageryLayerRef.current.show = true;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId);
    const featureLabels = getBasemapLabelsForCity(activeCity?.code);

    featureLabels.forEach((feat) => {
      const isLocality = feat.type === 'locality';
      const isHighway = feat.type === 'highway';
      const isRoad = feat.type === 'road';
      const isLandmark = feat.type === 'landmark' || feat.type === 'transit';

      // Typography & styling matching Google Maps reference
      let font = "500 11px 'Plus Jakarta Sans', system-ui, sans-serif";
      let fillColor = Cesium.Color.fromCssColorString('#F1F5F9');
      let outlineColor = Cesium.Color.fromCssColorString('#020617');
      let outlineWidth = 3.2;
      let bgColor = Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.72)');
      let bgPadding = new Cesium.Cartesian2(6, 3);
      let nearDist = feat.nearDistance || 30.0;
      let farDist = feat.farDistance || 10000.0;

      if (isLocality) {
        font =
          feat.priority === 1
            ? "bold 13px 'Plus Jakarta Sans', system-ui, sans-serif"
            : "600 12px 'Plus Jakarta Sans', system-ui, sans-serif";
        fillColor = Cesium.Color.WHITE;
        outlineWidth = 4.0;
        bgColor = Cesium.Color.fromCssColorString('rgba(2, 6, 23, 0.80)');
        bgPadding = new Cesium.Cartesian2(8, 4);
      } else if (isHighway) {
        font = "bold 11px 'Plus Jakarta Sans', system-ui, sans-serif";
        fillColor = Cesium.Color.fromCssColorString('#FEF08A'); // Highway Yellow
        outlineWidth = 3.5;
        bgColor = Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.85)');
      } else if (isRoad) {
        font = "500 11px 'Plus Jakarta Sans', system-ui, sans-serif";
        fillColor = Cesium.Color.fromCssColorString('#E2E8F0');
        outlineWidth = 3.0;
        bgColor = Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.70)');
      } else if (isLandmark) {
        font = "600 11px 'Plus Jakarta Sans', system-ui, sans-serif";
        fillColor = Cesium.Color.fromCssColorString('#93C5FD'); // Sky blue POI
        outlineWidth = 3.5;
        bgColor = Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.85)');
      }

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          feat.coordinates[0],
          feat.coordinates[1],
          (feat.elevation ?? 15) + 4
        ),
        label: {
          text: feat.name,
          font: font,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: fillColor,
          outlineColor: outlineColor,
          outlineWidth: outlineWidth,
          showBackground: true,
          backgroundColor: bgColor,
          backgroundPadding: bgPadding,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(nearDist, farDist),
          scaleByDistance: new Cesium.NearFarScalar(400.0, 1.0, 30000.0, 0.75),
          translucencyByDistance: new Cesium.NearFarScalar(nearDist, 1.0, farDist * 0.95, 0.55),
        },
        properties: {
          isBasemapFeature: true,
          featureType: feat.type,
          name: feat.name,
        },
      });

      basemapLabelEntitiesRef.current.push(entity);
    });

    safeRequestRender(viewer);
  }, [selectedCityId, layerVisibility.basemapLabels]);

  // 5C. RENDER 3D BUILDING NAME LABELS — ALWAYS ON, NOT JUST ON CLICK
  // Features rooftop positioning at centroid, altitude-based decluttering, bright hover, and pinned selected styling
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    // Clear previous building label entities
    buildingLabelEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    buildingLabelEntitiesRef.current = [];
    buildingLabelMapRef.current.clear();

    if (!layerVisibility.buildingLabels) {
      safeRequestRender(viewer);
      return;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId);
    const cityBuildings = buildings.filter((b) => {
      const p = parcels.find((parcel) => parcel.parcelId === b.parcelId);
      return p && activeCity && p.city === activeCity.code;
    });

    cityBuildings.forEach((b) => {
      const coords = b.footprint.coordinates[0];
      if (!coords || coords.length < 3) return;

      const [cLng, cLat] = computePolygonCentroid(coords);
      const roofAltitude = b.baseElevationM + b.heightM + 5.0; // 5 meters above rooftop

      const isSelected = b.buildingId === selectedBuildingId;
      const isHero = b.buildingId === 'B04' || b.heightM >= 70;
      const isMidRise = b.heightM >= 35 && b.heightM < 70;

      // Ranking & Decluttering Distance Display Condition:
      // - Selected building: pinned and visible up to 25km (regional view)
      // - Hero/Tall towers (>=70m): visible up to 5.5km
      // - Mid-rise (35m-70m): visible up to 2.8km
      // - Standard/low buildings (<35m): thins out above 1.4km to avoid clutter
      let distanceCondition: Cesium.DistanceDisplayCondition;
      if (isSelected) {
        distanceCondition = new Cesium.DistanceDisplayCondition(0.0, 25000.0);
      } else if (isHero) {
        distanceCondition = new Cesium.DistanceDisplayCondition(20.0, 5500.0);
      } else if (isMidRise) {
        distanceCondition = new Cesium.DistanceDisplayCondition(20.0, 2800.0);
      } else {
        distanceCondition = new Cesium.DistanceDisplayCondition(20.0, 1400.0);
      }

      let text = b.name;
      let font = "500 11px 'Plus Jakarta Sans', system-ui, sans-serif";
      let fillColor = Cesium.Color.fromCssColorString('#F8FAFC');
      let outlineColor = Cesium.Color.fromCssColorString('#0F172A');
      let outlineWidth = 3.2;
      let bgColor = Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.72)');
      let bgPadding = new Cesium.Cartesian2(6, 3);
      let scaleByDist = new Cesium.NearFarScalar(200.0, 1.0, 2500.0, 0.72);
      let transByDist = new Cesium.NearFarScalar(200.0, 1.0, 2400.0, 0.45);

      if (isSelected) {
        text = `📍 ${b.name}`;
        font = "bold 13px 'Plus Jakarta Sans', system-ui, sans-serif";
        fillColor = Cesium.Color.WHITE;
        outlineColor = Cesium.Color.fromCssColorString('#881337');
        outlineWidth = 3.5;
        bgColor = Cesium.Color.fromCssColorString('rgba(225, 29, 72, 0.96)'); // Vibrant Rose Pink badge
        bgPadding = new Cesium.Cartesian2(10, 5);
        scaleByDist = new Cesium.NearFarScalar(200.0, 1.25, 5000.0, 0.90);
        transByDist = new Cesium.NearFarScalar(200.0, 1.0, 24000.0, 0.95);
      }

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cLng, cLat, roofAltitude),
        label: {
          text: text,
          font: font,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: fillColor,
          outlineColor: outlineColor,
          outlineWidth: outlineWidth,
          showBackground: true,
          backgroundColor: bgColor,
          backgroundPadding: bgPadding,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: distanceCondition,
          scaleByDistance: scaleByDist,
          translucencyByDistance: transByDist,
        },
        ...(isSelected
          ? {
              point: {
                pixelSize: 10,
                color: Cesium.Color.fromCssColorString('#F43F5E'),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            }
          : {}),
        properties: {
          buildingId: b.buildingId,
          name: b.name,
          isBuildingLabel: true,
          heightM: b.heightM,
        },
      });

      buildingLabelEntitiesRef.current.push(entity);
      buildingLabelMapRef.current.set(b.buildingId, entity);
    });

    safeRequestRender(viewer);
  }, [buildings, parcels, selectedCityId, selectedBuildingId, layerVisibility.buildingLabels]);

  // 6. RENDER ARCHITECTURAL 3D BUILDING WITH FLOOR SLABS & VOLUMETRIC UNITS (As in User Reference Image)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    // Clear previous architectural entities
    architecturalBuildingEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    architecturalBuildingEntitiesRef.current = [];

    if (!selectedBuildingId || !layerVisibility.building) {
      safeRequestRender(viewer);
      return;
    }

    const b = buildings.find((item) => item.buildingId === selectedBuildingId);
    if (!b) return;

    const coords = b.footprint.coordinates[0];
    const flatCoords: number[] = [];
    coords.forEach((pt) => flatCoords.push(pt[0], pt[1]));

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coords.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;

    // Fetch floors for selected building
    const bFloors = floors.filter((f) => f.buildingId === selectedBuildingId);
    const avgFloorHeight = 3.6;
    const gapM = isExploded ? 1.6 * avgFloorHeight * explodedProgress : 0;

    // --- NORMAL GOOGLE MAPS 3D BUILDING VIEW (When not in Exploded Mode) ---
    // Renders the building in its authentic, normal architectural volume with a distinct emissive highlight outline
    if (!isExploded) {
      // 1. Solid Normal 3D Building Entity (Clean architectural geometry as in Google Maps 3D)
      let buildingMaterial: Cesium.Color;
      let buildingOutline: Cesium.Color = Cesium.Color.fromCssColorString('#FDA4AF');
      if (b.status === 'Flagged') {
        buildingMaterial = Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.75);
        buildingOutline = Cesium.Color.fromCssColorString('#DC2626');
      } else if (renderMode === 'wireframe') {
        // High-contrast luminous cyan wireframe cage
        buildingMaterial = Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.05);
        buildingOutline = Cesium.Color.fromCssColorString('#00F0FF');
      } else if (renderMode === 'blueprint') {
        // Authentic CAD cyanotype blueprint style
        buildingMaterial = Cesium.Color.fromCssColorString('#0A2540').withAlpha(0.88);
        buildingOutline = Cesium.Color.fromCssColorString('#38BDF8');
      } else if (colorMode === 'height') {
        buildingMaterial = getHeightColor(b.heightM).withAlpha(0.85);
        buildingOutline = getHeightColor(b.heightM);
      } else {
        // Selected Building Highlight: Guaranteed Vibrant Rose/Pink Mesh matching UI Selection
        buildingMaterial = Cesium.Color.fromCssColorString('#F43F5E').withAlpha(0.82);
        buildingOutline = Cesium.Color.fromCssColorString('#FDA4AF');
      }

      const solidBuilding = viewer.entities.add({
        id: `bldg-selected-${b.buildingId}`,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: 0,
          extrudedHeight: b.heightM,
          material: buildingMaterial,
          outline: true,
          outlineColor: buildingOutline,
          outlineWidth: renderMode === 'wireframe' ? 3.5 : 2.8,
        },
        properties: {
          buildingId: b.buildingId,
          name: b.name,
          parcelId: b.parcelId,
          floors: b.floorsAbove,
          approvedFloors: b.approvedFloors,
          heightM: b.heightM,
        },
      });
      architecturalBuildingEntitiesRef.current.push(solidBuilding);

      // 2. Distinct Emissive Roof Outline (Vibrant Glowing Edge around Roof Perimeter)
      const roofEmissiveOutline = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(
            coords.map((pt) => [pt[0], pt[1], b.heightM + 0.3]).flat()
          ),
          width: 4.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.35,
            taperPower: 0.85,
            color: Cesium.Color.fromCssColorString('#FB7185'),
          }),
        },
      });
      architecturalBuildingEntitiesRef.current.push(roofEmissiveOutline);

      // 3. Distinct Emissive Ground Base Outline (Flush to satellite surface)
      const groundEmissiveOutline = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(
            coords.map((pt) => [pt[0], pt[1], 0.3]).flat()
          ),
          width: 3.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            taperPower: 0.9,
            color: Cesium.Color.fromCssColorString('#F43F5E'),
          }),
        },
      });
      architecturalBuildingEntitiesRef.current.push(groundEmissiveOutline);

      // 4. Vertical Corner Accent Lines (Highlights building volumetric profile)
      coords.slice(0, -1).forEach(([cLng, cLat]) => {
        const cornerLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              cLng, cLat, 0.2,
              cLng, cLat, b.heightM + 0.2,
            ]),
            width: 2.2,
            material: Cesium.Color.fromCssColorString('#FDA4AF').withAlpha(0.95),
          },
        });
        architecturalBuildingEntitiesRef.current.push(cornerLine);
      });

      // 5. Rooftop Parapet / Crown Slab
      const roofCrown = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: b.heightM,
          extrudedHeight: b.heightM + 0.7,
          material: Cesium.Color.fromCssColorString('#9F1239').withAlpha(0.92),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#FDA4AF'),
          outlineWidth: 2.0,
        },
        properties: {
          buildingId: b.buildingId,
          name: `${b.name} (Rooftop Deck)`,
        },
      });
      architecturalBuildingEntitiesRef.current.push(roofCrown);

      // 6. Highlight active floor band on the normal building when selected
      if (selectedFloorId) {
        const activeFl = bFloors.find((f) => f.floorId === selectedFloorId);
        if (activeFl) {
          const flBase = activeFl.baseHeightM;
          const selectedFloorBand = viewer.entities.add({
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              height: flBase,
              extrudedHeight: flBase + activeFl.heightM,
              material: Cesium.Color.fromCssColorString('#2563EB').withAlpha(0.68),
              outline: true,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2.5,
            },
            properties: {
              floorId: activeFl.floorId,
              buildingId: b.buildingId,
              floorLabel: `${activeFl.label} (${activeFl.code})`,
              usage: activeFl.usage,
            },
          });
          architecturalBuildingEntitiesRef.current.push(selectedFloorBand);
        }
      }

      // 7. Render 3D Air-Rights Volumetric Parcel Sky Corridor Envelope (Fix #29)
      const airRightsUnit = units.find((u) => u.propertyType === 'Air-Rights' && u.floorId.includes(b.buildingId));
      if (airRightsUnit || bFloors.some((f) => f.code === 'RF')) {
        const airBase = b.heightM + 1.2;
        const airTop = b.heightM + 26.0;
        const airRightsEntity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: airBase,
            extrudedHeight: airTop,
            material: Cesium.Color.fromCssColorString('#06B6D4').withAlpha(0.24),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#22D3EE').withAlpha(0.95),
            outlineWidth: 2.5,
          },
          properties: {
            buildingId: b.buildingId,
            unitId: airRightsUnit?.unitId || 'U-AIR01',
            ulpin3d: airRightsUnit?.ulpin3d || 'MH-2026-458712-RF-AIR01',
            name: '3D Air-Rights Sky Corridor (TDR Volumetric Parcel)',
            isAirRights: true,
          },
        });
        architecturalBuildingEntitiesRef.current.push(airRightsEntity);
      }

      viewer.scene.requestRender();
      return;
    }

    // --- EXPLODED VIEW (Only active when isExploded === true) ---
    // A. Ground Highlight Ring around building
    const groundHighlight = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(
          coords.map((pt) => [pt[0], pt[1], 0.4]).flat()
        ),
        width: 3.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#38BDF8'),
        }),
      },
    });
    architecturalBuildingEntitiesRef.current.push(groundHighlight);

    // B. Outer Corner Structural Columns
    coords.slice(0, 4).forEach(([cLng, cLat]) => {
      const colLine = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            cLng, cLat, 0,
            cLng, cLat, b.heightM + (isExploded ? bFloors.length * gapM : 0),
          ]),
          width: 3,
          material: Cesium.Color.fromCssColorString('#94A3B8').withAlpha(0.7),
        },
      });
      architecturalBuildingEntitiesRef.current.push(colLine);
    });

    // C. Iterate over each floor to build Floor Slabs + Central Core + Volumetric Units
    bFloors.forEach((fl, idx) => {
      const isBasement = fl.code.startsWith('B');
      const basementIndex = isBasement ? (fl.code === 'B1' ? -1 : -2) : 0;
      const aboveGroundIndex = isBasement
        ? 0
        : fl.code === 'GF'
        ? 0
        : parseInt(fl.code.replace(/\D/g, ''), 10) || idx;

      const verticalOffset = isBasement
        ? basementIndex * gapM
        : aboveGroundIndex * gapM;

      const baseH = fl.baseHeightM + verticalOffset;
      const floorH = fl.heightM;
      const isCurrentFloor = fl.floorId === selectedFloorId;
      const isTopFloor = idx === bFloors.length - 1 || fl.code === 'F10' || fl.usage === 'Amenity';

      // Render Mode dependent styling for Slabs & Cores:
      let slabMaterial: Cesium.Color;
      let slabOutline: Cesium.Color;
      let slabOutlineWidth: number;

      let coreMaterial: Cesium.Color;
      let coreOutline: Cesium.Color;

      if (renderMode === 'wireframe') {
        slabMaterial = isCurrentFloor
          ? Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.22)
          : Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.04);
        slabOutline = Cesium.Color.fromCssColorString('#00F0FF');
        slabOutlineWidth = isCurrentFloor ? 3.5 : 2.5;

        coreMaterial = Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.06);
        coreOutline = Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.85);
      } else if (renderMode === 'blueprint') {
        slabMaterial = isCurrentFloor
          ? Cesium.Color.fromCssColorString('#1D4ED8').withAlpha(0.92)
          : Cesium.Color.fromCssColorString('#0A2540').withAlpha(0.92);
        slabOutline = Cesium.Color.fromCssColorString('#38BDF8');
        slabOutlineWidth = isCurrentFloor ? 3.0 : 1.8;

        coreMaterial = Cesium.Color.fromCssColorString('#0F172A').withAlpha(0.95);
        coreOutline = Cesium.Color.fromCssColorString('#60A5FA');
      } else {
        slabMaterial = isCurrentFloor
          ? Cesium.Color.fromCssColorString('#DBEAFE')
          : theme === 'dark'
          ? Cesium.Color.fromCssColorString('#1E293B')
          : Cesium.Color.fromCssColorString('#F8FAFC');
        slabOutline = isCurrentFloor
          ? Cesium.Color.fromCssColorString('#2563EB')
          : Cesium.Color.fromCssColorString('#CBD5E1');
        slabOutlineWidth = isCurrentFloor ? 2.5 : 1;

        coreMaterial = Cesium.Color.fromCssColorString('#475569').withAlpha(0.65);
        coreOutline = Cesium.Color.fromCssColorString('#334155');
      }

      // 1. Horizontal Floor Plate / Concrete Slab
      const slabEntity = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: baseH,
          extrudedHeight: baseH + 0.28,
          material: slabMaterial,
          outline: true,
          outlineColor: slabOutline,
          outlineWidth: slabOutlineWidth,
        },
        properties: {
          floorId: fl.floorId,
          buildingId: b.buildingId,
          floorLabel: `${fl.label} (${fl.code})`,
          usage: fl.usage,
          units: fl.unitCount,
        },
      });
      architecturalBuildingEntitiesRef.current.push(slabEntity);

      // 2. Central Structural Elevator / Staircase Core Prism
      const coreCoords = [
        minLng + 0.40 * lngSpan, minLat + 0.40 * latSpan,
        minLng + 0.60 * lngSpan, minLat + 0.40 * latSpan,
        minLng + 0.60 * lngSpan, minLat + 0.60 * latSpan,
        minLng + 0.40 * lngSpan, minLat + 0.60 * latSpan,
      ];
      const coreEntity = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(coreCoords),
          height: baseH + 0.28,
          extrudedHeight: baseH + floorH,
          material: coreMaterial,
          outline: true,
          outlineColor: coreOutline,
          outlineWidth: renderMode === 'wireframe' ? 2.2 : 1.5,
        },
        properties: {
          floorId: fl.floorId,
          buildingId: b.buildingId,
          floorLabel: `${fl.label} - Central Core`,
        },
      });
      architecturalBuildingEntitiesRef.current.push(coreEntity);

      // 3. Floor Plan Corridor Lines on Slab (when floorPlanActive or current floor)
      if (floorPlanActive || isCurrentFloor) {
        const corridorColor = renderMode === 'wireframe'
          ? Cesium.Color.fromCssColorString('#00F0FF')
          : renderMode === 'blueprint'
          ? Cesium.Color.fromCssColorString('#38BDF8')
          : Cesium.Color.fromCssColorString('#2563EB');

        const corridorLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              minLng + 0.50 * lngSpan, minLat + 0.05 * latSpan, baseH + 0.32,
              minLng + 0.50 * lngSpan, maxLat - 0.05 * latSpan, baseH + 0.32,
            ]),
            width: renderMode === 'wireframe' ? 3.0 : 2.5,
            material: corridorColor.withAlpha(0.85),
          },
        });
        architecturalBuildingEntitiesRef.current.push(corridorLine);

        const crossCorridorLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              minLng + 0.05 * lngSpan, minLat + 0.50 * latSpan, baseH + 0.32,
              maxLng - 0.05 * lngSpan, minLat + 0.50 * latSpan, baseH + 0.32,
            ]),
            width: renderMode === 'wireframe' ? 3.0 : 2.5,
            material: corridorColor.withAlpha(0.85),
          },
        });
        architecturalBuildingEntitiesRef.current.push(crossCorridorLine);
      }

      // 4. Volumetric Units (Glass Prisms inside Floor)
      if (layerVisibility.units) {
        const floorUnits = units.filter((u) => u.floorId === fl.floorId);

        const getUnitStyle = (u: any, isTop: boolean = false) => {
          const isSelected = u ? u.unitId === selectedUnitId : false;
          const hasDispute = u?.disputeIds && u.disputeIds.length > 0;

          let fill: Cesium.Color;
          let outline: Cesium.Color;
          let outlineWidth = isSelected ? 3.5 : 1.5;

          if (renderMode === 'wireframe') {
            if (isSelected) {
              fill = Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.38);
              outline = Cesium.Color.WHITE;
              outlineWidth = 4.0;
            } else if (hasDispute) {
              fill = Cesium.Color.fromCssColorString('#FF5722').withAlpha(0.35);
              outline = Cesium.Color.fromCssColorString('#FF8A65');
              outlineWidth = 2.5;
            } else {
              fill = Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.06);
              outline = Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.9);
              outlineWidth = 2.0;
            }
          } else if (renderMode === 'blueprint') {
            if (isSelected) {
              fill = Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.90);
              outline = Cesium.Color.fromCssColorString('#E0F2FE');
              outlineWidth = 3.0;
            } else if (hasDispute) {
              fill = Cesium.Color.fromCssColorString('#EA580C').withAlpha(0.75);
              outline = Cesium.Color.fromCssColorString('#FDBA74');
              outlineWidth = 2.2;
            } else {
              fill = Cesium.Color.fromCssColorString('#172554').withAlpha(0.75);
              outline = Cesium.Color.fromCssColorString('#60A5FA');
              outlineWidth = 1.8;
            }
          } else {
            // Realistic Mode
            if (isSelected) {
              fill = Cesium.Color.fromCssColorString('#2563EB').withAlpha(0.85);
              outline = Cesium.Color.WHITE;
              outlineWidth = 3.5;
            } else if (hasDispute) {
              fill = Cesium.Color.fromCssColorString('#F97316').withAlpha(0.42);
              outline = Cesium.Color.fromCssColorString('#FB923C');
            } else if (isTop) {
              fill = Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.48);
              outline = Cesium.Color.fromCssColorString('#FBBF24');
            } else if (colorMode === 'usage') {
              const usage = fl.usage;
              const hex = usage === 'Office' ? '#3B82F6' : usage === 'Retail' ? '#10B981' : usage === 'Residential' ? '#8B5CF6' : usage === 'Utility' || usage === 'Parking' ? '#F59E0B' : '#06B6D4';
              fill = Cesium.Color.fromCssColorString(hex).withAlpha(0.45);
              outline = Cesium.Color.fromCssColorString(hex);
            } else {
              fill = Cesium.Color.fromCssColorString('#06B6D4').withAlpha(0.24);
              outline = Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.7);
            }
          }
          return { fill, outline, outlineWidth };
        };

        if (floorUnits.length === 0 || isTopFloor) {
          const insetCoords = [
            minLng + 0.05 * lngSpan, minLat + 0.05 * latSpan,
            maxLng - 0.05 * lngSpan, minLat + 0.05 * latSpan,
            maxLng - 0.05 * lngSpan, maxLat - 0.05 * latSpan,
            minLng + 0.05 * lngSpan, maxLat - 0.05 * latSpan,
          ];

          const topUnit = floorUnits[0];
          const style = getUnitStyle(topUnit, isTopFloor);

          const topEntity = viewer.entities.add({
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(insetCoords),
              height: baseH + 0.28,
              extrudedHeight: baseH + floorH - 0.08,
              material: style.fill,
              outline: true,
              outlineColor: style.outline,
              outlineWidth: style.outlineWidth,
            },
            properties: {
              unitId: topUnit?.unitId || `U-ROOF-${idx}`,
              floorId: fl.floorId,
              buildingId: b.buildingId,
              flatNumber: topUnit?.flatNumber || 'Penthouse Suite & Sky Lounge',
              ownerName: topUnit?.ownerName || 'Bandra Sky Lounge Holdings',
              carpetArea: topUnit?.carpetAreaSqm || 620,
              ulpin3d: topUnit?.ulpin3d || `${b.parcelId}-${fl.code}-PH01`,
            },
          });
          architecturalBuildingEntitiesRef.current.push(topEntity);
        } else if (floorUnits.length === 2) {
          // 2 Units (Left and Right halves)
          const uLeftCoords = [
            minLng + 0.03 * lngSpan, minLat + 0.03 * latSpan,
            minLng + 0.47 * lngSpan, minLat + 0.03 * latSpan,
            minLng + 0.47 * lngSpan, maxLat - 0.03 * latSpan,
            minLng + 0.03 * lngSpan, maxLat - 0.03 * latSpan,
          ];
          const uRightCoords = [
            minLng + 0.53 * lngSpan, minLat + 0.03 * latSpan,
            maxLng - 0.03 * lngSpan, minLat + 0.03 * latSpan,
            maxLng - 0.03 * lngSpan, maxLat - 0.03 * latSpan,
            minLng + 0.53 * lngSpan, maxLat - 0.03 * latSpan,
          ];

          [floorUnits[0], floorUnits[1]].forEach((u, uIdx) => {
            if (!u) return;
            const style = getUnitStyle(u, false);

            const unitEntity = viewer.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(uIdx === 0 ? uLeftCoords : uRightCoords),
                height: baseH + 0.28,
                extrudedHeight: baseH + floorH - 0.08,
                material: style.fill,
                outline: true,
                outlineColor: style.outline,
                outlineWidth: style.outlineWidth,
              },
              properties: {
                unitId: u.unitId,
                floorId: fl.floorId,
                buildingId: b.buildingId,
                flatNumber: u.flatNumber,
                ownerName: u.ownerName,
                carpetArea: u.carpetAreaSqm,
                ulpin3d: u.ulpin3d,
              },
            });
            architecturalBuildingEntitiesRef.current.push(unitEntity);
          });
        } else {
          // 3 or more Units
          const u1Coords = [
            minLng + 0.03 * lngSpan, minLat + 0.46 * latSpan,
            minLng + 0.47 * lngSpan, minLat + 0.46 * latSpan,
            minLng + 0.47 * lngSpan, maxLat - 0.03 * latSpan,
            minLng + 0.03 * lngSpan, maxLat - 0.03 * latSpan,
          ];
          const u2Coords = [
            minLng + 0.53 * lngSpan, minLat + 0.46 * latSpan,
            maxLng - 0.03 * lngSpan, minLat + 0.46 * latSpan,
            maxLng - 0.03 * lngSpan, maxLat - 0.03 * latSpan,
            minLng + 0.53 * lngSpan, maxLat - 0.03 * latSpan,
          ];
          const u3Coords = [
            minLng + 0.03 * lngSpan, minLat + 0.03 * latSpan,
            maxLng - 0.03 * lngSpan, minLat + 0.03 * latSpan,
            maxLng - 0.03 * lngSpan, minLat + 0.40 * latSpan,
            minLng + 0.03 * lngSpan, minLat + 0.40 * latSpan,
          ];

          floorUnits.slice(0, 3).forEach((u, uIdx) => {
            const style = getUnitStyle(u, false);
            const chosenCoords = uIdx === 0 ? u1Coords : uIdx === 1 ? u2Coords : u3Coords;

            const unitEntity = viewer.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(chosenCoords),
                height: baseH + 0.28,
                extrudedHeight: baseH + floorH - 0.08,
                material: style.fill,
                outline: true,
                outlineColor: style.outline,
                outlineWidth: style.outlineWidth,
              },
              properties: {
                unitId: u.unitId,
                floorId: fl.floorId,
                buildingId: b.buildingId,
                flatNumber: u.flatNumber,
                ownerName: u.ownerName,
                carpetArea: u.carpetAreaSqm,
                ulpin3d: u.ulpin3d,
              },
            });
            architecturalBuildingEntitiesRef.current.push(unitEntity);
          });
        }
      }

      // 5. Outer Perimeter Glass Facade Curtain Wall (Subtle translucent glass)
      const glassFill = renderMode === 'wireframe'
        ? Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.02)
        : renderMode === 'blueprint'
        ? Cesium.Color.fromCssColorString('#0A2540').withAlpha(0.35)
        : Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.06);

      const glassOutline = renderMode === 'wireframe'
        ? Cesium.Color.fromCssColorString('#00F0FF').withAlpha(0.50)
        : renderMode === 'blueprint'
        ? Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.50)
        : Cesium.Color.fromCssColorString('#60A5FA').withAlpha(0.25);

      const glassCurtain = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          height: baseH,
          extrudedHeight: baseH + floorH,
          material: glassFill,
          outline: true,
          outlineColor: glassOutline,
          outlineWidth: 1,
        },
        properties: {
          floorId: fl.floorId,
          buildingId: b.buildingId,
          floorLabel: `${fl.label} Glass Envelope`,
        },
      });
      architecturalBuildingEntitiesRef.current.push(glassCurtain);

      // 6. AI Mesh Wireframe (when aiMeshActive is true)
      if (aiMeshActive) {
        const wireframeRing = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(
              coords.map((pt) => [pt[0], pt[1], baseH + floorH]).flat()
            ),
            width: 2,
            material: Cesium.Color.fromCssColorString('#00F0FF'),
          },
        });
        architecturalBuildingEntitiesRef.current.push(wireframeRing);
      }
    });

    safeRequestRender(viewer);
  }, [
    selectedBuildingId,
    selectedFloorId,
    selectedUnitId,
    isExploded,
    explodedProgress,
    floorPlanActive,
    aiMeshActive,
    layerVisibility.building,
    layerVisibility.units,
    buildings,
    floors,
    units,
    renderMode,
    theme,
  ]);

  // 7. Isolate selected building from base photogrammetry layer via clipping polygons (§6.2)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    const tileset = tilesetRef.current;
    if (!tileset) return;

    const b = buildings.find((item) => item.buildingId === selectedBuildingId);
    if (b) {
      try {
        const coords = b.footprint.coordinates[0];
        const positions = Cesium.Cartesian3.fromDegreesArray(
          coords.map((pt) => [pt[0], pt[1]]).flat()
        );
        const clipPoly = new Cesium.ClippingPolygon({ positions });
        tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
          polygons: [clipPoly],
          enabled: true,
        });
      } catch (err) {
        console.warn('Tileset clipping polygon error:', err);
      }
    } else {
      try {
        if (tileset.clippingPolygons) {
          tileset.clippingPolygons.enabled = false;
          tileset.clippingPolygons = undefined;
        }
      } catch (e) {
        // ignore
      }
    }
    safeRequestRender(viewer);
  }, [selectedBuildingId, buildings]);

  // 8. Camera Fly-To when a building is selected (§6.4)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer) || !selectedBuildingId) return;

    const b = buildings.find((item) => item.buildingId === selectedBuildingId);
    if (!b) return;

    const coords = b.footprint.coordinates[0];
    const centroidLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
    const centroidLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;

    const center = Cesium.Cartesian3.fromDegrees(
      centroidLng,
      centroidLat,
      b.baseElevationM + b.heightM * 0.5
    );
    const boundingSphere = new Cesium.BoundingSphere(center, Math.max(b.heightM, 70));

    viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(25.0),
        Cesium.Math.toRadians(-24.0),
        Math.max(b.heightM * 2.3, 110)
      ),
      duration: 1.6,
      complete: () => {
        if (isViewerValid(viewer) && viewer.scene?.screenSpaceCameraController) {
          viewer.scene.screenSpaceCameraController.enableInputs = true;
        }
        safeRequestRender(viewer);
      },
      cancel: () => {
        if (isViewerValid(viewer) && viewer.scene?.screenSpaceCameraController) {
          viewer.scene.screenSpaceCameraController.enableInputs = true;
        }
      },
    });
  }, [selectedBuildingId]);

  // 8. Camera Fly-To when targetCameraDestination is updated from search
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer) || !targetCameraDestination) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        targetCameraDestination.lng,
        targetCameraDestination.lat,
        targetCameraDestination.height || 600
      ),
      orientation: {
        heading: Cesium.Math.toRadians(targetCameraDestination.heading ?? 0),
        pitch: Cesium.Math.toRadians(targetCameraDestination.pitch ?? -38),
        roll: 0.0,
      },
      duration: 1.8,
      complete: () => {
        safeRequestRender(viewer);
      },
    });
  }, [targetCameraDestination]);

  // 8b. Render External Geocoded Marker on the 3D globe
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    if (externalMarkerEntityRef.current) {
      viewer.entities.remove(externalMarkerEntityRef.current);
      externalMarkerEntityRef.current = null;
    }

    if (externalMarker) {
      const pinEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(externalMarker.lng, externalMarker.lat, 25),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#EF4444'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `📍 ${externalMarker.name}`,
          font: 'bold 12px Inter, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#0F172A'),
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      externalMarkerEntityRef.current = pinEntity;
    }
    safeRequestRender(viewer);
  }, [externalMarker]);

  // 8c. Camera Actions (Zoom In, Zoom Out, Reset, Orbit, TopDown, Elevation)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer) || !cameraAction) return;

    const camera = viewer.camera;
    const currentHeight = camera.positionCartographic.height;

    if (cameraAction === 'zoomIn') {
      camera.zoomIn(Math.max(currentHeight * 0.35, 25));
      safeRequestRender(viewer);
    } else if (cameraAction === 'zoomOut') {
      camera.zoomOut(Math.max(currentHeight * 0.45, 35));
      safeRequestRender(viewer);
    } else if (cameraAction === 'reset') {
      const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(city.center[0], city.center[1], 850),
        orientation: {
          heading: Cesium.Math.toRadians(15.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0,
        },
        duration: 1.2,
      });
    } else if (cameraAction === 'topDown') {
      const b = selectedBuildingId ? buildings.find((item) => item.buildingId === selectedBuildingId) : null;
      if (b) {
        const coords = b.footprint.coordinates[0];
        const centroidLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
        const centroidLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;
        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            centroidLng,
            centroidLat,
            b.baseElevationM + b.heightM + 160
          ),
          orientation: {
            heading: 0.0,
            pitch: Cesium.Math.toRadians(-89.9),
            roll: 0.0,
          },
          duration: 1.2,
        });
      } else {
        const carto = camera.positionCartographic;
        camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, Math.max(carto.height, 450)),
          orientation: {
            heading: camera.heading,
            pitch: Cesium.Math.toRadians(-89.9),
            roll: 0.0,
          },
          duration: 1.2,
        });
      }
    } else if (cameraAction === 'elevation' && selectedBuildingId) {
      const b = buildings.find((item) => item.buildingId === selectedBuildingId);
      if (b) {
        const coords = b.footprint.coordinates[0];
        const centroidLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
        const centroidLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;
        const center = Cesium.Cartesian3.fromDegrees(
          centroidLng,
          centroidLat,
          b.baseElevationM + b.heightM * 0.5
        );
        const sphere = new Cesium.BoundingSphere(center, b.heightM);
        camera.flyToBoundingSphere(sphere, {
          offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(0),
            Cesium.Math.toRadians(-4.0),
            b.heightM * 2.1
          ),
          duration: 1.4,
        });
      }
    } else if (cameraAction === 'rotateLeft') {
      const b = buildings.find((item) => item.buildingId === selectedBuildingId) || buildings[0];
      if (b) {
        const centroid = computePolygonCentroid(b.footprint.coordinates[0]);
        const centerZ = isExploded ? b.heightM * 1.5 : b.heightM * 0.5;
        const center = Cesium.Cartesian3.fromDegrees(centroid[0], centroid[1], centerZ);
        const dist = Math.max(Cesium.Cartesian3.distance(viewer.camera.position, center), b.heightM * 1.5);
        const heading = viewer.camera.heading - Cesium.Math.toRadians(18);
        const pitch = viewer.camera.pitch;
        viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, dist));
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      } else {
        viewer.camera.rotateLeft(Cesium.Math.toRadians(18));
      }
      safeRequestRender(viewer);
    } else if (cameraAction === 'rotateRight') {
      const b = buildings.find((item) => item.buildingId === selectedBuildingId) || buildings[0];
      if (b) {
        const centroid = computePolygonCentroid(b.footprint.coordinates[0]);
        const centerZ = isExploded ? b.heightM * 1.5 : b.heightM * 0.5;
        const center = Cesium.Cartesian3.fromDegrees(centroid[0], centroid[1], centerZ);
        const dist = Math.max(Cesium.Cartesian3.distance(viewer.camera.position, center), b.heightM * 1.5);
        const heading = viewer.camera.heading + Cesium.Math.toRadians(18);
        const pitch = viewer.camera.pitch;
        viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, dist));
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      } else {
        viewer.camera.rotateRight(Cesium.Math.toRadians(18));
      }
      safeRequestRender(viewer);
    } else if (cameraAction === 'orbit') {
      toggleOrbiting();
    }
  }, [cameraAction, cameraActionCounter, selectedBuildingId, buildings, selectedCityId, isExploded, toggleOrbiting]);

  // Synchronize continuous 360° turntable orbit centered on building
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    if (!isOrbiting) {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
        if (isViewerValid(viewerRef.current)) {
          viewerRef.current.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          safeRequestRender(viewerRef.current);
        }
      }
      return;
    }

    if (orbitIntervalRef.current) {
      clearInterval(orbitIntervalRef.current);
      orbitIntervalRef.current = null;
    }

    const b = buildings.find((item) => item.buildingId === selectedBuildingId) || buildings[0];
    if (!b) return;

    const centroid = computePolygonCentroid(b.footprint.coordinates[0]);
    const centerZ = isExploded ? b.heightM * 1.5 : b.heightM * 0.5;
    const center = Cesium.Cartesian3.fromDegrees(centroid[0], centroid[1], centerZ);

    let currentDist = Cesium.Cartesian3.distance(viewer.camera.position, center);
    currentDist = Math.max(Math.min(currentDist, b.heightM * 4.5), b.heightM * 1.4);
    let currentPitch = viewer.camera.pitch;
    if (currentPitch > -0.15) currentPitch = Cesium.Math.toRadians(-25);
    let currentHeading = viewer.camera.heading;

    orbitIntervalRef.current = window.setInterval(() => {
      if (!isViewerValid(viewerRef.current)) return;
      currentHeading += 0.008;
      viewerRef.current.camera.lookAt(
        center,
        new Cesium.HeadingPitchRange(currentHeading, currentPitch, currentDist)
      );
      safeRequestRender(viewerRef.current);
    }, 30);

    return () => {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
        if (isViewerValid(viewerRef.current)) {
          viewerRef.current.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
      }
    };
  }, [isOrbiting, selectedBuildingId, buildings, isExploded]);

  // 9. Underground Subsurface Infrastructure: Extruded Basements & 3D Volumetric Utility Tubes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    utilityEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    utilityEntitiesRef.current = [];

    // Globe subsurface translucency for seeing below ground
    const globeObj = viewer.scene.globe as any;
    if (globeObj && globeObj.translucency) {
      globeObj.translucency.enabled = undergroundVisible;
      globeObj.translucency.frontFaceAlpha = undergroundVisible ? 0.38 : 1.0;
      globeObj.translucency.backFaceAlpha = undergroundVisible ? 0.25 : 1.0;
    }

    if (!undergroundVisible) {
      safeRequestRender(viewer);
      return;
    }

    const b =
      buildings.find((item) => item.buildingId === selectedBuildingId) || buildings[0];
    if (!b) return;

    const coords = b.footprint.coordinates[0];
    const flatCoords: number[] = [];
    coords.forEach((pt) => flatCoords.push(pt[0], pt[1]));

    const centroidLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
    const centroidLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;

    // A. Subterranean Parking & Basement Extruded Volumes (Real Footprint Geometry)
    if (basementVisible !== false) {
      const basementTiers = [
        {
          code: 'B1',
          name: 'Basement B1: Commercial & Visitor Parking (68 Bays)',
          depthTop: 0.2,
          depthBottom: 3.6,
          color: '#1E293B',
          alpha: 0.85,
          outline: '#38BDF8',
        },
        {
          code: 'B2',
          name: 'Basement B2: Sanctioned Resident Parking (112 Bays)',
          depthTop: 3.6,
          depthBottom: 7.2,
          color: '#0F172A',
          alpha: 0.85,
          outline: '#10B981',
        },
        {
          code: 'B3',
          name: 'Basement B3: Mechanical Cistern & Foundation Raft',
          depthTop: 7.2,
          depthBottom: 10.8,
          color: '#020617',
          alpha: 0.90,
          outline: '#64748B',
        },
      ];

      basementTiers.forEach((tier) => {
        const hTop = 0 - tier.depthTop;
        const hBottom = 0 - tier.depthBottom;

        const bEntity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: hBottom,
            extrudedHeight: hTop,
            material: Cesium.Color.fromCssColorString(tier.color).withAlpha(tier.alpha),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(tier.outline),
            outlineWidth: 2.0,
          },
          properties: {
            name: `${b.name} (${tier.name})`,
            tierCode: tier.code,
            isBasement: true,
          },
        });
        utilityEntitiesRef.current.push(bEntity);

        // Floor perimeter glow
        const glowLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(
              coords.map((pt) => [pt[0], pt[1], hTop + 0.1]).flat()
            ),
            width: 2.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString(tier.outline),
            }),
          },
        });
        utilityEntitiesRef.current.push(glowLine);
      });
    }

    // B. Subsurface 3D Utility Tubes (Volumetric Cylinders) following Real Logical Routes
    if (utilityPipesVisible !== false) {
      // Helper function for circular tube cross-section in Cesium
      const makeCircleSection = (radiusM: number, segments = 12) => {
        const pts: Cesium.Cartesian2[] = [];
        for (let i = 0; i < segments; i++) {
          const theta = (i / segments) * 2.0 * Math.PI;
          pts.push(new Cesium.Cartesian2(radiusM * Math.cos(theta), radiusM * Math.sin(theta)));
        }
        return pts;
      };

      // 1. Render Logical 3D Continuous Utility Tubes
      BKC_UTILITY_PIPELINES.forEach((pipe) => {
        // Individual Utility Type Filter
        if (pipe.utilityType === 'water' && !utilityWaterVisible) return;
        if (pipe.utilityType === 'sewer' && !utilitySewerVisible) return;
        if (pipe.utilityType === 'gas' && !utilityGasVisible) return;
        if (pipe.utilityType === 'electric' && !utilityElectricVisible) return;
        if (pipe.utilityType === 'telecom' && !utilityTelecomVisible) return;

        const isConnected = isPipelineConnectedToBuilding(pipe, selectedBuildingId);
        const radius = isConnected ? pipe.diameterM * 0.95 : pipe.diameterM * 0.60;
        const color = isConnected
          ? Cesium.Color.fromCssColorString(pipe.emissiveColor).withAlpha(0.98)
          : Cesium.Color.fromCssColorString(pipe.color).withAlpha(0.85);

        const flatCoords = pipe.path.flat();
        const positions = Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords);

        const pipeEntity = viewer.entities.add({
          name: pipe.name,
          polylineVolume: {
            positions: positions,
            shape: makeCircleSection(radius),
            material: color,
          },
          properties: {
            pipeId: pipe.id,
            name: pipe.name,
            utilityType: pipe.utilityType,
            description: pipe.description,
            isUtility: true,
            isConnectedToSelected: isConnected,
          },
        });
        utilityEntitiesRef.current.push(pipeEntity);

        // Highlight connected lines with an emissive center glow line for instant visual tracing
        if (isConnected) {
          const glowTrace = viewer.entities.add({
            polyline: {
              positions: positions,
              width: 5.5,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.45,
                taperPower: 0.85,
                color: Cesium.Color.fromCssColorString(pipe.emissiveColor),
              }),
            },
          });
          utilityEntitiesRef.current.push(glowTrace);
        }
      });

      // 2. Render 3D Junction Manholes / Inspection Chambers at Network Intersections
      BKC_UTILITY_JUNCTIONS.forEach((junc) => {
        const t = junc.utilityType;
        const isTypeVisible =
          (t === 'water' && utilityWaterVisible) ||
          (t === 'sewer' && utilitySewerVisible) ||
          (t === 'gas' && utilityGasVisible) ||
          (t === 'electric' && utilityElectricVisible) ||
          (t === 'telecom' && utilityTelecomVisible);
        if (!isTypeVisible) return;

        const isJuncConnected = selectedBuildingId ? junc.connectedBuildingIds.includes(selectedBuildingId) : false;
        const juncRadius = isJuncConnected ? 1.6 : 1.1;
        const juncHeight = junc.heightM || 4.0;
        const juncAltitude = junc.position[2] + juncHeight / 2;

        const juncEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(junc.position[0], junc.position[1], juncAltitude),
          cylinder: {
            length: juncHeight,
            topRadius: juncRadius,
            bottomRadius: juncRadius,
            material: isJuncConnected
              ? Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.95)
              : Cesium.Color.fromCssColorString('#475569').withAlpha(0.85),
            outline: true,
            outlineColor: isJuncConnected ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString('#94A3B8'),
            outlineWidth: isJuncConnected ? 2.5 : 1.2,
          },
          properties: {
            junctionId: junc.id,
            name: junc.name,
            isJunction: true,
          },
        });
        utilityEntitiesRef.current.push(juncEntity);
      });
    }

    safeRequestRender(viewer);
  }, [
    undergroundVisible,
    basementVisible,
    utilityPipesVisible,
    utilityWaterVisible,
    utilitySewerVisible,
    utilityGasVisible,
    utilityElectricVisible,
    utilityTelecomVisible,
    selectedBuildingId,
    buildings,
  ]);

  // 10. Flood Simulation Water Plane
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    if (floodEntityRef.current) {
      viewer.entities.remove(floodEntityRef.current);
      floodEntityRef.current = null;
    }

    if (!floodActive) {
      safeRequestRender(viewer);
      return;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
    const center = activeCity.center;

    const floodEntity = viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(
          center[0] - 0.02,
          center[1] - 0.02,
          center[0] + 0.02,
          center[1] + 0.02
        ),
        height: floodLevelM,
        material: Cesium.Color.fromCssColorString('#0284C7').withAlpha(0.65),
      },
    });

    floodEntityRef.current = floodEntity;
    safeRequestRender(viewer);
  }, [floodActive, floodLevelM, selectedCityId]);

  // 11. Topology Conflict Highlighting
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    conflictEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    conflictEntitiesRef.current = [];

    if (!showTopologyConflicts) {
      safeRequestRender(viewer);
      return;
    }

    verticalParcels
      .filter((vp) => !vp.topologyValid && vp.conflicts.length > 0)
      .forEach((vp) => {
        const coords = vp.footprint.coordinates[0];
        const flatCoords: number[] = [];
        coords.forEach((pt) => flatCoords.push(pt[0], pt[1]));

        const conflictEntity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
            height: vp.minHeightM,
            extrudedHeight: vp.maxHeightM,
            material: Cesium.Color.fromCssColorString('#EA580C').withAlpha(0.55), // Warning Amber-Orange Hazard
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#FDE047'),
            outlineWidth: 3,
          },
          properties: {
            name: `TOPOLOGY COLLISION: ${vp.ulpin3d}`,
            description: vp.conflicts[0]?.description,
          },
        });
        conflictEntitiesRef.current.push(conflictEntity);
      });

    safeRequestRender(viewer);
  }, [showTopologyConflicts, verticalParcels]);

  // 11b. DEM/DSM (Digital Elevation Model / Digital Surface Model) Hypsometric Layer (Fix #27)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;

    demDsmEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    demDsmEntitiesRef.current = [];

    if (!demDsmActive) {
      safeRequestRender(viewer);
      return;
    }

    const activeCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
    const [cLng, cLat] = activeCity.center;

    // High-resolution DEM/DSM Hypsometric Elevation Grid (Survey of India CORS Datum)
    const steps = 14;
    const span = 0.016;
    const stepSize = span / steps;

    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const west = cLng - span / 2 + i * stepSize;
        const south = cLat - span / 2 + j * stepSize;
        const east = west + stepSize;
        const north = south + stepSize;

        const distFromCenter = Math.sqrt(
          Math.pow((west + east) / 2 - cLng, 2) + Math.pow((south + north) / 2 - cLat, 2)
        );
        const simulatedElevation = Math.max(
          6,
          Math.round(95 * Math.exp(-distFromCenter * 170) + Math.sin(i * 1.4) * 8 + 10)
        );

        let tintColor: Cesium.Color;
        if (simulatedElevation < 20) {
          tintColor = Cesium.Color.fromCssColorString('#10B981').withAlpha(0.42); // Emerald Lowland
        } else if (simulatedElevation < 45) {
          tintColor = Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.46); // Amber Mid
        } else if (simulatedElevation < 70) {
          tintColor = Cesium.Color.fromCssColorString('#F97316').withAlpha(0.50); // Orange High
        } else {
          tintColor = Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.55); // Red Peak/Rooftop
        }

        const cell = viewer.entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
            height: 0.1,
            extrudedHeight: simulatedElevation * 0.45,
            material: tintColor,
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(0.20),
            outlineWidth: 1.0,
          },
          properties: {
            isDemDsm: true,
            elevationM: simulatedElevation,
            name: `DEM/DSM Grid [${i},${j}]: ${simulatedElevation}m MSL`,
          },
        });
        demDsmEntitiesRef.current.push(cell);
      }
    }

    safeRequestRender(viewer);
  }, [demDsmActive, selectedCityId]);

  // 12. Handle Explosion Animation Tween
  useEffect(() => {
    if (!isExploded) return;

    let startTime: number | null = null;
    const duration = 1200;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);

      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setExplodedProgress(ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isExploded]);

  // Manual Zoom Controls handlers
  const handleZoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;
    const height = viewer.camera.positionCartographic.height;
    viewer.camera.zoomIn(Math.max(height * 0.35, 25));
    safeRequestRender(viewer);
  }, []);

  const handleZoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;
    const height = viewer.camera.positionCartographic.height;
    viewer.camera.zoomOut(Math.max(height * 0.45, 35));
    safeRequestRender(viewer);
  }, []);

  const handleResetCamera = useCallback(() => {
    const viewer = viewerRef.current;
    if (!isViewerValid(viewer)) return;
    const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(city.center[0], city.center[1], 850),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0,
      },
      duration: 1.4,
    });
  }, [selectedCityId]);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-theme-base overflow-hidden select-none">
      {/* Cesium Canvas Target */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Tileset Notice / Fallback info */}
      {tilesetNotice && (
        <div className="absolute top-3 left-4 z-20 max-w-md bg-theme-surface/90 backdrop-blur-md border border-theme p-3 rounded-lg shadow-md flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-theme-muted">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{tilesetNotice}</span>
          </div>
          <button
            onClick={() => setTilesetNotice(null)}
            className="text-theme-muted hover:text-theme-main p-0.5 rounded"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hover Tooltip Floating over globe */}
      {hoveredBuildingName && (
        <div className="absolute top-3 right-4 z-20 pointer-events-none bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md border border-slate-700 font-mono">
          {hoveredBuildingName}
        </div>
      )}

      {/* Cesium Dynamic Legend Overlay - Safely positioned above bottom-left action buttons with collapse toggle */}
      <div className="absolute bottom-20 left-4 z-20 flex flex-col text-[11px] bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl font-mono transition-all max-w-[280px]">
        <div className="p-2.5 flex items-center justify-between gap-3 border-b border-slate-800">
          <button
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            className="flex items-center gap-1.5 font-bold text-slate-200 text-xs hover:text-blue-400 transition-colors cursor-pointer"
            title={isLegendCollapsed ? 'Expand Legend' : 'Collapse Legend'}
          >
            <Layers size={13} className="text-blue-400" />
            <span>{colorMode === 'height' ? 'Colors by Height' : 'Cadastral Legend'}</span>
            {isLegendCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => setColorMode(colorMode === 'usage' ? 'height' : 'usage')}
            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              colorMode === 'height' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle between Height mode and Usage mode"
          >
            {colorMode === 'height' ? 'Height' : 'Usage'}
          </button>
        </div>

        {!isLegendCollapsed && (
          <div className="p-2.5 space-y-1 animate-in fade-in">
            {colorMode === 'height' ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FDE68A] flex-shrink-0" />
                  <span>0 - 10 m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] flex-shrink-0" />
                  <span>10 - 25 m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] flex-shrink-0" />
                  <span>25 - 50 m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4] flex-shrink-0" />
                  <span>50 - 100 m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] flex-shrink-0" />
                  <span>100 - 200 m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1] flex-shrink-0" />
                  <span>&gt; 200 m</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4] flex-shrink-0" />
                  <span>Residential</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] flex-shrink-0" />
                  <span>Commercial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] flex-shrink-0" />
                  <span>Retail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] flex-shrink-0" />
                  <span>Utility / BMS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#64748B] flex-shrink-0" />
                  <span>Basement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] flex-shrink-0" />
                  <span>Selected</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
