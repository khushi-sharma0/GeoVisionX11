import React from 'react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Input } from '../../components/ui/Input';
import {
  Settings,
  Database,
  Link2,
  Key,
  ShieldCheck,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const connectors = [
    {
      name: 'DILRMP Central Gateway',
      description: 'Digital India Land Records Modernization Programme 2D Parcel Sync',
      status: 'Synchronized',
      lastSync: '10 mins ago',
      records: '48,190 Cadastral Records',
    },
    {
      name: 'NIC BhuNaksha WFS/WMS Service',
      description: 'National Informatics Centre cadastral vector boundaries map service',
      status: 'Connected',
      lastSync: '1 hour ago',
      records: 'Live Vector Feeds (EPSG:4326)',
    },
    {
      name: 'SVAMITVA Drone Abadi Portal',
      description: 'Ministry of Panchayati Raj high-resolution drone survey base boundaries',
      status: 'Connected',
      lastSync: 'Yesterday',
      records: '1,420 Village Abadi Polygons',
    },
    {
      name: 'CERSAI Mortgage Title Registry',
      description: 'Central Registry of Securitisation & Security Interests equitable mortgage verification',
      status: 'Active API Bridge',
      lastSync: 'Real-time',
      records: 'Volumetric Encumbrance Verification',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">System Connectors & National Integrations</h1>
          <p className="text-xs text-theme-muted mt-1">
            Status of external data bridges, GIS geodetic parameters, and institutional land record integrations.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
          <Link2 size={16} className="text-blue-500" />
          <span>National Cadastral Systems Bridges</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c, i) => (
            <div key={i} className="p-5 rounded-xl border border-theme bg-theme-surface flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-theme-main">{c.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <Chip label={c.status} variant="success" size="sm" />
                  </div>
                </div>
                <p className="text-xs text-theme-muted mt-1">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-theme flex items-center justify-between text-xs text-theme-muted font-mono">
                <span>{c.records}</span>
                <span>Sync: {c.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geodetic & Spatial Engine Status */}
      <div className="p-6 rounded-xl border border-theme bg-theme-surface space-y-4">
        <h3 className="text-sm font-bold text-theme-main flex items-center gap-2">
          <Server size={16} className="text-blue-500" />
          <span>Cadastral Spatial Database Engine (PostGIS 3D)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">Database Engine:</span>
            <div className="font-mono font-bold text-theme-main mt-0.5">PostgreSQL 16 + PostGIS 3.4</div>
            <span className="text-[10px] text-theme-muted">In-Memory Cadastral Seed Engine Active</span>
          </div>

          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">3D Polyhedral Surface Support:</span>
            <div className="font-mono font-bold text-emerald-500 mt-0.5">ST_3DIntersects, ST_Volume</div>
            <span className="text-[10px] text-theme-muted">Volumetric Encroachment Enabled</span>
          </div>

          <div className="p-3 rounded-lg bg-theme-subtle border border-theme">
            <span className="text-theme-muted">Default Coordinate System:</span>
            <div className="font-mono font-bold text-theme-main mt-0.5">EPSG:4978 / EPSG:4326</div>
            <span className="text-[10px] text-theme-muted">WGS 84 Ellipsoidal Elevation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
