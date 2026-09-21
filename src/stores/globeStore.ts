import { create } from 'zustand';

interface GlobeState {
  isExploded: boolean;
  explodedProgress: number; // 0 to 1
  undergroundVisible: boolean;
  basementVisible: boolean;
  utilityPipesVisible: boolean;
  utilityWaterVisible: boolean;
  utilitySewerVisible: boolean;
  utilityGasVisible: boolean;
  utilityElectricVisible: boolean;
  utilityTelecomVisible: boolean;
  groundDatumVisible: boolean;
  floorPlanActive: boolean;
  aiMeshActive: boolean;
  layerVisibility: {
    parcel: boolean;
    building: boolean;
    units: boolean;
    sewerage: boolean;
    basemapLabels: boolean;
    buildingLabels: boolean;
  };
  floodActive: boolean;
  floodLevelM: number; // in meters (0 to 30)
  demDsmActive: boolean;
  photorealisticEnabled: boolean;
  showTopologyConflicts: boolean;
  cameraMode: 'perspective' | 'topDown' | 'isometric';
  colorMode: 'usage' | 'height';
  renderMode: 'realistic' | 'wireframe' | 'blueprint';
  isOrbiting: boolean;
  cameraAction: 'zoomIn' | 'zoomOut' | 'reset' | 'orbit' | 'topDown' | 'elevation' | 'rotateLeft' | 'rotateRight' | null;
  cameraActionCounter: number;

  // Actions
  toggleExploded: () => void;
  setExploded: (exploded: boolean) => void;
  setExplodedProgress: (t: number) => void;
  toggleUnderground: () => void;
  toggleBasement: () => void;
  toggleUtilityPipes: () => void;
  toggleUtilityWater: () => void;
  toggleUtilitySewer: () => void;
  toggleUtilityGas: () => void;
  toggleUtilityElectric: () => void;
  toggleUtilityTelecom: () => void;
  toggleGroundDatum: () => void;
  toggleFloorPlan: () => void;
  toggleAiMesh: () => void;
  toggleDemDsm: () => void;
  toggleLayer: (layer: 'parcel' | 'building' | 'units' | 'sewerage' | 'basemapLabels' | 'buildingLabels') => void;
  setFloodActive: (active: boolean) => void;
  setFloodLevelM: (level: number) => void;
  togglePhotorealistic: () => void;
  toggleTopologyConflicts: () => void;
  setCameraMode: (mode: 'perspective' | 'topDown' | 'isometric') => void;
  setColorMode: (mode: 'usage' | 'height') => void;
  setRenderMode: (mode: 'realistic' | 'wireframe' | 'blueprint') => void;
  toggleOrbiting: () => void;
  triggerCameraAction: (action: 'zoomIn' | 'zoomOut' | 'reset' | 'orbit' | 'topDown' | 'elevation' | 'rotateLeft' | 'rotateRight') => void;
}

export const useGlobeStore = create<GlobeState>((set, get) => ({
  isExploded: false,
  explodedProgress: 0,
  undergroundVisible: false,
  basementVisible: true,
  utilityPipesVisible: true,
  utilityWaterVisible: true,
  utilitySewerVisible: true,
  utilityGasVisible: true,
  utilityElectricVisible: true,
  utilityTelecomVisible: true,
  groundDatumVisible: true,
  floorPlanActive: true,
  aiMeshActive: false,
  layerVisibility: {
    parcel: true,
    building: true,
    units: true,
    sewerage: false,
    basemapLabels: true,
    buildingLabels: true,
  },
  floodActive: false,
  floodLevelM: 10,
  demDsmActive: false,
  photorealisticEnabled: true,
  showTopologyConflicts: false,
  cameraMode: 'perspective',
  colorMode: 'usage',
  renderMode: 'realistic',
  isOrbiting: false,
  cameraAction: null,
  cameraActionCounter: 0,

  toggleExploded: () => {
    const next = !get().isExploded;
    set({
      isExploded: next,
      explodedProgress: next ? 1 : 0,
    });
  },

  setExploded: (exploded: boolean) => {
    set({
      isExploded: exploded,
      explodedProgress: exploded ? 1 : 0,
    });
  },

  setExplodedProgress: (t: number) => {
    set({ explodedProgress: Math.max(0, Math.min(1, t)) });
  },

  toggleUnderground: () => {
    const next = !get().undergroundVisible;
    set((state) => ({
      undergroundVisible: next,
      layerVisibility: { ...state.layerVisibility, sewerage: next },
    }));
  },

  toggleBasement: () => {
    set({ basementVisible: !get().basementVisible });
  },

  toggleUtilityPipes: () => {
    set({ utilityPipesVisible: !get().utilityPipesVisible });
  },

  toggleUtilityWater: () => {
    set({ utilityWaterVisible: !get().utilityWaterVisible });
  },

  toggleUtilitySewer: () => {
    set({ utilitySewerVisible: !get().utilitySewerVisible });
  },

  toggleUtilityGas: () => {
    set({ utilityGasVisible: !get().utilityGasVisible });
  },

  toggleUtilityElectric: () => {
    set({ utilityElectricVisible: !get().utilityElectricVisible });
  },

  toggleUtilityTelecom: () => {
    set({ utilityTelecomVisible: !get().utilityTelecomVisible });
  },

  toggleGroundDatum: () => {
    set({ groundDatumVisible: !get().groundDatumVisible });
  },

  toggleFloorPlan: () => {
    set({ floorPlanActive: !get().floorPlanActive });
  },

  toggleAiMesh: () => {
    set({ aiMeshActive: !get().aiMeshActive });
  },

  toggleDemDsm: () => {
    set({ demDsmActive: !get().demDsmActive });
  },

  toggleLayer: (layer) => {
    set((state) => {
      const nextVal = !state.layerVisibility[layer];
      const updated = {
        ...state.layerVisibility,
        [layer]: nextVal,
      };
      return {
        layerVisibility: updated,
        undergroundVisible: layer === 'sewerage' ? nextVal : state.undergroundVisible,
      };
    });
  },

  setFloodActive: (active: boolean) => {
    set({ floodActive: active });
  },

  setFloodLevelM: (level: number) => {
    set({ floodLevelM: level });
  },

  togglePhotorealistic: () => {
    set({ photorealisticEnabled: !get().photorealisticEnabled });
  },

  toggleTopologyConflicts: () => {
    set({ showTopologyConflicts: !get().showTopologyConflicts });
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },

  setColorMode: (mode) => {
    set({ colorMode: mode });
  },

  setRenderMode: (mode) => {
    set({ renderMode: mode });
  },

  toggleOrbiting: () => {
    const next = !get().isOrbiting;
    set({ isOrbiting: next });
    if (next) {
      get().triggerCameraAction('orbit');
    }
  },

  triggerCameraAction: (action) => {
    set((state) => ({
      cameraAction: action,
      cameraActionCounter: state.cameraActionCounter + 1,
    }));
  },
}));
