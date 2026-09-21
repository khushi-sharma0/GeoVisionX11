import React, { useState } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Table } from '../../components/ui/Table';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Unit } from '../../domain/types';
import {
  encodeUlpin3d,
  decodeUlpin3d,
  validateUlpin3d,
  computeCheckDigits,
  isUlpinError,
} from '../../domain/ulpin';
import { PropertyPassportModal } from '../citizen/PropertyPassportModal';
import {
  FileCheck2,
  Search,
  Plus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  Eye,
  QrCode,
} from 'lucide-react';

export const UlpinRegistryPage: React.FC = () => {
  const { units, buildings, floors, parcels, verticalParcels, createOrUpdateUnit } = useCadastreStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePassportUnit, setActivePassportUnit] = useState<Unit | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // New ULPIN Form State
  const [formState, setFormState] = useState({
    state: 'MH',
    city: 'MUM',
    parcel: '98213',
    building: 'B04',
    floor: 'F12',
    unit: 'U302',
    ownerName: 'Vikramaditya Shinde',
    flatNumber: '1204',
    builtUpAreaSqm: 135.0,
    carpetAreaSqm: 112.5,
  });

  // Candidate ULPIN code derived from form
  const candidateUlpin = encodeUlpin3d({
    state: formState.state,
    city: formState.city,
    parcel: formState.parcel,
    building: formState.building,
    floor: formState.floor,
    unit: formState.unit,
  });

  const validation = validateUlpin3d(candidateUlpin, {
    parcels,
    buildings,
    floors,
    units,
    verticalParcels,
  });

  const checkDigits = computeCheckDigits(candidateUlpin);

  // Filter units
  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.ulpin3d?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unitId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'ulpin3d',
      header: '3D ULPIN Code',
      render: (u: Unit) => (
        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 select-all">
          {u.ulpin3d}
        </span>
      ),
    },
    {
      key: 'flatNumber',
      header: 'Unit / Flat',
      width: 'w-28',
      render: (u: Unit) => (
        <span className="font-mono font-bold text-theme-main text-xs">
          Flat {u.flatNumber || u.unitId}
        </span>
      ),
    },
    {
      key: 'ownerName',
      header: 'Title Holder',
      render: (u: Unit) => (
        <div>
          <div className="font-medium text-theme-main text-xs">{u.ownerName}</div>
          <div className="text-[10px] text-theme-muted font-mono">{u.ownerId}</div>
        </div>
      ),
    },
    {
      key: 'area',
      header: 'Area (Built / Carpet)',
      render: (u: Unit) => (
        <span className="font-mono text-xs text-theme-muted">
          {u.builtUpAreaSqm} m² / {u.carpetAreaSqm} m²
        </span>
      ),
    },
    {
      key: 'checksum',
      header: 'Mod-97 Checksum',
      width: 'w-32',
      render: (u: Unit) => (
        <span className="font-mono text-xs font-semibold text-theme-main">
          {computeCheckDigits(u.ulpin3d)}
        </span>
      ),
    },
    {
      key: 'taxStatus',
      header: 'Tax Status',
      width: 'w-24',
      render: (u: Unit) => (
        <Chip
          label={u.taxStatus}
          variant={u.taxStatus === 'Paid' ? 'success' : 'warning'}
          size="sm"
        />
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      width: 'w-32',
      render: (u: Unit) => (
        <Chip
          label={u.verificationStatus}
          variant={u.verificationStatus === 'Verified' ? 'success' : 'warning'}
          size="sm"
          icon={<ShieldCheck size={12} />}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 'w-32',
      render: (u: Unit) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs py-1 px-2.5"
          icon={<QrCode size={12} />}
          onClick={(e) => {
            e.stopPropagation();
            setActivePassportUnit(u);
          }}
        >
          Passport
        </Button>
      ),
    },
  ];

  const handleRegisterNewUlpin = async () => {
    const newUnit: Unit = {
      unitId: formState.unit.startsWith('U') ? formState.unit : `U${formState.unit}`,
      floorId: `FL-${formState.city}-${formState.building}-${formState.floor.replace(/^F/, '')}`,
      flatNumber: formState.flatNumber,
      ulpin3d: candidateUlpin,
      ownerName: formState.ownerName,
      ownerId: `REG-${Math.floor(1000 + Math.random() * 9000)}-****`,
      builtUpAreaSqm: Number(formState.builtUpAreaSqm),
      carpetAreaSqm: Number(formState.carpetAreaSqm),
      taxStatus: 'Paid',
      registrationDate: new Date().toISOString(),
      verificationStatus: 'Verified',
      approvedBy: 'Director of Cadastral Operations, DoLR',
      disputeIds: [],
    };

    await createOrUpdateUnit(newUnit);
    setIsGenerateModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">National 3D ULPIN Statutory Registry</h1>
          <p className="text-xs text-theme-muted mt-1">
            Unique Land Parcel Identification Numbers (ULPIN) for vertical spatial property units (DoLR-MoRD Standard).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setIsGenerateModalOpen(true)}
          >
            Generate 3D ULPIN
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-theme-surface border border-theme flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by 3D ULPIN, Flat No, Owner Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Verification Statuses' },
              { value: 'Verified', label: 'Verified Statutory Titles' },
              { value: 'Pending Approval', label: 'Pending Authority Endorsement' },
              { value: 'Rejected', label: 'Flagged / Rejected' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredUnits}
        keyExtractor={(u) => u.ulpin3d}
        onRowClick={(u) => setActivePassportUnit(u)}
      />

      {/* Property Passport Modal */}
      {activePassportUnit && (
        <PropertyPassportModal
          isOpen={!!activePassportUnit}
          onClose={() => setActivePassportUnit(null)}
          unit={activePassportUnit}
        />
      )}

      {/* 3D ULPIN Generator Modal (§7) */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="AI-Assisted 3D ULPIN Generator"
        subtitle="Department of Land Resources · Ministry of Rural Development Format Codec"
        maxWidth="xl"
      >
        <div className="space-y-5 text-xs">
          {/* Result Code Display */}
          <div className="p-4 rounded-lg bg-theme-subtle border border-theme space-y-2">
            <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider">
              Calculated 3D Cadastral Identifier
            </span>
            <div className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
              {candidateUlpin}
            </div>
            <div className="flex items-center justify-between text-theme-muted pt-1 border-t border-theme/50">
              <span>ISO 7064 Mod-97 Checksum: <strong>{checkDigits}</strong></span>
              <Chip
                label={validation.valid ? 'VALID SYNTAX' : 'INVALID COMPOSITION'}
                variant={validation.valid ? 'success' : 'danger'}
                size="sm"
              />
            </div>
          </div>

          {/* Validation reasons if invalid */}
          {!validation.valid && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Cadastral Topology Rule Violations:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {validation.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Segment Inputs (§7) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              label="State (LGD)"
              value={formState.state}
              onChange={(e) => setFormState({ ...formState, state: e.target.value.toUpperCase() })}
              maxLength={2}
            />
            <Input
              label="City (ULB)"
              value={formState.city}
              onChange={(e) => setFormState({ ...formState, city: e.target.value.toUpperCase() })}
              maxLength={3}
            />
            <Input
              label="Parcel (5 Digits)"
              value={formState.parcel}
              onChange={(e) => setFormState({ ...formState, parcel: e.target.value })}
              maxLength={5}
            />
            <Input
              label="Building ID"
              value={formState.building}
              onChange={(e) => setFormState({ ...formState, building: e.target.value.toUpperCase() })}
              maxLength={3}
            />
            <Input
              label="Floor Code"
              value={formState.floor}
              onChange={(e) => setFormState({ ...formState, floor: e.target.value.toUpperCase() })}
              placeholder="F12, FGF, FB1"
            />
            <Input
              label="Unit ID"
              value={formState.unit}
              onChange={(e) => setFormState({ ...formState, unit: e.target.value.toUpperCase() })}
              placeholder="U302"
            />
          </div>

          {/* Unit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-theme">
            <Input
              label="Flat Number"
              value={formState.flatNumber}
              onChange={(e) => setFormState({ ...formState, flatNumber: e.target.value })}
            />
            <Input
              label="Built-Up Area (m²)"
              type="number"
              value={formState.builtUpAreaSqm}
              onChange={(e) => setFormState({ ...formState, builtUpAreaSqm: Number(e.target.value) })}
            />
            <Input
              label="Carpet Area (m²)"
              type="number"
              value={formState.carpetAreaSqm}
              onChange={(e) => setFormState({ ...formState, carpetAreaSqm: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Owner Name (Title Holder)"
            value={formState.ownerName}
            onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
          />

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-theme">
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!validation.valid}
              onClick={handleRegisterNewUlpin}
              icon={<CheckCircle2 size={15} />}
            >
              Issue & Register 3D ULPIN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Property Passport Modal */}
      {activePassportUnit && (
        <PropertyPassportModal
          isOpen={true}
          onClose={() => setActivePassportUnit(null)}
          unit={activePassportUnit}
          building={buildings.find((b) => {
            const fl = floors.find((f) => f.floorId === activePassportUnit.floorId);
            return fl && fl.buildingId === b.buildingId;
          })}
          floor={floors.find((f) => f.floorId === activePassportUnit.floorId)}
          parcel={parcels.find((p) => {
            const fl = floors.find((f) => f.floorId === activePassportUnit.floorId);
            const bld = buildings.find((b) => fl && fl.buildingId === b.buildingId);
            return bld && bld.parcelId === p.parcelId;
          })}
        />
      )}
    </div>
  );
};
