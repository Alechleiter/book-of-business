'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { DashboardStats } from '@/lib/dashboard-data';
import type { Property } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { Building2, Home, DollarSign, Activity, Percent, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { Abbr, AbbrCustom } from '@/components/shared/abbr';
import { StatusBadge } from '@/components/shared/status-badge';
import { ContactQuality } from '@/components/shared/contact-quality';
import { PropertyDetailPanel } from '@/components/shared/property-detail-panel';
import { ExportButton } from '@/components/shared/export-button';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { useHousingTypeProperties } from '@/lib/hooks/use-dashboard';

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
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { favoriteIds, toggle: toggleFav } = useFavorites();
  const { addToPipeline } = usePipeline();

  return (
    <div className="flex gap-6 relative items-start">
      {/* Main dashboard content */}
      <div className={`space-y-6 min-w-0 ${selectedProperty ? 'w-1/2 hidden lg:block' : 'w-full'}`}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPI icon={Building2} label="Total Properties" tooltip="Total number of multi-family properties (5+ units) in the database" value={fmt(stats.totalProperties)} />
          <KPI icon={Home} label="Total Units" tooltip="Sum of all apartment units across all properties" value={fmt(stats.totalUnits)} />
          <KPI icon={DollarSign} label="Avg Rent" tooltip="Average monthly rent across all properties with rent data" value={fmtCurrency(stats.avgRent)} />
          <KPI icon={Activity} label="Active Properties" tooltip="Properties currently active and leasing units" value={fmt(stats.activeProperties)} />
          <KPI icon={Percent} label="Avg Occupancy" tooltip="Average occupancy rate — percentage of units currently leased" value={fmtPercent(stats.avgOccupancy)} />
        </div>

        {/* Housing Type Breakdown — now interactive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Housing Type by Total Units</CardTitle>
            <p className="text-xs text-muted-foreground">Click a housing type to view its properties</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.housingTypeUnits.map((ht) => {
                const maxUnits = stats.housingTypeUnits[0]?.units || 1;
                const pct = Math.round((ht.units / stats.totalUnits) * 100);
                const barWidth = Math.max((ht.units / maxUnits) * 100, 2);
                const isExpanded = expandedType === ht.name;
                return (
                  <div key={ht.name}>
                    <button
                      className="w-full text-left space-y-1 rounded-lg p-2 -m-2 transition-colors hover:bg-accent/50"
                      onClick={() => {
                        setExpandedType(isExpanded ? null : ht.name);
                        if (isExpanded) setSelectedProperty(null);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: HOUSING_COLORS[ht.name] || '#94a3b8' }} />
                          <Abbr text={ht.name} className="text-sm font-medium" />
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-sm font-bold tabular-nums">{fmt(ht.units)}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                          <AbbrCustom tooltip="Number of properties with this housing type" className="text-xs text-muted-foreground w-20 text-right">{fmt(ht.properties)} props</AbbrCustom>
                          {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%`, backgroundColor: HOUSING_COLORS[ht.name] || '#94a3b8' }}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <HousingTypeExpansion
                        category={ht.name}
                        onSelectProperty={setSelectedProperty}
                        selectedPropertyId={selectedProperty?.id ?? null}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <ChartsSection stats={stats} />
      </div>

      {/* Property Detail Panel — sticky */}
      {selectedProperty && (
        <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
          <PropertyDetailPanel
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onSelectProperty={setSelectedProperty}
            isFavorite={favoriteIds.has(selectedProperty.id)}
            onToggleFav={() => toggleFav(selectedProperty.id)}
            onAddToPipeline={() => addToPipeline(selectedProperty.id)}
          />
        </div>
      )}
    </div>
  );
}

/** Expansion panel showing properties for a housing type category. */
function HousingTypeExpansion({ category, onSelectProperty, selectedPropertyId }: {
  category: string;
  onSelectProperty: (p: Property) => void;
  selectedPropertyId: number | null;
}) {
  const { properties: allProperties, loading } = useHousingTypeProperties(category);
  const [mgmtFilter, setMgmtFilter] = useState<string | null>(null);

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>;

  // Build management company breakdown from fetched properties
  const mgmtMap: Record<string, { units: number; properties: number }> = {};
  for (const p of allProperties) {
    const mc = p.management_company || 'Unknown';
    if (!mgmtMap[mc]) mgmtMap[mc] = { units: 0, properties: 0 };
    mgmtMap[mc].units += p.units || 0;
    mgmtMap[mc].properties++;
  }
  const mgmtBreakdown = Object.entries(mgmtMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units);

  const properties = mgmtFilter
    ? allProperties.filter((p) => (p.management_company || 'Unknown') === mgmtFilter)
    : allProperties;

  return (
    <div className="border-t mt-3 pt-4 space-y-4">
      {/* Management Company Breakdown */}
      {mgmtBreakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Management Companies</h4>
          <div className="space-y-1">
            {mgmtBreakdown.slice(0, 10).map((b) => (
              <button
                key={b.name}
                className={`w-full flex items-center justify-between text-sm rounded-md px-2 py-1 text-left transition-colors hover:bg-accent/50 ${
                  mgmtFilter === b.name ? 'bg-accent ring-1 ring-primary' : ''
                }`}
                onClick={() => setMgmtFilter(mgmtFilter === b.name ? null : b.name)}
              >
                <span className="truncate text-primary hover:underline">{b.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{fmt(b.units)} units / {fmt(b.properties)} props</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Properties ({properties.length})</h4>
          {mgmtFilter && (
            <button className="text-[10px] text-primary hover:underline" onClick={() => setMgmtFilter(null)}>
              Clear filter
            </button>
          )}
        </div>
        <ExportButton properties={properties} label="Export" />
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {properties.map((p) => (
          <button
            key={p.id}
            className={`w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg text-left transition-colors hover:bg-accent/50 ${
              selectedPropertyId === p.id ? 'bg-accent ring-1 ring-primary' : ''
            }`}
            onClick={() => onSelectProperty(p)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{p.name}</span>
                <ContactQuality property={p} />
                {p.phone && <Phone className="h-3 w-3 text-green-500 flex-shrink-0" />}
                {p.email && <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />}
              </div>
              <span className="text-xs text-muted-foreground block truncate">{p.address}, {p.city}</span>
              <div className="flex gap-x-3 text-xs text-muted-foreground mt-0.5">
                <span>{p.units} units</span>
                {p.avg_rent > 0 && <span>{fmtCurrency(p.avg_rent)}</span>}
                {p.management_company && <span className="truncate max-w-[150px]">{p.management_company}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <StatusBadge status={p.status} />
            </div>
          </button>
        ))}
      </div>
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
