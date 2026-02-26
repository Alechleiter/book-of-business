'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { NotesSection } from '@/components/shared/notes-section';
import { AbbrCustom, ACRONYM_MAP } from '@/components/shared/abbr';
import { CompanyPropertiesPanel, RegionalPropertiesPanel } from '@/components/shared/related-properties';
import { fmt, fmtCurrency, fmtPercent, fmtPhone } from '@/lib/format';
import {
  X,
  Star,
  TrendingUp,
  Phone,
  Mail,
  ExternalLink,
  Building2,
  MapPinned,
  Users,
} from 'lucide-react';
import type { Property } from '@/types/database';

type RelatedView =
  | { type: 'company'; value: string }
  | { type: 'regional'; value: string }
  | null;

export interface PropertyDetailPanelProps {
  property: Property;
  onClose: () => void;
  onSelectProperty: (p: Property) => void;
  isFavorite: boolean;
  onToggleFav: () => void;
  onAddToPipeline: () => void;
  headerSlot?: React.ReactNode;
  disableCompanyLink?: boolean;
}

/**
 * Shared property detail panel used across zip-codes, properties, and other pages.
 * Manages its own relatedView state internally (company / regional overlays).
 */
export function PropertyDetailPanel({
  property: p,
  onClose,
  onSelectProperty,
  isFavorite,
  onToggleFav,
  onAddToPipeline,
  headerSlot,
  disableCompanyLink = false,
}: PropertyDetailPanelProps) {
  const [relatedView, setRelatedView] = useState<RelatedView>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll detail panel into view when property changes
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [p.id]);

  const handleRelatedSelect = (selected: Property) => {
    onSelectProperty(selected);
    setRelatedView(null);
  };

  return (
    <Card ref={panelRef}>
      <CardContent className="p-5 space-y-5 max-h-[85vh] overflow-y-auto">
        {/* Related Properties Panel */}
        {relatedView ? (
          relatedView.type === 'company' ? (
            <CompanyPropertiesPanel
              company={relatedView.value}
              currentPropertyId={p.id}
              onSelectProperty={handleRelatedSelect}
              onClose={() => setRelatedView(null)}
            />
          ) : (
            <RegionalPropertiesPanel
              supervisor={relatedView.value}
              currentPropertyId={p.id}
              onSelectProperty={handleRelatedSelect}
              onClose={() => setRelatedView(null)}
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
                {(p.county || p.market) && <p className="text-xs text-muted-foreground">{p.county && `${p.county} County`}{p.county && p.market && ' \u00b7 '}{p.market}</p>}
                {(p.submarket || p.neighborhood) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPinned className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {p.submarket && <span>Submarket: <span className="font-medium text-foreground">{p.submarket}</span></span>}
                      {p.submarket && p.neighborhood && ' \u00b7 '}
                      {p.neighborhood && <span>Neighborhood: <span className="font-medium text-foreground">{p.neighborhood}</span></span>}
                    </p>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Optional header slot (e.g. Pipeline stage buttons) */}
            {headerSlot}

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
              <Stat label="Year Built" tooltip="Year the property was originally constructed" value={p.year_built ? String(p.year_built) : '\u2014'} />
              <Stat label="Avg Rent" tooltip="Average monthly rent across all unit types" value={fmtCurrency(p.avg_rent)} />
              <Stat label="Occupancy" tooltip="Percentage of units currently leased to tenants" value={fmtPercent(p.occupancy)} />
              <Stat label="Avg Sqft" tooltip="Average square footage per unit" value={fmt(p.avg_sqft)} />
              <Stat label="$/Sqft" tooltip="Average rent price per square foot — rent divided by unit size" value={p.avg_price_per_sqft ? `$${p.avg_price_per_sqft.toFixed(2)}` : '\u2014'} />
              <Stat label="Total Sqft" tooltip="Total rentable square footage across all units" value={fmt(p.total_rentable_sqft)} />
              <Stat label="Min Lease" tooltip="Minimum lease term — shortest lease option offered (in months)" value={p.min_lease_term ? `${p.min_lease_term} mo` : '\u2014'} />
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

            {/* Management Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Management
              </h4>
              <div className="grid grid-cols-1 gap-1.5 text-sm">
                {p.management_company && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    {disableCompanyLink ? (
                      <span className="font-medium text-right text-muted-foreground">{p.management_company}</span>
                    ) : (
                      <button
                        className="font-medium text-right text-primary hover:underline inline-flex items-center gap-1"
                        onClick={() => setRelatedView({ type: 'company', value: p.management_company! })}
                      >
                        {p.management_company}
                        <Building2 className="h-3 w-3" />
                      </button>
                    )}
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
                      onClick={() => setRelatedView({ type: 'regional', value: p.regional_supervisor! })}
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

/** Small stat card used within the 3x3 key-stats grid. */
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
