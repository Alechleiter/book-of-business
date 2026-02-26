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
import { NotesSection } from '@/components/shared/notes-section';
import { ExportButton } from '@/components/shared/export-button';
import { fmt, fmtCurrency, fmtPercent, fmtPhone } from '@/lib/format';
import { MARKETS, HOUSING_TYPES } from '@/lib/constants';
import { Search, ChevronDown, ChevronUp, MapPin, X, Star, TrendingUp, Phone, Mail, ExternalLink, Building2, MapPinned, Users } from 'lucide-react';
import { Abbr, AbbrCustom, ACRONYM_MAP } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';
import { CompanyPropertiesPanel, RegionalPropertiesPanel } from '@/components/shared/related-properties';
import type { ZipAggregate, Property } from '@/types/database';

type RelatedView = { type: 'company'; value: string } | { type: 'regional'; value: string } | null;

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
  const [relatedView, setRelatedView] = useState<RelatedView>(null);
  const { zips, loading } = useZipCodes(search, market, sort);
  const { favoriteIds, toggle: toggleFav } = useFavorites();
  const { addToPipeline } = usePipeline();

  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p);
    setRelatedView(null);
  };

  const handleRelatedSelect = (p: Property) => {
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
            <PropertyDetail
              property={selectedProperty}
              onClose={() => { setSelectedProperty(null); setRelatedView(null); }}
              isFavorite={favoriteIds.has(selectedProperty.id)}
              onToggleFav={() => toggleFav(selectedProperty.id)}
              onAddToPipeline={() => addToPipeline(selectedProperty.id)}
              relatedView={relatedView}
              onSetRelatedView={setRelatedView}
              onRelatedSelect={handleRelatedSelect}
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

function PropertyDetail({ property: p, onClose, isFavorite, onToggleFav, onAddToPipeline, relatedView, onSetRelatedView, onRelatedSelect }: {
  property: Property;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFav: () => void;
  onAddToPipeline: () => void;
  relatedView: RelatedView;
  onSetRelatedView: (v: RelatedView) => void;
  onRelatedSelect: (p: Property) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-5 max-h-[85vh] overflow-y-auto">
        {/* Related Properties Panel */}
        {relatedView ? (
          relatedView.type === 'company' ? (
            <CompanyPropertiesPanel
              company={relatedView.value}
              currentPropertyId={p.id}
              onSelectProperty={onRelatedSelect}
              onClose={() => onSetRelatedView(null)}
            />
          ) : (
            <RegionalPropertiesPanel
              supervisor={relatedView.value}
              currentPropertyId={p.id}
              onSelectProperty={onRelatedSelect}
              onClose={() => onSetRelatedView(null)}
            />
          )
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                {p.former_name && <p className="text-xs text-muted-foreground">Formerly: {p.former_name}</p>}
                <p className="text-sm text-muted-foreground mt-1">{p.address}, {p.city}, {p.state} {p.zip}</p>
                {(p.county || p.market) && <p className="text-xs text-muted-foreground">{p.county && `${p.county} County`}{p.county && p.market && ' · '}{p.market}</p>}
                {(p.submarket || p.neighborhood) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPinned className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {p.submarket && <span>Submarket: <span className="font-medium text-foreground">{p.submarket}</span></span>}
                      {p.submarket && p.neighborhood && ' · '}
                      {p.neighborhood && <span>Neighborhood: <span className="font-medium text-foreground">{p.neighborhood}</span></span>}
                    </p>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={p.status} />
              {p.classification && (
                <AbbrCustom tooltip={ACRONYM_MAP[p.classification] || `Property quality classification: ${p.classification}`}>
                  <Badge variant="outline" className="text-[10px]">{p.classification}</Badge>
                </AbbrCustom>
              )}
              {p.housing_type && (
                <AbbrCustom tooltip={ACRONYM_MAP[p.housing_type] || `Housing type: ${p.housing_type}`}>
                  <Badge variant="outline" className="text-[10px]">{p.housing_type}</Badge>
                </AbbrCustom>
              )}
              {p.built_type && (
                <AbbrCustom tooltip={ACRONYM_MAP[p.built_type] || `Building height classification: ${p.built_type}`}>
                  <Badge variant="outline" className="text-[10px]">{p.built_type}</Badge>
                </AbbrCustom>
              )}
              {p.has_concessions && (
                <AbbrCustom tooltip="Property is offering move-in specials, free rent periods, or other incentives to attract tenants">
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600">Concessions</Badge>
                </AbbrCustom>
              )}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Units" tooltip="Total apartment units at this property" value={fmt(p.units)} />
              <Stat label="Stories" tooltip="Number of floors in the building" value={fmt(p.stories)} />
              <Stat label="Year Built" tooltip="Year the property was originally constructed" value={p.year_built ? String(p.year_built) : '—'} />
              <Stat label="Avg Rent" tooltip="Average monthly rent across all unit types" value={fmtCurrency(p.avg_rent)} />
              <Stat label="Occupancy" tooltip="Percentage of units currently leased to tenants" value={fmtPercent(p.occupancy)} />
              <Stat label="Avg Sqft" tooltip="Average square footage per unit" value={fmt(p.avg_sqft)} />
              <Stat label="$/Sqft" tooltip="Average rent price per square foot — rent divided by unit size" value={p.avg_price_per_sqft ? `$${p.avg_price_per_sqft.toFixed(2)}` : '—'} />
              <Stat label="Total Sqft" tooltip="Total rentable square footage across all units" value={fmt(p.total_rentable_sqft)} />
              <Stat label="Min Lease" tooltip="Minimum lease term — shortest lease option offered (in months)" value={p.min_lease_term ? `${p.min_lease_term} mo` : '—'} />
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" /> Contact Info
              </h4>
              <div className="flex flex-wrap gap-2">
                {p.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${p.phone}`}><Phone className="h-3 w-3 mr-1.5" /> {fmtPhone(p.phone)}</a>
                  </Button>
                )}
                {p.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${p.email}`}><Mail className="h-3 w-3 mr-1.5" /> {p.email}</a>
                  </Button>
                )}
                {p.onsite_manager_email && p.onsite_manager_email !== p.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${p.onsite_manager_email}`}><Mail className="h-3 w-3 mr-1.5" /> Onsite Mgr</a>
                  </Button>
                )}
                {p.regional_supervisor_email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${p.regional_supervisor_email}`}><Mail className="h-3 w-3 mr-1.5" /> Regional</a>
                  </Button>
                )}
                {p.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" /> Website</a>
                  </Button>
                )}
              </div>
              {!p.phone && !p.email && (
                <p className="text-xs text-muted-foreground italic">No contact info available</p>
              )}
            </div>

            {/* Management Details — clickable company & regional */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Management
              </h4>
              <div className="grid grid-cols-1 gap-1.5 text-sm">
                {p.management_company && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    <button
                      className="font-medium text-right text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => onSetRelatedView({ type: 'company', value: p.management_company! })}
                    >
                      {p.management_company}
                      <Building2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {p.onsite_manager && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="The on-site property manager responsible for day-to-day operations" className="text-muted-foreground">Onsite Manager</AbbrCustom>
                    <span className="font-medium text-right">{p.onsite_manager}</span>
                  </div>
                )}
                {p.regional_supervisor && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="Regional supervisor overseeing multiple properties in the area" className="text-muted-foreground">Regional Supervisor</AbbrCustom>
                    <button
                      className="font-medium text-right text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => onSetRelatedView({ type: 'regional', value: p.regional_supervisor! })}
                    >
                      {p.regional_supervisor}
                      <Users className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {p.ownership && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="The entity or group that owns the property" className="text-muted-foreground">Ownership</AbbrCustom>
                    <span className="font-medium text-right">{p.ownership}</span>
                  </div>
                )}
                {p.software_system && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="Property management software used for leasing, accounting, and operations" className="text-muted-foreground">Software</AbbrCustom>
                    <span className="font-medium text-right">{p.software_system}</span>
                  </div>
                )}
                {p.flat_fee && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="Fixed monthly management fee (not percentage-based) charged by the management company" className="text-muted-foreground">Flat Fee</AbbrCustom>
                    <span className="font-medium text-right">{p.flat_fee}</span>
                  </div>
                )}
                {p.former_management_company && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="The previous management company before the current one took over" className="text-muted-foreground">Former Company</AbbrCustom>
                    <span className="font-medium text-right text-muted-foreground">{p.former_management_company}</span>
                  </div>
                )}
                {p.former_onsite_manager && (
                  <div className="flex justify-between">
                    <AbbrCustom tooltip="The previous on-site property manager" className="text-muted-foreground">Former Onsite</AbbrCustom>
                    <span className="font-medium text-right text-muted-foreground">{p.former_onsite_manager}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Concessions */}
            {p.concessions_text && (
              <div className="rounded-lg bg-amber-500/10 p-3 text-sm">
                <p className="font-semibold text-amber-600 dark:text-amber-400 text-xs mb-1">Concessions</p>
                <p>{p.concessions_text}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant={isFavorite ? 'default' : 'outline'} onClick={onToggleFav}>
                <Star className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={onAddToPipeline}>
                <TrendingUp className="h-4 w-4 mr-1" /> Add to Pipeline
              </Button>
            </div>

            {/* Notes */}
            <NotesSection propertyId={p.id} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5 text-center">
      {tooltip ? (
        <AbbrCustom tooltip={tooltip} className="text-[10px] text-muted-foreground">{label}</AbbrCustom>
      ) : (
        <p className="text-[10px] text-muted-foreground">{label}</p>
      )}
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
