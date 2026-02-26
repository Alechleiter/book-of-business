'use client';

import { useState } from 'react';
import { useZipCodes, useZipProperties, useZipMgmtBreakdown } from '@/lib/hooks/use-zip-codes';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { PropertyDetailPanel } from '@/components/shared/property-detail-panel';
import { ExportButton } from '@/components/shared/export-button';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { MARKETS, HOUSING_TYPES } from '@/lib/constants';
import { Search, ChevronDown, ChevronUp, MapPin, Phone, Mail } from 'lucide-react';
import { AbbrCustom } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';
import type { ZipAggregate, Property } from '@/types/database';

const SORT_OPTIONS = [
  { value: 'total_units', label: 'Units' },
  { value: 'total_properties', label: 'Properties' },
  { value: 'avg_rent', label: 'Rent' },
  { value: 'avg_occupancy', label: 'Occupancy' },
  { value: 'zip', label: 'ZIP' },
];

export default function ZipCodesPage() {
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('');
  const [sort, setSort] = useState('total_units');
  const [housingType, setHousingType] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { zips, loading } = useZipCodes(search, market, sort);
  const { favoriteIds, toggle: toggleFav } = useFavorites();
  const { addToPipeline } = usePipeline();

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by ZIP or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={market} onChange={(e) => setMarket(e.target.value)}>
          <option value="">All Markets</option>
          {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={housingType} onChange={(e) => setHousingType(e.target.value)}>
          <option value="">All Housing Types</option>
          {HOUSING_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SORT_OPTIONS.map((s) => (
          <Button key={s.value} variant={sort === s.value ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSort(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{fmt(zips.length)} zip codes</p>

      <div className="flex gap-6 relative items-start">
        {/* Zip List */}
        <div className={`space-y-2 ${selectedProperty ? 'w-1/2 hidden lg:block' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            zips.map((z) => (
              <ZipRow
                key={z.zip}
                zip={z}
                isExpanded={expanded === z.zip}
                onToggle={() => setExpanded(expanded === z.zip ? null : z.zip)}
                onSelectProperty={handleSelectProperty}
                selectedPropertyId={selectedProperty?.id ?? null}
                housingTypeFilter={housingType}
              />
            ))
          )}
        </div>

        {/* Property Detail Panel — sticky */}
        {selectedProperty && (
          <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
            <PropertyDetailPanel
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
              onSelectProperty={handleSelectProperty}
              isFavorite={favoriteIds.has(selectedProperty.id)}
              onToggleFav={() => toggleFav(selectedProperty.id)}
              onAddToPipeline={() => addToPipeline(selectedProperty.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ZipRow({ zip, isExpanded, onToggle, onSelectProperty, selectedPropertyId, housingTypeFilter }: {
  zip: ZipAggregate;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectProperty: (p: Property) => void;
  selectedPropertyId: number | null;
  housingTypeFilter: string;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <button className="w-full flex items-center justify-between p-4 text-left" onClick={onToggle}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{zip.zip}</span>
                <span className="text-xs text-muted-foreground truncate">{zip.city}</span>
                {zip.market && <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{zip.market}</Badge>}
              </div>
              <div className="flex gap-x-4 text-xs text-muted-foreground mt-0.5">
                <span>{fmt(zip.total_units)} units</span>
                <AbbrCustom tooltip="Total properties in this ZIP code" className="text-xs text-muted-foreground">{fmt(zip.total_properties)} props</AbbrCustom>
                {zip.avg_rent > 0 && <AbbrCustom tooltip="Average monthly rent across properties in this ZIP" className="text-xs text-muted-foreground">{fmtCurrency(zip.avg_rent)} avg rent</AbbrCustom>}
                {zip.avg_occupancy > 0 && <AbbrCustom tooltip="Average occupancy rate — percentage of units currently leased" className="text-xs text-muted-foreground">{fmtPercent(zip.avg_occupancy)} occ</AbbrCustom>}
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
        </button>
        {isExpanded && (
          <ZipExpansion
            zip={zip.zip}
            onSelectProperty={onSelectProperty}
            selectedPropertyId={selectedPropertyId}
            housingTypeFilter={housingTypeFilter}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ZipExpansion({ zip, onSelectProperty, selectedPropertyId, housingTypeFilter }: {
  zip: string;
  onSelectProperty: (p: Property) => void;
  selectedPropertyId: number | null;
  housingTypeFilter: string;
}) {
  const { properties: allProperties, loading } = useZipProperties(zip);
  const breakdown = useZipMgmtBreakdown(zip);

  const properties = housingTypeFilter
    ? allProperties.filter((p) => p.housing_type === housingTypeFilter)
    : allProperties;

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="border-t p-4 space-y-4">
      {breakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Management Companies</h4>
          <div className="space-y-1">
            {breakdown.slice(0, 10).map((b) => (
              <div key={b.management_company} className="flex items-center justify-between text-sm">
                <span className="truncate">{b.management_company}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{fmt(b.unit_count)} units / {fmt(b.property_count)} props</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground">Properties ({properties.length})</h4>
        <ExportButton properties={properties} label="Export ZIP" />
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
