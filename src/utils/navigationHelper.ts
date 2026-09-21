import { Building, Parcel, Floor, Unit } from '../domain/types';
import { useCadastreStore } from '../stores/cadastreStore';

export interface NavigateToBuildingParams {
  buildingId?: string;
  targetBuildingId?: string;
  parcelId?: string;
  targetParcelId?: string;
  unitId?: string;
  targetUnitId?: string;
  floorId?: string;
  targetFloorId?: string;
  ulpin3d?: string;
  propertyName?: string;
  portal?: 'citizen' | 'authority';
  isCitizen?: boolean;
}

export interface CadastreContext {
  buildings: Building[];
  parcels: Parcel[];
  floors: Floor[];
  units: Unit[];
  setSelectedCityId: (cityId: string) => void;
  selectBuilding: (buildingId: string | null) => void;
  selectFloor: (floorId: string | null) => void;
  selectUnit: (unitId: string | null) => void;
}

/**
 * Robust helper that locates the target building across cities and navigates
 * directly to that specific 3D building.
 *
 * Supports both argument conventions:
 *   navigateTo3DBuilding(navigate, params, cadastre?)
 *   navigateTo3DBuilding(params, navigate)
 */
export function navigateTo3DBuilding(
  arg1: ((path: string) => void) | NavigateToBuildingParams,
  arg2?: ((path: string) => void) | NavigateToBuildingParams,
  cadastreArg?: CadastreContext
): boolean {
  let navigateFn: (path: string) => void;
  let params: NavigateToBuildingParams;

  if (typeof arg1 === 'function') {
    navigateFn = arg1;
    params = (arg2 as NavigateToBuildingParams) || {};
  } else {
    params = arg1 || {};
    navigateFn =
      typeof arg2 === 'function'
        ? arg2
        : (path: string) => {
            if (typeof window !== 'undefined') {
              window.location.href = path;
            }
          };
  }

  // Retrieve cadastre state directly from Zustand store
  const store = useCadastreStore.getState();
  const buildings = cadastreArg?.buildings || store.buildings;
  const parcels = cadastreArg?.parcels || store.parcels;
  const floors = cadastreArg?.floors || store.floors;
  const units = cadastreArg?.units || store.units;
  const setSelectedCityId = cadastreArg?.setSelectedCityId || store.setSelectedCityId;
  const selectBuilding = cadastreArg?.selectBuilding || store.selectBuilding;
  const selectFloor = cadastreArg?.selectFloor || store.selectFloor;
  const selectUnit = cadastreArg?.selectUnit || store.selectUnit;

  // Collect all query tokens from arguments
  const tokens: string[] = [
    params.ulpin3d,
    params.targetUnitId,
    params.unitId,
    params.targetBuildingId,
    params.buildingId,
    params.targetParcelId,
    params.parcelId,
    params.propertyName,
  ]
    .filter(Boolean)
    .map((s) => s!.trim());

  let targetBuilding: Building | undefined;
  let targetFloorId: string | undefined = params.floorId || params.targetFloorId;
  let targetUnitId: string | undefined = params.unitId || params.targetUnitId;

  // 1. First priority: Resolve target Unit by ULPIN-3D or Unit ID
  for (const token of tokens) {
    const q = token.toLowerCase();

    // Direct match on unit's ulpin3d or unitId
    const matchedUnit = units.find(
      (u) =>
        u.ulpin3d.toLowerCase() === q ||
        u.unitId.toLowerCase() === q ||
        q.includes(u.ulpin3d.toLowerCase()) ||
        q.includes(u.unitId.toLowerCase())
    );

    if (matchedUnit) {
      targetUnitId = matchedUnit.unitId;
      targetFloorId = matchedUnit.floorId;
      const matchedFloor = floors.find((f) => f.floorId === matchedUnit.floorId);
      if (matchedFloor) {
        targetBuilding = buildings.find((b) => b.buildingId === matchedFloor.buildingId);
      }
      if (!targetBuilding && matchedUnit.parentUlpin) {
        targetBuilding = buildings.find(
          (b) => b.ulpin === matchedUnit.parentUlpin || b.parcelId === matchedUnit.parentUlpin
        );
      }
      break;
    }

    // Pattern match for cadastral ULPIN structures like MH-MUM-98213-B04-F16-U402 or 27250600044102-B01-13-U01
    const ulpinPattern = /(B\d+|EC\d+)[-_]?(F?\d+|GF|B\d+)?[-_]?(U\d+|\d+)?/i;
    const match = token.match(ulpinPattern);
    if (match) {
      const bCode = match[1]?.toUpperCase();
      const uCode = match[3]?.toUpperCase();

      if (uCode) {
        const uMatch = units.find(
          (u) =>
            u.unitId.toUpperCase().includes(uCode) ||
            u.ulpin3d.toUpperCase().includes(uCode) ||
            u.flatNumber.toUpperCase().includes(uCode)
        );
        if (uMatch) {
          targetUnitId = uMatch.unitId;
          targetFloorId = uMatch.floorId;
          const matchedFloor = floors.find((f) => f.floorId === uMatch.floorId);
          if (matchedFloor) {
            targetBuilding = buildings.find((b) => b.buildingId === matchedFloor.buildingId);
          }
          if (targetBuilding) break;
        }
      }

      if (bCode && !targetBuilding) {
        targetBuilding = buildings.find((b) => b.buildingId.toUpperCase() === bCode);
        if (targetBuilding) break;
      }
    }
  }

  // 2. Second priority: Resolve target Building by buildingId, ulpin, or name
  if (!targetBuilding) {
    for (const token of tokens) {
      const q = token.toLowerCase();
      targetBuilding = buildings.find(
        (b) =>
          b.buildingId.toLowerCase() === q ||
          (b.ulpin && b.ulpin.toLowerCase() === q) ||
          b.name.toLowerCase().includes(q) ||
          q.includes(b.buildingId.toLowerCase())
      );
      if (targetBuilding) break;
    }
  }

  // 3. Third priority: Resolve by Parcel
  if (!targetBuilding) {
    for (const token of tokens) {
      const q = token.toLowerCase();
      const matchedParcel = parcels.find(
        (p) =>
          p.parcelId.toLowerCase() === q ||
          p.ulpin2d.toLowerCase() === q ||
          p.surveyNumber.toLowerCase().includes(q) ||
          q.includes(p.parcelId.toLowerCase())
      );
      if (matchedParcel) {
        targetBuilding = buildings.find((b) => b.parcelId === matchedParcel.parcelId);
        if (targetBuilding) break;
      }
    }
  }

  // 4. Safe fallback if nothing matched
  if (!targetBuilding) {
    targetBuilding = buildings[0];
  }

  if (!targetBuilding) return false;

  // Resolve parcel and switch city view if necessary
  const parcel = parcels.find((p) => p.parcelId === targetBuilding!.parcelId);
  if (parcel) {
    if (parcel.city === 'MUM') setSelectedCityId('mumbai');
    else if (parcel.city === 'PUN') setSelectedCityId('pune');
    else if (parcel.city === 'DEL') setSelectedCityId('delhi');
    else if (parcel.city === 'AMD') setSelectedCityId('ahmedabad');
  } else {
    // City determination fallback from building address
    const addr = targetBuilding.address?.toLowerCase() || '';
    if (addr.includes('mumbai') || addr.includes('worli') || addr.includes('bkc')) {
      setSelectedCityId('mumbai');
    } else if (addr.includes('pune') || addr.includes('hinjawadi')) {
      setSelectedCityId('pune');
    } else if (addr.includes('delhi') || addr.includes('connaught')) {
      setSelectedCityId('delhi');
    } else if (addr.includes('ahmedabad') || addr.includes('gift')) {
      setSelectedCityId('ahmedabad');
    }
  }

  // Select building, floor, and unit in global state
  selectBuilding(targetBuilding.buildingId);
  if (targetFloorId) {
    selectFloor(targetFloorId);
  }
  if (targetUnitId) {
    selectUnit(targetUnitId);
  }

  // Construct destination URL with query parameters for direct deep-linking
  const isCitizenView = params.portal === 'citizen' || Boolean(params.isCitizen);
  const basePath = isCitizenView ? '/citizen/3d-view' : '/authority/globe';
  const queryParams = new URLSearchParams();
  queryParams.set('buildingId', targetBuilding.buildingId);
  if (targetFloorId) queryParams.set('floorId', targetFloorId);
  if (targetUnitId) queryParams.set('unitId', targetUnitId);
  if (params.ulpin3d) queryParams.set('ulpin', params.ulpin3d);

  navigateFn(`${basePath}?${queryParams.toString()}`);
  return true;
}

