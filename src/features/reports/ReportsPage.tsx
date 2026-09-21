import React from 'react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { FileText, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { generateCadastralReportPdf } from '../../utils/pdfGenerator';
import { triggerFileDownload } from '../../utils/downloadHelper';

export const ReportsPage: React.FC = () => {
  const { buildings, parcels, units, disputes } = useCadastreStore();

  const reports = [
    {
      id: 'REP-2025-001',
      title: 'National 3D ULPIN Gazette Notification — Pilot Batch 1',
      type: 'Statutory Gazette',
      date: '15 Jan 2025',
      jurisdiction: 'Maharashtra (Mumbai BKC & Pune Hinjewadi)',
      recordsCount: 420,
      format: 'PDF / GeoJSON',
    },
    {
      id: 'REP-2025-002',
      title: 'Vertical Encroachment & Air Rights Violation Audit',
      type: 'Compliance & Enforcement',
      date: '02 Feb 2025',
      jurisdiction: 'Pune Municipal Corporation',
      recordsCount: 14,
      format: 'PDF',
    },
    {
      id: 'REP-2025-003',
      title: 'Volumetric Airspace Municipal Tax Assessment Ledger',
      type: 'Revenue & Valuation',
      date: '28 Feb 2025',
      jurisdiction: 'All Pilot Cities (MUM, PUN, DEL, AMD)',
      recordsCount: 728,
      format: 'XLSX / CSV',
    },
  ];

  const handleDownloadCsv = (r: typeof reports[0]) => {
    let csv = 'Building Name,2D ULPIN,Survey No,Floors Above,Approved Floors,Compliance Status\n';
    buildings.forEach((b) => {
      const isEncroaching = b.floorsAbove > b.approvedFloors;
      csv += `"${b.name}","${b.ulpin}","${b.bmcCtsNo || 'SR-101'}",${b.floorsAbove},${b.approvedFloors},"${isEncroaching ? 'Deviation' : 'Compliant'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `${r.id}_data_extract.csv`, 'text/csv');
  };

  const handleDownloadPdf = (r: typeof reports[0]) => {
    generateCadastralReportPdf(r, {
      buildings,
      parcels,
      units,
      disputes,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">Cadastral Reports & Gazette Extracts</h1>
          <p className="text-xs text-theme-muted mt-1">
            Certified statutory titles, vertical encroachment notices, and volumetric municipal tax roll statements.
          </p>
        </div>
      </div>

      <div className="border border-theme rounded-xl bg-theme-surface divide-y divide-theme overflow-hidden">
        {reports.map((r) => (
          <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-theme-main">{r.title}</h3>
                  <Chip label={r.type} variant="primary" size="sm" />
                </div>
                <div className="text-xs text-theme-muted font-mono mt-1">
                  Report ID: {r.id} · Issued: {r.date} · {r.jurisdiction} ({r.recordsCount} units)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                icon={<FileSpreadsheet size={14} />}
                onClick={() => handleDownloadCsv(r)}
              >
                CSV Data
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Download size={14} />}
                onClick={() => handleDownloadPdf(r)}
              >
                Download PDF Gazette
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
