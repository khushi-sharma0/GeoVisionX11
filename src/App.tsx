import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';
import { CitizenLayout } from './layouts/CitizenLayout';

// Authority Pages
import { AuthorityDashboardPage } from './features/dashboard/AuthorityDashboardPage';
import { GlobeExplorerPage } from './features/globe/GlobeExplorerPage';
import { PropertyExplorerPage } from './features/parcels/PropertyExplorerPage';
import { UlpinRegistryPage } from './features/ulpin/UlpinRegistryPage';
import { GisManagementPage } from './features/gis/GisManagementPage';
import { AiPipelinePage } from './features/ai/AiPipelinePage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { DisasterManagementPage } from './features/disaster/DisasterManagementPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AuthorityComplaintsPage } from './features/complaints/AuthorityComplaintsPage';
import { AuthorityDisputesPage } from './features/disputes/AuthorityDisputesPage';
import { AuditVerificationPage } from './features/audit/AuditVerificationPage';
import { UserManagementPage } from './features/admin/UserManagementPage';

// Citizen Pages
import { CitizenMyPropertiesPage } from './features/citizen/CitizenMyPropertiesPage';
import { CitizenSearchPage } from './features/citizen/CitizenSearchPage';
import { CitizenPassportPage } from './features/citizen/CitizenPassportPage';
import { Citizen3dViewPage } from './features/citizen/Citizen3dViewPage';
import { CitizenOwnershipPage } from './features/citizen/CitizenOwnershipPage';
import { CitizenTaxPage } from './features/citizen/CitizenTaxPage';
import { CitizenDisputesPage } from './features/citizen/CitizenDisputesPage';
import { CitizenComplaintsPage } from './features/citizen/CitizenComplaintsPage';

import { useThemeStore } from './stores/themeStore';
import { useCadastreStore } from './stores/cadastreStore';

export default function App() {
  const { theme } = useThemeStore();
  const { loadInitialData } = useCadastreStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Gateway / Login / Role Switcher */}
        <Route path="/" element={<AuthLayout />} />
        <Route path="/login" element={<AuthLayout />} />

        {/* Authority Routes (§10) */}
        <Route path="/authority" element={<AuthorityLayout />}>
          <Route index element={<Navigate to="/authority/dashboard" replace />} />
          <Route path="dashboard" element={<AuthorityDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="globe" element={<GlobeExplorerPage />} />
          <Route path="properties" element={<PropertyExplorerPage />} />
          <Route path="ulpin-registry" element={<UlpinRegistryPage />} />
          <Route path="gis" element={<GisManagementPage />} />
          <Route path="ai-pipeline" element={<AiPipelinePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="disaster" element={<DisasterManagementPage />} />
          <Route path="complaints" element={<AuthorityComplaintsPage />} />
          <Route path="disputes" element={<AuthorityDisputesPage />} />
          <Route path="audit" element={<AuditVerificationPage />} />
          <Route path="audit-verification" element={<Navigate to="/authority/audit" replace />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Citizen Routes (§10) */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<Navigate to="/citizen/my-properties" replace />} />
          <Route path="my-properties" element={<CitizenMyPropertiesPage />} />
          <Route path="search" element={<CitizenSearchPage />} />
          <Route path="passport" element={<CitizenPassportPage />} />
          <Route path="3d-view" element={<Citizen3dViewPage />} />
          <Route path="ownership" element={<CitizenOwnershipPage />} />
          <Route path="tax" element={<CitizenTaxPage />} />
          <Route path="disputes" element={<CitizenDisputesPage />} />
          <Route path="complaints" element={<CitizenComplaintsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
