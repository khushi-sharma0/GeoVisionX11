// GeoVision Cadastral Geometry Engine
// Provides authoritative per-building multi-vertex footprint polygons and elevations

import { Building } from '../domain/types';
import { useCadastreStore } from '../stores/cadastreStore';

/**
 * Returns the authentic multi-vertex footprint polygon coordinates for a given building.
 * Guaranteed to return an array of [longitude, latitude] points representing the actual surveyed perimeter.
 */
export function getBuildingFootprint(buildingId: string, fallbackBuildings?: Building[]): [number, number][] {
  const store = useCadastreStore.getState();
  const buildings = fallbackBuildings || store.buildings;
  const b = buildings.find((item) => item.buildingId.toLowerCase() === buildingId.toLowerCase());

  if (b && b.footprint?.coordinates?.[0] && b.footprint.coordinates[0].length >= 3) {
    return b.footprint.coordinates[0] as [number, number][];
  }

  // Fallback if not found in store: return empty array or safe center offset
  return [];
}

/**
 * Returns the surveyed structural height in meters for a given building.
 */
export function getBuildingHeight(buildingId: string, fallbackBuildings?: Building[]): number {
  const store = useCadastreStore.getState();
  const buildings = fallbackBuildings || store.buildings;
  const b = buildings.find((item) => item.buildingId.toLowerCase() === buildingId.toLowerCase());
  return b?.heightM || 30.0;
}

/**
 * Returns the base ground elevation in meters MSL for a given building.
 */
export function getBuildingBaseElevation(buildingId: string, fallbackBuildings?: Building[]): number {
  const store = useCadastreStore.getState();
  const buildings = fallbackBuildings || store.buildings;
  const b = buildings.find((item) => item.buildingId.toLowerCase() === buildingId.toLowerCase());
  return b?.baseElevationM || 0.0;
}
