import React from 'react';
import { CesiumViewer } from './CesiumViewer';
import { GlobeControls } from './GlobeControls';
import { GlobeSearchBar } from './GlobeSearchBar';
import { BuildingDetailPanel } from './BuildingDetailPanel';

export const GlobeExplorerPage: React.FC = () => {
  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* 3D Photorealistic Globe Viewer */}
      <CesiumViewer />

      {/* Primary Search Navigation (Search bar is the only navigation - §2) */}
      <GlobeSearchBar />

      {/* Floating Controls & Layer Toggles (Left) */}
      <GlobeControls />

      {/* Floating Detail & Exploded Stack Panel (Right) */}
      <BuildingDetailPanel />
    </div>
  );
};
