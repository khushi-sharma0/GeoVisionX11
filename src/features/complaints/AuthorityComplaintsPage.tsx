import React, { useState } from 'react';
import { useComplaintsStore } from '../../stores/complaintsStore';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  MessageSquareWarning,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  ShieldCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  Send,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Complaint } from '../../domain/types';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';

export const AuthorityComplaintsPage: React.FC = () => {
  const { complaints, updateComplaintStatus } = useComplaintsStore();
  const { buildings, selectBuilding } = useCadastreStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Review' | 'Resolved'>('All');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Modal actions state
  const [newStatus, setNewStatus] = useState<Complaint['status']>('In Review');
  const [remarks, setRemarks] = useState('');
  const [officerName, setOfficerName] = useState(user.name || 'Er. Rajesh Deshmukh');
  const [isUpdating, setIsUpdating] = useState(false);

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch =
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.linkedPropertyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inReviewCount = complaints.filter((c) => c.status === 'In Review').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const handleOpenAdjudicate = (c: Complaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setRemarks(c.authorityRemarks || '');
    setOfficerName(c.assignedOfficer || user.name || 'Municipal Town Planner');
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdating(true);
    setTimeout(() => {
      updateComplaintStatus(selectedComplaint.complaintId, newStatus, remarks, officerName);
      setIsUpdating(false);
      setSelectedComplaint(null);
    }, 400);
  };

  const handleInspectInGlobe = (complaintOrUlpin: Complaint | string) => {
    if (typeof complaintOrUlpin === 'object' && complaintOrUlpin !== null) {
      navigateTo3DBuilding(
        {
          ulpin3d: complaintOrUlpin.linkedPropertyId,
          targetBuildingId: complaintOrUlpin.buildingId,
          targetUnitId: complaintOrUlpin.unitId,
          targetParcelId: complaintOrUlpin.parcelId,
          portal: 'authority',
        },
        navigate
      );
    } else {
      navigateTo3DBuilding(
        {
          ulpin3d: complaintOrUlpin,
          portal: 'authority',
        },
        navigate
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-main">Citizen Grievance & Complaints Adjudication</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Authority Portal
            </span>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Review spatial boundary objections, illegal floor projections, and audit reports submitted by citizens.
          </p>
        </div>
      </div>

      {/* METRIC COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-theme bg-theme-surface">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Total Lodged</span>
          <span className="font-mono text-2xl font-bold text-theme-main mt-1 block">{complaints.length}</span>
          <span className="text-[10px] text-theme-muted mt-0.5 block">State Cadastral Registry</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Pending First Review</span>
          <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">Awaiting Officer Assignment</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Under Investigation</span>
          <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{inReviewCount}</span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">LiDAR / Total Station Audit</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resolved & Closed</span>
          <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">Statutory Order Issued</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-theme bg-theme-surface">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-theme-base border border-theme rounded-lg px-3 py-1.5 text-xs">
          <Search size={14} className="text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, ULPIN, subject..."
            className="w-full bg-transparent focus:outline-none text-theme-main placeholder-theme-muted"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['All', 'Pending', 'In Review', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-theme-primary text-white font-semibold shadow-xs'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* COMPLAINTS TABLE */}
      <div className="border border-theme rounded-2xl bg-theme-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-subtle border-b border-theme text-theme-muted uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Case ID / Date</th>
                <th className="p-3.5">Petitioner</th>
                <th className="p-3.5">Target 3D ULPIN</th>
                <th className="p-3.5">Category & Subject</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-theme-muted">
                    No complaints match your search query.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isResolved = c.status === 'Resolved';
                  const isInReview = c.status === 'In Review';

                  return (
                    <tr key={c.complaintId} className="hover:bg-theme-subtle/50 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-theme-main">{c.complaintId}</div>
                        <div className="text-[11px] text-theme-muted">{c.filingDate}</div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-theme-main">{c.citizenName}</div>
                        <div className="text-[10px] font-mono text-theme-muted">{c.citizenId}</div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-mono">
                        <div className="text-blue-500 font-semibold truncate max-w-[200px]">
                          {c.linkedPropertyId}
                        </div>
                        <div className="text-[10px] text-theme-muted">Parcel {c.parcelId} · Bldg {c.buildingId}</div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-theme-main truncate">{c.subject}</div>
                        <div className="text-[11px] text-theme-muted line-clamp-1">{c.description}</div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <Chip
                          label={c.status}
                          variant={isResolved ? 'success' : isInReview ? 'warning' : 'info'}
                          size="sm"
                        />
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInspectInGlobe(c)}
                          className="px-2"
                          title="View building in 3D Explorer"
                        >
                          <Building2 size={13} className="text-blue-500" />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAdjudicate(c)}
                        >
                          Review & Act
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUDICATE MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Adjudicate Grievance: ${selectedComplaint.complaintId}`}
          size="lg"
        >
          <form onSubmit={handleSaveAction} className="space-y-4">
            {/* Case Meta Box */}
            <div className="p-3.5 rounded-xl bg-theme-subtle/80 border border-theme space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-theme-muted uppercase block">Petitioner</span>
                  <span className="font-bold text-theme-main">{selectedComplaint.citizenName} ({selectedComplaint.citizenId})</span>
                </div>
                <div>
                  <span className="text-[10px] text-theme-muted uppercase block">Target 3D Property</span>
                  <span className="font-mono font-bold text-blue-500">{selectedComplaint.linkedPropertyId}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-theme/60">
                <span className="text-[10px] text-theme-muted uppercase block">Subject</span>
                <span className="font-bold text-theme-main">{selectedComplaint.subject}</span>
              </div>
              <p className="text-xs text-theme-muted italic">
                "{selectedComplaint.description}"
              </p>
              {selectedComplaint.evidenceFileName && (
                <div className="flex items-center gap-1.5 text-[11px] text-blue-500 font-mono">
                  <FileText size={13} />
                  <span>Evidence File: {selectedComplaint.evidenceFileName}</span>
                </div>
              )}
            </div>

            {/* Change Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Update Statutory Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Complaint['status'])}
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Pending">Pending (Under Queue)</option>
                <option value="In Review">In Review (LiDAR & CAD Cross-Section Audit in Progress)</option>
                <option value="Resolved">Resolved (Statutory Demarcation Order Issued / Demolition Notice)</option>
              </select>
            </div>

            {/* Assigned Officer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Assigned Cadastral Officer / Town Planner</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
                placeholder="e.g. Er. Rajesh Deshmukh"
                required
              />
            </div>

            {/* Official Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main block">Official Authority Remarks & Action Log</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter inspection findings, LiDAR deviation metrics, or statutory order reference..."
                rows={3}
                className="w-full bg-theme-surface border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-theme">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleInspectInGlobe(selectedComplaint)}
                className="flex items-center gap-1.5"
              >
                <Building2 size={13} className="text-blue-500" />
                <span>Open in 3D Explorer</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isUpdating ? 'Recording...' : 'Update & Notify Citizen'}</span>
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
