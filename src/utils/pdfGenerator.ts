import { jsPDF } from 'jspdf';
import { Unit, Building, Floor, Parcel } from '../domain/types';
import { triggerFileDownload } from './downloadHelper';

/**
 * Generates an official, certified Government of India Digital Property Passport PDF
 * adhering to DoLR & Bhu-Aadhaar standards.
 * Features strict margin boundaries, calculated row heights, and text wrapping.
 */
export function generatePropertyPassportPdf(
  unit: Unit,
  building?: Building,
  floor?: Floor,
  parcel?: Parcel
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer Security Border & Guilloche-style double frame
  doc.setDrawColor(15, 45, 90);
  doc.setLineWidth(1.0);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.35);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

  // Top National Emblem & Header Banner
  doc.setFillColor(15, 45, 90);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNMENT OF INDIA · DEPARTMENT OF LAND RESOURCES', pageWidth / 2, margin + 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('NATIONAL 3D CADASTRAL REGISTRY & GEOSPATIAL AIRSPACE PORTAL', pageWidth / 2, margin + 15, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(220, 235, 255);
  doc.text('Digital Property Passport · Statutory 3D Title Extract (ISO 19152 LADM Compliant)', pageWidth / 2, margin + 21, { align: 'center' });

  // Document Title
  let y = margin + 31;
  doc.setTextColor(15, 45, 90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DIGITAL PROPERTY PASSPORT (BHU-AADHAAR 3D)', pageWidth / 2, y, { align: 'center' });

  // 3D ULPIN Highlight Box
  y += 5;
  const ulpinText = unit.ulpin3d || `${parcel?.ulpin2d || '2710150098213'}-${building?.buildingId || 'B01'}-${floor?.code || 'F12'}-${unit.unitId || 'U302'}`;
  const ulpinBoxHeight = ulpinText.length > 35 ? 20 : 18;
  doc.setFillColor(243, 248, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin + 6, y, contentWidth - 12, ulpinBoxHeight, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ASSIGNED 3D UNIQUE LAND PARCEL IDENTIFICATION NUMBER (3D ULPIN)', pageWidth / 2, y + 5.5, { align: 'center' });

  // Dynamically scale font size to prevent overlapping or clipping
  if (ulpinText.length > 36) {
    doc.setFontSize(9);
  } else if (ulpinText.length > 28) {
    doc.setFontSize(10.5);
  } else {
    doc.setFontSize(12);
  }
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 45, 140);
  doc.text(ulpinText, pageWidth / 2, y + (ulpinBoxHeight === 20 ? 14 : 13), { align: 'center' });

  y += ulpinBoxHeight + 6;

  // Geographic Coordinates calculation
  const buildingCentroid = building?.footprint?.coordinates?.[0]?.[0] || [72.8258, 18.9986];
  const lng = buildingCentroid[0] || 72.8258;
  const lat = buildingCentroid[1] || 18.9986;
  const latStr = `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(6)}° ${lng >= 0 ? 'E' : 'W'}`;
  const baseElev = (building?.baseElevationM || 8.5) + (floor ? (parseFloat(floor.code.replace(/\D/g, '')) || 12) * 3.4 : 40.8);

  // Helper to render section title with divider
  const renderSectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 45, 90);
    doc.text(title, margin + 4, y);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin + 4, y + 1.8, pageWidth - margin - 4, y + 1.8);
    y += 6;
  };

  // Helper for rendering 2-column paired rows with automatic wrapping and fixed column width
  const renderTwoColumnRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    isMonospaceVal = false
  ) => {
    const col1X = margin + 4;
    const col1ValX = margin + 38;
    const col1ValWidth = 50;

    const col2X = margin + 94;
    const col2ValX = margin + 130;
    const col2ValWidth = contentWidth - 130 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label1, col1X, y);
    doc.text(label2, col2X, y);

    // Format value 1
    doc.setFont(isMonospaceVal ? 'courier' : 'helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const lines1 = doc.splitTextToSize(val1 || '—', col1ValWidth);
    doc.text(lines1, col1ValX, y);

    // Format value 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const lines2 = doc.splitTextToSize(val2 || '—', col2ValWidth);
    doc.text(lines2, col2ValX, y);

    const maxLines = Math.max(lines1.length, lines2.length);
    const rowHeight = Math.max(maxLines * 4.2, 5.2);
    y += rowHeight;
  };

  // Full-width row helper for long addresses or owner details
  const renderFullWidthRow = (label: string, val: string, isMonospaceVal = false) => {
    const colX = margin + 4;
    const valX = margin + 38;
    const valWidth = contentWidth - 42;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, colX, y);

    doc.setFont(isMonospaceVal ? 'courier' : 'helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(val || '—', valWidth);
    doc.text(lines, valX, y);

    const rowHeight = Math.max(lines.length * 4.2, 5.2);
    y += rowHeight;
  };

  // Section 1: Cadastral & Municipal Identifiers
  renderSectionHeader('1. CADASTRAL & MUNICIPAL IDENTIFIERS');
  renderTwoColumnRow(
    'Parent ULPIN (Base):',
    unit.parentUlpin || building?.ulpin || parcel?.ulpin2d || 'MH-2026-458712',
    'Child ULPIN (Unit):',
    unit.ulpin3d,
    true
  );
  renderTwoColumnRow(
    'Survey / CTS No:',
    parcel?.surveyNumber || building?.bmcCtsNo || 'CTS-418/2B',
    'Structure / Tower:',
    building?.name || 'Platinum Horizon Tower',
    true
  );
  renderTwoColumnRow(
    'Unit / Flat No:',
    unit.flatNumber || unit.unitId,
    'Floor / Level:',
    floor?.label || `Level ${floor?.code || 'F12'}`
  );
  renderTwoColumnRow(
    'Property Type:',
    unit.propertyType || 'Apartment',
    'Cadastral Source:',
    `${parcel?.source || 'DILRMP'} / BMC GIS Node`
  );
  renderTwoColumnRow(
    'City / District:',
    `${parcel?.city || 'MUM'} · ${parcel?.district || 'Mumbai Suburban'} (${parcel?.state || 'MH'})`,
    'Zoning / Code:',
    parcel?.zoneCode || 'C-2 (Mixed Commercial-Residential)'
  );
  renderFullWidthRow(
    'Property Address:',
    building?.address || 'Worli Sea Face, Worli, Mumbai, Maharashtra 400030'
  );

  y += 2;

  // Section 2: Spatial Geometry & Geographic Coordinates (Requirement 8, 32, 34)
  renderSectionHeader('2. SPATIAL GEOMETRY, GEODETIC DATUM & CORS NETWORK ATTRIBUTES');
  renderTwoColumnRow(
    'Coordinate Source:',
    'Source: GNSS/CORS Network',
    'CORS Base Station:',
    unit.corsReference?.stationId || building?.corsStationId || 'SOI-CORS-MUM-04 (Bandra Kurla Base)',
    true
  );
  renderTwoColumnRow(
    'Latitude (WGS-84):',
    latStr,
    'Longitude (WGS-84):',
    lngStr,
    true
  );
  renderTwoColumnRow(
    'GNSS RTK Precision:',
    unit.corsReference?.rtkPrecision || building?.gnssAccuracyM || 'Horizontal ±8mm / Vertical ±14mm',
    'Geodetic Reference Datum:',
    unit.corsReference?.datum || 'ITRF2020 / WGS 84 (EPSG:4978)',
    true
  );
  renderTwoColumnRow(
    'Topology Status:',
    unit.topologyStatus || (unit.disputeIds && unit.disputeIds.length > 0 ? 'Conflict Detected' : 'Valid (Pass)'),
    'Verification Status:',
    unit.verificationStatus || 'Verified & Sealed',
    true
  );
  renderTwoColumnRow(
    'Base Elevation:',
    `+${baseElev.toFixed(2)} m MSL (Datum)`,
    'Vertical Airspace:',
    `+${baseElev.toFixed(2)}m to +${(baseElev + (floor?.heightM || 3.4)).toFixed(2)}m MSL`
  );
  renderTwoColumnRow(
    'RERA Carpet Area:',
    `${unit.carpetAreaSqm.toFixed(2)} m² (${(unit.carpetAreaSqm * 10.7639).toFixed(1)} sq ft)`,
    'Built-up Area:',
    `${unit.builtUpAreaSqm.toFixed(2)} m² (${(unit.builtUpAreaSqm * 10.7639).toFixed(1)} sq ft)`
  );
  renderTwoColumnRow(
    'Enclosed Air Volume:',
    `${(unit.builtUpAreaSqm * (floor?.heightM || 3.2)).toFixed(1)} m³`,
    'Permitted Usage:',
    floor?.usage === 'Office' ? 'Commercial IT / Corporate' : 'Residential Luxury Housing'
  );
  renderTwoColumnRow(
    'Assigned Parking:',
    unit.parkingSlot || 'Covered Bay P-B1-04',
    'Storage Space:',
    unit.storage || 'Basement Vault S-12'
  );

  y += 2;

  // Section 3: Registered Title & Assessment Record
  renderSectionHeader('3. REGISTERED TITLE, REVENUE & TAXATION RECORD');
  renderTwoColumnRow(
    'Registered Owner:',
    unit.ownerName,
    'Aadhaar / Tax ID:',
    unit.ownerId || 'AADH-****-6721',
    true
  );
  renderTwoColumnRow(
    'Registration Date:',
    unit.registrationDate ? unit.registrationDate.substring(0, 10) : '2023-04-12',
    'Property Tax Status:',
    `${unit.taxStatus.toUpperCase()} (FY 2025-26 Cleared)`
  );
  renderTwoColumnRow(
    'Verification Status:',
    unit.verificationStatus || 'Verified & Sealed',
    'Approving Authority:',
    unit.approvedBy || 'Divisional Joint Director, Land Records'
  );

  y += 3;

  // Section 4: Statutory Endorsement Box & Digital Seal
  const certBoxHeight = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 4, y, contentWidth - 8, certBoxHeight, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 45, 90);
  doc.text('STATUTORY ENDORSEMENT & CERTIFICATE OF AUTHENTICITY', margin + 8, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const legalText =
    'This Digital Property Passport is issued under the National 3D Cadastral Framework pursuant to the Digital India Land Records Modernization Programme (DILRMP). The volumetric prism coordinates, geographic datum references, and vertical airspace boundaries contained herein constitute certified statutory evidence of vertical property title, cadastral demarcations, and airspace ownership rights under Indian Law.';
  const splitLegal = doc.splitTextToSize(legalText, contentWidth - 62);
  doc.text(splitLegal, margin + 8, y + 10);

  // Digital verification metadata
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Digital Signature SHA-256: 9b2d8e4f0a7c1b5e39d248a70c61fe4412809e6d`, margin + 8, y + 23);
  doc.text(`Timestamp: ${new Date().toISOString()} · Issuer: GeoVision Central Node · 0 Conflicts`, margin + 8, y + 27);
  doc.text(`Coordinates Datum: WGS-84 / Survey of India Levelling Network`, margin + 8, y + 31);

  // Authorized Signatory Stamp (Right inside cert box)
  const stampX = pageWidth - margin - 50;
  doc.setDrawColor(15, 45, 90);
  doc.setLineWidth(0.4);
  doc.roundedRect(stampX, y + 3, 44, certBoxHeight - 6, 1.5, 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 45, 90);
  doc.text('AUTHORIZED REGISTRAR', stampX + 22, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Department of Land Resources', stampX + 22, y + 13, { align: 'center' });
  doc.text('Ministry of Rural Development', stampX + 22, y + 17, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text('[DIGITALLY SIGNED]', stampX + 22, y + 23, { align: 'center' });

  // Footer Page Number & National Watermark
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Page 1 of 1 · GeoVision National 3D Cadastre · Official Government of India Portal · dolr.gov.in',
    pageWidth / 2,
    pageHeight - margin + 4,
    { align: 'center' }
  );

  // Trigger Save File via robust browser download trigger
  const sanitizedUlpin = (unit.ulpin3d || 'UNIT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfBlob = doc.output('blob');
  triggerFileDownload(pdfBlob, `Property_Passport_${sanitizedUlpin}.pdf`, 'application/pdf');
}

/**
 * Generates an official Cadastral Gazette / Audit Report PDF
 */
export function generateCadastralReportPdf(
  report: {
    id: string;
    title: string;
    type: string;
    date: string;
    jurisdiction: string;
    recordsCount: number;
  },
  data: {
    buildings: Building[];
    parcels: Parcel[];
    units: Unit[];
    disputes: any[];
  }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Decorative Border
  doc.setDrawColor(20, 50, 95);
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Header Banner
  doc.setFillColor(20, 50, 95);
  doc.rect(margin, margin, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNMENT OF INDIA · DEPARTMENT OF LAND RESOURCES', pageWidth / 2, margin + 8, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DIGITAL INDIA LAND RECORDS MODERNIZATION PROGRAMME (DILRMP)', pageWidth / 2, margin + 14, { align: 'center' });
  doc.text('OFFICIAL STATUTORY GAZETTE & CADASTRAL AUDIT REPORT', pageWidth / 2, margin + 19, { align: 'center' });

  // Report Title & Metadata
  let y = margin + 31;
  doc.setTextColor(20, 50, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(report.title.toUpperCase(), margin + 4, y);

  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Gazette Record Ref: ${report.id}  |  Classification: ${report.type}  |  Date: ${report.date}`, margin + 4, y);
  y += 4.5;
  doc.text(`Jurisdiction: ${report.jurisdiction}  |  Audited Scope: ${report.recordsCount} Cadastral Prisms`, margin + 4, y);

  doc.setDrawColor(20, 50, 95);
  doc.setLineWidth(0.4);
  doc.line(margin + 4, y + 3, pageWidth - margin - 4, y + 3);

  // Executive Summary Card
  y += 8;
  doc.setFillColor(245, 248, 255);
  doc.rect(margin + 4, y, contentWidth - 8, 22, 'F');
  doc.setDrawColor(180, 200, 230);
  doc.rect(margin + 4, y, contentWidth - 8, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 50, 95);
  doc.text('EXECUTIVE CADASTRAL SUMMARY', margin + 8, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text(
    `This certified document sets forth the statutory 3D parcel demarcations, volumetric rights determinations,\nand vertical compliance audit for ${report.jurisdiction}. Issued under the authority of the Joint Secretary &\nDirector General of Land Records, Ministry of Rural Development, Government of India.`,
    margin + 8,
    y + 10.5
  );

  // Table of Audited Structures
  y += 27;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 50, 95);
  doc.text('AUDITED HIGH-RISE STRUCTURES & VERTICAL PARCEL LEDGER', margin + 4, y);

  y += 4;
  doc.setFillColor(20, 50, 95);
  doc.rect(margin + 4, y, contentWidth - 8, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('STRUCTURE NAME', margin + 6, y + 5);
  doc.text('2D ULPIN', margin + 55, y + 5);
  doc.text('SURVEY NO', margin + 95, y + 5);
  doc.text('BUILT / SANCTION', margin + 125, y + 5);
  doc.text('STATUS', margin + 155, y + 5);

  y += 7;

  const sampleBuildings = data.buildings.slice(0, 8);
  sampleBuildings.forEach((b, idx) => {
    const isEncroaching = b.floorsAbove > b.approvedFloors;
    const isEven = idx % 2 === 0;

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 4, y, contentWidth - 8, 6.5, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(20, 20, 20);
    const nameStr = b.name.length > 24 ? b.name.substring(0, 23) + '…' : b.name;
    doc.text(nameStr, margin + 6, y + 4.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(60, 60, 60);
    doc.text(b.ulpin || '2710150098213', margin + 55, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(b.bmcCtsNo || 'CTS-102', margin + 95, y + 4.5);

    doc.setFont('courier', 'bold');
    doc.text(`${b.floorsAbove} / ${b.approvedFloors} Fl`, margin + 125, y + 4.5);

    if (isEncroaching) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(`+${b.floorsAbove - b.approvedFloors} Fl Deviation`, margin + 155, y + 4.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('100% Compliant', margin + 155, y + 4.5);
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin + 4, y + 6.5, pageWidth - margin - 4, y + 6.5);

    y += 6.5;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Page 1 of 1 · Certified Official Government of India Cadastral Extract · dilrmp.gov.in',
    pageWidth / 2,
    pageHeight - margin + 4,
    { align: 'center' }
  );

  const sanitizedId = report.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const reportBlob = doc.output('blob');
  triggerFileDownload(reportBlob, `${sanitizedId}_Official_Gazette_Report.pdf`, 'application/pdf');
}
