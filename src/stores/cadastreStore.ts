import { create } from 'zustand';
import { Parcel, Building, Floor, Unit, VerticalParcel, CadastralDispute } from '../domain/types';
import { cadastralRepo } from '../services/cadastralRepository';
import { CITIES, CityConfig, generateSeedData } from '../data/seed';

const initialSeed = generateSeedData();

const initialDisputes: CadastralDispute[] = [
  {
    disputeId: 'DISP-MH-98213-01',
    buildingId: 'B04',
    unitId: 'U302',
    ulpin3d: 'MH-MUM-98213-B04-F12-U302',
    disputeType: 'Vertical Airspace Encroachment',
    petitionerName: 'Aditya Vikram Singhania',
    targetUnitOrBuilding: 'Flat 1302 (Floor 13 Cantilever Balcony)',
    description: 'Floor 13 upper balcony slab has cantilever projection exceeding sanctioned envelope by 1.4m into our airspace.',
    status: 'Site Inspection Scheduled',
    filingDate: '2026-03-12',
  },
];

interface CadastreState {
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  verticalParcels: VerticalParcel[];
  disputes: CadastralDispute[];
  selectedCityId: string;
  selectedParcelId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedUnitId: string | null;
  searchQuery: string;
  isLoading: boolean;
  externalMarker: { name: string; lng: number; lat: number } | null;
  targetCameraDestination: { lng: number; lat: number; height: number; heading?: number; pitch?: number } | null;

  // Actions
  loadInitialData: () => Promise<void>;
  setSelectedCityId: (cityId: string) => void;
  selectParcel: (parcelId: string | null) => void;
  selectBuilding: (buildingId: string | null) => void;
  selectFloor: (floorId: string | null) => void;
  selectUnit: (unitId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setExternalMarker: (marker: { name: string; lng: number; lat: number } | null) => void;
  setTargetCameraDestination: (dest: { lng: number; lat: number; height: number; heading?: number; pitch?: number } | null) => void;
  approveUnitUlpin: (ulpin3d: string, officerName: string) => Promise<void>;
  createOrUpdateUnit: (unit: Unit) => Promise<void>;
  addCustomParcel: (parcel: Parcel, building?: Building) => Promise<void>;
  addDynamicBuilding: (data: {
    parcel: Parcel;
    building: Building;
    floors: Floor[];
    units: Unit[];
    verticalParcels: VerticalParcel[];
  }) => void;
  addDispute: (dispute: CadastralDispute) => void;
  getActiveCity: () => CityConfig;
}

export const useCadastreStore = create<CadastreState>((set, get) => ({
  parcels: initialSeed.parcels,
  buildings: initialSeed.buildings,
  floors: initialSeed.floors,
  units: initialSeed.units,
  verticalParcels: initialSeed.verticalParcels,
  disputes: initialDisputes,
  selectedCityId: 'mumbai',
  selectedParcelId: '271015',
  selectedBuildingId: 'B06',
  selectedFloorId: 'FL-MUM-B06-F3',
  selectedUnitId: 'U-SB-F3-301',
  searchQuery: '',
  isLoading: false,
  externalMarker: null,
  targetCameraDestination: null,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [parcels, buildings, floors, units, verticalParcels] = await Promise.all([
        cadastralRepo.getParcels(),
        cadastralRepo.getBuildings(),
        cadastralRepo.getFloors(),
        cadastralRepo.getUnits(),
        cadastralRepo.getVerticalParcels(),
      ]);
      set({
        parcels,
        buildings,
        floors,
        units,
        verticalParcels,
        isLoading: false,
      });
    } catch (e) {
      console.error('Error loading initial cadastre data:', e);
      set({ isLoading: false });
    }
  },

  setSelectedCityId: (cityId: string) => {
    const city = CITIES.find((c) => c.id === cityId) || CITIES[0];
    const { parcels, buildings } = get();
    const cityParcels = parcels.filter((p) => p.city === city.code);
    const firstParcel = cityParcels[0];
    const firstBuilding = firstParcel ? buildings.find((b) => b.parcelId === firstParcel.parcelId) : null;

    set({
      selectedCityId: cityId,
      selectedParcelId: firstParcel ? firstParcel.parcelId : null,
      selectedBuildingId: firstBuilding ? firstBuilding.buildingId : null,
      selectedFloorId: null,
      selectedUnitId: null,
    });
  },

  selectParcel: (parcelId: string | null) => {
    const { buildings } = get();
    const building = parcelId ? buildings.find((b) => b.parcelId === parcelId) : null;
    set({
      selectedParcelId: parcelId,
      selectedBuildingId: building ? building.buildingId : null,
      selectedFloorId: null,
      selectedUnitId: null,
    });
  },

  selectBuilding: (buildingId: string | null) => {
    const { buildings, floors, units } = get();
    const b = buildings.find((item) => item.buildingId === buildingId);
    if (!buildingId || !b) {
      set({
        selectedBuildingId: null,
        selectedFloorId: null,
        selectedUnitId: null,
      });
      return;
    }
    const bFloors = floors.filter((f) => f.buildingId === buildingId);
    const preferredFloor = bFloors.find((f) => f.code === 'F3' || f.code === '12' || f.code === '03') || bFloors[0] || null;
    const floorUnits = preferredFloor ? units.filter((u) => u.floorId === preferredFloor.floorId) : [];
    const preferredUnit = floorUnits.find((u) => u.unitId === 'U-SB-F3-301' || u.unitId === 'U302') || floorUnits[0] || null;

    set({
      selectedBuildingId: buildingId,
      selectedParcelId: b ? b.parcelId : get().selectedParcelId,
      selectedFloorId: preferredFloor ? preferredFloor.floorId : null,
      selectedUnitId: preferredUnit ? preferredUnit.unitId : null,
    });
  },

  selectFloor: (floorId: string | null) => {
    const { units } = get();
    const floorUnits = floorId ? units.filter((u) => u.floorId === floorId) : [];
    const firstUnit = floorUnits[0] || null;
    set({
      selectedFloorId: floorId,
      selectedUnitId: firstUnit ? firstUnit.unitId : null,
    });
  },

  selectUnit: (unitId: string | null) => {
    set({ selectedUnitId: unitId });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setExternalMarker: (marker: { name: string; lng: number; lat: number } | null) => {
    set({ externalMarker: marker });
  },

  setTargetCameraDestination: (dest: { lng: number; lat: number; height: number; heading?: number; pitch?: number } | null) => {
    set({ targetCameraDestination: dest });
  },

  approveUnitUlpin: async (ulpin3d: string, officerName: string) => {
    await cadastralRepo.updateUnitVerification(ulpin3d, 'Verified', officerName);
    const units = await cadastralRepo.getUnits();
    set({ units });
  },

  createOrUpdateUnit: async (unit: Unit) => {
    await cadastralRepo.saveUnit(unit);
    const units = await cadastralRepo.getUnits();
    set({ units });
  },

  addCustomParcel: async (parcel: Parcel, building?: Building) => {
    await cadastralRepo.addParcel(parcel);
    if (building) {
      await cadastralRepo.addBuilding(building);
    }
    const [parcels, buildings] = await Promise.all([
      cadastralRepo.getParcels(),
      cadastralRepo.getBuildings(),
    ]);
    set({
      parcels,
      buildings,
      selectedParcelId: parcel.parcelId,
      selectedBuildingId: building ? building.buildingId : null,
    });
  },

  addDynamicBuilding: (data) => {
    set((state) => {
      const existingB = state.buildings.find((b) => b.buildingId === data.building.buildingId);
      if (existingB) {
        return state;
      }
      return {
        parcels: [data.parcel, ...state.parcels],
        buildings: [data.building, ...state.buildings],
        floors: [...data.floors, ...state.floors],
        units: [...data.units, ...state.units],
        verticalParcels: [...data.verticalParcels, ...state.verticalParcels],
      };
    });
    get().selectBuilding(data.building.buildingId);
  },

  addDispute: (dispute: CadastralDispute) => {
    set((state) => {
      const nextDisputes = [dispute, ...state.disputes];
      // Also update unit disputeIds if unit matches
      const nextUnits = state.units.map((u) => {
        if (dispute.unitId && u.unitId === dispute.unitId) {
          return {
            ...u,
            disputeIds: [...(u.disputeIds || []), dispute.disputeId],
          };
        }
        return u;
      });
      return {
        disputes: nextDisputes,
        units: nextUnits,
      };
    });
  },

  getActiveCity: () => {
    const { selectedCityId } = get();
    return CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  },
}));
