'use client';

import dynamic from 'next/dynamic';
import type { DashboardStats } from '@/lib/dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { Building2, Home, DollarSign, Activity, Percent } from 'lucide-react';
import { Abbr, AbbrCustom } from '@/components/shared/abbr';

const ChartsSection = dynamic(() => import('@/components/dashboard/charts-section'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
  ssr: false,
});

const HOUSING_COLORS: Record<string, string> = {
  'Conventional': '#3b82f6',
  'Section 8 / Affordable': '#10b981',
  'Tax Credit': '#f59e0b',
  'Senior Housing': '#8b5cf6',
  'Student Housing': '#ef4444',
  'BTR/SFR': '#06b6d4',
  'Mixed Use': '#f97316',
  'Income Restricted': '#6366f1',
  'Corporate Housing': '#ec4899',
  'Unknown': '#94a3b8',
  'Other': '#64748b',
};

export default function DashboardContent({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI icon={Building2} label="Total Properties" tooltip="Total number of multi-family properties (5+ units) in the database" value={fmt(stats.totalProperties)} />
        <KPI icon={Home} label="Total Units" tooltip="Sum of all apartment units across all properties" value={fmt(stats.totalUnits)} />
        <KPI icon={DollarSign} label="Avg Rent" tooltip="Average monthly rent across all properties with rent data" value={fmtCurrency(stats.avgRent)} />
        <KPI icon={Activity} label="Active Properties" tooltip="Properties currently active and leasing units" value={fmt(stats.activeProperties)} />
        <KPI icon={Percent} label="Avg Occupancy" tooltip="Average occupancy rate — percentage of units currently leased" value={fmtPercent(stats.avgOccupancy)} />
      </div>

      {/* Housing Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Housing Type by Total Units</CardTitle>
          <p className="text-xs text-muted-foreground">Conventional vs Student vs Affordable vs Senior etc.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.housingTypeUnits.map((ht) => {
              const maxUnits = stats.housingTypeUnits[0]?.units || 1;
              const pct = Math.round((ht.units / stats.totalUnits) * 100);
              const barWidth = Math.max((ht.units / maxUnits) * 100, 2);
              return (
                <div key={ht.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: HOUSING_COLORS[ht.name] || '#94a3b8' }} />
                      <Abbr text={ht.name} className="text-sm font-medium" />
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-sm font-bold tabular-nums">{fmt(ht.units)}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      <AbbrCustom tooltip="Number of properties with this housing type" className="text-xs text-muted-foreground w-20 text-right">{fmt(ht.properties)} props</AbbrCustom>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: HOUSING_COLORS[ht.name] || '#94a3b8' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <ChartsSection stats={stats} />
    </div>
  );
}

function KPI({ icon: Icon, label, value, tooltip }: { icon: React.ElementType; label: string; value: string; tooltip?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {tooltip ? (
            <AbbrCustom tooltip={tooltip} className="text-xs text-muted-foreground no-underline decoration-transparent">
              <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">{label}</span>
            </AbbrCustom>
          ) : (
            <p className="text-xs text-muted-foreground">{label}</p>
          )}
          <p className="text-xl font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
