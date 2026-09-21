// Deterministic seed data generator for GeoVision
// Uses a linear congruential generator (LCG) to ensure byte-identical results on every reload.

import { Parcel, Building, Floor, Unit, VerticalParcel, FloorCode } from '../domain/types';
import { encodeUlpin3d } from '../domain/ulpin';
import { generateCadastreForCoordinates } from './cadastreRegistryGenerator';

// Seeded PRNG
class LCG {
  private m = 0x80000000; // 2**31
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  nextInt(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }

  nextFloat(): number {
    return this.nextInt() / (this.m - 1);
  }

  range(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.nextFloat() * arr.length)];
  }
}

export interface CityConfig {
  id: string;
  name: string;
  code: string;
  state: string;
  center: [number, number]; // [lng, lat]
  elevation: number;
  description: string;
  focus: string;
}

export const CITIES: CityConfig[] = [
  {
    id: 'mumbai',
    name: 'Mumbai (BKC)',
    code: 'MUM',
    state: 'MH',
    center: [72.8688, 19.0657],
    elevation: 8,
    description: 'Bandra Kurla Complex - High-density vertical financial district',
    focus: 'High-rise mixed use, 3D cadastral commercial tower',
  },
  {
    id: 'pune',
    name: 'Pune (Hinjawadi)',
    code: 'PUN',
    state: 'MH',
    center: [73.7280, 18.5912],
    elevation: 560,
    description: 'Hinjawadi Phase 1 IT Park & Township',
    focus: 'IT campus, Vertical sanction encroachment case',
  },
  {
    id: 'delhi',
    name: 'Delhi (Connaught Place)',
    code: 'DEL',
    state: 'DL',
    center: [77.2197, 28.6315],
    elevation: 216,
    description: 'Connaught Place Heritage Circle & Metro Interchanges',
    focus: 'Heritage colonnade + Multi-level underground metro utilities',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad (GIFT City)',
    code: 'AMD',
    state: 'GJ',
    center: [72.6841, 23.1611],
    elevation: 42,
    description: 'Gujarat International Finance Tec-City',
    focus: 'Planned multi-level vertical cadastral jurisdiction',
  },
];

export interface SeedDataResult {
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  verticalParcels: VerticalParcel[];
}

export function generateSeedData(): SeedDataResult {
  const rng = new LCG(42078); // Deterministic seed

  const parcels: Parcel[] = [];
  const buildings: Building[] = [];
  const floors: Floor[] = [];
  const units: Unit[] = [];
  const verticalParcels: VerticalParcel[] = [];

  // 1. MUMBAI BKC - Includes Hero Building (B04 on Parcel 98213)
  const mumParcel1Poly: number[][][] = [[
    [72.8682, 19.0652],
    [72.8696, 19.0652],
    [72.8696, 19.0664],
    [72.8682, 19.0664],
    [72.8682, 19.0652],
  ]];

  parcels.push({
    parcelId: '98213',
    ulpin2d: '27710400098213', // Official 14-character DoLR Bhu-Aadhaar format
    surveyNumber: 'CS-418/2B',
    state: 'MH',
    city: 'MUM',
    district: 'Mumbai Suburban',
    areaSqm: 14250,
    landUse: 'Mixed',
    geometry: { type: 'Polygon', coordinates: mumParcel1Poly },
    source: 'DILRMP',
  });

  // Hero Building B04 - Platinum Horizon Tower (Articulated stepped high-rise footprint with podium setbacks)
  const heroFootprint: number[][][] = [[
    [72.86845, 19.06540],
    [72.86920, 19.06540],
    [72.86938, 19.06568],
    [72.86938, 19.06602],
    [72.86912, 19.06625],
    [72.86878, 19.06625],
    [72.86878, 19.06592],
    [72.86845, 19.06592],
    [72.86845, 19.06540],
  ]];

  const heroBuilding: Building = {
    buildingId: 'B04',
    parcelId: '98213',
    name: 'Godrej BKC Tower (Platinum Horizon)',
    address: 'Plot C-68, G-Block, BKC Central, Bandra Kurla Complex, Mumbai 400051',
    ulpin: 'MH-2026-458712',
    footprint: { type: 'Polygon', coordinates: heroFootprint },
    baseElevationM: 0,
    heightM: 78.4,
    floorsAbove: 19,
    floorsBelow: 2,
    yearBuilt: 2021,
    approvedFloors: 19,
    extractionConfidence: 0.98,
    status: 'Verified',
    sourceAuthority: 'BMC',
    bmcCtsNo: 'CTS 418/2B',
    bmcApprovalRef: 'BMC-BP-2021-GBLK-0884',
    corsStationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
    gnssAccuracyM: '±8mm horizontal / ±14mm vertical',
  };
  buildings.push(heroBuilding);

  // Generate floors for Hero Tower: B2, B1, GF, 01..17, plus RF (Rooftop & Air-Rights)
  const heroFloorConfigs: { code: FloorCode; label: string; usage: Floor['usage']; height: number; ownershipStatus: Floor['ownershipStatus'] }[] = [
    { code: 'B2', label: 'Basement 2 (Lower Mechanical & Reserved Parking)', usage: 'Parking', height: 3.5, ownershipStatus: 'Fully Mapped' },
    { code: 'B1', label: 'Basement 1 (Visitor Parking & BMS Utility)', usage: 'Utility', height: 3.5, ownershipStatus: 'Fully Mapped' },
    { code: 'GF', label: 'Ground Floor (Atrium & Commercial Retail Arcade)', usage: 'Retail', height: 4.8, ownershipStatus: 'Fully Mapped' },
    { code: '01', label: 'Level 1 (Financial Services Hub)', usage: 'Office', height: 3.8, ownershipStatus: 'Fully Mapped' },
    { code: '02', label: 'Level 2 (Corporate Offices)', usage: 'Office', height: 3.8, ownershipStatus: 'Fully Mapped' },
    { code: '03', label: 'Level 3 (Corporate Offices)', usage: 'Office', height: 3.8, ownershipStatus: 'Fully Mapped' },
    { code: '04', label: 'Level 4 (Executive Suites)', usage: 'Office', height: 3.8, ownershipStatus: 'Fully Mapped' },
    { code: '05', label: 'Level 5 (Podium Club & Wellness Amenity)', usage: 'Amenity', height: 4.2, ownershipStatus: 'Fully Mapped' },
    { code: '06', label: 'Level 6 (Residential Suites A)', usage: 'Residential', height: 3.4, ownershipStatus: 'Fully Mapped' },
    { code: '07', label: 'Level 7 (Residential Suites B)', usage: 'Residential', height: 3.4, ownershipStatus: 'Partially Mapped' },
    { code: '08', label: 'Level 8 (Residential Suites C)', usage: 'Residential', height: 3.4, ownershipStatus: 'Fully Mapped' },
    { code: '09', label: 'Level 9 (Residential Suites D)', usage: 'Residential', height: 3.4, ownershipStatus: 'Disputed' }, // Deliberate disputed floor
    { code: '10', label: 'Level 10 (Residential Suites E)', usage: 'Residential', height: 3.4, ownershipStatus: 'Fully Mapped' },
    { code: '11', label: 'Level 11 (Residential Suites F)', usage: 'Residential', height: 3.4, ownershipStatus: 'Fully Mapped' },
    { code: '12', label: 'Level 12 (Premium Executive Residences)', usage: 'Residential', height: 3.6, ownershipStatus: 'Fully Mapped' }, // Hero floor!
    { code: '13', label: 'Level 13 (Sky Residences A)', usage: 'Residential', height: 3.6, ownershipStatus: 'Fully Mapped' },
    { code: '14', label: 'Level 14 (Sky Residences B)', usage: 'Residential', height: 3.6, ownershipStatus: 'Fully Mapped' },
    { code: '15', label: 'Level 15 (Sky Residences C)', usage: 'Residential', height: 3.6, ownershipStatus: 'Fully Mapped' },
    { code: '16', label: 'Level 16 (Duplex Penthouse Lower)', usage: 'Residential', height: 3.8, ownershipStatus: 'Fully Mapped' },
    { code: '17', label: 'Level 17 (Duplex Penthouse Upper & Sky Deck)', usage: 'Residential', height: 4.0, ownershipStatus: 'Fully Mapped' },
    { code: 'RF', label: 'Rooftop (Airspace Envelope, Telecom Tower & Air-Rights)', usage: 'Amenity', height: 4.5, ownershipStatus: 'Fully Mapped' },
  ];

  let currentElevation = 0;
  // Basements have negative base heights
  const b2Base = -7.0;
  const b1Base = -3.5;

  heroFloorConfigs.forEach((cfg) => {
    let baseHeight = 0;
    if (cfg.code === 'B2') baseHeight = b2Base;
    else if (cfg.code === 'B1') baseHeight = b1Base;
    else {
      baseHeight = currentElevation;
      currentElevation += cfg.height;
    }

    const floorId = `FL-MUM-B04-${cfg.code}`;
    const floorObj: Floor = {
      floorId,
      buildingId: 'B04',
      code: cfg.code,
      label: cfg.label,
      baseHeightM: baseHeight,
      heightM: cfg.height,
      areaSqm: 880,
      usage: cfg.usage,
      unitCount: cfg.code === 'RF' ? 2 : cfg.code.startsWith('B') ? 4 : (cfg.code === 'GF' ? 6 : 4),
      segmentationConfidence: 0.96,
      ownershipStatus: cfg.ownershipStatus,
    };
    floors.push(floorObj);

    // Populate units for this floor
    const uCount = floorObj.unitCount;

    if (cfg.code === 'RF') {
      // 1. Air-Rights Child Property (Fix #29 & Core Requirement §1)
      const airRightsUlpin = 'MH-2026-458712-RF-AIR01';
      const airRightsUnit: Unit = {
        unitId: 'U-AIR01',
        floorId,
        parentUlpin: 'MH-2026-458712',
        flatNumber: 'Air-Rights Sky Corridor (TDR Envelope)',
        ulpin3d: airRightsUlpin,
        ownerName: 'Maharashtra Airport & Airspace Development Authority (TDR Bank)',
        ownerId: 'GOV-MH-TDR-4412-****',
        propertyType: 'Air-Rights',
        builtUpAreaSqm: 880.0,
        carpetAreaSqm: 880.0,
        volumeM3: 42500,
        elevationRange: { minM: 78.4, maxM: 108.4 },
        encumbranceStatus: 'Clear',
        taxStatus: 'Paid',
        registrationDate: '2023-01-10T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'DGCA / Ministry of Civil Aviation & DoLR Cadastre Directorate',
        coordinateSource: 'Source: GNSS/CORS Network',
        topologyStatus: 'Valid',
        disputeIds: [],
        corsReference: {
          stationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
          rtkPrecision: 'Horizontal ±8mm / Vertical ±14mm',
          datum: 'ITRF2020 / WGS 84 (EPSG:4978)',
          epoch: '2026.24',
        },
        boundingBox3D: {
          minX: 72.86845,
          maxX: 72.86938,
          minY: 19.06540,
          maxY: 19.06625,
          minZ: 78.4,
          maxZ: 108.4,
        },
      };
      units.push(airRightsUnit);

      verticalParcels.push({
        ulpin3d: airRightsUlpin,
        parcelId: '98213',
        buildingId: 'B04',
        floorId,
        unitId: 'U-AIR01',
        footprint: { type: 'Polygon', coordinates: heroFootprint },
        minHeightM: 78.4,
        maxHeightM: 108.4,
        volumeM3: 42500,
        topologyValid: true,
        conflicts: [],
      });

      // 2. Rooftop Telecom & Renewable Solar Asset
      const telecomUlpin = 'MH-2026-458712-RF-T01';
      const telecomUnit: Unit = {
        unitId: 'U-T01',
        floorId,
        parentUlpin: 'MH-2026-458712',
        flatNumber: 'Telecom Tower & Microgrid Asset 01',
        ulpin3d: telecomUlpin,
        ownerName: 'Bharti Infratel & Solis Renewable Asset Holdings',
        ownerId: 'CORP-TELE-9810-****',
        propertyType: 'Rooftop Telecom / Solar',
        builtUpAreaSqm: 120.0,
        carpetAreaSqm: 110.0,
        volumeM3: 4800,
        elevationRange: { minM: 78.4, maxM: 88.0 },
        encumbranceStatus: 'Clear',
        taxStatus: 'Paid',
        registrationDate: '2022-08-14T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'DoT / Wireless Planning & Coordination Wing',
        coordinateSource: 'Source: GNSS/CORS Network',
        topologyStatus: 'Valid',
        disputeIds: [],
        corsReference: {
          stationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
          rtkPrecision: 'Horizontal ±8mm / Vertical ±14mm',
          datum: 'ITRF2020 / WGS 84',
          epoch: '2026.24',
        },
      };
      units.push(telecomUnit);

      verticalParcels.push({
        ulpin3d: telecomUlpin,
        parcelId: '98213',
        buildingId: 'B04',
        floorId,
        unitId: 'U-T01',
        footprint: { type: 'Polygon', coordinates: heroFootprint },
        minHeightM: 78.4,
        maxHeightM: 88.0,
        volumeM3: 4800,
        topologyValid: true,
        conflicts: [],
      });
      return;
    }

    for (let u = 1; u <= uCount; u++) {
      const uNumStr = u.toString().padStart(2, '0');
      // Special check for grievance target units
      const isHeroUnit = cfg.code === '12' && u === 2;
      const isUnit402 = cfg.code === '16' && u === 2;
      const isUnit101 = cfg.code === '03' && u === 1;

      const unitId = isHeroUnit ? 'U302' : isUnit402 ? 'U402' : isUnit101 ? 'U101' : `U${cfg.code.replace('GF', 'G')}${uNumStr}`;
      
      let propType: Unit['propertyType'] = 'Apartment';
      let flatNum = `${cfg.code}-${uNumStr}`;
      let customUlpin: string | null = null;

      if (cfg.code === 'B2' || cfg.code === 'B1') {
        if (u <= 2) {
          propType = 'Parking Slot';
          flatNum = `Demarcated Parking Bay ${cfg.code}-P0${u}`;
          customUlpin = `MH-2026-458712-${cfg.code}-P0${u}`;
        } else {
          propType = 'Subsurface Utility';
          flatNum = `Subsurface Utility Duct & Valve Chamber ${cfg.code}-UT0${u}`;
          customUlpin = `MH-2026-458712-${cfg.code}-UT0${u}`;
        }
      } else if (cfg.code === 'GF') {
        propType = 'Retail Shop';
      } else if (['01', '02', '03', '04'].includes(cfg.code)) {
        propType = 'Commercial Office';
      }

      if (isHeroUnit) {
        flatNum = 'Flat 302 (Executive Penthouse Residence)';
        customUlpin = 'MH-MUM-98213-B04-F12-U302';
      } else if (isUnit402) {
        flatNum = 'Flat 402 (Duplex Penthouse Upper)';
        customUlpin = 'MH-MUM-98213-B04-F16-U402';
      } else if (isUnit101) {
        flatNum = 'Suite 101 (Executive Commercial Wing)';
        customUlpin = 'MH-MUM-98213-B04-F03-U101';
      }

      const ulpin3d = customUlpin || encodeUlpin3d({
        state: 'MH',
        city: 'MUM',
        parcel: '98213',
        building: 'B04',
        floor: `F${cfg.code}`,
        unit: isHeroUnit ? 'U302' : isUnit402 ? 'U402' : isUnit101 ? 'U101' : `U${u.toString().padStart(3, '0')}`,
      });

      const isDisputed = cfg.code === '09' && u === 1;

      const unitObj: Unit = {
        unitId,
        floorId,
        parentUlpin: 'MH-2026-458712',
        flatNumber: flatNum,
        ulpin3d,
        ownerName: (isHeroUnit || isUnit402 || isUnit101) ? 'Aditya Vikram Singhania' : `Property Holder ${flatNum}`,
        ownerId: `MH-REG-${rng.range(1000, 9999).toFixed(0)}-****`,
        propertyType: propType,
        coordinateSource: 'Source: GNSS/CORS Network',
        topologyStatus: isDisputed ? 'Conflict Detected' : 'Valid',
        builtUpAreaSqm: isHeroUnit ? 185.4 : 142.5,
        carpetAreaSqm: isHeroUnit ? 156.0 : 118.0,
        volumeM3: Math.round((880 * cfg.height) / uCount),
        elevationRange: {
          minM: Math.round((baseHeight) * 10) / 10,
          maxM: Math.round((baseHeight + cfg.height) * 10) / 10,
        },
        encumbranceStatus: isDisputed ? 'Disputed' : 'Clear',
        parkingSlot: `P-B1-${rng.range(10, 99).toFixed(0)}`,
        storage: `S-B2-${u}`,
        taxStatus: isDisputed ? 'Overdue' : 'Paid',
        registrationDate: '2022-03-15T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'Divisional Joint Registrar, Mumbai Suburban',
        disputeIds: isDisputed ? ['DISP-MH-2024-0891'] : [],
        corsReference: {
          stationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
          rtkPrecision: 'Horizontal ±8mm / Vertical ±14mm',
          datum: 'ITRF2020 / WGS 84 (EPSG:4978)',
          epoch: '2026.24',
        },
        boundingBox3D: {
          minX: 72.86845,
          maxX: 72.86938,
          minY: 19.06540,
          maxY: 19.06625,
          minZ: baseHeight,
          maxZ: baseHeight + cfg.height,
        },
      };
      units.push(unitObj);

      // Create vertical parcel prism
      verticalParcels.push({
        ulpin3d,
        parcelId: '98213',
        buildingId: 'B04',
        floorId,
        unitId,
        footprint: { type: 'Polygon', coordinates: heroFootprint },
        minHeightM: baseHeight,
        maxHeightM: baseHeight + cfg.height,
        volumeM3: Math.round((880 * cfg.height) / uCount),
        topologyValid: !isDisputed,
        conflicts: isDisputed ? [
          {
            conflictId: 'CONF-09-01',
            type: 'HeightOverlap',
            severity: 'Critical',
            sourceUlpin3d: ulpin3d,
            targetUlpin3d: 'MH-2026-458712-F08-U001',
            overlapHeightMinM: baseHeight,
            overlapHeightMaxM: baseHeight + 0.4,
            description: 'Volumetric elevation overlap detected with Level 8 slab prism',
          },
        ] : [],
      });
    }
  });

  // Elevated Transport Corridor (Req #31): 3D Volumetric Metro/Flyover Corridor with unique Child ULPINs
  const elevatedCorridorFootprint: number[][][] = [[
    [72.86795, 19.06505],
    [72.86985, 19.06515],
    [72.86982, 19.06528],
    [72.86792, 19.06518],
    [72.86795, 19.06505],
  ]];

  const elevatedCorridorBuilding: Building = {
    buildingId: 'EC01',
    parcelId: '98213',
    name: 'BKC Elevated Metro Viaduct Corridor (Line 2B)',
    address: 'BKC Central Elevated Transit ROW, Bandra Kurla Complex, Mumbai 400051',
    ulpin: 'MH-2026-458712',
    footprint: { type: 'Polygon', coordinates: elevatedCorridorFootprint },
    baseElevationM: 12.0,
    heightM: 9.5,
    floorsAbove: 2,
    floorsBelow: 0,
    yearBuilt: 2023,
    approvedFloors: 2,
    extractionConfidence: 0.99,
    status: 'Verified',
    sourceAuthority: 'DoLR',
    corsStationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
    gnssAccuracyM: '±6mm horizontal / ±11mm vertical',
  };
  buildings.push(elevatedCorridorBuilding);

  const ecFloorId = 'FL-MUM-EC01-01';
  floors.push({
    floorId: ecFloorId,
    buildingId: 'EC01',
    code: '01',
    label: 'Elevated Metro Guideway & Track Slab Deck',
    baseHeightM: 12.0,
    heightM: 4.8,
    areaSqm: 1420,
    usage: 'Utility',
    unitCount: 2,
    segmentationConfidence: 0.98,
    ownershipStatus: 'Fully Mapped',
  });

  units.push({
    unitId: 'U-EC-01',
    floorId: ecFloorId,
    parentUlpin: 'MH-2026-458712',
    flatNumber: 'Elevated Metro Viaduct Right-of-Way Segment 01',
    ulpin3d: 'MH-2026-458712-EC-01',
    ownerName: 'Mumbai Metropolitan Region Development Authority (MMRDA Transit)',
    ownerId: 'GOV-MMRDA-METRO-02B',
    propertyType: 'Elevated Corridor',
    coordinateSource: 'Source: GNSS/CORS Network',
    topologyStatus: 'Valid',
    builtUpAreaSqm: 710.0,
    carpetAreaSqm: 680.0,
    volumeM3: 3400,
    elevationRange: { minM: 12.0, maxM: 16.8 },
    encumbranceStatus: 'Clear',
    taxStatus: 'Paid',
    registrationDate: '2023-06-01T00:00:00.000Z',
    verificationStatus: 'Verified',
    approvedBy: 'Ministry of Housing and Urban Affairs (MoHUA)',
    disputeIds: [],
    corsReference: {
      stationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
      rtkPrecision: 'Horizontal ±6mm / Vertical ±11mm',
      datum: 'ITRF2020 / WGS 84 (EPSG:4978)',
      epoch: '2026.24',
    },
  });

  units.push({
    unitId: 'U-EC-02',
    floorId: ecFloorId,
    parentUlpin: 'MH-2026-458712',
    flatNumber: 'BKC Concourse Station Elevated Airspace Deck',
    ulpin3d: 'MH-2026-458712-EC-02',
    ownerName: 'Maha Mumbai Metro Operation Corp Ltd (MMMOCL)',
    ownerId: 'GOV-MMMOCL-STN-044',
    propertyType: 'Elevated Corridor',
    coordinateSource: 'Source: GNSS/CORS Network',
    topologyStatus: 'Valid',
    builtUpAreaSqm: 710.0,
    carpetAreaSqm: 660.0,
    volumeM3: 3400,
    elevationRange: { minM: 16.8, maxM: 21.5 },
    encumbranceStatus: 'Clear',
    taxStatus: 'Paid',
    registrationDate: '2023-06-01T00:00:00.000Z',
    verificationStatus: 'Verified',
    approvedBy: 'Ministry of Housing and Urban Affairs (MoHUA)',
    disputeIds: [],
    corsReference: {
      stationId: 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
      rtkPrecision: 'Horizontal ±6mm / Vertical ±11mm',
      datum: 'ITRF2020 / WGS 84 (EPSG:4978)',
      epoch: '2026.24',
    },
  });

  // Mumbai second parcel 98214 (North adjacent plot) and building B02 (BKC Executive Annex)
  const mumParcel2Poly: number[][][] = [[
    [72.8681, 19.0664],
    [72.8696, 19.0664],
    [72.8696, 19.0674],
    [72.8681, 19.0674],
    [72.8681, 19.0664],
  ]];
  parcels.push({
    parcelId: '98214',
    ulpin2d: 'MH-MUM-98214-00000',
    surveyNumber: 'CS-418/2C',
    state: 'MH',
    city: 'MUM',
    district: 'Mumbai Suburban',
    areaSqm: 8800,
    landUse: 'Commercial',
    geometry: { type: 'Polygon', coordinates: mumParcel2Poly },
    source: 'DILRMP',
  });

  const mumB02Footprint: number[][][] = [[
    [72.86835, 19.06655],
    [72.86890, 19.06655],
    [72.86890, 19.06685],
    [72.86865, 19.06685],
    [72.86865, 19.06720],
    [72.86835, 19.06720],
    [72.86835, 19.06655],
  ]];
  buildings.push({
    buildingId: 'B02',
    parcelId: '98214',
    name: 'BKC Executive Annex',
    address: 'Plot C-24, G-Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    ulpin: 'MH-MUM-98214-B02',
    footprint: { type: 'Polygon', coordinates: mumB02Footprint },
    baseElevationM: 8.5,
    heightM: 32.0,
    floorsAbove: 8,
    floorsBelow: 1,
    approvedFloors: 8,
    extractionConfidence: 0.94,
    status: 'Verified',
  });

  // Add floors & units for BKC Executive Annex
  for (let fl = 1; fl <= 8; fl++) {
    const code = fl === 1 ? 'GF' : `0${fl - 1}`;
    const floorId = `FL-MUM-B02-${code}`;
    floors.push({
      floorId,
      buildingId: 'B02',
      code,
      label: fl === 1 ? 'Ground Floor (Retail & Reception)' : `Level ${code} (Commercial Suites)`,
      baseHeightM: (fl - 1) * 3.8,
      heightM: 3.8,
      areaSqm: 640,
      usage: fl === 1 ? 'Retail' : 'Office',
      unitCount: 3,
      segmentationConfidence: 0.95,
      ownershipStatus: 'Fully Mapped',
    });

    for (let u = 1; u <= 3; u++) {
      units.push({
        unitId: `U-B02-${code}-0${u}`,
        floorId,
        flatNumber: `Suite ${code}0${u}`,
        ulpin3d: `MH-MUM-98213-B02-${code}-U0${u}`,
        ownerName: u === 1 ? 'Vertex Financial Consultants' : u === 2 ? 'Apex Wealth Management' : 'Global Logistics Ltd',
        ownerId: `GSTIN-27AABCT${2000 + u}Z1`,
        builtUpAreaSqm: 180,
        carpetAreaSqm: 155,
        taxStatus: 'Paid',
        registrationDate: '2023-01-10T00:00:00.000Z',
        verificationStatus: 'Verified',
        disputeIds: [],
      });
    }
  }

  // 1B. MUMBAI WORLI SEA FACE - Sea Breeze Heights (Reference 3D Property from UI)
  const worliParcelPoly: number[][][] = [[
    [72.8665, 19.0645],
    [72.8678, 19.0645],
    [72.8678, 19.0658],
    [72.8665, 19.0658],
    [72.8665, 19.0645],
  ]];
  parcels.push({
    parcelId: '271015',
    ulpin2d: 'MH-MUM-271015-00000',
    surveyNumber: 'CS-504/A',
    state: 'MH',
    city: 'MUM',
    district: 'Worli, Mumbai City',
    areaSqm: 11500,
    landUse: 'Residential',
    geometry: { type: 'Polygon', coordinates: worliParcelPoly },
    source: 'DILRMP',
  });

  // Sea Breeze Heights (Real faceted coastal wing tower footprint)
  const seaBreezeFootprint: number[][][] = [[
    [72.86675, 19.06480],
    [72.86725, 19.06480],
    [72.86755, 19.06505],
    [72.86755, 19.06550],
    [72.86705, 19.06550],
    [72.86675, 19.06525],
    [72.86675, 19.06480],
  ]];

  const seaBreezeBuilding: Building = {
    buildingId: 'B06',
    parcelId: '271015',
    name: 'Sea Breeze Heights',
    address: 'Worli Sea Face, Mumbai, Maharashtra 400030',
    ulpin: '27101500984123',
    footprint: { type: 'Polygon', coordinates: seaBreezeFootprint },
    baseElevationM: 8.0,
    heightM: 42.0,
    floorsAbove: 10,
    floorsBelow: 1,
    yearBuilt: 2022,
    approvedFloors: 10,
    extractionConfidence: 0.98,
    status: 'Verified',
  };
  buildings.push(seaBreezeBuilding);

  // Sea Breeze Heights Floors: F1..F10
  const sbFloorConfigs: { code: string; label: string; usage: Floor['usage']; height: number }[] = [
    { code: 'F1', label: 'F1 — Ground Floor - Atrium & Parking (820 m²)', usage: 'Parking', height: 4.2 },
    { code: 'F2', label: 'F2 — 2nd Floor - Podium Amenity (820 m²)', usage: 'Amenity', height: 3.8 },
    { code: 'F3', label: 'F3 — 3th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F4', label: 'F4 — 4th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F5', label: 'F5 — 5th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F6', label: 'F6 — 6th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F7', label: 'F7 — 7th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F8', label: 'F8 — 8th Floor - Residential (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F9', label: 'F9 — 9th Floor - Premium Residences (820 m²)', usage: 'Residential', height: 3.6 },
    { code: 'F10', label: 'F10 — Sky Lounge & Penthouse (820 m²)', usage: 'Amenity', height: 4.0 },
  ];

  let sbElevation = 0;
  sbFloorConfigs.forEach((cfg) => {
    const floorId = `FL-MUM-B06-${cfg.code}`;
    floors.push({
      floorId,
      buildingId: 'B06',
      code: cfg.code,
      label: cfg.label,
      baseHeightM: sbElevation,
      heightM: cfg.height,
      areaSqm: 820,
      usage: cfg.usage,
      unitCount: cfg.code === 'F3' ? 3 : cfg.code === 'F10' ? 1 : 2,
      segmentationConfidence: 0.98,
      ownershipStatus: cfg.code === 'F3' ? 'Fully Mapped' : 'Fully Mapped',
    });

    if (cfg.code === 'F3') {
      // Units on F3 matching user reference screenshot!
      units.push({
        unitId: 'U-SB-F3-301',
        floorId,
        flatNumber: 'Unit F3-301',
        ulpin3d: '27101500984123-SB-F3-U01',
        ownerName: 'Priya Nair',
        ownerId: 'AADH-****-9142',
        builtUpAreaSqm: 145.0,
        carpetAreaSqm: 120.0,
        parkingSlot: 'P-B1-08',
        storage: 'S-B1-03',
        taxStatus: 'Paid',
        registrationDate: '2022-08-14T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'Divisional Joint Registrar, Mumbai City',
        disputeIds: [],
      });

      units.push({
        unitId: 'U-SB-F3-302',
        floorId,
        flatNumber: 'Unit F3-302',
        ulpin3d: '27101500984123-SB-F3-U02',
        ownerName: 'Vikram Malhotra',
        ownerId: 'AADH-****-6721',
        builtUpAreaSqm: 140.0,
        carpetAreaSqm: 120.0,
        parkingSlot: 'P-B1-09',
        storage: 'S-B1-04',
        taxStatus: 'Paid',
        registrationDate: '2022-09-01T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'Divisional Joint Registrar, Mumbai City',
        disputeIds: [],
      });

      units.push({
        unitId: 'U-SB-F3-303',
        floorId,
        flatNumber: 'Unit F3-303',
        ulpin3d: '27101500984123-SB-F3-U03',
        ownerName: 'Ananya Deshmukh',
        ownerId: 'AADH-****-3319',
        builtUpAreaSqm: 140.0,
        carpetAreaSqm: 120.0,
        parkingSlot: 'P-B1-10',
        storage: 'S-B1-05',
        taxStatus: 'Due',
        registrationDate: '2023-04-18T00:00:00.000Z',
        verificationStatus: 'Pending Approval',
        approvedBy: 'Under Boundary Review',
        disputeIds: ['DISP-MH-271015-01'],
      });
    } else if (cfg.code === 'F10') {
      units.push({
        unitId: 'U-SB-F10-PH',
        floorId,
        flatNumber: 'Penthouse & Sky Lounge',
        ulpin3d: '27101500984123-SB-F10-PH',
        ownerName: 'Dr. Siddharth Mehra',
        ownerId: 'AADH-****-5581',
        builtUpAreaSqm: 420.0,
        carpetAreaSqm: 380.0,
        parkingSlot: 'P-B1-01 & 02',
        storage: 'S-B1-01',
        taxStatus: 'Paid',
        registrationDate: '2022-11-20T00:00:00.000Z',
        verificationStatus: 'Verified',
        approvedBy: 'Divisional Joint Registrar, Mumbai City',
        disputeIds: [],
      });
    } else {
      units.push({
        unitId: `U-SB-${cfg.code}-01`,
        floorId,
        flatNumber: `Unit ${cfg.code}-01`,
        ulpin3d: `27101500984123-SB-${cfg.code}-U01`,
        ownerName: 'Rohit Sharma',
        ownerId: 'AADH-****-8821',
        builtUpAreaSqm: 135.0,
        carpetAreaSqm: 112.0,
        taxStatus: 'Paid',
        registrationDate: '2023-02-11T00:00:00.000Z',
        verificationStatus: 'Verified',
        disputeIds: [],
      });
      units.push({
        unitId: `U-SB-${cfg.code}-02`,
        floorId,
        flatNumber: `Unit ${cfg.code}-02`,
        ulpin3d: `27101500984123-SB-${cfg.code}-U02`,
        ownerName: 'Kavita Iyer',
        ownerId: 'AADH-****-1194',
        builtUpAreaSqm: 140.0,
        carpetAreaSqm: 118.0,
        taxStatus: 'Paid',
        registrationDate: '2023-03-05T00:00:00.000Z',
        verificationStatus: 'Verified',
        disputeIds: [],
      });
    }

    sbElevation += cfg.height;
  });

  // 2. PUNE HINJAWADI - Encroachment Case (Building B01 on Parcel 44102)
  // Building has 14 floors built but only 12 approved!
  const puneParcelPoly: number[][][] = [[
    [73.7270, 18.5905],
    [73.7295, 18.5905],
    [73.7295, 18.5925],
    [73.7270, 18.5925],
    [73.7270, 18.5905],
  ]];
  parcels.push({
    parcelId: '44102',
    ulpin2d: '27250600044102', // Official 14-char Bhu-Aadhaar format (DoLR)
    surveyNumber: 'SR-89/1',
    state: 'MH',
    city: 'PUN',
    district: 'Pune Tech Zone',
    areaSqm: 21800,
    landUse: 'Commercial',
    geometry: { type: 'Polygon', coordinates: puneParcelPoly },
    source: 'BhuNaksha',
  });

  // CyberVertex Tech Tower (Real U-shaped courtyard campus footprint)
  const puneB01Footprint: number[][][] = [[
    [73.72750, 18.59100],
    [73.72860, 18.59100],
    [73.72860, 18.59190],
    [73.72825, 18.59190],
    [73.72825, 18.59145],
    [73.72785, 18.59145],
    [73.72785, 18.59190],
    [73.72750, 18.59190],
    [73.72750, 18.59100],
  ]];
  const puneBuilding: Building = {
    buildingId: 'B01',
    parcelId: '44102',
    name: 'CyberVertex Tech Tower',
    address: 'Rajiv Gandhi Infotech Park, Hinjawadi Phase 1, Pune, Maharashtra 411057',
    ulpin: '27250600044102-B01',
    footprint: { type: 'Polygon', coordinates: puneB01Footprint },
    baseElevationM: 562.0,
    heightM: 48.0,
    floorsAbove: 14, // 14 built
    floorsBelow: 1,
    yearBuilt: 2020,
    approvedFloors: 12, // Only 12 sanctioned! Flags +2 encroachment
    extractionConfidence: 0.95,
    status: 'Flagged',
  };
  buildings.push(puneBuilding);

  // Add sample floors & units for Pune tower
  for (let fl = 1; fl <= 14; fl++) {
    const code = fl === 1 ? 'GF' : fl.toString().padStart(2, '0');
    const isEncroaching = fl > 12;
    const floorId = `FL-PUN-B01-${code}`;
    floors.push({
      floorId,
      buildingId: 'B01',
      code,
      label: isEncroaching ? `Level ${code} (UNSANCTIONED ENCROACHMENT)` : `Level ${code} - IT Operations (950 m²)`,
      baseHeightM: (fl - 1) * 3.4,
      heightM: 3.4,
      areaSqm: 950,
      usage: 'Office',
      unitCount: 2,
      segmentationConfidence: 0.91,
      ownershipStatus: isEncroaching ? 'Disputed' : 'Fully Mapped',
    });

    units.push({
      unitId: `U-PUN-B01-${code}-01`,
      floorId,
      flatNumber: `Suite ${code}A`,
      ulpin3d: `27250600044102-B01-${code}-U01`,
      ownerName: isEncroaching ? 'Unsanctioned Developer Hold' : 'Syntel Cloud Labs',
      ownerId: 'GSTIN-27AABCS9912K1',
      builtUpAreaSqm: 420.0,
      carpetAreaSqm: 380.0,
      taxStatus: isEncroaching ? 'Due' : 'Paid',
      registrationDate: '2021-06-20T00:00:00.000Z',
      verificationStatus: isEncroaching ? 'Pending Approval' : 'Verified',
      disputeIds: isEncroaching ? ['DISP-PUN-2024-001'] : [],
    });
    units.push({
      unitId: `U-PUN-B01-${code}-02`,
      floorId,
      flatNumber: `Suite ${code}B`,
      ulpin3d: `27250600044102-B01-${code}-U02`,
      ownerName: isEncroaching ? 'Unsanctioned Developer Hold' : 'Tata Consultancy Services',
      ownerId: 'GSTIN-27AABCT4410L1',
      builtUpAreaSqm: 420.0,
      carpetAreaSqm: 380.0,
      taxStatus: isEncroaching ? 'Due' : 'Paid',
      registrationDate: '2021-06-20T00:00:00.000Z',
      verificationStatus: isEncroaching ? 'Pending Approval' : 'Verified',
      disputeIds: isEncroaching ? ['DISP-PUN-2024-002'] : [],
    });
  }

  // 3. DELHI CONNAUGHT PLACE - Deliberately broken parcel with overlapping height ranges
  // (§5: "Include one deliberately broken parcel so topology validation has something true to find:
  //  two vertical parcels with overlapping height ranges on the same footprint.")
  const delhiParcelPoly: number[][][] = [[
    [77.2185, 28.6305],
    [77.2210, 28.6305],
    [77.2210, 28.6325],
    [77.2185, 28.6325],
    [77.2185, 28.6305],
  ]];
  parcels.push({
    parcelId: '11001',
    ulpin2d: 'DL-DEL-11001-00000',
    surveyNumber: 'CP-BLOCK-D/4',
    state: 'DL',
    city: 'DEL',
    district: 'New Delhi Central',
    areaSqm: 18500,
    landUse: 'Commercial',
    geometry: { type: 'Polygon', coordinates: delhiParcelPoly },
    source: 'DILRMP',
  });

  // Statesman Heritage Colonnade (Real radial arc colonnade segment)
  const delhiFootprint: number[][][] = [[
    [77.21890, 28.63110],
    [77.21945, 28.63095],
    [77.22010, 28.63115],
    [77.22030, 28.63165],
    [77.21995, 28.63210],
    [77.21940, 28.63200],
    [77.21885, 28.63165],
    [77.21890, 28.63110],
  ]];
  const delhiBuilding: Building = {
    buildingId: 'B03',
    parcelId: '11001',
    name: 'Statesman Heritage Colonnade',
    address: 'Barakhamba Road, Connaught Place, New Delhi 110001',
    ulpin: 'DL-DEL-11001-B03',
    footprint: { type: 'Polygon', coordinates: delhiFootprint },
    baseElevationM: 216.0,
    heightM: 24.0,
    floorsAbove: 6,
    floorsBelow: 2,
    yearBuilt: 1938,
    approvedFloors: 6,
    extractionConfidence: 0.93,
    status: 'Flagged',
  };
  buildings.push(delhiBuilding);

  // Add Delhi floors and units
  for (let fl = 1; fl <= 6; fl++) {
    const code = fl === 1 ? 'GF' : `0${fl - 1}`;
    const floorId = `FL-DEL-B03-${code}`;
    floors.push({
      floorId,
      buildingId: 'B03',
      code,
      label: fl === 1 ? 'Ground Colonnade (Heritage Arcade)' : `Level ${code} (Press & Cultural Bureaus)`,
      baseHeightM: (fl - 1) * 4.0,
      heightM: 4.0,
      areaSqm: 1200,
      usage: fl === 1 ? 'Retail' : 'Office',
      unitCount: 2,
      segmentationConfidence: 0.94,
      ownershipStatus: code === '03' ? 'Disputed' : 'Fully Mapped',
    });

    const isDelhiGf = fl === 1;
    units.push({
      unitId: isDelhiGf ? 'U-DEL-B03-GF-01' : `U-DEL-${code}-01`,
      floorId,
      flatNumber: isDelhiGf ? 'Ground Arcade Unit GF-01' : `Colonnade Suite ${code}01`,
      ulpin3d: isDelhiGf ? 'DL-DEL-110001-B03-GF-U01' : `DL-DEL-11001-B03-${code}-U01`,
      ownerName: isDelhiGf ? 'Meera Nambiar' : 'National Heritage Trust',
      ownerId: isDelhiGf ? 'CIT-DL-110001-0814' : 'PAN-AAATN8812D',
      builtUpAreaSqm: 550,
      carpetAreaSqm: 490,
      taxStatus: 'Paid',
      registrationDate: '2019-10-15T00:00:00.000Z',
      verificationStatus: 'Verified',
      disputeIds: code === '03' ? ['DISP-DEL-2024-009'] : [],
    });
    units.push({
      unitId: `U-DEL-${code}-02`,
      floorId,
      flatNumber: `Colonnade Suite ${code}02`,
      ulpin3d: `DL-DEL-11001-B03-${code}-U02`,
      ownerName: 'Northern Railway Regional Liaison',
      ownerId: 'GOV-NR-DEL-04',
      builtUpAreaSqm: 550,
      carpetAreaSqm: 490,
      taxStatus: 'Paid',
      registrationDate: '2019-11-20T00:00:00.000Z',
      verificationStatus: 'Verified',
      disputeIds: code === '03' ? ['DISP-DEL-2024-009'] : [],
    });
  }

  // Deliberately broken vertical parcels in Delhi
  const brokenUlpinA = 'DL-DEL-11001-B03-F03-U001';
  const brokenUlpinB = 'DL-DEL-11001-B03-F03-U002';

  verticalParcels.push({
    ulpin3d: brokenUlpinA,
    parcelId: '11001',
    buildingId: 'B03',
    floorId: 'FL-DEL-B03-03',
    unitId: 'U301',
    footprint: { type: 'Polygon', coordinates: delhiFootprint },
    minHeightM: 226.0,
    maxHeightM: 231.0, // Overlaps from 228 to 231
    volumeM3: 3200,
    topologyValid: false,
    conflicts: [
      {
        conflictId: 'CONF-DL-001',
        type: 'HeightOverlap',
        severity: 'Critical',
        sourceUlpin3d: brokenUlpinA,
        targetUlpin3d: brokenUlpinB,
        overlapHeightMinM: 228.0,
        overlapHeightMaxM: 231.0,
        description: 'Critical volumetric collision: 3.0m vertical overlap with DL-DEL-11001-B03-F03-U002 on identical spatial column',
      },
    ],
  });

  verticalParcels.push({
    ulpin3d: brokenUlpinB,
    parcelId: '11001',
    buildingId: 'B03',
    floorId: 'FL-DEL-B03-03',
    unitId: 'U302',
    footprint: { type: 'Polygon', coordinates: delhiFootprint },
    minHeightM: 228.0,
    maxHeightM: 233.0, // Overlaps from 228 to 231
    volumeM3: 3200,
    topologyValid: false,
    conflicts: [
      {
        conflictId: 'CONF-DL-001',
        type: 'HeightOverlap',
        severity: 'Critical',
        sourceUlpin3d: brokenUlpinB,
        targetUlpin3d: brokenUlpinA,
        overlapHeightMinM: 228.0,
        overlapHeightMaxM: 231.0,
        description: 'Critical volumetric collision: 3.0m vertical overlap with DL-DEL-11001-B03-F03-U001 on identical spatial column',
      },
    ],
  });

  // 4. AHMEDABAD GIFT CITY - Planned Vertical Development
  const giftParcelPoly: number[][][] = [[
    [72.6825, 23.1595],
    [72.6860, 23.1595],
    [72.6860, 23.1630],
    [72.6825, 23.1630],
    [72.6825, 23.1595],
  ]];
  parcels.push({
    parcelId: '38235',
    ulpin2d: '24070300038235', // Gujarat DILRMP / AnyRoR 14-character Bhu-Aadhaar
    surveyNumber: 'GIFT-SEZ-T1',
    state: 'GJ',
    city: 'AMD',
    district: 'Gandhinagar SEZ',
    areaSqm: 36000,
    landUse: 'Commercial',
    geometry: { type: 'Polygon', coordinates: giftParcelPoly },
    source: 'DILRMP',
  });

  // Authentic SVAMITVA Parcel: Confined strictly to rural village abadi land
  const ruralSvamitvaPoly: number[][][] = [[
    [73.7220, 18.5870],
    [73.7250, 18.5870],
    [73.7250, 18.5895],
    [73.7220, 18.5895],
    [73.7220, 18.5870],
  ]];
  parcels.push({
    parcelId: 'SV-HINJ-401',
    ulpin2d: '27250600010941', // 14-char Bhu-Aadhaar for Rural Abadi
    surveyNumber: 'Gaothan Plot 42/B (Chalta No. 109)',
    state: 'MH',
    city: 'PUN',
    district: 'Pune Rural / Hinjawadi Gram Panchayat',
    areaSqm: 8400,
    landUse: 'Residential',
    geometry: { type: 'Polygon', coordinates: ruralSvamitvaPoly },
    source: 'SVAMITVA', // Legitimate SVAMITVA drone survey property card
  });

  // GIFT One Financial Spire (Real chamfered diamond financial tower footprint)
  const giftFootprint: number[][][] = [[
    [72.68350, 23.16075],
    [72.68385, 23.16045],
    [72.68445, 23.16045],
    [72.68480, 23.16080],
    [72.68480, 23.16150],
    [72.68445, 23.16185],
    [72.68385, 23.16185],
    [72.68350, 23.16150],
    [72.68350, 23.16075],
  ]];
  buildings.push({
    buildingId: 'B05',
    parcelId: '38235',
    name: 'GIFT One Financial Spire',
    address: 'Road 5C, GIFT City, Gandhinagar, Gujarat 382355',
    ulpin: 'GJ-AMD-38235-B05',
    footprint: { type: 'Polygon', coordinates: giftFootprint },
    baseElevationM: 42.0,
    heightM: 122.0,
    floorsAbove: 28,
    floorsBelow: 3,
    yearBuilt: 2023,
    approvedFloors: 28,
    extractionConfidence: 0.99,
    status: 'Verified',
  });

  // Add sample floors and units for GIFT One
  for (let fl = 1; fl <= 28; fl++) {
    const code = fl === 1 ? 'GF' : fl.toString().padStart(2, '0');
    const floorId = `FL-AMD-B05-${code}`;
    floors.push({
      floorId,
      buildingId: 'B05',
      code,
      label: fl === 1 ? 'Ground Floor (International Banking Atrium)' : `Level ${code} (Offshore Financial Unit)`,
      baseHeightM: (fl - 1) * 4.2,
      heightM: 4.2,
      areaSqm: 1400,
      usage: fl === 1 ? 'Retail' : 'Office',
      unitCount: 2,
      segmentationConfidence: 0.98,
      ownershipStatus: 'Fully Mapped',
    });

    units.push({
      unitId: `U-AMD-${code}-01`,
      floorId,
      flatNumber: `IFSC Suite ${code}01`,
      ulpin3d: `GJ-AMD-38235-B05-${code}-U01`,
      ownerName: 'International Financial Services Centre Authority',
      ownerId: 'IFSCA-REG-2023-99',
      builtUpAreaSqm: 650,
      carpetAreaSqm: 590,
      taxStatus: 'Paid',
      registrationDate: '2023-08-01T00:00:00.000Z',
      verificationStatus: 'Verified',
      disputeIds: [],
    });
    units.push({
      unitId: `U-AMD-${code}-02`,
      floorId,
      flatNumber: `IFSC Suite ${code}02`,
      ulpin3d: `GJ-AMD-38235-B05-${code}-U02`,
      ownerName: 'State Bank of India Overseas Banking Unit',
      ownerId: 'SBI-OBU-GIFT-01',
      builtUpAreaSqm: 650,
      carpetAreaSqm: 590,
      taxStatus: 'Paid',
      registrationDate: '2023-08-15T00:00:00.000Z',
      verificationStatus: 'Verified',
      disputeIds: [],
    });
  }

  // Expanded Statutory Datasets from BMC, DILRMP, ULPIN (DoLR), BhuNaksha, and SVAMITVA
  const additionalSites: {
    lng: number;
    lat: number;
    height: number;
    levels: number;
    name: string;
    address: string;
    footprintCoords?: number[][][];
  }[] = [
    // Mumbai BKC Commercial & Institutional Sector (G-Block Avenue 1 to 5)
    // Real, authentic non-box building footprints extruded from satellite/cadastral outlines
    {
      lng: 72.8660,
      lat: 19.0665,
      height: 78,
      levels: 19,
      name: 'One BKC (Commercial Hub)',
      address: 'Plot C-66, G-Block, Bandra Kurla Complex, Mumbai 400051',
      // Wide dual-wing complex with central recessed atrium
      footprintCoords: [[[72.86540, 19.06610], [72.86655, 19.06615], [72.86655, 19.06685], [72.86615, 19.06685], [72.86615, 19.06655], [72.86580, 19.06655], [72.86580, 19.06685], [72.86540, 19.06685], [72.86540, 19.06610]]],
    },
    {
      lng: 72.8648,
      lat: 19.0645,
      height: 64,
      levels: 16,
      name: 'Maker Maxity BKC',
      address: 'BKC Avenue 1, Bandra East, Mumbai 400051',
      // Multi-faceted polygon campus block
      footprintCoords: [[[72.86430, 19.06410], [72.86525, 19.06420], [72.86540, 19.06460], [72.86510, 19.06495], [72.86420, 19.06485], [72.86410, 19.06445], [72.86430, 19.06410]]],
    },
    {
      lng: 72.8702,
      lat: 19.0658,
      height: 58,
      levels: 14,
      name: 'IL&FS Financial Centre',
      address: 'Plot C-22, G-Block, BKC, Mumbai 400051',
      // Chamfered triangular/trapezoidal modern high-rise tower
      footprintCoords: [[[72.86970, 19.06540], [72.87070, 19.06555], [72.87050, 19.06635], [72.86980, 19.06635], [72.86950, 19.06585], [72.86970, 19.06540]]],
    },
    {
      lng: 72.8715,
      lat: 19.0668,
      height: 72,
      levels: 18,
      name: 'ICICI Bank Regional Towers',
      address: 'Bandra Kurla Complex, Avenue 4, Mumbai 400051',
      // Articulated twin-tower podium complex
      footprintCoords: [[[72.87095, 19.06635], [72.87140, 19.06635], [72.87140, 19.06660], [72.87175, 19.06660], [72.87175, 19.06635], [72.87220, 19.06635], [72.87220, 19.06720], [72.87165, 19.06720], [72.87150, 19.06690], [72.87095, 19.06690], [72.87095, 19.06635]]],
    },
    {
      lng: 72.8682,
      lat: 19.0636,
      height: 68,
      levels: 17,
      name: 'Bharat Diamond Bourse (BDB Complex)',
      address: 'G-Block, BKC Central, Mumbai 400051',
      // Sprawling interconnected multi-quadrangle complex with central courtyards
      footprintCoords: [[[72.86740, 19.06320], [72.86880, 19.06320], [72.86880, 19.06355], [72.86920, 19.06355], [72.86920, 19.06420], [72.86840, 19.06420], [72.86840, 19.06385], [72.86780, 19.06385], [72.86780, 19.06415], [72.86720, 19.06415], [72.86720, 19.06360], [72.86740, 19.06360], [72.86740, 19.06320]]],
    },
    {
      lng: 72.8692,
      lat: 19.0645,
      height: 52,
      levels: 13,
      name: 'Trident BKC Executive Complex',
      address: 'Plot C-56, G-Block, BKC, Mumbai 400051',
      // T-shaped luxury hotel and convention block
      footprintCoords: [[[72.86860, 19.06410], [72.86970, 19.06410], [72.86970, 19.06445], [72.86930, 19.06445], [72.86930, 19.06495], [72.86900, 19.06495], [72.86900, 19.06445], [72.86860, 19.06445], [72.86860, 19.06410]]],
    },
    {
      lng: 72.8655,
      lat: 19.0652,
      height: 48,
      levels: 12,
      name: 'Canara Bank Financial Towers',
      address: 'Plot C-35, G-Block, BKC, Mumbai 400051',
      // Narrow soaring vertical slab tower with corner chamfers (8 vertices)
      footprintCoords: [[[72.86510, 19.06485], [72.86580, 19.06485], [72.86595, 19.06500], [72.86595, 19.06550], [72.86580, 19.06565], [72.86510, 19.06565], [72.86495, 19.06550], [72.86495, 19.06500], [72.86510, 19.06485]]],
    },
    {
      lng: 72.8708,
      lat: 19.0648,
      height: 60,
      levels: 15,
      name: 'SEBI Bhavan National HQ',
      address: 'Plot C-4A, G-Block, BKC, Mumbai 400051',
      // Stepped and curved crescent arc block (10 vertices)
      footprintCoords: [[[72.87020, 19.06440], [72.87110, 19.06440], [72.87135, 19.06470], [72.87135, 19.06515], [72.87110, 19.06530], [72.87050, 19.06530], [72.87050, 19.06490], [72.87000, 19.06490], [72.87000, 19.06465], [72.87020, 19.06440]]],
    },
    {
      lng: 72.8725,
      lat: 19.0658,
      height: 54,
      levels: 14,
      name: 'National Stock Exchange (NSE) Complex',
      address: 'Exchange Plaza, Plot C-1, G-Block, BKC, Mumbai 400051',
      // Striking octagonal / chamfered diamond financial fortress profile (9 vertices)
      footprintCoords: [[[72.87220, 19.06535], [72.87285, 19.06535], [72.87320, 19.06570], [72.87320, 19.06610], [72.87285, 19.06635], [72.87220, 19.06635], [72.87180, 19.06600], [72.87180, 19.06570], [72.87220, 19.06535]]],
    },
    // Pune Hinjawadi Phase 1 (DILRMP / BhuNaksha / SVAMITVA)
    {
      lng: 73.7255,
      lat: 18.5915,
      height: 42,
      levels: 11,
      name: 'Wipro Hinjawadi Tech Park',
      address: 'Plot 2, Hinjawadi Phase 1, Pune 411057',
      // L-shaped dual wing tech campus (7 vertices)
      footprintCoords: [[[73.72510, 18.59110], [73.72590, 18.59110], [73.72590, 18.59145], [73.72555, 18.59145], [73.72555, 18.59190], [73.72510, 18.59190], [73.72510, 18.59110]]],
    },
    {
      lng: 73.7302,
      lat: 18.5910,
      height: 48,
      levels: 12,
      name: 'Infosys Hinjawadi Hub',
      address: 'Plot 44, Hinjawadi Phase 1, Pune 411057',
      // Stepped U-shaped quadrangle (9 vertices)
      footprintCoords: [[[73.72970, 18.59060], [73.73070, 18.59060], [73.73070, 18.59140], [73.73040, 18.59140], [73.73040, 18.59095], [73.73000, 18.59095], [73.73000, 18.59140], [73.72970, 18.59140], [73.72970, 18.59060]]],
    },
    {
      lng: 73.7288,
      lat: 18.5930,
      height: 52,
      levels: 13,
      name: 'Persistent Systems Hinjawadi Campus',
      address: 'Plot 9A, Hinjawadi Phase 1, Pune 411057',
      // Chamfered octagonal block (9 vertices)
      footprintCoords: [[[73.72840, 18.59260], [73.72910, 18.59260], [73.72935, 18.59285], [73.72935, 18.59325], [73.72910, 18.59350], [73.72840, 18.59350], [73.72815, 18.59325], [73.72815, 18.59285], [73.72840, 18.59260]]],
    },
    // Delhi Connaught Place Radial Blocks (DILRMP / DoLR)
    {
      lng: 77.2218,
      lat: 28.6308,
      height: 44,
      levels: 11,
      name: 'Barakhamba Business Tower',
      address: 'Barakhamba Road, Connaught Place, New Delhi 110001',
      // Stepped setback polygon (7 vertices)
      footprintCoords: [[[77.22140, 28.63045], [77.22220, 28.63045], [77.22220, 28.63085], [77.22200, 28.63085], [77.22200, 28.63115], [77.22140, 28.63115], [77.22140, 28.63045]]],
    },
    {
      lng: 77.2225,
      lat: 28.6295,
      height: 64,
      levels: 16,
      name: 'Gopal Das Heritage Bhawan',
      address: '28 Barakhamba Road, New Delhi 110001',
      // Curved radial segmented facade (8 vertices)
      footprintCoords: [[[77.22205, 28.62915], [77.22270, 28.62910], [77.22300, 28.62940], [77.22295, 28.62985], [77.22250, 28.62995], [77.22210, 28.62975], [77.22195, 28.62945], [77.22205, 28.62915]]],
    },
    {
      lng: 77.2180,
      lat: 28.6300,
      height: 56,
      levels: 14,
      name: 'Jeevan Bharati LIC Building',
      address: '124 Connaught Circus, New Delhi 110001',
      // Iconic curved crescent arc colonnade (9 vertices)
      footprintCoords: [[[77.21740, 28.62965], [77.21800, 28.62955], [77.21860, 28.62970], [77.21875, 28.63015], [77.21845, 28.63045], [77.21785, 28.63040], [77.21745, 28.63025], [77.21725, 28.62995], [77.21740, 28.62965]]],
    },
    // Ahmedabad GIFT City SEZ Blocks (BhuNaksha / DoLR)
    {
      lng: 72.6855,
      lat: 23.1622,
      height: 88,
      levels: 22,
      name: 'GIFT Diamond Tower',
      address: 'Block 2, GIFT City SEZ, Gandhinagar 382355',
      // Faceted diamond spire (9 vertices)
      footprintCoords: [[[72.68500, 23.16180], [72.68580, 23.16180], [72.68615, 23.16215], [72.68615, 23.16255], [72.68580, 23.16285], [72.68500, 23.16285], [72.68465, 23.16255], [72.68465, 23.16215], [72.68500, 23.16180]]],
    },
    {
      lng: 72.6828,
      lat: 23.1600,
      height: 70,
      levels: 17,
      name: 'Pragya GIFT City FinTech Hub',
      address: 'Block 3, Processing Area, GIFT City 382355',
      // Stepped twin-podium tower (7 vertices)
      footprintCoords: [[[72.68230, 23.15960], [72.68320, 23.15960], [72.68320, 23.16010], [72.68295, 23.16010], [72.68295, 23.16045], [72.68230, 23.16045], [72.68230, 23.15960]]],
    },
    {
      lng: 72.6846,
      lat: 23.1615,
      height: 82,
      levels: 20,
      name: 'GIFT Two International Tower',
      address: 'Block 5, Road 1C, GIFT City 382355',
      // Stepped setback high-rise (8 vertices)
      footprintCoords: [[[72.68410, 23.16110], [72.68495, 23.16110], [72.68515, 23.16140], [72.68515, 23.16190], [72.68470, 23.16190], [72.68470, 23.16160], [72.68410, 23.16160], [72.68410, 23.16110]]],
    },
  ];

  additionalSites.forEach((site, idx) => {
    const res = generateCadastreForCoordinates(site.lng, site.lat, {
      height: site.height,
      levels: site.levels,
      name: site.name,
      address: site.address,
      footprintCoords: site.footprintCoords,
    });
    // Guarantee 100% distinct building and parcel IDs across all cadastral records
    const uniquePrefix = `CAD${idx + 10}`;
    res.building.buildingId = `${res.building.buildingId}-${uniquePrefix}`;
    res.parcel.parcelId = `${res.parcel.parcelId}-${uniquePrefix}`;
    res.building.parcelId = res.parcel.parcelId;
    res.floors.forEach((f) => { f.buildingId = res.building.buildingId; });
    res.verticalParcels.forEach((v) => { v.buildingId = res.building.buildingId; v.parcelId = res.parcel.parcelId; });

    parcels.push(res.parcel);
    buildings.push(res.building);
    floors.push(...res.floors);
    units.push(...res.units);
    verticalParcels.push(...res.verticalParcels);
  });

  return { parcels, buildings, floors, units, verticalParcels };
}
