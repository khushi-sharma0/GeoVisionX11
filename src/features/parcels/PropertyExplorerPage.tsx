import React, { useState } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Table } from '../../components/ui/Table';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { Parcel, Building, Floor } from '../../domain/types';
import { Building2, Layers, Search, MapPin, Eye, Filter, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluateBuildingEncroachment } from '../../domain/topology';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';

export const PropertyExplorerPage: React.FC = () => {
  const { parcels, buildings, floors, selectBuilding, setSelectedCityId } = useCadastreStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState('all');
  const [selectedBuildingDetail, setSelectedBuildingDetail] = useState<Building | null>(null);
  const navigate = useNavigate();

  // Filter buildings
  const filteredBuildings = buildings.filter((b) => {
    const parcel = parcels.find((p) => p.parcelId === b.parcelId);
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.buildingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.parcelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parcel && parcel.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLandUse =
      selectedLandUse === 'all' || (parcel && parcel.landUse === selectedLandUse);

    return matchesSearch && matchesLandUse;
  });

  const columns = [
    {
      key: 'buildingId',
      header: 'Structure ID',
      width: 'w-24',
      render: (b: Building) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
          {b.buildingId}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Building Name',
      render: (b: Building) => {
        const parcel = parcels.find((p) => p.parcelId === b.parcelId);
        return (
          <div>
            <div className="font-semibold text-theme-main flex items-center gap-1.5">
              <span>{b.name}</span>
            </div>
            <div className="text-xs text-theme-muted font-mono">
              Parcel {b.parcelId} · Survey {parcel?.surveyNumber || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'parcelCity',
      header: 'Jurisdiction',
      render: (b: Building) => {
        const parcel = parcels.find((p) => p.parcelId === b.parcelId);
        return (
          <span className="text-xs font-mono">
            {parcel ? `${parcel.state}-${parcel.city}` : 'National'}
          </span>
        );
      },
    },
    {
      key: 'floors',
      header: 'Floors Stack',
      render: (b: Building) => (
        <span className="font-mono text-xs">
          {b.floorsAbove} Above / {b.floorsBelow} Below
        </span>
      ),
    },
    {
      key: 'height',
      header: 'Total Height',
      render: (b: Building) => (
        <span className="font-mono text-xs font-medium">
          {b.heightM}m (Base +{b.baseElevationM}m)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Compliance Status',
      render: (b: Building) => {
        const encroachment = evaluateBuildingEncroachment(b, floors);
        if (encroachment.hasEncroachment) {
          return <Chip label={`Encroachment (+${encroachment.excessFloors} Fl)`} variant="danger" size="sm" />;
        }
        return <Chip label={b.status} variant={b.status === 'Verified' ? 'success' : 'warning'} size="sm" />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b: Building) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs py-1 px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBuildingDetail(b);
            }}
          >
            Details
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="text-xs py-1 px-2.5"
            icon={<ArrowUpRight size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              navigateTo3DBuilding(
                {
                  targetBuildingId: b.buildingId,
                  targetParcelId: b.parcelId,
                  portal: 'authority',
                },
                navigate
              );
            }}
          >
            3D Globe
          </Button>
        </div>
      ),
    },
  ];

  const detailFloors = selectedBuildingDetail
    ? floors.filter((f) => f.buildingId === selectedBuildingDetail.buildingId)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">2D Parcel & 3D Building Registry</h1>
          <p className="text-xs text-theme-muted mt-1">
            Cadastral boundary database connecting 2D survey parcels with vertical spatial building volumes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Chip label={`${buildings.length} Structures Registered`} variant="neutral" />
          <Chip label={`${parcels.length} Primary Parcels`} variant="neutral" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-lg bg-theme-surface border border-theme flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by building name, ID, survey number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            value={selectedLandUse}
            onChange={(e) => setSelectedLandUse(e.target.value)}
            options={[
              { value: 'all', label: 'All Land Uses' },
              { value: 'Mixed', label: 'Mixed Commercial/Residential' },
              { value: 'Commercial', label: 'Commercial IT / BFSI' },
              { value: 'Residential', label: 'Residential High-rise' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredBuildings}
        keyExtractor={(b) => `${b.parcelId}-${b.buildingId}`}
        onRowClick={(b) => setSelectedBuildingDetail(b)}
      />

      {/* Detail Drawer */}
      {selectedBuildingDetail && (
        <Drawer
          isOpen={!!selectedBuildingDetail}
          onClose={() => setSelectedBuildingDetail(null)}
          title={selectedBuildingDetail.name}
          subtitle={`Cadastral ID: ${selectedBuildingDetail.buildingId} · Base Elevation: +${selectedBuildingDetail.baseElevationM}m MSL`}
        >
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="p-4 rounded-lg bg-theme-subtle border border-theme space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-theme-muted">Verification Status</span>
                <Chip label={selectedBuildingDetail.status} variant="success" size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-theme-muted">Total Height:</span>
                  <div className="font-mono font-bold text-sm">{selectedBuildingDetail.heightM} meters</div>
                </div>
                <div>
                  <span className="text-theme-muted">Floor Levels:</span>
                  <div className="font-mono font-bold text-sm">
                    {selectedBuildingDetail.floorsAbove} Above / {selectedBuildingDetail.floorsBelow} Below
                  </div>
                </div>
                <div>
                  <span className="text-theme-muted">Sanctioned Floors:</span>
                  <div className="font-mono font-bold text-sm">{selectedBuildingDetail.approvedFloors} Floors</div>
                </div>
                <div>
                  <span className="text-theme-muted">AI Extraction Quality:</span>
                  <div className="font-mono font-bold text-sm">{(selectedBuildingDetail.extractionConfidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Jump to 3D Globe Button */}
            <Button
              variant="primary"
              className="w-full"
              icon={<ArrowUpRight size={15} />}
              onClick={() => {
                navigateTo3DBuilding(
                  {
                    targetBuildingId: selectedBuildingDetail.buildingId,
                    targetParcelId: selectedBuildingDetail.parcelId,
                    portal: 'authority',
                  },
                  navigate
                );
              }}
            >
              Examine in Cesium 3D Globe
            </Button>

            {/* Floor Slices Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                Vertical Floor Segmentation ({detailFloors.length} Floors)
              </h4>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {detailFloors.map((fl) => (
                  <div
                    key={fl.floorId}
                    className="p-2.5 rounded-md border border-theme bg-theme-surface flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-theme-main flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-500">{fl.code}</span>
                        <span>{fl.label}</span>
                      </div>
                      <div className="text-[11px] text-theme-muted font-mono mt-0.5">
                        Base: +{fl.baseHeightM}m · Height: {fl.heightM}m · Area: {fl.areaSqm}m²
                      </div>
                    </div>
                    <Chip label={fl.usage} variant="neutral" size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
