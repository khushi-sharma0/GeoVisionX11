import React, { useState, useRef } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Scale,
  Search,
  Calendar,
  User,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  Filter,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dispute } from '../../domain/types';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';

export const AuthorityDisputesPage: React.FC = () => {
  const { disputes, buildings, selectBuilding } = useCadastreStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExhibitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedDispute) {
      selectedDispute.documents.push(`${file.name} (Uploaded Just Now)`);
    }
    setUploadNotice(`Order/Exhibit "${file.name}" successfully attached and cryptographically recorded.`);
    setTimeout(() => setUploadNotice(null), 5000);
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesType = filterType === 'All' || d.status === filterType;
    const claimantStr = d.claimant || d.petitionerName || '';
    const respondentStr = d.respondent || d.respondentName || '';
    const matchesSearch =
      d.disputeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.disputeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claimantStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      respondentStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.targetUnitOrBuilding.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const activeCount = disputes.filter((d) => d.status === 'Active' || d.status === 'Site Inspection Scheduled').length;
  const hearingCount = disputes.filter((d) => d.status === 'Hearing Scheduled').length;
  const resolvedCount = disputes.filter((d) => d.status === 'Resolved').length;

  const handleInspectIn3D = (buildingOrUnit: string) => {
    navigateTo3DBuilding(
      {
        targetBuildingId: buildingOrUnit,
        targetUnitId: buildingOrUnit,
        portal: 'authority',
      },
      navigate
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-theme-main">Cadastral & Airspace Disputes Tribunal</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Statutory Revenue Court
            </span>
          </div>
          <p className="text-xs text-theme-muted mt-1">
            Official judicial tracking of 3D airspace overlaps, cantilever disputes, and boundary contestations filed under Revenue Code Sec 143.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleExhibitUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
          >
            <UploadCloud size={14} className="text-blue-500" />
            <span>Upload Judicial Decree / Order</span>
          </Button>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20">
            Recorded
          </span>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-theme bg-theme-surface">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Total Petitions</span>
          <span className="font-mono text-2xl font-bold text-theme-main mt-1 block">{disputes.length}</span>
          <span className="text-[10px] text-theme-muted mt-0.5 block">Revenue Tribunal Registry</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Active / Under Audit</span>
          <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{activeCount}</span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">Total Station Survey Pending</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Hearing Scheduled</span>
          <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{hearingCount}</span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">Sub-Divisional Magistrate Court</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Resolved & Demarcated</span>
          <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">Decree Sealed & Uploaded</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-theme bg-theme-surface">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-theme-base border border-theme rounded-lg px-3 py-1.5 text-xs">
          <Search size={14} className="text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Case ID, parties, property..."
            className="w-full bg-transparent focus:outline-none text-theme-main placeholder-theme-muted"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['All', 'Active', 'Site Inspection Scheduled', 'Hearing Scheduled', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterType(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterType === st
                  ? 'bg-theme-primary text-white font-semibold shadow-xs'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* DISPUTES LIST */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-theme rounded-2xl bg-theme-surface">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-theme-main">No Disputes Found</h3>
            <p className="text-xs text-theme-muted mt-1">No cadastral disputes match the current search or status filter.</p>
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const isResolved = d.status === 'Resolved';
            const isHearing = d.status === 'Hearing Scheduled';
            const isInspection = d.status === 'Site Inspection Scheduled';

            return (
              <div
                key={d.disputeId}
                className="p-5 rounded-2xl border border-theme bg-theme-surface space-y-4 hover:border-amber-500/40 transition-all shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-theme-main">{d.disputeType}</span>
                      <Chip
                        label={d.status}
                        variant={isResolved ? 'success' : isHearing ? 'info' : 'warning'}
                        size="sm"
                      />
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-theme-subtle border border-theme text-theme-muted">
                        Case: <strong>{d.disputeId}</strong>
                      </span>
                    </div>
                    <div className="text-xs text-theme-muted font-mono mt-1 flex items-center gap-3">
                      <span>Filed: {d.filingDate}</span>
                      <span>•</span>
                      <span>Target: <strong className="text-blue-500">{d.targetUnitOrBuilding}</strong></span>
                      {d.hearingDate && (
                        <>
                          <span>•</span>
                          <span className="text-amber-500 font-semibold">Next Hearing: {d.hearingDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInspectIn3D(d.targetUnitOrBuilding)}
                      className="flex items-center gap-1.5"
                    >
                      <Building2 size={13} className="text-blue-500" />
                      <span>Inspect 3D Geometry</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedDispute(d)}
                    >
                      Hearing Dossier
                    </Button>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-theme-subtle/60 border border-theme text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Petitioner / Claimant</span>
                    <div className="font-bold text-theme-main">{d.claimant || d.petitionerName}</div>
                    <div className="text-[10px] text-theme-muted font-mono">Title Holder · Parcel {d.parcelId || '98213'}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Respondent / Contesting Party</span>
                    <div className="font-bold text-theme-main">{d.respondent || d.respondentName || 'Adjacent Occupant / Developer'}</div>
                    <div className="text-[10px] text-theme-muted font-mono">Adjacent Occupant / Developer</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-theme-muted leading-relaxed">
                  {d.description}
                </p>

                {/* Statutory Timeline Steps */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                    <span className="font-mono text-[9px] text-theme-muted block">STAGE 1</span>
                    <span className="font-bold text-theme-main">Petition Registered</span>
                    <span className="text-[10px] text-theme-muted block mt-0.5">{d.filingDate}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                    <span className="font-mono text-[9px] text-theme-muted block">STAGE 2</span>
                    <span className="font-bold text-theme-main">3D CAD Mesh Audit</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Deviations Flagged</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isInspection || isHearing || isResolved
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-theme bg-theme-subtle/40 opacity-60'
                  }`}>
                    <span className="font-mono text-[9px] text-theme-muted block">STAGE 3</span>
                    <span className="font-bold text-theme-main">Total Station Survey</span>
                    <span className="text-[10px] text-theme-muted block mt-0.5">
                      {isInspection ? 'Inspection Scheduled' : isHearing || isResolved ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    isResolved
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-theme bg-theme-subtle/40 opacity-60'
                  }`}>
                    <span className="font-mono text-[9px] text-theme-muted block">STAGE 4</span>
                    <span className="font-bold text-theme-main">Tribunal Final Order</span>
                    <span className="text-[10px] text-theme-muted block mt-0.5">
                      {isResolved ? 'Demarcation Sealed' : 'Awaiting Hearing'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DISPUTE DOSSIER MODAL */}
      {selectedDispute && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDispute(null)}
          title={`Tribunal Case Dossier: ${selectedDispute.disputeId}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-theme-subtle border border-theme space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-theme-main">{selectedDispute.disputeType}</span>
                <Chip label={selectedDispute.status} variant="warning" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-theme/60">
                <div>
                  <span className="text-[10px] text-theme-muted uppercase block">Petitioner</span>
                  <span className="font-bold text-theme-main">{selectedDispute.claimant}</span>
                </div>
                <div>
                  <span className="text-[10px] text-theme-muted uppercase block">Respondent</span>
                  <span className="font-bold text-theme-main">{selectedDispute.respondent}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Grievance Narrative</span>
              <p className="text-xs text-theme-muted leading-relaxed p-3 rounded-lg border border-theme bg-theme-surface">
                {selectedDispute.description}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Tribunal Evidence Exhibits</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <UploadCloud size={12} />
                  <span>+ Attach Exhibit / Order</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {selectedDispute.documents.map((docName, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-theme-subtle border border-theme font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-blue-500" />
                      <span>{docName}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified on Chain</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-theme">
              <Button
                variant="outline"
                onClick={() => handleInspectIn3D(selectedDispute.targetUnitOrBuilding)}
                className="flex items-center gap-1.5"
              >
                <Building2 size={13} className="text-blue-500" />
                <span>Open in 3D Explorer</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => setSelectedDispute(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
