import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import {
  Database,
  Upload,
  FileCheck2,
  Layers,
  Sliders,
  AlertCircle,
  CheckCircle2,
  FileCode,
  HardDrive,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UploadedFileInfo {
  name: string;
  size: string;
  type: string;
  crs: string;
  featuresCount?: number;
  status: 'Parsed' | 'Indexed';
  previewDetails: string;
}

export const GisManagementPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([
    {
      name: 'bkc_cadastral_parcels_2025.geojson',
      size: '4.2 MB',
      type: 'GeoJSON Vector',
      crs: 'EPSG:4326 (WGS 84)',
      featuresCount: 142,
      status: 'Parsed',
      previewDetails: '142 Polygon Features with Survey Numbers, Land Use, and Base Elevations.',
    },
    {
      name: 'hinjewadi_phase1_lidar.laz',
      size: '184.6 MB',
      type: 'Airborne LiDAR Point Cloud',
      crs: 'EPSG:32643 (UTM 43N)',
      status: 'Indexed',
      previewDetails: 'Point density: 32.4 pts/m². Classified Ground, Vegetation, and Rooftops.',
    },
    {
      name: 'metro_line2b_alignment.dwg',
      size: '12.8 MB',
      type: 'AutoCAD Civil 3D',
      crs: 'EPSG:4326',
      status: 'Indexed',
      previewDetails: 'Underground sub-surface alignment profiles at -18m to -24m depth.',
    },
  ]);

  const [activeLayers, setActiveLayers] = useState([
    { id: 'l1', name: '2D Revenue Cadastral Parcels', type: 'Vector Polygon', visible: true, opacity: 100, crs: 'EPSG:4326' },
    { id: 'l2', name: '3D Building Volumetric Meshes', type: '3D Tileset / Poly', visible: true, opacity: 85, crs: 'EPSG:4978' },
    { id: 'l3', name: 'Sub-surface Utilities & Transit', type: '3D Polyline', visible: true, opacity: 90, crs: 'EPSG:4978' },
    { id: 'l4', name: 'DoLR Drone High-Res Orthomosaic', type: 'Raster XYZ', visible: false, opacity: 70, crs: 'EPSG:3857' },
  ]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      const isGeoJson = file.name.endsWith('.geojson') || file.name.endsWith('.json');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

      if (isGeoJson) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            const count = parsed.features ? parsed.features.length : 1;
            setUploadedFiles((prev) => [
              {
                name: file.name,
                size: `${sizeMB} MB`,
                type: 'GeoJSON FeatureCollection',
                crs: 'EPSG:4326 (WGS 84)',
                featuresCount: count,
                status: 'Parsed',
                previewDetails: `Parsed ${count} real spatial features from GeoJSON file.`,
              },
              ...prev,
            ]);
          } catch (err) {
            console.error('GeoJSON parse error:', err);
          }
        };
        reader.readAsText(file);
      } else {
        // Other formats (LAS/LAZ, DWG, TIFF) - simulated ingestion
        setUploadedFiles((prev) => [
          {
            name: file.name,
            size: `${sizeMB} MB`,
            type: file.name.endsWith('.las') || file.name.endsWith('.laz') ? 'LiDAR Point Cloud' : 'CAD/GIS Raster',
            crs: 'EPSG:32643 (UTM 43N)',
            status: 'Indexed',
            previewDetails: 'Processed via Cloud GIS converter pipeline.',
          },
          ...prev,
        ]);
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">GIS Data Management & Ingestion</h1>
          <p className="text-xs text-theme-muted mt-1">
            Import, validate, and orchestrate spatial land datasets (GeoJSON, Point Clouds, CAD drawings, and Orthophotos).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip label="CRS: WGS 84 / UTM 43N" variant="neutral" />
          <Chip label="OGC 3D Portrayal Compliant" variant="primary" />
        </div>
      </div>

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-theme bg-theme-surface hover:border-theme-muted'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-theme-subtle flex items-center justify-center text-blue-500 mb-3">
            <Upload size={24} />
          </div>
          <h3 className="font-bold text-sm text-theme-main">
            Drag & drop GIS spatial files, or browse
          </h3>
          <p className="text-xs text-theme-muted mt-1">
            Supports real GeoJSON parsing, plus LiDAR (.las/.laz), AutoCAD (.dwg/.dxf), and GeoTIFF (.tif).
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".geojson,.json,.las,.laz,.dwg,.dxf,.tif"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="primary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer font-bold shadow-md hover:shadow-lg transition-all"
            >
              Upload from Device
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileCode size={14} />}
              onClick={() => {
                const sampleGeojson = {
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      properties: {
                        surveyNumber: 'BKC-SURV-2026/09',
                        landUse: 'Commercial',
                        areaSqm: 5400,
                        baseElevationM: 14.5,
                      },
                      geometry: {
                        type: 'Polygon',
                        coordinates: [
                          [
                            [72.868, 19.066],
                            [72.871, 19.066],
                            [72.871, 19.068],
                            [72.868, 19.068],
                            [72.868, 19.066],
                          ],
                        ],
                      },
                    },
                  ],
                };
                const blob = new Blob([JSON.stringify(sampleGeojson)], { type: 'application/json' });
                const sampleFile = new File([blob], 'mumbai_bkc_extension_sample.geojson', {
                  type: 'application/json',
                });
                processFiles([sampleFile] as unknown as FileList);
              }}
              className="cursor-pointer text-xs"
            >
              Load Sample GeoJSON
            </Button>
          </div>
        </div>
      </div>

      {/* Uploaded Datasets Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-theme-main">Ingested Datasets & Spatial Layers</h3>

        <div className="border border-theme rounded-lg overflow-hidden bg-theme-surface">
          <div className="divide-y divide-theme">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-theme-subtle flex items-center justify-center text-theme-main mt-0.5 flex-shrink-0">
                    <FileCode size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-theme-main flex items-center gap-2">
                      <span>{f.name}</span>
                      <Chip
                        label={f.status}
                        variant={f.status === 'Parsed' ? 'success' : 'primary'}
                        size="sm"
                      />
                    </div>
                    <div className="text-[11px] text-theme-muted mt-0.5">
                      {f.previewDetails}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-theme-muted flex-shrink-0">
                  <span>{f.crs}</span>
                  <span>{f.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Cadastral Layer Stack */}
      <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-4">
        <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
          <Layers size={16} className="text-blue-500" />
          <span>Active Globe Cadastral Layers</span>
        </h3>

        <div className="space-y-2">
          {activeLayers.map((layer) => (
            <div
              key={layer.id}
              className="p-3 rounded-lg border border-theme bg-theme-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setActiveLayers((prev) =>
                      prev.map((l) => (l.id === layer.id ? { ...l, visible: !l.visible } : l))
                    )
                  }
                  className="text-theme-muted hover:text-theme-main"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye size={16} className="text-blue-500" /> : <EyeOff size={16} />}
                </button>
                <div>
                  <div className="font-semibold text-theme-main">{layer.name}</div>
                  <div className="text-[10px] text-theme-muted font-mono">{layer.type} · {layer.crs}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-theme-muted">Opacity:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={layer.opacity}
                  onChange={(e) =>
                    setActiveLayers((prev) =>
                      prev.map((l) => (l.id === layer.id ? { ...l, opacity: Number(e.target.value) } : l))
                    )
                  }
                  className="w-24 h-1.5 bg-theme-subtle rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="font-mono text-xs w-8 text-right">{layer.opacity}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
