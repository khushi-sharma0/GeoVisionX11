import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Unit, Building, Floor, Parcel } from '../../domain/types';
import { decodeUlpin3d, computeCheckDigits } from '../../domain/ulpin';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ShieldCheck, Download, Printer, CheckCircle, ExternalLink, Box, QrCode, FileText, Globe, Layers, FileCode } from 'lucide-react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useAuthStore } from '../../stores/authStore';
import { generatePropertyPassportPdf } from '../../utils/pdfGenerator';
import { useNavigate } from 'react-router-dom';
import { navigateTo3DBuilding } from '../../utils/navigationHelper';

interface PropertyPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  building?: Building;
  floor?: Floor;
  parcel?: Parcel;
}

export const PropertyPassportModal: React.FC<PropertyPassportModalProps> = ({
  isOpen,
  onClose,
  unit,
  building,
  floor,
  parcel,
}) => {
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const { approveUnitUlpin } = useCadastreStore();
  const { role, user } = useAuthStore();
  const navigate = useNavigate();

  if (!unit) return null;

  const decoded = decodeUlpin3d(unit.ulpin3d);
  const checkDigit = computeCheckDigits(unit.ulpin3d);
  const isVerified = unit.verificationStatus === 'Verified';

  // Deep-link verification URL readable by any phone camera
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#/citizen/passport?ulpin=${encodeURIComponent(unit.ulpin3d)}`
    : `https://geovision.gov.in/verify/${encodeURIComponent(unit.ulpin3d)}`;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveUnitUlpin(unit.ulpin3d, user.name);
      setTimeout(() => {
        setIsApproving(false);
      }, 400);
    } catch (e) {
      console.error(e);
      setIsApproving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Property Passport (3D ULPIN)"
      subtitle="Statutory Title Document · Government of India Cadastral Registry"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 rounded-lg bg-theme-subtle border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-theme-muted tracking-wider">
                Child 3D Cadastral Identifier (Unit)
              </span>
              <Chip
                label={unit.propertyType || 'Apartment'}
                variant="info"
                size="sm"
              />
              <Chip
                label={`Topology: ${unit.topologyStatus || (unit.disputeIds && unit.disputeIds.length > 0 ? 'Conflict Detected' : 'Valid')}`}
                variant={(unit.topologyStatus === 'Conflict Detected' || (unit.disputeIds && unit.disputeIds.length > 0)) ? 'danger' : 'success'}
                size="sm"
              />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold tracking-tight text-blue-600 dark:text-blue-400 select-all">
              {unit.ulpin3d}
            </div>

            {/* Permanent Parent ULPIN Linkage */}
            <div className="flex items-center gap-2 text-xs text-theme-muted bg-theme-base/60 px-2.5 py-1 rounded border border-theme/40 w-fit">
              <span className="font-semibold text-theme-main">Parent Parcel ULPIN:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {unit.parentUlpin || building?.ulpin || parcel?.ulpin2d || 'MH-2026-458712'}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Permanently Linked</span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Chip
                label={unit.verificationStatus}
                variant={isVerified ? 'success' : 'warning'}
                size="sm"
                icon={<ShieldCheck size={12} />}
              />
              <span className="text-xs text-theme-muted font-mono">
                Checksum: <strong className="text-theme-main">{checkDigit}</strong> (ISO 7064 Mod-97)
              </span>
            </div>
          </div>

          {/* Real Functional QR Code Container */}
          <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-gray-300 shadow-sm flex-shrink-0">
            <QRCodeSVG
              value={verificationUrl}
              size={96}
              level="M"
              includeMargin={false}
            />
            <span className="text-[9px] font-mono text-gray-800 mt-1 uppercase font-bold tracking-tight">
              Scan to Verify Title
            </span>
          </div>
        </div>

        {/* Breakdown of Segments (§7) */}
        <div className="border border-theme rounded-lg p-4 bg-theme-surface">
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-3 flex items-center gap-1.5">
            <Box size={14} className="text-blue-500" />
            <span>3D ULPIN Structural Segment Breakdown</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">STATE</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.state : 'MH'}</div>
              <div className="text-[9px] text-theme-muted">LGD Code</div>
            </div>
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">CITY</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.city : 'MUM'}</div>
              <div className="text-[9px] text-theme-muted">ULB Code</div>
            </div>
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">PARCEL</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.parcel : '98213'}</div>
              <div className="text-[9px] text-theme-muted">2D Survey Lot</div>
            </div>
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">BUILDING</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.building : 'B04'}</div>
              <div className="text-[9px] text-theme-muted">Structure ID</div>
            </div>
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">FLOOR</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.floor : 'F12'}</div>
              <div className="text-[9px] text-theme-muted">Elevation Slice</div>
            </div>
            <div className="p-2 rounded bg-theme-subtle border border-theme">
              <div className="text-[10px] text-theme-muted">UNIT</div>
              <div className="font-mono font-bold text-theme-main text-sm mt-0.5">{decoded && !('isError' in decoded) ? decoded.unit : 'U302'}</div>
              <div className="text-[9px] text-theme-muted">Spatial Prism</div>
            </div>
          </div>
        </div>

        {/* Property & Spatial Prism Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-theme bg-theme-surface space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center justify-between">
              <span>Spatial Geometry & CORS Datum</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {unit.coordinateSource || 'Source: GNSS/CORS Network'}
              </span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Flat / Unit Number:</span>
                <span className="font-mono font-bold text-theme-main">{unit.flatNumber || unit.unitId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Coordinate Source:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {unit.coordinateSource || 'Source: GNSS/CORS Network'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">CORS Base Station:</span>
                <span className="font-mono text-theme-main">
                  {unit.corsReference?.stationId || building?.corsStationId || 'SOI-CORS-MUM-04 (Bandra Kurla Base)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">RTK Survey Precision:</span>
                <span className="font-mono text-blue-500 font-semibold">
                  {unit.corsReference?.rtkPrecision || building?.gnssAccuracyM || 'Horizontal ±8mm / Vertical ±14mm'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Built-up / Carpet Area:</span>
                <span className="font-mono font-medium">{unit.builtUpAreaSqm} m² / {unit.carpetAreaSqm} m²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Volumetric Prism Elevation:</span>
                <span className="font-mono font-semibold text-blue-500">
                  +51.7m to +55.3m MSL
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Geographic Coordinates:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  19.065400° N, 72.868450° E
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-theme-muted">Geodetic Reference Datum:</span>
                <span className="font-mono text-theme-main">{unit.corsReference?.datum || 'ITRF2020 / WGS84 (EPSG:4978)'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-theme bg-theme-surface space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted">
              Ownership & Cadastral Title
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Registered Owner:</span>
                <span className="font-bold text-theme-main">{unit.ownerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">National Citizen ID:</span>
                <span className="font-mono">{role === 'Authority' ? unit.ownerId : 'MH-REG-4912-7812'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Property Category:</span>
                <span className="font-semibold text-theme-main">{unit.propertyType || 'Apartment'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Topology Status:</span>
                <span className={`font-semibold ${(unit.topologyStatus === 'Conflict Detected' || (unit.disputeIds && unit.disputeIds.length > 0)) ? 'text-red-500' : 'text-emerald-500'}`}>
                  {unit.topologyStatus || (unit.disputeIds && unit.disputeIds.length > 0 ? 'Conflict Detected' : 'Valid')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Assigned Parking Bay:</span>
                <span className="font-mono font-medium text-theme-main">{unit.parkingSlot || 'Demarcated Bay P-B1-04'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme/50">
                <span className="text-theme-muted">Municipal Tax Status:</span>
                <Chip
                  label={unit.taxStatus}
                  variant={unit.taxStatus === 'Paid' ? 'success' : 'danger'}
                  size="sm"
                />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-theme-muted">Approving Authority:</span>
                <span className="text-theme-main font-medium">{unit.approvedBy || 'Divisional Land Registry Node'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Interoperability Statement (Req #36) */}
        <div className="p-3.5 rounded-lg border border-theme bg-theme-subtle space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Globe size={13} className="text-blue-500" />
              <span>Statutory Interoperability & Open Standards Statement</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              ISO 19152 LADM / OGC CityGML 3.0 / LandInfra
            </span>
          </div>
          <p className="text-[11px] text-theme-muted leading-relaxed">
            All 3D volumetric parcels conform strictly to the <strong>OGC CityGML 3.0</strong> conceptual model, <strong>ISO 19152 Land Administration Domain Model (LADM)</strong> SpatialUnit package, and <strong>LandInfra / InfraGML Part 3</strong> standards. Spatial boundaries, CORS datum coordinates, and hierarchical ULPIN identifiers are exportable into vendor-neutral open GIS formats without proprietary vendor lock-in.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                const geojsonObj = {
                  type: 'FeatureCollection',
                  properties: {
                    cadastreStandard: 'ISO 19152 LADM',
                    source: 'Survey of India GNSS/CORS Network',
                    parentUlpin: unit.parentUlpin || building?.ulpin || 'MH-2026-458712',
                    childUlpin: unit.ulpin3d,
                    topologyStatus: unit.topologyStatus || 'Valid',
                    exportedAt: new Date().toISOString(),
                  },
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Polygon',
                        coordinates: building?.footprint?.coordinates || [
                          [[72.8682, 19.0652], [72.8690, 19.0653], [72.8689, 19.0658], [72.8681, 19.0657], [72.8682, 19.0652]]
                        ],
                      },
                      properties: {
                        unitId: unit.unitId,
                        ulpin3d: unit.ulpin3d,
                        parentUlpin: unit.parentUlpin || building?.ulpin || 'MH-2026-458712',
                        propertyType: unit.propertyType || 'Apartment',
                        owner: unit.ownerName,
                        carpetAreaSqm: unit.carpetAreaSqm,
                        coordinateSource: unit.coordinateSource || 'Source: GNSS/CORS Network',
                        corsStationId: unit.corsReference?.stationId || 'SOI-CORS-MUM-04',
                        topologyStatus: unit.topologyStatus || 'Valid',
                      },
                    },
                  ],
                };
                const blob = new Blob([JSON.stringify(geojsonObj, null, 2)], { type: 'application/geo+json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `3D_CADASTRE_${unit.ulpin3d}.geojson`;
                a.click();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-theme-surface border border-theme hover:border-blue-500 text-theme-main transition-colors"
            >
              <FileCode size={12} className="text-blue-500" />
              <span>Export 3D GeoJSON (.geojson)</span>
            </button>
            <button
              onClick={() => {
                const gmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<core:CityModel xmlns:core="http://www.opengis.net/citygml/3.0"
                xmlns:bldg="http://www.opengis.net/citygml/building/3.0"
                xmlns:gml="http://www.opengis.net/gml/3.2"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <gml:name>${unit.ulpin3d}</gml:name>
  <core:cityObjectMember>
    <bldg:BuildingUnit gml:id="${unit.unitId}">
      <gml:identifier codeSpace="urn:ogc:def:crs:EPSG::4978">${unit.ulpin3d}</gml:identifier>
      <bldg:parentUlpin>${unit.parentUlpin || building?.ulpin || 'MH-2026-458712'}</bldg:parentUlpin>
      <bldg:coordinateSource>Source: GNSS/CORS Network</bldg:coordinateSource>
      <bldg:corsStationId>${unit.corsReference?.stationId || 'SOI-CORS-MUM-04'}</bldg:corsStationId>
      <bldg:topologyStatus>${unit.topologyStatus || 'Valid'}</bldg:topologyStatus>
      <bldg:usage>${unit.propertyType || 'Apartment'}</bldg:usage>
      <bldg:ownerName>${unit.ownerName}</bldg:ownerName>
      <bldg:carpetArea uom="m2">${unit.carpetAreaSqm}</bldg:carpetArea>
    </bldg:BuildingUnit>
  </core:cityObjectMember>
</core:CityModel>`;
                const blob = new Blob([gmlContent], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CityGML_3.0_${unit.ulpin3d}.gml`;
                a.click();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-theme-surface border border-theme hover:border-emerald-500 text-theme-main transition-colors"
            >
              <Layers size={12} className="text-emerald-500" />
              <span>Export CityGML 3.0 (.gml)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => {
                const blob = new Blob([JSON.stringify(unit, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PASSPORT_${unit.ulpin3d}.json`;
                a.click();
              }}
            >
              JSON-LD
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<FileText size={14} />}
              onClick={() => generatePropertyPassportPdf(unit, building, floor, parcel)}
            >
              Download Official PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Box size={14} className="text-blue-500" />}
              onClick={() => {
                onClose();
                navigateTo3DBuilding(
                  {
                    targetBuildingId: building?.buildingId,
                    targetFloorId: floor?.floorId,
                    targetUnitId: unit.unitId,
                    portal: role === 'Authority' ? 'authority' : 'citizen',
                  },
                  navigate
                );
              }}
            >
              View in 3D
            </Button>
          </div>

          {/* Authority Approval Button */}
          {role === 'Authority' && !isVerified && (
            <Button
              variant="primary"
              size="sm"
              loading={isApproving}
              icon={<CheckCircle size={14} />}
              onClick={handleApprove}
            >
              Statutory Endorsement & Approve 3D ULPIN
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
