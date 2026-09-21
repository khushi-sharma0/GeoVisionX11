// 3D ULPIN Codec and Validation Specification for GeoVision
// Statutory Standard (DoLR / DILRMP):
// - Parent ULPIN: Exactly 14 digits (e.g. 27101500485488, 27710400098213)
// - Child ULPIN: Full untouched 14-digit parent verbatim + suffix
//   (e.g. 27101500485488-F3-U301, 27101500485488-B1-P02, 27101500485488-RF-T01, 27101500485488-AR-01)
// Legacy alphanumeric format also supported: STATE-CITY-PARCEL-BUILDING-FLOOR-UNIT

import { UlpinParts, UlpinError, UlpinValidationResult, Parcel, Building, Floor, Unit, VerticalParcel } from './types';

export const PARENT_ULPIN_14_REGEX = /^\d{14}$/;
export const CHILD_ULPIN_14_REGEX = /^(\d{14})-([A-Za-z0-9\-_]+)$/;
export const LEGACY_ULPIN_3D_REGEX = /^[A-Z]{2}-[A-Z]{3}-\d{5}-B\d{2}-F(?:B[1-3]|GF|\d{2})-U\d{3}$/;
export const ULPIN_3D_REGEX = CHILD_ULPIN_14_REGEX;

/**
 * Strict validation enforcing that the child ULPIN has the parent's exact 14-digit core
 * copied verbatim as the fixed prefix, followed by a hyphen and suffix.
 */
export function validateChildUlpinStrict(
  childUlpin: string,
  parentUlpin: string
): { valid: boolean; error?: string } {
  if (!childUlpin) {
    return { valid: false, error: 'Child ULPIN cannot be empty' };
  }
  if (!parentUlpin) {
    return { valid: false, error: 'Parent ULPIN is missing' };
  }

  const cleanParent = parentUlpin.trim();
  const cleanChild = childUlpin.trim();

  // If parent is 14 digits, enforce strict 14-digit prefix
  if (PARENT_ULPIN_14_REGEX.test(cleanParent)) {
    const expectedPrefix = `${cleanParent}-`;
    if (!cleanChild.startsWith(expectedPrefix)) {
      const childPrefix = cleanChild.split('-')[0];
      return {
        valid: false,
        error: `CRITICAL ULPIN VIOLATION: Child ULPIN prefix '${childPrefix}' does not match parent 14-digit ULPIN '${cleanParent}'. The 14-digit core must remain completely unchanged across every child unit.`,
      };
    }
    const suffix = cleanChild.slice(expectedPrefix.length);
    if (!suffix || suffix.trim().length === 0) {
      return {
        valid: false,
        error: `Child ULPIN missing unit/floor/asset identifier suffix after parent '${cleanParent}-'`,
      };
    }
    return { valid: true };
  }

  // Fallback for alphanumeric legacy parent ULPINs
  if (!cleanChild.startsWith(`${cleanParent}-`)) {
    return {
      valid: false,
      error: `Child ULPIN '${cleanChild}' does not start with parent ULPIN '${cleanParent}'`,
    };
  }

  return { valid: true };
}

/**
 * Auto-generates a standardized Child ULPIN by copying the 14-digit parent verbatim
 */
export function formatChildUlpin(parentUlpin14: string, suffix: string): string {
  const cleanParent = parentUlpin14.trim();
  const cleanSuffix = suffix.replace(/^[-\s]+/, '');
  const childUlpin = `${cleanParent}-${cleanSuffix}`;

  const validation = validateChildUlpinStrict(childUlpin, cleanParent);
  if (!validation.valid) {
    console.warn('formatChildUlpin validation failed:', validation.error);
  }

  return childUlpin;
}

export function encodeUlpin3d(parts: UlpinParts): string {
  const floorSeg = parts.floor.startsWith('F') ? parts.floor : `F${parts.floor}`;
  const unitSeg = parts.unit.startsWith('U') ? parts.unit : `U${parts.unit.padStart(3, '0')}`;
  const buildingSeg = parts.building.startsWith('B') ? parts.building : `B${parts.building.padStart(2, '0')}`;
  const parcelSeg = parts.parcel.padStart(5, '0');
  return `${parts.state.toUpperCase()}-${parts.city.toUpperCase()}-${parcelSeg}-${buildingSeg}-${floorSeg}-${unitSeg}`;
}

export function decodeUlpin3d(id: string): UlpinParts | UlpinError {
  if (!id || typeof id !== 'string') {
    return {
      isError: true,
      reason: 'Empty or non-string ULPIN provided',
      rawInput: String(id),
    };
  }

  const trimmed = id.trim().toUpperCase();

  // Match modern statutory 14-digit format: 27101500485488-F3-U301 or 27101500485488-B1-P02
  const statutoryMatch = trimmed.match(CHILD_ULPIN_14_REGEX);
  if (statutoryMatch) {
    const parent14 = statutoryMatch[1];
    const suffix = statutoryMatch[2];
    const suffixParts = suffix.split('-');

    return {
      state: parent14.slice(0, 2),
      city: parent14.slice(2, 6),
      parcel: parent14.slice(6, 14),
      building: 'B01',
      floor: suffixParts[0] || 'F01',
      unit: suffixParts[1] || 'U01',
    };
  }

  // Match legacy alphanumeric format: MH-MUM-98213-B04-F12-U302
  if (LEGACY_ULPIN_3D_REGEX.test(trimmed)) {
    const segments = trimmed.split('-');
    return {
      state: segments[0],
      city: segments[1],
      parcel: segments[2],
      building: segments[3],
      floor: segments[4],
      unit: segments[5],
    };
  }

  // Tolerant parse for hyphenated format
  const parts = trimmed.split('-');
  if (parts.length >= 2) {
    return {
      state: parts[0].slice(0, 2) || 'MH',
      city: parts[0].slice(2, 6) || 'MUM',
      parcel: parts[0].slice(6, 14) || '00000000',
      building: parts[1] || 'B01',
      floor: parts[2] || 'F01',
      unit: parts[3] || parts[parts.length - 1] || 'U01',
    };
  }

  return {
    isError: true,
    reason: 'Invalid 3D ULPIN syntax. Expected format: 14-digit Parent + Suffix (e.g. 27101500485488-F3-U301)',
    rawInput: trimmed,
  };
}

export function isUlpinError(result: UlpinParts | UlpinError): result is UlpinError {
  return 'isError' in result && result.isError === true;
}

export function computeCheckDigits(id: string): string {
  // ISO 7064 Mod 97-10 check digit computation over alphanumeric string
  let checksum = 0;
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    checksum = (checksum * 31 + code) % 97;
  }
  const check = (98 - (checksum % 97)) % 97;
  return check.toString().padStart(2, '0');
}

export interface RegistrySnapshot {
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  verticalParcels: VerticalParcel[];
}

export function validateUlpin3d(id: string, registry: RegistrySnapshot, currentUnitId?: string): UlpinValidationResult {
  const reasons: string[] = [];

  // Check strict 14-digit parent preservation if unit belongs to a building
  const unit = registry.units.find((u) => u.ulpin3d === id);
  if (unit && unit.parentUlpin) {
    const strictCheck = validateChildUlpinStrict(id, unit.parentUlpin);
    if (!strictCheck.valid && strictCheck.error) {
      reasons.push(strictCheck.error);
    }
  }

  const decoded = decodeUlpin3d(id);
  if (isUlpinError(decoded)) {
    reasons.push(decoded.reason);
    return { valid: false, reasons };
  }

  // 1. Verify duplicate ULPIN in units registry (excluding currentUnitId if updating)
  const duplicateUnit = registry.units.find(
    (u) => u.ulpin3d === id && (!currentUnitId || u.unitId !== currentUnitId)
  );
  if (duplicateUnit) {
    reasons.push(`Duplicate 3D ULPIN: Already assigned to Unit '${duplicateUnit.flatNumber || duplicateUnit.unitId}' (${duplicateUnit.unitId})`);
  }

  // 2. Vertical parcel overlap check
  const matchingVParcels = registry.verticalParcels.filter((vp) => vp.ulpin3d === id);
  for (const vp of matchingVParcels) {
    if (!vp.topologyValid) {
      for (const conflict of vp.conflicts) {
        reasons.push(`Vertical parcel topology conflict: ${conflict.description} (${conflict.type})`);
      }
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
    parts: decoded,
  };
}
