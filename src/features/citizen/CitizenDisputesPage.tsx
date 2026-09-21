import React, { useState, useRef } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { AlertCircle, FileQuestion, CheckCircle2, ShieldAlert, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CitizenDisputesPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { units, addDispute, buildings } = useCadastreStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    unitId: 'U302',
    disputeType: 'Vertical Airspace Encroachment',
    targetUnitOrBuilding: 'Flat 1302 (Floor 13 Cantilever Balcony)',
    description: 'Upper floor unit has erected an unauthorized steel cantilever extension protruding 1.8m into our vertical airspace volume column.',
    evidenceFiles: 'site_photo_elevation.jpg',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `DISP-MH-${Math.floor(10000 + Math.random() * 90000)}`;

    const selectedUnit = units.find((u) => u.unitId === form.unitId) || units[0];

    addDispute({
      disputeId: newId,
      buildingId: 'B04',
      unitId: form.unitId,
      ulpin3d: selectedUnit?.ulpin3d || 'MH-MUM-98213-B04-F12-U302',
      disputeType: form.disputeType,
      petitionerName: user.name,
      targetUnitOrBuilding: form.targetUnitOrBuilding,
      description: form.description,
      status: 'Under Review',
      filingDate: new Date().toISOString().split('T')[0],
      evidenceFiles: form.evidenceFiles,
    });

    setSubmittedId(newId);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">Report Volumetric Boundary Dispute</h1>
          <p className="text-xs text-theme-muted mt-1">
            File statutory boundary objections for vertical airspace encroachment, floor partition overlaps, or balcony intrusions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate('/citizen/my-properties')}
        >
          Back to Properties
        </Button>
      </div>

      {submittedId ? (
        <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-theme-main">
              Boundary Dispute Successfully Registered
            </h3>
            <p className="text-xs text-theme-muted mt-1">
              Statutory notice dispatched to Municipal Surveyor & Building Maintenance Committee.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-theme-surface border border-theme max-w-xs mx-auto text-xs font-mono font-bold text-blue-500">
            Case Number: {submittedId}
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/citizen/complaints')}
            >
              Track Case on Grievance Portal
            </Button>
            <Button
              variant="outline"
              onClick={() => setSubmittedId(null)}
            >
              File Another Notice
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-theme bg-theme-surface space-y-5">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-xs text-blue-700 dark:text-blue-300">
            <ShieldAlert size={18} className="flex-shrink-0 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Statutory Cadastral Objection Notice</span>
              <p className="text-[11px] leading-relaxed text-theme-muted">
                Under the National 3D Cadastral Framework, volumetric objections are cross-checked with the 3D building model and Municipal Sanction plan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-muted">Affected Property (My Unit)</label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="w-full bg-theme-subtle border border-theme rounded-md px-3 py-2 text-xs text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="U302">Flat 302 · Platinum Horizon Tower (Floor 12)</option>
                <option value="U101">Flat 101 · Tech Boulevard Tower (Floor 01)</option>
                <option value="U402">Flat 402 · Connaught Heritage Place (Floor 04)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-theme-muted">Dispute Category</label>
              <select
                value={form.disputeType}
                onChange={(e) => setForm({ ...form, disputeType: e.target.value })}
                className="w-full bg-theme-subtle border border-theme rounded-md px-3 py-2 text-xs text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Vertical Airspace Encroachment">Vertical Airspace Encroachment (Cantilever/Overhang)</option>
                <option value="Floor Boundary Overlap">Floor Boundary Overlap (Partition Wall Shifting)</option>
                <option value="Balcony Projection Dispute">Balcony Projection Dispute (Unauthorized Extension)</option>
                <option value="Common Area Encroachment">Common Area / Duct Encroachment</option>
              </select>
            </div>
          </div>

          <Input
            label="Target Structure / Neighboring Unit Involved"
            value={form.targetUnitOrBuilding}
            onChange={(e) => setForm({ ...form, targetUnitOrBuilding: e.target.value })}
            placeholder="e.g., Flat 1302 or Common Terrace Slab"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-muted">Factual Description of Spatial Intrusion</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-theme-subtle border border-theme rounded-md p-3 text-xs text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
              required
            />
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-dashed border-theme bg-theme-subtle/40 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:bg-theme-subtle transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.las,.laz,.obj"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setForm({ ...form, evidenceFiles: file.name });
                }
              }}
            />
            <Upload size={20} className="text-blue-500 mx-auto" />
            <div className="text-xs font-medium text-theme-main">
              Upload Photographic or 3D Laser Scan Evidence
            </div>
            <div className="text-[10px] text-theme-muted">
              Attached: <span className="font-mono text-blue-500 font-semibold">{form.evidenceFiles}</span> (Click to browse from device)
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/citizen/my-properties')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Submit Statutory Dispute Petition
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
