// Topology rules and vertical parcel validation engine
// Pure domain logic - No React imports

import { VerticalParcel, TopologyConflict, Building, Floor } from './types';

export function checkVerticalParcelTopology(
  vParcel: VerticalParcel,
  allParcels: VerticalParcel[]
): { isValid: boolean; conflicts: TopologyConflict[] } {
  const conflicts: TopologyConflict[] = [];

  for (const other of allParcels) {
    if (other.ulpin3d === vParcel.ulpin3d) continue;

    // Check if on same building / footprint base
    if (other.buildingId === vParcel.buildingId) {
      // Check for vertical height overlap:
      // Overlap occurs if minA < maxB and maxA > minB
      const overlapMin = Math.max(vParcel.minHeightM, other.minHeightM);
      const overlapMax = Math.min(vParcel.maxHeightM, other.maxHeightM);

      if (overlapMin < overlapMax) {
        conflicts.push({
          conflictId: `CONF-${vParcel.ulpin3d}-${other.ulpin3d}`,
          type: 'HeightOverlap',
          severity: 'Critical',
          sourceUlpin3d: vParcel.ulpin3d,
          targetUlpin3d: other.ulpin3d,
          overlapHeightMinM: overlapMin,
          overlapHeightMaxM: overlapMax,
          description: `Vertical prism overlap detected between ${vParcel.ulpin3d} and ${other.ulpin3d} from ${overlapMin}m to ${overlapMax}m elevation.`,
        });
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

export interface EncroachmentCheckResult {
  hasEncroachment: boolean;
  floorsAbove: number;
  approvedFloors: number;
  excessFloors: number;
  estimatedExcessHeightM: number;
  severity: 'None' | 'Moderate' | 'Critical';
  statusDescription: string;
}

export function evaluateBuildingEncroachment(building: Building, floors: Floor[]): EncroachmentCheckResult {
  const excess = Math.max(0, building.floorsAbove - building.approvedFloors);
  if (excess === 0) {
    return {
      hasEncroachment: false,
      floorsAbove: building.floorsAbove,
      approvedFloors: building.approvedFloors,
      excessFloors: 0,
      estimatedExcessHeightM: 0,
      severity: 'None',
      statusDescription: `Compliant with municipal sanctioned plan (Approved: ${building.approvedFloors}, Built: ${building.floorsAbove})`,
    };
  }

  const buildingFloors = floors.filter(f => f.buildingId === building.buildingId && !f.code.startsWith('B'));
  const avgFloorHeight = buildingFloors.length > 0 
    ? buildingFloors.reduce((acc, f) => acc + f.heightM, 0) / buildingFloors.length 
    : 3.2;

  const excessHeight = excess * avgFloorHeight;
  const severity = excess >= 2 ? 'Critical' : 'Moderate';

  return {
    hasEncroachment: true,
    floorsAbove: building.floorsAbove,
    approvedFloors: building.approvedFloors,
    excessFloors: excess,
    estimatedExcessHeightM: Number(excessHeight.toFixed(1)),
    severity,
    statusDescription: `Non-sanctioned vertical encroachment: ${excess} unapproved upper floor(s) (${excessHeight.toFixed(1)}m vertical deviation above sanction)`,
  };
}
