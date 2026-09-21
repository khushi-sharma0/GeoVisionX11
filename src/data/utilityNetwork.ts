// Comprehensive 3D Subsurface Utility Pipeline & Infrastructure Network
// Implements continuous 3D tube geometry (polylineVolume) with authentic arterial routing,
// municipal gravity gradients, junction manholes, and building-specific service laterals.

export type UtilityType = 'water' | 'sewer' | 'gas' | 'electric' | 'telecom';

export interface UtilityPipelineSegment {
  id: string;
  name: string;
  utilityType: UtilityType;
  diameterM: number; // pipe outer diameter in meters
  color: string;
  emissiveColor: string;
  description: string;
  isMainTrunk: boolean;
  connectedBuildingIds: string[]; // Building IDs that this pipe directly serves
  // [lng, lat, depthMeters] - depth is negative underground relative to surface datum
  path: [number, number, number][];
}

export interface UtilityJunctionNode {
  id: string;
  name: string;
  utilityType: UtilityType;
  position: [number, number, number]; // [lng, lat, depth]
  diameterM: number;
  heightM: number;
  connectedBuildingIds: string[];
}

export const UTILITY_COLORS: Record<UtilityType, { color: string; emissive: string; label: string }> = {
  water: {
    color: '#0284C7', // Sky / Deep Blue
    emissive: '#38BDF8',
    label: 'Potable Water Main & Service',
  },
  sewer: {
    color: '#78350F', // Dark Brown / Amber Earth
    emissive: '#B45309',
    label: 'Gravity Sewer & Storm Drainage',
  },
  gas: {
    color: '#F59E0B', // Bright Yellow / Amber
    emissive: '#FBBF24',
    label: 'PNG City Gas Distribution',
  },
  electric: {
    color: '#DC2626', // High-Voltage Red
    emissive: '#EF4444',
    label: '33kV Sub-transmission Grid',
  },
  telecom: {
    color: '#059669', // Optical Fiber Emerald Green
    emissive: '#10B981',
    label: 'Multi-duct Optical Fiber Corridor',
  },
};

// ============================================================================
// MUMBAI BKC REAL-WORLD UTILITY DISTRIBUTION GRID
// Modeled accurately along BKC Central Avenue, Avenue 1, 4, 5, and Cross Roads
// ============================================================================

export const BKC_UTILITY_PIPELINES: UtilityPipelineSegment[] = [
  // --------------------------------------------------------------------------
  // 1. POTABLE WATER NETWORK (Blue - depth -5.0m to -5.8m)
  // --------------------------------------------------------------------------
  // Arterial Water Main along BKC Central Boulevard
  {
    id: 'pipe-water-main-central',
    name: 'BKC Central Avenue Municipal Water Main 600mm',
    utilityType: 'water',
    diameterM: 0.6,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Bhandup Reservoir Primary 600mm DI feeder main under BKC Central Avenue',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B06', 'CAD12', 'CAD15', 'CAD18'],
    path: [
      [72.8638, 19.0651, -5.2],
      [72.8660, 19.0651, -5.2],
      [72.8672, 19.0651, -5.3],
      [72.8688, 19.0651, -5.4],
      [72.8702, 19.0651, -5.4],
      [72.8720, 19.0651, -5.5],
      [72.8735, 19.0651, -5.5],
    ],
  },
  // North Water Main along Avenue 4 / G-Block North
  {
    id: 'pipe-water-main-north',
    name: 'G-Block North 450mm Distribution Main',
    utilityType: 'water',
    diameterM: 0.45,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: '450mm ductile iron secondary distribution loop',
    isMainTrunk: true,
    connectedBuildingIds: ['B02', 'CAD10', 'CAD13'],
    path: [
      [72.8654, 19.0664, -5.0],
      [72.8675, 19.0664, -5.1],
      [72.8688, 19.0664, -5.1],
      [72.8710, 19.0664, -5.2],
      [72.8725, 19.0664, -5.2],
    ],
  },
  // Cross Water Link along Cross Street (connecting central to north)
  {
    id: 'pipe-water-cross-bkc',
    name: 'Avenue 3-4 Interconnector Water Line',
    utilityType: 'water',
    diameterM: 0.4,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Grid balancing interconnector',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B02'],
    path: [
      [72.8688, 19.0651, -5.4],
      [72.8688, 19.0658, -5.3],
      [72.8688, 19.0664, -5.1],
    ],
  },
  // Service Lateral to Sea Breeze Heights (B06)
  {
    id: 'pipe-water-b06',
    name: 'Sea Breeze Heights Water Inflow Lateral 250mm',
    utilityType: 'water',
    diameterM: 0.25,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Dedicated 250mm high-pressure water service connection entering B2 basement pump room',
    isMainTrunk: false,
    connectedBuildingIds: ['B06'],
    path: [
      [72.8672, 19.0651, -5.3],
      [72.8672, 19.0650, -5.3],
      [72.86715, 19.06515, -4.8], // Enters Sea Breeze Heights foundation
    ],
  },
  // Service Lateral to Godrej BKC Tower (B04)
  {
    id: 'pipe-water-b04',
    name: 'Godrej BKC Tower Dual Water Service Feed 300mm',
    utilityType: 'water',
    diameterM: 0.3,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Twin 300mm domestic and fire-protection intake lines into B3 underground reservoir',
    isMainTrunk: false,
    connectedBuildingIds: ['B04'],
    path: [
      [72.8688, 19.0655, -5.3],
      [72.86891, 19.06582, -4.5], // Enters Godrej BKC Tower foundation
    ],
  },
  // Service Lateral to ICICI Bank Regional Towers (CAD13)
  {
    id: 'pipe-water-cad13',
    name: 'ICICI Bank Towers Potable Water Feed 300mm',
    utilityType: 'water',
    diameterM: 0.3,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Dedicated potable water line feeding dual subterranean cisterns',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD13', 'B-MUM-886128-CAD13'],
    path: [
      [72.8710, 19.0664, -5.2],
      [72.87157, 19.06677, -4.6], // Enters ICICI Bank foundation
    ],
  },
  // Service Lateral to IL&FS Financial Centre (CAD12)
  {
    id: 'pipe-water-cad12',
    name: 'IL&FS Financial Centre Water Feed 250mm',
    utilityType: 'water',
    diameterM: 0.25,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: '250mm supply lateral from Central Avenue',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD12', 'B-MUM-886128-CAD12'],
    path: [
      [72.8702, 19.0651, -5.4],
      [72.87010, 19.06585, -4.8], // Enters IL&FS foundation
    ],
  },
  // Service Lateral to National Stock Exchange NSE (CAD18)
  {
    id: 'pipe-water-cad18',
    name: 'NSE Complex Dedicated Water Main 350mm',
    utilityType: 'water',
    diameterM: 0.35,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'High-reliability dual municipal water feeder',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD18', 'B-MUM-886128-CAD18'],
    path: [
      [72.8720, 19.0651, -5.5],
      [72.87250, 19.06585, -4.8], // Enters NSE foundation
    ],
  },
  // Service Lateral to Trident BKC (CAD15)
  {
    id: 'pipe-water-cad15',
    name: 'Trident BKC Hospitality Water Intake 300mm',
    utilityType: 'water',
    diameterM: 0.3,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'High-volume commercial hospitality supply connection',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD15', 'B-MUM-886128-CAD15'],
    path: [
      [72.8688, 19.0651, -5.4],
      [72.86915, 19.06452, -4.6], // Enters Trident foundation
    ],
  },
  // Service Lateral to One BKC (CAD10)
  {
    id: 'pipe-water-cad10',
    name: 'One BKC Water Service Lateral 300mm',
    utilityType: 'water',
    diameterM: 0.3,
    color: '#0284C7',
    emissiveColor: '#38BDF8',
    description: 'Dual-wing commercial supply line',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD10', 'B-MUM-886128-CAD10'],
    path: [
      [72.8654, 19.0664, -5.0],
      [72.86597, 19.06647, -4.5], // Enters One BKC foundation
    ],
  },

  // --------------------------------------------------------------------------
  // 2. GRAVITY SEWER & DRAINAGE NETWORK (Brown - depth -9.5m to -12.0m)
  // --------------------------------------------------------------------------
  // Deep Gravity Trunk Sewer along Central Avenue
  {
    id: 'pipe-sewer-trunk-central',
    name: 'BKC Deep Gravity Trunk Sewer 1000mm',
    utilityType: 'sewer',
    diameterM: 1.0,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'Reinforced concrete 1000mm gravity interceptor trunk sloping west towards Mithi River Treatment Facility',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B06', 'CAD12', 'CAD15', 'CAD18'],
    path: [
      [72.8735, 19.0650, -9.8],
      [72.8720, 19.0650, -10.2],
      [72.8702, 19.0650, -10.6],
      [72.8688, 19.0650, -10.9],
      [72.8672, 19.0650, -11.3],
      [72.8650, 19.0650, -11.7],
      [72.8635, 19.0650, -12.2],
    ],
  },
  // North Sewer Collector along Avenue 4
  {
    id: 'pipe-sewer-north-collector',
    name: 'Avenue 4 North Sewer Collector 600mm',
    utilityType: 'sewer',
    diameterM: 0.6,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: '600mm vitrified clay collector line connecting to central trunk via drop manhole',
    isMainTrunk: true,
    connectedBuildingIds: ['B02', 'CAD10', 'CAD13'],
    path: [
      [72.8725, 19.0663, -9.2],
      [72.8710, 19.0663, -9.6],
      [72.8688, 19.0663, -10.1],
      [72.8655, 19.0663, -10.7],
    ],
  },
  // Sewer Drop Manhole connection line from North to Central
  {
    id: 'pipe-sewer-drop-connector',
    name: 'Central Drop Manhole Link 500mm',
    utilityType: 'sewer',
    diameterM: 0.5,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'High-gradient connection conduit',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B02'],
    path: [
      [72.8688, 19.0663, -10.1],
      [72.8688, 19.0657, -10.5],
      [72.8688, 19.0650, -10.9],
    ],
  },
  // Sewer Discharge Lateral: Sea Breeze Heights (B06)
  {
    id: 'pipe-sewer-b06',
    name: 'Sea Breeze Heights Outfall Sewer 300mm',
    utilityType: 'sewer',
    diameterM: 0.3,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'Greywater and blackwater outflow into municipal interceptor manhole MH-W04',
    isMainTrunk: false,
    connectedBuildingIds: ['B06'],
    path: [
      [72.86715, 19.06515, -6.5],
      [72.8672, 19.0650, -11.3], // Connects to Central Sewer Trunk
    ],
  },
  // Sewer Discharge Lateral: Godrej BKC Tower (B04)
  {
    id: 'pipe-sewer-b04',
    name: 'Godrej BKC Tower Basement Outfall Sewer 400mm',
    utilityType: 'sewer',
    diameterM: 0.4,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'Treated STP effluent and sanitary outflow connecting to central manhole MH-C01',
    isMainTrunk: false,
    connectedBuildingIds: ['B04'],
    path: [
      [72.86891, 19.06582, -6.8],
      [72.8688, 19.0657, -10.5], // Connects into central drop line
    ],
  },
  // Sewer Discharge Lateral: ICICI Bank Regional Towers (CAD13)
  {
    id: 'pipe-sewer-cad13',
    name: 'ICICI Bank Towers Sewer Outflow 350mm',
    utilityType: 'sewer',
    diameterM: 0.35,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: '350mm sanitary line discharging into Avenue 4 collector manhole MH-N02',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD13', 'B-MUM-886128-CAD13'],
    path: [
      [72.87157, 19.06677, -6.2],
      [72.8710, 19.0663, -9.6],
    ],
  },
  // Sewer Discharge Lateral: IL&FS Financial Centre (CAD12)
  {
    id: 'pipe-sewer-cad12',
    name: 'IL&FS Sewer Connection 300mm',
    utilityType: 'sewer',
    diameterM: 0.3,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'Discharge line to manhole MH-C02',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD12', 'B-MUM-886128-CAD12'],
    path: [
      [72.87010, 19.06585, -6.4],
      [72.8702, 19.0650, -10.6],
    ],
  },
  // Sewer Discharge Lateral: NSE Complex (CAD18)
  {
    id: 'pipe-sewer-cad18',
    name: 'NSE Complex Sanitary Discharge 400mm',
    utilityType: 'sewer',
    diameterM: 0.4,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'High-capacity dual sewage connection into trunk manhole MH-E01',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD18', 'B-MUM-886128-CAD18'],
    path: [
      [72.87250, 19.06585, -6.6],
      [72.8720, 19.0650, -10.2],
    ],
  },
  // Sewer Discharge Lateral: Trident BKC (CAD15)
  {
    id: 'pipe-sewer-cad15',
    name: 'Trident BKC Commercial Drainage Outfall 350mm',
    utilityType: 'sewer',
    diameterM: 0.35,
    color: '#78350F',
    emissiveColor: '#B45309',
    description: 'Kitchen grease-trap filtered and sanitary effluent conduit',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD15', 'B-MUM-886128-CAD15'],
    path: [
      [72.86915, 19.06452, -6.5],
      [72.8688, 19.0650, -10.9],
    ],
  },

  // --------------------------------------------------------------------------
  // 3. PNG CITY GAS NETWORK (Yellow - depth -3.8m to -4.4m)
  // --------------------------------------------------------------------------
  // City Gas Grid Trunk along Central Boulevard
  {
    id: 'pipe-gas-trunk-central',
    name: 'Mahanagar Gas 300mm Medium-Pressure PNG Trunk',
    utilityType: 'gas',
    diameterM: 0.3,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Coated steel 4-bar medium pressure natural gas arterial supply pipe',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B06', 'CAD12', 'CAD15', 'CAD18'],
    path: [
      [72.8640, 19.0652, -4.0],
      [72.8660, 19.0652, -4.0],
      [72.8672, 19.0652, -4.0],
      [72.8688, 19.0652, -4.1],
      [72.8702, 19.0652, -4.1],
      [72.8720, 19.0652, -4.2],
      [72.8735, 19.0652, -4.2],
    ],
  },
  // Gas Secondary Ring along Avenue 4
  {
    id: 'pipe-gas-ring-north',
    name: 'G-Block North 200mm PNG Ring Line',
    utilityType: 'gas',
    diameterM: 0.2,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Distribution loop serving northern commercial blocks',
    isMainTrunk: true,
    connectedBuildingIds: ['B02', 'CAD10', 'CAD13'],
    path: [
      [72.8655, 19.0665, -3.8],
      [72.8688, 19.0665, -3.8],
      [72.8710, 19.0665, -3.9],
      [72.8725, 19.0665, -3.9],
    ],
  },
  // Gas Service Lateral: Sea Breeze Heights (B06)
  {
    id: 'pipe-gas-b06',
    name: 'Sea Breeze Heights PNG Service Intake 125mm',
    utilityType: 'gas',
    diameterM: 0.15,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Regulated 100mbar residential PNG supply pipeline to metering skid',
    isMainTrunk: false,
    connectedBuildingIds: ['B06'],
    path: [
      [72.8672, 19.0652, -4.0],
      [72.86715, 19.06515, -3.5], // Enters Sea Breeze Heights
    ],
  },
  // Gas Service Lateral: Godrej BKC Tower (B04)
  {
    id: 'pipe-gas-b04',
    name: 'Godrej BKC Tower Commercial PNG Feeder 150mm',
    utilityType: 'gas',
    diameterM: 0.18,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Commercial kitchen and emergency co-generation gas feed line',
    isMainTrunk: false,
    connectedBuildingIds: ['B04'],
    path: [
      [72.8688, 19.0652, -4.1],
      [72.86891, 19.06582, -3.6], // Enters Godrej BKC Tower
    ],
  },
  // Gas Service Lateral: Trident BKC (CAD15)
  {
    id: 'pipe-gas-cad15',
    name: 'Trident BKC Hotel Kitchen PNG Service 200mm',
    utilityType: 'gas',
    diameterM: 0.2,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Heavy commercial kitchen and boiler fuel supply line',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD15', 'B-MUM-886128-CAD15'],
    path: [
      [72.8688, 19.0652, -4.1],
      [72.86915, 19.06452, -3.6], // Enters Trident BKC
    ],
  },
  // Gas Service Lateral: ICICI Bank Regional Towers (CAD13)
  {
    id: 'pipe-gas-cad13',
    name: 'ICICI Bank Cafeteria PNG Feed 125mm',
    utilityType: 'gas',
    diameterM: 0.15,
    color: '#F59E0B',
    emissiveColor: '#FBBF24',
    description: 'Catering and climate plant supply line',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD13', 'B-MUM-886128-CAD13'],
    path: [
      [72.8710, 19.0665, -3.9],
      [72.87157, 19.06677, -3.5], // Enters ICICI Bank
    ],
  },

  // --------------------------------------------------------------------------
  // 4. HIGH-VOLTAGE ELECTRIC GRID (Red - depth -7.0m to -8.0m)
  // --------------------------------------------------------------------------
  // 33kV Arterial Transmission Conduit Bank along Central Avenue
  {
    id: 'pipe-elec-trunk-central',
    name: 'BKC 33kV Concrete Duct Bank Transmission Corridor',
    utilityType: 'electric',
    diameterM: 0.45,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: 'Reinforced 8-way underground duct bank housing 33kV XLPE copper insulated cables from BKC Substation',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B06', 'CAD12', 'CAD15', 'CAD18'],
    path: [
      [72.8638, 19.0649, -7.2],
      [72.8660, 19.0649, -7.3],
      [72.8672, 19.0649, -7.3],
      [72.8688, 19.0649, -7.4],
      [72.8702, 19.0649, -7.4],
      [72.8720, 19.0649, -7.5],
      [72.8735, 19.0649, -7.5],
    ],
  },
  // 33kV North Loop along Avenue 4
  {
    id: 'pipe-elec-loop-north',
    name: 'Avenue 4 33kV Ring Feeder Corridor',
    utilityType: 'electric',
    diameterM: 0.4,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: 'Dual redundant power loop feeding financial institutions',
    isMainTrunk: true,
    connectedBuildingIds: ['B02', 'CAD10', 'CAD13'],
    path: [
      [72.8654, 19.0662, -7.0],
      [72.8688, 19.0662, -7.1],
      [72.8710, 19.0662, -7.1],
      [72.8725, 19.0662, -7.2],
    ],
  },
  // Electric Feed: Sea Breeze Heights (B06)
  {
    id: 'pipe-elec-b06',
    name: 'Sea Breeze Heights 11kV Dual Power Feed',
    utilityType: 'electric',
    diameterM: 0.25,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: '11kV/415V dual redundant electrical feeder cables entering B1 transformer vault',
    isMainTrunk: false,
    connectedBuildingIds: ['B06'],
    path: [
      [72.8672, 19.0649, -7.3],
      [72.86715, 19.06515, -5.2], // Enters Sea Breeze Heights substation
    ],
  },
  // Electric Feed: Godrej BKC Tower (B04)
  {
    id: 'pipe-elec-b04',
    name: 'Godrej BKC Tower 33kV Dedicated Substation Vault Line',
    utilityType: 'electric',
    diameterM: 0.35,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: '33kV express industrial dual feeder with automatic transfer switch (ATS)',
    isMainTrunk: false,
    connectedBuildingIds: ['B04'],
    path: [
      [72.8688, 19.0649, -7.4],
      [72.86891, 19.06582, -5.5], // Enters Godrej BKC Tower basement
    ],
  },
  // Electric Feed: National Stock Exchange NSE (CAD18)
  {
    id: 'pipe-elec-cad18',
    name: 'NSE Financial Exchange Tier-IV 33kV Dual Express Feeder',
    utilityType: 'electric',
    diameterM: 0.4,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: 'Triple-redundant mission critical trading exchange power supply conduits',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD18', 'B-MUM-886128-CAD18'],
    path: [
      [72.8720, 19.0649, -7.5],
      [72.87250, 19.06585, -5.5], // Enters NSE
    ],
  },
  // Electric Feed: ICICI Bank Regional Towers (CAD13)
  {
    id: 'pipe-elec-cad13',
    name: 'ICICI Bank 33kV Data Center Feeder',
    utilityType: 'electric',
    diameterM: 0.35,
    color: '#DC2626',
    emissiveColor: '#EF4444',
    description: 'Tier-III data center high-reliability power intake line',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD13', 'B-MUM-886128-CAD13'],
    path: [
      [72.8710, 19.0662, -7.1],
      [72.87157, 19.06677, -5.4], // Enters ICICI Bank
    ],
  },

  // --------------------------------------------------------------------------
  // 5. OPTICAL FIBER TELECOM NETWORK (Green - depth -2.5m to -3.2m)
  // --------------------------------------------------------------------------
  // High-Density Fiber Backbone along Central Avenue
  {
    id: 'pipe-tel-backbone-central',
    name: 'BKC Ultra-Low Latency Optical Fiber Backbone (144-Core)',
    utilityType: 'telecom',
    diameterM: 0.28,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Multi-operator dark fiber and financial algorithmic trading communications corridor',
    isMainTrunk: true,
    connectedBuildingIds: ['B04', 'B06', 'CAD12', 'CAD15', 'CAD18'],
    path: [
      [72.8638, 19.0653, -2.7],
      [72.8660, 19.0653, -2.7],
      [72.8672, 19.0653, -2.8],
      [72.8688, 19.0653, -2.8],
      [72.8702, 19.0653, -2.9],
      [72.8720, 19.0653, -2.9],
      [72.8735, 19.0653, -3.0],
    ],
  },
  // Northern Telecom Loop along Avenue 4
  {
    id: 'pipe-tel-loop-north',
    name: 'G-Block North Optical Fiber Ring',
    utilityType: 'telecom',
    diameterM: 0.22,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Carrier-neutral redundant telecommunications duct',
    isMainTrunk: true,
    connectedBuildingIds: ['B02', 'CAD10', 'CAD13'],
    path: [
      [72.8654, 19.0666, -2.5],
      [72.8688, 19.0666, -2.6],
      [72.8710, 19.0666, -2.6],
      [72.8725, 19.0666, -2.7],
    ],
  },
  // Telecom Entry: Sea Breeze Heights (B06)
  {
    id: 'pipe-tel-b06',
    name: 'Sea Breeze Heights Fiber Entry Duct (FTTH)',
    utilityType: 'telecom',
    diameterM: 0.15,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Gigabit fiber-to-the-home residential distribution entry point',
    isMainTrunk: false,
    connectedBuildingIds: ['B06'],
    path: [
      [72.8672, 19.0653, -2.8],
      [72.86715, 19.06515, -2.2], // Enters Sea Breeze Heights
    ],
  },
  // Telecom Entry: Godrej BKC Tower (B04)
  {
    id: 'pipe-tel-b04',
    name: 'Godrej BKC Tower Dual Fiber Point-of-Presence (PoP)',
    utilityType: 'telecom',
    diameterM: 0.2,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Diverse path redundant corporate telecommunication intake into MDF room',
    isMainTrunk: false,
    connectedBuildingIds: ['B04'],
    path: [
      [72.8688, 19.0653, -2.8],
      [72.86891, 19.06582, -2.4], // Enters Godrej BKC Tower
    ],
  },
  // Telecom Entry: National Stock Exchange NSE (CAD18)
  {
    id: 'pipe-tel-cad18',
    name: 'NSE Exchange Co-Location Low-Latency Optical Fiber Vault',
    utilityType: 'telecom',
    diameterM: 0.25,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Direct high-frequency trading market data fiber manifold',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD18', 'B-MUM-886128-CAD18'],
    path: [
      [72.8720, 19.0653, -2.9],
      [72.87250, 19.06585, -2.3], // Enters NSE
    ],
  },
  // Telecom Entry: ICICI Bank Regional Towers (CAD13)
  {
    id: 'pipe-tel-cad13',
    name: 'ICICI Bank Financial Inter-Bank Secure Optical Link',
    utilityType: 'telecom',
    diameterM: 0.2,
    color: '#059669',
    emissiveColor: '#10B981',
    description: 'Encrypted inter-bank banking switch and payment gateway fiber connection',
    isMainTrunk: false,
    connectedBuildingIds: ['CAD13', 'B-MUM-886128-CAD13'],
    path: [
      [72.8710, 19.0666, -2.6],
      [72.87157, 19.06677, -2.2], // Enters ICICI Bank
    ],
  },
];

// ============================================================================
// REAL 3D JUNCTION NODES & INSPECTION MANHOLES
// Positioned at arterial intersections, branch points, and building entries
// ============================================================================

export const BKC_UTILITY_JUNCTIONS: UtilityJunctionNode[] = [
  // Central Avenue Inspection Manholes (Sewer / Drainage)
  {
    id: 'mh-sewer-01',
    name: 'Deep Sewer Manhole MH-W04 (Sea Breeze Junction)',
    utilityType: 'sewer',
    position: [72.8672, 19.0650, -11.3],
    diameterM: 1.6,
    heightM: 11.5,
    connectedBuildingIds: ['B06'],
  },
  {
    id: 'mh-sewer-02',
    name: 'Central Drop Manhole MH-C01 (Godrej Junction)',
    utilityType: 'sewer',
    position: [72.8688, 19.0650, -10.9],
    diameterM: 1.8,
    heightM: 11.0,
    connectedBuildingIds: ['B04', 'B02'],
  },
  {
    id: 'mh-sewer-03',
    name: 'Deep Interceptor Manhole MH-C02 (IL&FS Junction)',
    utilityType: 'sewer',
    position: [72.8702, 19.0650, -10.6],
    diameterM: 1.6,
    heightM: 10.7,
    connectedBuildingIds: ['CAD12'],
  },
  {
    id: 'mh-sewer-04',
    name: 'East Exchange Manhole MH-E01 (NSE Junction)',
    utilityType: 'sewer',
    position: [72.8720, 19.0650, -10.2],
    diameterM: 1.8,
    heightM: 10.3,
    connectedBuildingIds: ['CAD18'],
  },

  // Water Valve Chambers
  {
    id: 'valv-water-01',
    name: 'Sea Breeze Sector Isolation Valve Pit WV-04',
    utilityType: 'water',
    position: [72.8672, 19.0651, -5.3],
    diameterM: 1.4,
    heightM: 5.5,
    connectedBuildingIds: ['B06'],
  },
  {
    id: 'valv-water-02',
    name: 'Central Avenue 4-Way Cross Valve Vault WV-08',
    utilityType: 'water',
    position: [72.8688, 19.0651, -5.4],
    diameterM: 1.8,
    heightM: 5.6,
    connectedBuildingIds: ['B04', 'B02'],
  },
  {
    id: 'valv-water-03',
    name: 'NSE Exchange Dedicated Metering Chamber WV-12',
    utilityType: 'water',
    position: [72.8720, 19.0651, -5.5],
    diameterM: 1.5,
    heightM: 5.7,
    connectedBuildingIds: ['CAD18'],
  },

  // Electrical Transformer / Switch Vaults
  {
    id: 'vault-elec-01',
    name: 'Sea Breeze High-Voltage Splicing Vault EV-04',
    utilityType: 'electric',
    position: [72.8672, 19.0649, -7.3],
    diameterM: 2.0,
    heightM: 7.5,
    connectedBuildingIds: ['B06'],
  },
  {
    id: 'vault-elec-02',
    name: 'BKC Central 33kV Automated Ring Main Unit (RMU) EV-08',
    utilityType: 'electric',
    position: [72.8688, 19.0649, -7.4],
    diameterM: 2.4,
    heightM: 7.6,
    connectedBuildingIds: ['B04'],
  },
  {
    id: 'vault-elec-03',
    name: 'NSE Primary High-Availability Substation Vault EV-12',
    utilityType: 'electric',
    position: [72.8720, 19.0649, -7.5],
    diameterM: 2.6,
    heightM: 7.7,
    connectedBuildingIds: ['CAD18'],
  },

  // Telecom Optical Handholes
  {
    id: 'hh-tel-01',
    name: 'Fiber Splice Handhole HH-T04 (Sea Breeze Access)',
    utilityType: 'telecom',
    position: [72.8672, 19.0653, -2.8],
    diameterM: 1.2,
    heightM: 3.0,
    connectedBuildingIds: ['B06'],
  },
  {
    id: 'hh-tel-02',
    name: 'Main Optical Cross-Connect Vault HH-T08 (Central)',
    utilityType: 'telecom',
    position: [72.8688, 19.0653, -2.8],
    diameterM: 1.6,
    heightM: 3.0,
    connectedBuildingIds: ['B04'],
  },
  {
    id: 'hh-tel-03',
    name: 'NSE Ultra-Low Latency Carrier Handhole HH-T12',
    utilityType: 'telecom',
    position: [72.8720, 19.0653, -2.9],
    diameterM: 1.6,
    heightM: 3.1,
    connectedBuildingIds: ['CAD18'],
  },
];

/**
 * Returns all pipeline segments connected to the given buildingId
 */
export function getPipelinesForBuilding(buildingId: string | null): UtilityPipelineSegment[] {
  if (!buildingId) return [];
  return BKC_UTILITY_PIPELINES.filter((pipe) =>
    pipe.connectedBuildingIds.some((id) => buildingId.includes(id) || id.includes(buildingId))
  );
}

/**
 * Checks if a specific pipeline is connected to the selected building
 */
export function isPipelineConnectedToBuilding(
  pipe: UtilityPipelineSegment,
  selectedBuildingId: string | null
): boolean {
  if (!selectedBuildingId) return false;
  return pipe.connectedBuildingIds.some(
    (id) => selectedBuildingId.includes(id) || id.includes(selectedBuildingId)
  );
}
