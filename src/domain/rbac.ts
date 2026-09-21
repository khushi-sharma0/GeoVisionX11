import { UserRole } from './types';

export interface RoleCapability {
  viewer3D: 'Full access';
  passportDownload: boolean;
  lidarGisData: 'Full edit access' | 'View only' | 'Full access (admin override)';
  editFootprint: boolean;
  complaintsDashboard: 'View + escalate' | 'Full access, resolve/respond' | 'Full access' | 'No access';
  disputesPage: 'Full access, final authority' | 'Can raise/manage' | 'Full access' | 'No access';
  auditVerificationDashboard: 'View verdicts only' | 'Feeds data in' | 'Full access, acts on flags' | 'Full access';
  perFloorDiscrepancyAudit: 'View only' | 'Can flag/report' | 'Can act (sanction/penalize)' | 'Full access';
  userManagement: boolean;
  systemAuditLogs: boolean;
  sanctionApprovalsBmc: boolean;
}

export interface RoleDefinition {
  role: UserRole;
  displayName: string;
  badge: string;
  department: string;
  capabilities: RoleCapability;
  allowedRoutes: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  Authority: {
    role: 'Authority',
    displayName: 'Director General (DoLR)',
    badge: 'Statutory Apex Authority',
    department: 'Department of Land Resources, Ministry of Rural Development',
    capabilities: {
      viewer3D: 'Full access',
      passportDownload: true,
      lidarGisData: 'View only',
      editFootprint: false,
      complaintsDashboard: 'View + escalate',
      disputesPage: 'Full access, final authority',
      auditVerificationDashboard: 'View verdicts only',
      perFloorDiscrepancyAudit: 'View only',
      userManagement: false,
      systemAuditLogs: false,
      sanctionApprovalsBmc: false,
    },
    allowedRoutes: [
      '/authority/dashboard',
      '/authority/globe',
      '/authority/properties',
      '/authority/ulpin-registry',
      '/authority/audit',
      '/authority/complaints',
      '/authority/disputes',
      '/authority/gis',
      '/authority/analytics',
      '/authority/disaster',
      '/authority/reports',
    ],
  },
  SurveyOfficer: {
    role: 'SurveyOfficer',
    displayName: 'Survey Officer (DILRMP)',
    badge: 'Cadastral Geodesist & Drone Pilot',
    department: 'Survey of India / DILRMP Spatial Data Division',
    capabilities: {
      viewer3D: 'Full access',
      passportDownload: true,
      lidarGisData: 'Full edit access',
      editFootprint: true,
      complaintsDashboard: 'No access',
      disputesPage: 'No access',
      auditVerificationDashboard: 'Feeds data in',
      perFloorDiscrepancyAudit: 'Can flag/report',
      userManagement: false,
      systemAuditLogs: false,
      sanctionApprovalsBmc: false,
    },
    allowedRoutes: [
      '/authority/globe',
      '/authority/gis',
      '/authority/ai-pipeline',
      '/authority/audit',
      '/authority/properties',
      '/authority/ulpin-registry',
      '/authority/analytics',
      '/authority/disaster',
    ],
  },
  MunicipalOfficer: {
    role: 'MunicipalOfficer',
    displayName: 'Municipal Officer (BMC)',
    badge: 'Town Planning & Building Sanction Enforcement',
    department: 'Brihanmumbai Municipal Corporation (BMC) / Town Planning Dept.',
    capabilities: {
      viewer3D: 'Full access',
      passportDownload: true,
      lidarGisData: 'View only',
      editFootprint: false,
      complaintsDashboard: 'Full access, resolve/respond',
      disputesPage: 'Can raise/manage',
      auditVerificationDashboard: 'Full access, acts on flags',
      perFloorDiscrepancyAudit: 'Can act (sanction/penalize)',
      userManagement: false,
      systemAuditLogs: false,
      sanctionApprovalsBmc: true,
    },
    allowedRoutes: [
      '/authority/dashboard',
      '/authority/globe',
      '/authority/audit',
      '/authority/complaints',
      '/authority/disputes',
      '/authority/properties',
      '/authority/ulpin-registry',
      '/authority/gis',
      '/authority/analytics',
      '/authority/disaster',
      '/authority/reports',
    ],
  },
  SystemAdministrator: {
    role: 'SystemAdministrator',
    displayName: 'System Admin (NIC)',
    badge: 'Pan-India Platform Administrator',
    department: 'National Informatics Centre / 3D ULPIN Systems Directorate',
    capabilities: {
      viewer3D: 'Full access',
      passportDownload: true,
      lidarGisData: 'Full access (admin override)',
      editFootprint: true,
      complaintsDashboard: 'Full access',
      disputesPage: 'Full access',
      auditVerificationDashboard: 'Full access',
      perFloorDiscrepancyAudit: 'Full access',
      userManagement: true,
      systemAuditLogs: true,
      sanctionApprovalsBmc: true,
    },
    allowedRoutes: [
      '/authority/dashboard',
      '/authority/users',
      '/authority/globe',
      '/authority/properties',
      '/authority/ulpin-registry',
      '/authority/gis',
      '/authority/ai-pipeline',
      '/authority/analytics',
      '/authority/disaster',
      '/authority/complaints',
      '/authority/disputes',
      '/authority/audit',
      '/authority/reports',
      '/authority/settings',
    ],
  },
  Citizen: {
    role: 'Citizen',
    displayName: 'Property Owner / Citizen',
    badge: 'Registered 3D Property Holder',
    department: 'Maharashtra Land Administration Portal',
    capabilities: {
      viewer3D: 'Full access',
      passportDownload: true,
      lidarGisData: 'View only',
      editFootprint: false,
      complaintsDashboard: 'Full access, resolve/respond',
      disputesPage: 'Can raise/manage',
      auditVerificationDashboard: 'View verdicts only',
      perFloorDiscrepancyAudit: 'View only',
      userManagement: false,
      systemAuditLogs: false,
      sanctionApprovalsBmc: false,
    },
    allowedRoutes: [
      '/citizen/my-properties',
      '/citizen/search',
      '/citizen/passport',
      '/citizen/3d-view',
      '/citizen/ownership',
      '/citizen/tax',
      '/citizen/disputes',
      '/citizen/complaints',
    ],
  },
};

export const canAccessRoute = (role: UserRole, path: string): boolean => {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  // Exact or prefix match
  return def.allowedRoutes.some((r) => path === r || path.startsWith(r + '/'));
};

export const getRoleDefinition = (role: UserRole): RoleDefinition => {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.Authority;
};
