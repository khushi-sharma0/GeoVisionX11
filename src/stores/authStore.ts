import { create } from 'zustand';
import { UserRole } from '../domain/types';
import { getRoleDefinition } from '../domain/rbac';

export interface UserProfile {
  id: string;
  name: string;
  designation: string;
  department: string;
  role: UserRole;
  jurisdiction: string;
  avatarInitials: string;
  citizenUnitIds?: string[];
}

export interface AccountRecord {
  id: string; // Login ID (e.g. ADMIN-NIC-001, SURV-SOI-4402)
  name: string;
  email: string;
  role: UserRole;
  jurisdiction: string;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  lastLogin: string;
  department: string;
  designation: string;
  temporaryPassword?: string;
  permissionsCount?: number;
}

interface AuthState {
  role: UserRole;
  user: UserProfile;
  isAuthenticated: boolean;
  accounts: AccountRecord[];
  setRole: (role: UserRole) => void;
  switchUser: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  createAccount: (data: {
    name: string;
    email: string;
    role: UserRole;
    jurisdiction?: string;
    temporaryPassword?: string;
    status: 'Active' | 'Inactive';
  }) => AccountRecord;
  updateAccount: (id: string, updates: Partial<AccountRecord>) => void;
  toggleAccountStatus: (id: string) => void;
  resetAccountPassword: (id: string) => string;
}

const authorityUser: UserProfile = {
  id: 'AUTH-GOI-8419',
  name: 'Shri R. K. Shrivastava, IAS',
  designation: 'Joint Secretary & Director General of Land Records',
  department: 'Department of Land Resources, Ministry of Rural Development',
  role: 'Authority',
  jurisdiction: 'National Cadastre (DL/MH/GJ)',
  avatarInitials: 'RS',
};

const surveyOfficerUser: UserProfile = {
  id: 'SURV-DILRMP-4402',
  name: 'Er. K. V. Ramanathan',
  designation: 'Senior Cadastral Geodesist & Drone LiDAR Pilot',
  department: 'Survey of India / DILRMP Spatial Data Division',
  role: 'SurveyOfficer',
  jurisdiction: 'Western Cadastral Zone (MH / GJ)',
  avatarInitials: 'KR',
};

const municipalOfficerUser: UserProfile = {
  id: 'MUNI-BMC-1904',
  name: 'Smt. Neha K. Deshmukh',
  designation: 'Chief Town Planning & Building Sanction Enforcement Officer',
  department: 'Brihanmumbai Municipal Corporation (BMC) / Town Planning Dept.',
  role: 'MunicipalOfficer',
  jurisdiction: 'Mumbai Metropolitan Region (Ward H-East & K-West)',
  avatarInitials: 'ND',
};

const systemAdminUser: UserProfile = {
  id: 'ADMIN-NIC-001',
  name: 'Dr. Arvind Mehra',
  designation: 'Chief Geomatic Systems Architect & Cadastre Administrator',
  department: 'National Informatics Centre / 3D ULPIN Systems Directorate',
  role: 'SystemAdministrator',
  jurisdiction: 'Pan-India 3D Cadastral Cloud Infrastructure',
  avatarInitials: 'AM',
};

const citizenUser: UserProfile = {
  id: 'CIT-MH-98213-0302',
  name: 'Aditya Vikram Singhania',
  designation: 'Registered 3D Property Holder & Taxpayer',
  department: 'Maharashtra Land Administration Portal',
  role: 'Citizen',
  jurisdiction: 'Mumbai Suburban (BKC)',
  avatarInitials: 'AS',
  citizenUnitIds: ['U302', 'U101', 'U402'],
};

const initialAccounts: AccountRecord[] = [
  {
    id: 'ADMIN-NIC-001',
    name: 'Dr. Arvind Mehra',
    email: 'arvind.mehra@nic.in',
    role: 'SystemAdministrator',
    jurisdiction: 'Pan-India 3D Cadastral Cloud Infrastructure',
    status: 'Active',
    dateCreated: '2023-01-15T09:00:00.000Z',
    lastLogin: '2026-03-24T08:15:00.000Z',
    department: 'National Informatics Centre',
    designation: 'Chief Geomatic Systems Architect',
  },
  {
    id: 'AUTH-GOI-8419',
    name: 'Shri R. K. Shrivastava, IAS',
    email: 'rk.shrivastava@dolr.gov.in',
    role: 'Authority',
    jurisdiction: 'National Cadastre (DL/MH/GJ)',
    status: 'Active',
    dateCreated: '2023-02-01T10:30:00.000Z',
    lastLogin: '2026-03-23T14:40:00.000Z',
    department: 'Department of Land Resources (DoLR)',
    designation: 'Director General of Land Records',
  },
  {
    id: 'SURV-DILRMP-4402',
    name: 'Er. K. V. Ramanathan',
    email: 'kv.ramanathan@soi.gov.in',
    role: 'SurveyOfficer',
    jurisdiction: 'Western Cadastral Zone (MH / GJ)',
    status: 'Active',
    dateCreated: '2023-03-10T11:15:00.000Z',
    lastLogin: '2026-03-24T07:50:00.000Z',
    department: 'Survey of India / DILRMP',
    designation: 'Senior Cadastral Geodesist',
  },
  {
    id: 'MUNI-BMC-1904',
    name: 'Smt. Neha K. Deshmukh',
    email: 'neha.deshmukh@mcgm.gov.in',
    role: 'MunicipalOfficer',
    jurisdiction: 'Mumbai Metropolitan Region (Ward H-East & K-West)',
    status: 'Active',
    dateCreated: '2023-04-05T12:00:00.000Z',
    lastLogin: '2026-03-24T09:20:00.000Z',
    department: 'Brihanmumbai Municipal Corporation (BMC)',
    designation: 'Chief Town Planning Enforcement Officer',
  },
  {
    id: 'CIT-MH-98213-0302',
    name: 'Aditya Vikram Singhania',
    email: 'aditya.singhania@bkc-holdings.com',
    role: 'Citizen',
    jurisdiction: 'Mumbai Suburban (BKC)',
    status: 'Active',
    dateCreated: '2023-08-20T16:45:00.000Z',
    lastLogin: '2026-03-22T19:10:00.000Z',
    department: 'Maharashtra Citizen Land Portal',
    designation: 'Registered 3D Property Holder',
  },
];

const getUserProfileForRole = (role: UserRole): UserProfile => {
  switch (role) {
    case 'Citizen':
      return citizenUser;
    case 'SurveyOfficer':
      return surveyOfficerUser;
    case 'MunicipalOfficer':
      return municipalOfficerUser;
    case 'SystemAdministrator':
      return systemAdminUser;
    case 'Authority':
    default:
      return authorityUser;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  role: 'Authority',
  user: authorityUser,
  isAuthenticated: true,
  accounts: initialAccounts,
  setRole: (role: UserRole) => {
    set({
      role,
      user: getUserProfileForRole(role),
    });
  },
  switchUser: (role: UserRole) => {
    set({
      role,
      user: getUserProfileForRole(role),
    });
  },
  login: (role: UserRole) => {
    set({
      role,
      user: getUserProfileForRole(role),
      isAuthenticated: true,
    });
  },
  logout: () => {
    set({
      isAuthenticated: false,
    });
  },
  createAccount: (data) => {
    const roleDef = getRoleDefinition(data.role);
    const prefixMap: Record<UserRole, string> = {
      SystemAdministrator: 'ADMIN-NIC',
      Authority: 'AUTH-DOLR',
      SurveyOfficer: 'SURV-SOI',
      MunicipalOfficer: 'MUNI-BMC',
      Citizen: 'CIT-MH',
    };
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedLoginId = `${prefixMap[data.role] || 'USR'}-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const newAccount: AccountRecord = {
      id: generatedLoginId,
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      jurisdiction: data.jurisdiction?.trim() || roleDef.department,
      status: data.status,
      dateCreated: nowIso,
      lastLogin: 'Never',
      department: roleDef.department,
      designation: roleDef.displayName,
      temporaryPassword: data.temporaryPassword || `Gov#Pass${Math.floor(1000 + Math.random() * 9000)}`,
    };

    set((state) => ({
      accounts: [newAccount, ...state.accounts],
    }));

    return newAccount;
  },
  updateAccount: (id, updates) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...updates } : acc
      ),
    }));
  },
  toggleAccountStatus: (id) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id
          ? { ...acc, status: acc.status === 'Active' ? 'Inactive' : 'Active' }
          : acc
      ),
    }));
  },
  resetAccountPassword: (id) => {
    const newTemp = `Nic@${Math.floor(100000 + Math.random() * 900000)}#`;
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, temporaryPassword: newTemp } : acc
      ),
    }));
    return newTemp;
  },
}));
