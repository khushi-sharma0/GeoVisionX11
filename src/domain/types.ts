// Domain types for GeoVision - 3D Cadastral & Vertical Ownership Platform
// CRITICAL: No React imports or UI-specific types allowed in this file.

export type FloorCode = 'B3' | 'B2' | 'B1' | 'GF' | string;

export interface Parcel {
  parcelId: string;          // 5-digit, e.g. '98213'
  ulpin2d: string;           // existing DoLR 2D ULPIN
  surveyNumber: string;
  state: string;             // 'MH'
  city: string;              // 'MUM'
  district: string;
  areaSqm: number;
  landUse: 'Residential' | 'Commercial' | 'Mixed' | 'Industrial' | 'Institutional';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
  source: 'DILRMP' | 'BhuNaksha' | 'SVAMITVA' | 'BMC' | 'Manual';
  bmcWard?: string;
  ctsNumber?: string;
  dilrmpRecordId?: string;
  svamitvaPropertyId?: string;
  bhunakshaPlotNo?: string;
  zoneCode?: string;
}

export interface Building {
  buildingId: string;        // 'B04'
  parcelId: string;
  name: string;
  address?: string;          // e.g. 'Worli Sea Face, Mumbai, Maharashtra 400030'
  ulpin?: string;            // e.g. '27101500984123'
  footprint: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  baseElevationM: number;    // terrain height at centroid
  heightM: number;
  floorsAbove: number;
  floorsBelow: number;
  yearBuilt?: number;
  approvedFloors: number;    // drives encroachment detection
  extractionConfidence: number; // 0–1
  status: 'Verified' | 'Pending' | 'Flagged';
  sourceAuthority?: 'BMC' | 'DILRMP' | 'BhuNaksha' | 'SVAMITVA' | 'DoLR';
  bmcCtsNo?: string;
  bmcApprovalRef?: string;
  dilrmp712No?: string;
  svamitvaCardNo?: string;
  corsStationId?: string;
  gnssAccuracyM?: string;
}

export interface Floor {
  floorId: string;
  buildingId: string;
  code: FloorCode;
  label: string;             // 'Basement 2', 'Ground Floor', '12th Floor'
  baseHeightM: number;       // relative to building base
  heightM: number;
  areaSqm: number;
  usage: 'Parking' | 'Retail' | 'Office' | 'Residential' | 'Utility' | 'Amenity';
  unitCount: number;
  segmentationConfidence: number;
  ownershipStatus: 'Fully Mapped' | 'Partially Mapped' | 'Unmapped' | 'Disputed';
  disputeIds?: string[];
}

export interface Unit {
  unitId: string;            // 'U302'
  floorId: string;
  flatNumber: string;
  ulpin3d: string;
  parentUlpin?: string;      // Base cadastral identity e.g. 'MH-2026-458712'
  ownerName: string;
  ownerId: string;           // masked in Authority views e.g. 'AADH-****-7812'
  propertyType?: 'Apartment' | 'Commercial Office' | 'Retail Shop' | 'Parking Slot' | 'Storage Unit' | 'Air-Rights' | 'Subsurface Utility' | 'Rooftop Telecom / Solar' | 'Elevated Corridor';
  builtUpAreaSqm: number;
  carpetAreaSqm: number;
  volumeM3?: number;
  elevationRange?: { minM: number; maxM: number };
  encumbranceStatus?: 'Clear' | 'Disputed' | 'Mortgaged to Bank' | 'Statutory Lien';
  parkingSlot?: string;
  storage?: string;
  taxStatus: 'Paid' | 'Due' | 'Overdue';
  registrationDate: string;  // ISO
  verificationStatus: 'Verified' | 'Pending Approval' | 'Rejected';
  topologyStatus?: 'Valid' | 'Conflict Detected';
  coordinateSource?: string; // 'Source: GNSS/CORS Network'
  approvedBy?: string;
  disputeIds: string[];
  corsReference?: {
    stationId: string;
    rtkPrecision: string;
    datum: string;
    epoch: string;
  };
  boundingBox3D?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface TopologyConflict {
  conflictId: string;
  type: 'HeightOverlap' | 'BoundaryExtrusion' | 'VolumeDiscrepancy' | 'UnclaimedVoid';
  severity: 'Critical' | 'Warning';
  sourceUlpin3d: string;
  targetUlpin3d: string;
  overlapHeightMinM: number;
  overlapHeightMaxM: number;
  description: string;
}

export interface VerticalParcel {
  ulpin3d: string;
  parcelId: string;
  buildingId: string;
  floorId: string;
  unitId: string;
  footprint: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  minHeightM: number;   // absolute elevation
  maxHeightM: number;
  volumeM3: number;
  topologyValid: boolean;
  conflicts: TopologyConflict[];
}

export interface UlpinParts {
  state: string;     // e.g. 'MH'
  city: string;      // e.g. 'MUM'
  parcel: string;    // e.g. '98213'
  building: string;  // e.g. 'B04'
  floor: string;     // e.g. 'FB2', 'FGF', 'F12'
  unit: string;      // e.g. 'U302'
}

export interface UlpinError {
  isError: true;
  reason: string;
  rawInput: string;
}

export interface UlpinValidationResult {
  valid: boolean;
  reasons: string[];
  parts?: UlpinParts;
}

export interface CadastralDispute {
  disputeId: string;
  buildingId: string;
  unitId?: string;
  parcelId?: string;
  ulpin3d?: string;
  disputeType: string;
  petitionerName: string;
  claimant?: string;
  targetUnitOrBuilding: string;
  respondentName?: string;
  respondent?: string;
  description: string;
  status: 'Under Review' | 'Site Inspection Scheduled' | 'Hearing Scheduled' | 'Active' | 'Resolved';
  filingDate: string;
  hearingDate?: string;
  evidenceFiles?: string;
  assignedOfficer?: string;
  timeline?: {
    date: string;
    action: string;
    officer: string;
    remarks: string;
  }[];
}

export type Dispute = CadastralDispute;

export interface Complaint {
  complaintId: string;
  citizenId: string;
  citizenName: string;
  category: 'Boundary Dispute' | 'Illegal Construction / Encroachment' | 'Floor Plan Discrepancy' | 'Tax / Assessment Error' | 'Unauthorized Partition' | 'Utility / Easement Obstruction' | 'General';
  linkedPropertyId: string; // e.g. ULPIN, Survey No, or Building Name
  parcelId?: string;
  buildingId?: string;
  unitId?: string;
  subject: string;
  description: string;
  evidenceFileName?: string;
  status: 'Pending' | 'In Review' | 'Resolved' | 'Rejected';
  filingDate: string;
  authorityRemarks?: string;
  assignedOfficer?: string;
  updatedAt: string;
}

export type UserRole = 'Citizen' | 'SurveyOfficer' | 'MunicipalOfficer' | 'SystemAdministrator' | 'Authority';
