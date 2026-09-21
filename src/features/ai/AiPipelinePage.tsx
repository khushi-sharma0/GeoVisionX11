import React, { useState, useRef } from 'react';
import { usePipelineStore, PIPELINE_STAGES, PipelineStageId } from '../../stores/pipelineStore';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Select } from '../../components/ui/Input';
import {
  Cpu,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Box,
  FileCheck2,
  Terminal,
  Activity,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

export const AiPipelinePage: React.FC = () => {
  const {
    currentStage,
    progress,
    isRunning,
    activeDataset,
    extractedBuildingsCount,
    segmentedFloorsCount,
    delineatedUnitsCount,
    detectedConflictsCount,
    generatedUlpinsCount,
    logs,
    startPipeline,
    resetPipeline,
    stopPipeline,
  } = usePipelineStore();

  const [selectedDataset, setSelectedDataset] = useState(activeDataset);
  const [datasetOptions, setDatasetOptions] = useState([
    { value: 'BKC_Sector3_AerialLiDAR_2024.laz', label: 'BKC Mumbai — Drone Photogrammetry (0.05m GSD)' },
    { value: 'Hinjewadi_Phase1_AirborneLiDAR.laz', label: 'Hinjewadi Pune — Airborne LiDAR Point Cloud (32 pts/m²)' },
    { value: 'ConnaughtPlace_Stereo_DEM.tif', label: 'Connaught Place — Satellite Stereo DEM/DSM' },
  ]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadRawSurvey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newOpt = {
      value: file.name,
      label: `${file.name} — Ingested Field Survey (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
    setDatasetOptions((prev) => [newOpt, ...prev]);
    setSelectedDataset(file.name);
    setUploadNotice(`Loaded raw dataset "${file.name}". Ready for PointNet++ 3D segmentation inference.`);
    setTimeout(() => setUploadNotice(null), 5000);
  };

  const stageOrder: PipelineStageId[] = [
    'building_extraction',
    'floor_segmentation',
    'vertical_parcel_delineation',
    'topology_validation',
    'ulpin_generation',
  ];

  const currentStageIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-theme-main">
              AI 3D Cadastral Segmentation & ULPIN Engine
            </h1>
            <Chip label="ONLINE" variant="success" size="sm" />
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Automated deep-learning pipeline for 3D building extraction, floor decomposition, volumetric delineation, and topology validation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              variant="outline"
              icon={<Pause size={15} />}
              onClick={stopPipeline}
            >
              Pause Pipeline
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Play size={15} />}
              onClick={() => startPipeline(selectedDataset)}
            >
              {currentStage === 'idle' ? 'Execute Pipeline' : 'Resume Pipeline'}
            </Button>
          )}
          <Button
            variant="outline"
            icon={<RotateCcw size={15} />}
            onClick={resetPipeline}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Dataset & Configuration Card */}
      <div className="p-4 rounded-xl bg-theme-surface border border-theme flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-80">
            <Select
              label="Source Input Dataset"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              options={datasetOptions}
            />
          </div>
          <div className="flex items-center gap-2 pt-4 sm:pt-0 self-end sm:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".laz,.las,.tif,.geojson,.ply,.xyz"
              className="hidden"
              onChange={handleUploadRawSurvey}
            />
            <Button
              variant="outline"
              size="sm"
              icon={<UploadCloud size={14} className="text-blue-500" />}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer font-bold shadow-xs whitespace-nowrap"
            >
              Upload Raw Survey
            </Button>
          </div>
          <div className="text-xs text-theme-muted hidden lg:block pt-4">
            <span>Model: <strong>PointNet++ / 3D U-Net Cadastral Backbone</strong></span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="text-theme-muted">Pipeline Status</div>
            <div className="font-mono font-bold capitalize text-theme-main">
              {isRunning ? 'Processing' : currentStage === 'completed' ? 'Completed' : 'Standby'}
            </div>
          </div>
          <div className="h-8 w-px bg-theme" />
          <div className="text-right text-xs">
            <div className="text-theme-muted">Overall Progress</div>
            <div className="font-mono font-bold text-blue-500">{Math.round(progress)}%</div>
          </div>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20">
            Ingested
          </span>
        </div>
      )}

      {/* 5-Stage Animated State Machine (§4, §9) */}
      <div className="p-6 rounded-xl bg-theme-surface border border-theme space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            <span>Multi-Stage Autonomous Processing Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-theme-muted">ISO 19152 LADM 3D Pipeline</span>
        </div>

        {/* Stages Track */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map((st, idx) => {
            const isCurrent = currentStage === st.id;
            const isCompleted = currentStageIndex > idx || currentStage === 'completed';
            const isPending = currentStageIndex < idx && currentStage !== 'completed';

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500'
                    : isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-theme bg-theme-subtle/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-theme-muted">
                      STAGE 0{idx + 1}
                    </span>
                    {isCompleted && <CheckCircle2 size={15} className="text-emerald-500" />}
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-theme-main">{st.name}</h4>
                  <p className="text-[10px] text-theme-muted mt-1 leading-snug">
                    {st.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-theme/40 text-[10px] font-mono">
                  {isCompleted && <span className="text-emerald-500 font-semibold">100% Completed</span>}
                  {isCurrent && <span className="text-blue-500 font-semibold">Processing...</span>}
                  {isPending && <span className="text-theme-muted">Queued</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Summary & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-theme-main">Pipeline Yield Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-theme-surface border border-theme">
              <span className="text-[10px] uppercase font-bold text-theme-muted">Buildings Extracted</span>
              <div className="text-2xl font-bold font-mono text-theme-main mt-1">
                {extractedBuildingsCount}
              </div>
              <span className="text-[10px] text-theme-muted">Footprint polygon accuracy: 98.4%</span>
            </div>

            <div className="p-4 rounded-lg bg-theme-surface border border-theme">
              <span className="text-[10px] uppercase font-bold text-theme-muted">Floors Segmented</span>
              <div className="text-2xl font-bold font-mono text-theme-main mt-1">
                {segmentedFloorsCount}
              </div>
              <span className="text-[10px] text-theme-muted">Mean floor height: 3.48m</span>
            </div>

            <div className="p-4 rounded-lg bg-theme-surface border border-theme">
              <span className="text-[10px] uppercase font-bold text-theme-muted">3D ULPINs Issued</span>
              <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                {generatedUlpinsCount}
              </div>
              <span className="text-[10px] text-theme-muted">Check digits verified</span>
            </div>

            <div className="p-4 rounded-lg bg-theme-surface border border-theme">
              <span className="text-[10px] uppercase font-bold text-theme-muted">Topology Conflicts</span>
              <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
                {detectedConflictsCount}
              </div>
              <span className="text-[10px] text-theme-muted">Encroachments & overlaps</span>
            </div>
          </div>
        </div>

        {/* Live Execution Terminal */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
              <Terminal size={15} className="text-blue-500" />
              <span>Inference Engine Execution Logs</span>
            </h3>
            <span className="text-[10px] font-mono text-theme-muted">STDOUT (Live Stream)</span>
          </div>

          <div className="h-64 rounded-lg bg-slate-950 p-3.5 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 border border-slate-800">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed flex items-start gap-2">
                <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
