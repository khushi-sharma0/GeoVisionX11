import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { useCadastreStore } from '../../stores/cadastreStore';
import { useThemeStore } from '../../stores/themeStore';
import { Chip } from '../../components/ui/Chip';
import { BarChart3, TrendingUp, PieChart as PieIcon, ShieldCheck, Layers } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];

export const AnalyticsPage: React.FC = () => {
  const { parcels, buildings, floors, units } = useCadastreStore();
  const { theme } = useThemeStore();

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';

  // 1. Data: Floor Usage Distribution
  const usageMap: Record<string, number> = {};
  floors.forEach((f) => {
    usageMap[f.usage] = (usageMap[f.usage] || 0) + f.areaSqm;
  });
  const usageData = Object.entries(usageMap).map(([usage, area]) => ({
    name: usage,
    areaSqm: area,
  }));

  // 2. Data: 3D ULPIN Verification Status
  const statusCounts = {
    Verified: units.filter((u) => u.verificationStatus === 'Verified').length,
    'Pending Approval': units.filter((u) => u.verificationStatus === 'Pending Approval').length,
    Rejected: units.filter((u) => u.verificationStatus === 'Rejected').length,
  };
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // 3. Data: City Volume Distribution
  const cityData = [
    { city: 'Mumbai (BKC)', volumeM3: 480000, buildings: 4, taxCrores: 18.4 },
    { city: 'Pune (Hinjewadi)', volumeM3: 310000, buildings: 3, taxCrores: 11.2 },
    { city: 'Delhi (CP)', volumeM3: 260000, buildings: 3, taxCrores: 8.6 },
    { city: 'Ahmedabad (GIFT)', volumeM3: 198900, buildings: 2, taxCrores: 4.6 },
  ];

  // 4. Data: Monthly 3D ULPIN Issuance Trend
  const monthlyTrend = [
    { month: 'Oct 2024', issued: 42, taxCollected: 1.2 },
    { month: 'Nov 2024', issued: 88, taxCollected: 2.8 },
    { month: 'Dec 2024', issued: 140, taxCollected: 5.1 },
    { month: 'Jan 2025', issued: 220, taxCollected: 7.9 },
    { month: 'Feb 2025', issued: 360, taxCollected: 12.4 },
    { month: 'Mar 2025', issued: 490, taxCollected: 16.8 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-main">Cadastral Spatial Analytics & Intelligence</h1>
          <p className="text-xs text-theme-muted mt-1">
            Volumetric airspace capacity, 3D ULPIN issuance velocity, and vertical property tax metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip label="Real-Time Data Engine" variant="primary" size="sm" />
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <span className="text-[10px] uppercase font-bold text-theme-muted">Total Volumetric Airspace</span>
          <div className="text-2xl font-mono font-bold text-theme-main mt-1">1,248,900 m³</div>
          <span className="text-xs text-emerald-500 font-medium">+18.4% YoY vertical growth</span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <span className="text-[10px] uppercase font-bold text-theme-muted">3D ULPINs Registered</span>
          <div className="text-2xl font-mono font-bold text-blue-500 mt-1">{units.length} Units</div>
          <span className="text-xs text-theme-muted">Across 12 multi-story towers</span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <span className="text-[10px] uppercase font-bold text-theme-muted">Vertical Tax Assessment</span>
          <div className="text-2xl font-mono font-bold text-emerald-500 mt-1">₹42.8 Cr</div>
          <span className="text-xs text-theme-muted">94.2% statutory realization rate</span>
        </div>

        <div className="p-4 rounded-xl bg-theme-surface border border-theme">
          <span className="text-[10px] uppercase font-bold text-theme-muted">Encroachments Caught</span>
          <div className="text-2xl font-mono font-bold text-rose-500 mt-1">100%</div>
          <span className="text-xs text-theme-muted">Autonomous vertical height verification</span>
        </div>
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Floor Usage Distribution */}
        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-theme-main">Volumetric Floor Area by Land Use</h3>
              <p className="text-xs text-theme-muted">Total floor space (m²) partitioned by functional zoning</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="areaSqm" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D ULPIN Title Verification Breakdown */}
        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-theme-main">3D ULPIN Title Verification Status</h3>
              <p className="text-xs text-theme-muted">Statutory certification and pending endorsement ratio</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Volume & Tax Yield */}
        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-4">
          <div>
            <h3 className="text-sm font-bold text-theme-main">Airspace Volume & Tax Potential by City</h3>
            <p className="text-xs text-theme-muted">Comparison across primary pilot municipal jurisdictions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="city" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="taxCrores" name="Tax Yield (₹ Cr)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3D ULPIN Issuance Velocity Trend */}
        <div className="p-5 rounded-xl border border-theme bg-theme-surface space-y-4">
          <div>
            <h3 className="text-sm font-bold text-theme-main">Cumulative 3D ULPIN Issuance Velocity</h3>
            <p className="text-xs text-theme-muted">Pilot trajectory over the past two fiscal quarters</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="issued"
                  name="3D ULPINs Issued"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
