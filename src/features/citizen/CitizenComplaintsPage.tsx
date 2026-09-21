import React, { useState, useRef } from 'react';
import { useComplaintsStore } from '../../stores/complaintsStore';
import { useAuthStore } from '../../stores/authStore';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  MessageSquareWarning,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UploadCloud,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  User,
  Filter,
  Trash2,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';

export const CitizenComplaintsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { complaints, addComplaint } = useComplaintsStore();
  const { user } = useAuthStore();
  const { buildings, selectBuilding } = useCadastreStore();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'In Review' | 'Resolved'>('All');

  // Form State
  const [category, setCategory] = useState('Illegal Construction / Encroachment');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [linkedPropertyId, setLinkedPropertyId] = useState('MH-MUM-98213-B04-F12-U302');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus === 'All') return true;
    return c.status === filterStatus;
  });

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inReviewCount = complaints.filter((c) => c.status === 'In Review').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const handleProcessFile = (file: File) => {
    setSelectedFile(file);
    setEvidenceFileName(file.name);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setEvidenceFileName('');
    setPreviewUrl(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newId = addComplaint({
        citizenId: user.id || 'CIT-MH-98213-0302',
        citizenName: user.name || 'Aditya Vikram Singhania',
        category,
        linkedPropertyId,
        parcelId: '98213',
        buildingId: 'B04',
        unitId: 'U302',
        subject,
        description,
        evidenceFileName: evidenceFileName || 'boundary_survey_evidence.pdf',
      });

      setIsSubmitting(false);
      setSubmittedId(newId);

      // Reset form
      setSubject('');
      setDescription('');
      handleRemoveFile();

      setTimeout(() => {
        setSubmittedId(null);
        setIsModalOpen(false);
      }, 1500);
    }, 400);
  };

  const handleViewIn3d = (complaint: any) => {
    let bId = complaint.buildingId;
    let uId = complaint.unitId;
    let pId = complaint.parcelId;

    if (!bId && complaint.linkedPropertyId) {
      const parts = complaint.linkedPropertyId.split('-');
      const foundB = parts.find((p: string) => p.startsWith('B'));
      if (foundB) bId = foundB;
      const foundU = parts.find((p: string) => p.startsWith('U'));
      if (foundU) uId = foundU;
    }

    navigateTo3DBuilding(
      {
        targetBuildingId: bId,
        targetParcelId: pId,
        targetUnitId: uId,
        portal: 'citizen',
      },
      navigate
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-main">Citizen Grievance & Complaint Tracker</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Statutory Fast-Track
            </span>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Lodge and monitor municipal complaints regarding unauthorized floor slabs, airspace encroachments, and boundary discrepancies.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 shadow-md"
        >
          <Plus size={15} />
          <span>Raise a Complaint</span>
        </Button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-theme bg-theme-surface">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Total Filed</span>
          <span className="font-mono text-xl font-bold text-theme-main mt-1 block">{complaints.length}</span>
          <span className="text-[10px] text-theme-muted mt-0.5 block">Logged on Bhu-Aadhaar</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Under Review</span>
          <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{inReviewCount}</span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">LiDAR / CAD audit</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Awaiting Action</span>
          <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">In municipal queue</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resolved</span>
          <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">Order passed</span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-theme pb-2">
        <Filter size={13} className="text-theme-muted" />
        <span className="text-xs font-semibold text-theme-muted mr-2">Filter by Status:</span>
        {(['All', 'Pending', 'In Review', 'Resolved'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-theme-primary text-white font-semibold shadow-xs'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* COMPLAINTS LIST */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-theme rounded-2xl bg-theme-surface">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-theme-main">No Complaints Under This Filter</h3>
            <p className="text-xs text-theme-muted mt-1">All properties are currently compliant or no tickets match the selected status.</p>
          </div>
        ) : (
          filteredComplaints.map((c) => {
            const isResolved = c.status === 'Resolved';
            const isInReview = c.status === 'In Review';

            return (
              <div
                key={c.complaintId}
                className="p-5 rounded-2xl border border-theme bg-theme-surface space-y-4 hover:border-blue-500/40 transition-all shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-theme-main">{c.subject}</span>
                      <Chip
                        label={c.status}
                        variant={isResolved ? 'success' : isInReview ? 'warning' : 'info'}
                        size="sm"
                      />
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-theme-subtle border border-theme text-theme-muted font-medium">
                        {c.category}
                      </span>
                    </div>
                    <div className="text-xs text-theme-muted font-mono mt-1 flex items-center gap-3">
                      <span>Case ID: <strong className="text-theme-main">{c.complaintId}</strong></span>
                      <span>•</span>
                      <span>Filed on {c.filingDate}</span>
                      <span>•</span>
                      <span>Target: <strong className="text-blue-500">{c.linkedPropertyId}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewIn3d(c)}
                      className="flex items-center gap-1.5"
                    >
                      <Building2 size={13} className="text-blue-500" />
                      <span>Inspect in 3D</span>
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-theme-muted leading-relaxed">
                  {c.description}
                </p>

                {/* Evidence attachment */}
                {c.evidenceFileName && (
                  <div className="flex items-center gap-2 text-[11px] text-theme-muted font-mono bg-theme-subtle/70 p-2 rounded-lg border border-theme w-fit">
                    <FileText size={13} className="text-blue-500" />
                    <span>Evidence Attached: <strong>{c.evidenceFileName}</strong></span>
                  </div>
                )}

                {/* Authority Investigation Box */}
                {(c.assignedOfficer || c.authorityRemarks) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Municipal Action & Officer Remarks
                      </span>
                      {c.assignedOfficer && (
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Assigned: <strong>{c.assignedOfficer}</strong>
                        </span>
                      )}
                    </div>
                    {c.authorityRemarks && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{c.authorityRemarks}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* LODGE COMPLAINT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise a Statutory Municipal Complaint"
        size="lg"
      >
        {submittedId ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <h3 className="font-bold text-base text-theme-main">Complaint Lodged Successfully</h3>
            <p className="text-xs text-theme-muted font-mono">
              Statutory Docket ID: <strong className="text-theme-main">{submittedId}</strong>
            </p>
            <p className="text-xs text-theme-muted">
              Your grievance has been entered into the municipal CAD audit queue. You will receive an SMS and portal update once the 3D LiDAR cross-section check is concluded.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-theme-muted">
              Submit an official report regarding unauthorized building extensions, floor plan discrepancies, or vertical airspace violations.
            </p>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Complaint Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
              >
                <option value="Illegal Construction / Encroachment">Illegal Construction / Airspace Encroachment</option>
                <option value="Floor Plan Discrepancy">Floor Plan & RERA Carpet Area Discrepancy</option>
                <option value="Tax / Assessment Error">Municipal Property Tax / Zone Assessment Error</option>
                <option value="Utility Obstruction">Sub-surface Utility / Pipeline Access Obstruction</option>
                <option value="Boundary Misalignment">Cadastral Boundary Misalignment (Total Station Audit)</option>
              </select>
            </div>

            {/* Linked Property ULPIN */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Target 3D Property / ULPIN</label>
              <input
                type="text"
                value={linkedPropertyId}
                onChange={(e) => setLinkedPropertyId(e.target.value)}
                placeholder="e.g. MH-MUM-98213-B04-F12-U302"
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs font-mono text-theme-main focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Subject Summary</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cantilever projection extending over Floor 12 balcony"
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Detailed Grievance Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide exact details of the deviation, affected floors, and observations..."
                rows={4}
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* File Upload Evidence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-main block">
                Supporting Evidence (Photos / Sanction Drawings / LiDAR scans)
              </label>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  className="border-2 border-dashed border-theme rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-theme-subtle/50 hover:border-blue-500 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                    <UploadCloud size={20} />
                  </div>
                  <span className="text-xs font-semibold text-theme-main">
                    Click to browse or drag & drop file from device
                  </span>
                  <span className="text-[10px] text-theme-muted mt-1">
                    Supports JPG, PNG, WEBP, PDF, CAD DXF (Up to 25MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.dxf"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-theme bg-theme-subtle flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-theme flex-shrink-0 bg-black">
                        <img
                          src={previewUrl}
                          alt="Evidence preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                        <FileText size={22} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-theme-main truncate">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-theme-muted">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                          <Check size={11} /> Attached
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex-shrink-0 cursor-pointer"
                    title="Remove selected file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-3 border-t border-theme">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5"
              >
                {isSubmitting ? 'Registering Docket...' : 'Submit Grievance'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
