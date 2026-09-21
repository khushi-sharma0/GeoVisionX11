import { create } from 'zustand';

export type PipelineStageId = 
  | 'idle'
  | 'building_extraction'
  | 'floor_segmentation'
  | 'vertical_parcel_delineation'
  | 'topology_validation'
  | 'ulpin_generation'
  | 'completed';

export interface PipelineLog {
  timestamp: string;
  stage: string;
  level: 'info' | 'success' | 'warn';
  message: string;
}

export interface PipelineStageInfo {
  id: PipelineStageId;
  name: string;
  description: string;
  algorithm: string;
  durationMs: number;
}

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'building_extraction',
    name: 'Building Extraction',
    description: 'Mask R-CNN on orthoimagery & LiDAR point cloud clustering',
    algorithm: 'U-Net 3D + DBSCAN Point Clustering (3dfier core)',
    durationMs: 2400,
  },
  {
    id: 'floor_segmentation',
    name: 'Vertical Floor Segmentation',
    description: 'Vertical slice elevation frequency analysis & slab detection',
    algorithm: 'Kernel Density Peak Estimation + Architectural Sanction Prior',
    durationMs: 2200,
  },
  {
    id: 'vertical_parcel_delineation',
    name: 'Vertical Parcel Delineation',
    description: 'Construct 3D polyhedral prism geometries for every unit',
    algorithm: 'OGC LADM ISO 19152 3D Spatial Partitioning',
    durationMs: 2500,
  },
  {
    id: 'topology_validation',
    name: '3D Topology & Encroachment Validation',
    description: 'Volumetric collision detection & municipal sanction height bounds',
    algorithm: 'SFCGAL 3D Intersection & Bounding Box Overlap Filter',
    durationMs: 2300,
  },
  {
    id: 'ulpin_generation',
    name: '3D ULPIN Generation & Verification',
    description: 'Compute ISO 7064 check digits and register vertical spatial units',
    algorithm: 'National Land Records Modernisation 3D Codec (DoLR-MoRD)',
    durationMs: 1800,
  },
];

interface PipelineState {
  currentStage: PipelineStageId;
  progress: number; // 0 to 100
  isRunning: boolean;
  activeDataset: string;
  extractedBuildingsCount: number;
  segmentedFloorsCount: number;
  delineatedUnitsCount: number;
  detectedConflictsCount: number;
  generatedUlpinsCount: number;
  logs: PipelineLog[];

  startPipeline: (datasetName?: string) => void;
  resetPipeline: () => void;
  stopPipeline: () => void;
}

let pipelineTimer: ReturnType<typeof setTimeout> | null = null;

export const usePipelineStore = create<PipelineState>((set, get) => ({
  currentStage: 'idle',
  progress: 0,
  isRunning: false,
  activeDataset: 'BKC_Sector3_AerialLiDAR_2024.laz',
  extractedBuildingsCount: 0,
  segmentedFloorsCount: 0,
  delineatedUnitsCount: 0,
  detectedConflictsCount: 0,
  generatedUlpinsCount: 0,
  logs: [
    {
      timestamp: '09:00:12',
      stage: 'System',
      level: 'info',
      message: 'AI 3D Cadastral Pipeline engine standby. Ready for sensor ingestion.',
    },
  ],

  startPipeline: (datasetName = 'BKC_Sector3_AerialLiDAR_2024.laz') => {
    if (get().isRunning) return;

    if (pipelineTimer) clearTimeout(pipelineTimer);

    set({
      isRunning: true,
      currentStage: 'building_extraction',
      progress: 5,
      activeDataset: datasetName,
      extractedBuildingsCount: 0,
      segmentedFloorsCount: 0,
      delineatedUnitsCount: 0,
      detectedConflictsCount: 0,
      generatedUlpinsCount: 0,
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'Ingestion',
          level: 'info',
          message: `Ingesting dataset '${datasetName}' (Point Density: 48 pts/m², Format: LAS 1.4)`,
        },
      ],
    });

    const runNextStage = (stageIdx: number) => {
      const stages: PipelineStageId[] = [
        'building_extraction',
        'floor_segmentation',
        'vertical_parcel_delineation',
        'topology_validation',
        'ulpin_generation',
      ];

      if (stageIdx >= stages.length) {
        set({
          currentStage: 'completed',
          isRunning: false,
          progress: 100,
          logs: [
            ...get().logs,
            {
              timestamp: new Date().toLocaleTimeString(),
              stage: 'Completed',
              level: 'success',
              message: 'Pipeline run finalized successfully. 3D vertical parcels verified and queued for authority approval.',
            },
          ],
        });
        return;
      }

      const stage = stages[stageIdx];
      const stageInfo = PIPELINE_STAGES[stageIdx];
      const stageProgress = ((stageIdx + 1) / stages.length) * 100;

      set({
        currentStage: stage,
        progress: stageProgress,
      });

      // Update counters and logs based on stage
      const now = new Date().toLocaleTimeString();
      let newLog: PipelineLog | null = null;

      if (stage === 'building_extraction') {
        newLog = {
          timestamp: now,
          stage: 'Extraction',
          level: 'info',
          message: 'Extracting 3D building envelopes using 3dfier planar projection. 14 building polygons detected.',
        };
        set({ extractedBuildingsCount: 14 });
      } else if (stage === 'floor_segmentation') {
        newLog = {
          timestamp: now,
          stage: 'Segmentation',
          level: 'info',
          message: 'Elevational histogram clustering resolved floor slabs (inter-floor height: 3.4m-3.8m). 188 total floor slices.',
        };
        set({ segmentedFloorsCount: 188 });
      } else if (stage === 'vertical_parcel_delineation') {
        newLog = {
          timestamp: now,
          stage: 'Delineation',
          level: 'info',
          message: 'Constructing ISO 19152 3D volumetric parcels. 542 unit prisms created.',
        };
        set({ delineatedUnitsCount: 542 });
      } else if (stage === 'topology_validation') {
        newLog = {
          timestamp: now,
          stage: 'Topology',
          level: 'warn',
          message: 'SFCGAL 3D intersection pass: Detected 1 vertical height collision (Parcel 11001) and 1 vertical encroachment (Parcel 44102).',
        };
        set({ detectedConflictsCount: 2 });
      } else if (stage === 'ulpin_generation') {
        newLog = {
          timestamp: now,
          stage: 'ULPIN 3D',
          level: 'success',
          message: 'Generated 540 valid 3D ULPIN codes with Mod-97 verification check digits. 2 flagged for municipal manual audit.',
        };
        set({ generatedUlpinsCount: 540 });
      }

      if (newLog) {
        set({ logs: [...get().logs, newLog] });
      }

      pipelineTimer = setTimeout(() => {
        runNextStage(stageIdx + 1);
      }, stageInfo.durationMs);
    };

    runNextStage(0);
  },

  resetPipeline: () => {
    if (pipelineTimer) clearTimeout(pipelineTimer);
    set({
      currentStage: 'idle',
      isRunning: false,
      progress: 0,
      extractedBuildingsCount: 0,
      segmentedFloorsCount: 0,
      delineatedUnitsCount: 0,
      detectedConflictsCount: 0,
      generatedUlpinsCount: 0,
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'System',
          level: 'info',
          message: 'Pipeline reset. Ready for next dataset execution.',
        },
      ],
    });
  },

  stopPipeline: () => {
    if (pipelineTimer) clearTimeout(pipelineTimer);
    set({ isRunning: false });
  },
}));
