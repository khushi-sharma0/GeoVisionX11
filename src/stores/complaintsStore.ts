import { create } from 'zustand';
import { Complaint } from '../domain/types';

interface ComplaintsState {
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'complaintId' | 'filingDate' | 'status' | 'updatedAt'>) => string;
  updateComplaintStatus: (complaintId: string, status: Complaint['status'], remarks?: string, officerName?: string) => void;
  getComplaintsByCitizen: (citizenId: string) => Complaint[];
}

const STORAGE_KEY = 'geovision.complaints.v1';

const initialComplaints: Complaint[] = [
  {
    complaintId: 'CMP-2026-0841',
    citizenId: 'CIT-MH-98213-0302',
    citizenName: 'Aditya Vikram Singhania',
    category: 'Illegal Construction / Encroachment',
    linkedPropertyId: 'MH-MUM-98213-B04-F12-U302',
    parcelId: '98213',
    buildingId: 'B04',
    unitId: 'U302',
    subject: 'Unauthorized structural cantilever extending over Floor 12 balcony',
    description: 'Upper floor unit (Flat 1302) has constructed an unapproved 1.8m steel cantilever shade projecting into our vertical airspace volume column without municipal NOC.',
    evidenceFileName: 'site_elevation_scan.jpg',
    status: 'In Review',
    filingDate: '2026-03-12',
    assignedOfficer: 'Er. Rajesh Deshmukh (Municipal Town Planner)',
    authorityRemarks: 'LiDAR drone scan comparison completed. Cross-sectional deviation of 1.76m verified against sanctioned BMC plan. Field inspection notice served to Flat 1302 owner.',
    updatedAt: '2026-03-15',
  },
  {
    complaintId: 'CMP-2026-0792',
    citizenId: 'CIT-MH-98213-0302',
    citizenName: 'Aditya Vikram Singhania',
    category: 'Floor Plan Discrepancy',
    linkedPropertyId: 'MH-MUM-98213-B04-F03-U101',
    parcelId: '98213',
    buildingId: 'B04',
    unitId: 'U101',
    subject: 'Discrepancy in recorded RERA carpet area on 3D Property Passport',
    description: 'The digitized 3D boundary indicates 164.20 sqm carpet area whereas registered sale deed specifies 172.50 sqm inclusive of internal wall deductions.',
    evidenceFileName: 'registered_sale_deed_page4.pdf',
    status: 'Pending',
    filingDate: '2026-03-18',
    assignedOfficer: 'Smt. Anjali Patil (Cadastral Officer)',
    authorityRemarks: 'Scheduled for digital CAD re-triangulation against original building sanction drawings.',
    updatedAt: '2026-03-18',
  },
  {
    complaintId: 'CMP-2026-0610',
    citizenId: 'CIT-MH-98213-0302',
    citizenName: 'Aditya Vikram Singhania',
    category: 'Tax / Assessment Error',
    linkedPropertyId: 'MH-MUM-98213-B04-F16-U402',
    parcelId: '98213',
    buildingId: 'B04',
    unitId: 'U402',
    subject: 'Property tax assessment assessed on commercial tariff instead of residential',
    description: 'Unit U402 is classified as pure residential dwelling under Maharashtra Housing Act but assessment bill Q4 lists category as Commercial Class B.',
    status: 'Resolved',
    filingDate: '2026-02-14',
    assignedOfficer: 'Shri V. S. Kulkarni (Revenue Assessor)',
    authorityRemarks: 'Assessment record rectified to Residential Grade A. Excess surcharge of ₹14,200 adjusted against FY 2026-27 property tax dues.',
    updatedAt: '2026-02-28',
  },
  {
    complaintId: 'CMP-2026-0518',
    citizenId: 'CIT-DL-110001-0814',
    citizenName: 'Meera Nambiar',
    category: 'Utility / Easement Obstruction',
    linkedPropertyId: 'DL-DEL-110001-B03-GF-U01',
    parcelId: '110001',
    buildingId: 'B03',
    unitId: 'U-DEL-B03-GF-01',
    subject: 'Subterranean gas pipeline access chamber buried during podium repaving',
    description: 'Contractor repaved the basement entrance ramp and paved over the municipal natural gas isolation valve marker at Connaught Place Arcade.',
    status: 'Resolved',
    filingDate: '2026-01-20',
    assignedOfficer: 'Shri R. Sharma (Assistant Municipal Engineer)',
    authorityRemarks: 'Utility access cover restored with standard yellow high-visibility marker ring.',
    updatedAt: '2026-01-25',
  },
  {
    complaintId: 'CMP-2026-0922',
    citizenId: 'CIT-PUN-44102-0101',
    citizenName: 'Kunal Deshpande',
    category: 'Illegal Construction / Encroachment',
    linkedPropertyId: '27250600044102-B01-13-U01',
    parcelId: '44102',
    buildingId: 'B01',
    unitId: 'U-PUN-B01-13-01',
    subject: 'Unsanctioned 13th & 14th vertical floors constructed beyond approved height',
    description: 'Developer has erected 2 additional upper floors (Levels 13-14) exceeding the 12-floor PMRDA sanctioned commencement certificate.',
    evidenceFileName: 'pune_hinjawadi_drone_scan.jpg',
    status: 'In Review',
    filingDate: '2026-03-08',
    assignedOfficer: 'Er. Sachin More (PMRDA Town Planning Authority)',
    authorityRemarks: 'LiDAR audit confirmed 6.8m vertical height encroachment above approved sanction.',
    updatedAt: '2026-03-14',
  },
  {
    complaintId: 'CMP-2026-0430',
    citizenId: 'CIT-GJ-38235-0202',
    citizenName: 'Harsh Vardhan Trivedi',
    category: 'Utility / Easement Obstruction',
    linkedPropertyId: 'GJ-AMD-38235-B05-02-U02',
    parcelId: '382355',
    buildingId: 'B05',
    unitId: 'U-AMD-02-02',
    subject: 'Airspace easement objection for high-voltage transmission duct in GIFT City',
    description: 'Utility utility tunnel shaft conflicts with private basement loading bay clear airspace.',
    status: 'Pending',
    filingDate: '2026-03-17',
    assignedOfficer: 'Shri B. K. Patel (GIFT SEZ Planning)',
    authorityRemarks: 'BhuNaksha 3D verification in progress.',
    updatedAt: '2026-03-17',
  },
];

const loadStoredComplaints = (): Complaint[] => {
  if (typeof window === 'undefined') return initialComplaints;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load complaints from storage', e);
  }
  return initialComplaints;
};

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  complaints: loadStoredComplaints(),

  addComplaint: (data) => {
    const complaintId = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().split('T')[0];
    const newComplaint: Complaint = {
      ...data,
      complaintId,
      status: 'Pending',
      filingDate: now,
      updatedAt: now,
    };

    const updated = [newComplaint, ...get().complaints];
    set({ complaints: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return complaintId;
  },

  updateComplaintStatus: (complaintId, status, remarks, officerName) => {
    const now = new Date().toISOString().split('T')[0];
    const updated = get().complaints.map((c) => {
      if (c.complaintId === complaintId) {
        return {
          ...c,
          status,
          ...(remarks ? { authorityRemarks: remarks } : {}),
          ...(officerName ? { assignedOfficer: officerName } : {}),
          updatedAt: now,
        };
      }
      return c;
    });

    set({ complaints: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  },

  getComplaintsByCitizen: (citizenId) => {
    return get().complaints.filter((c) => c.citizenId === citizenId);
  },
}));
