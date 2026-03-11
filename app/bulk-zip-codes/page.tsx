'use client';

import { useState } from 'react';
import { useBulkZips } from '@/lib/hooks/use-bulk-zips';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { PropertyDetailPanel } from '@/components/shared/property-detail-panel';
import { ExportButton } from '@/components/shared/export-button';
import { ContactQuality } from '@/components/shared/contact-quality';
import { AbbrCustom } from '@/components/shared/abbr';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import {
  Search, ChevronDown, ChevronUp, MapPin, Phone, Mail,
  Trash2, AlertTriangle, Loader2, Building2, Home, DollarSign, Percent,
} from 'lucide-react';
import type { ZipAggregate, Property } from '@/types/database';

export default function BulkZipCodesPage() {
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { zips, allProperties, summary, loading, propertiesLoading, searched, search, clear } = useBulkZips();
  const { favoriteIds, toggle: toggleFav } = useFavorites();
  const { addToPipeline } = usePipeline();

  const handleSubmit = () => {
    setSelectedProperty(null);
    setExpanded(null);
    search(input);
  };

  const handleClear = () => {
    setInput('');
    setSelectedProperty(null);
    setExpanded(null);
    clear();
  };

  const getPropertiesForZip = (zip: string) =>
    allProperties.filter((p) => p.zip === zip);

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium">
            Paste or type ZIP codes (comma, space, or newline separated)
          </label>
          <textarea
            className="w-full h-28 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={"90210, 90211, 90212\n91301\n91302 91303"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!input.trim() || loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Search ZIPs</>
              )}
            </Button>
            {searched && (
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {searched && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <SummaryCard icon={MapPin} label="Matched ZIPs" value={fmt(summary.matchedZipCount)} />
            <SummaryCard icon={Building2} label="Total Properties" value={fmt(summary.totalProperties)} />
            <SummaryCard icon={Home} label="Total Units" value={fmt(summary.totalUnits)} />
            <SummaryCard icon={DollarSign} label="Avg Rent" value={fmtCurrency(summary.avgRent)} />
            <SummaryCard icon={Percent} label="Avg Occupancy" value={fmtPercent(summary.avgOccupancy)} />
          </div>

          {/* Unmatched warning */}
          {summary.unmatchedZips.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-600">
                  {summary.unmatchedZips.length} ZIP(s) not found in database
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.unmatchedZips.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Export all + count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {fmt(zips.length)} zip codes
            </p>
            <div className="flex items-center gap-2">
              {propertiesLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading properties...
                </span>
              )}
              <ExportButton
                properties={allProperties}
                label={propertiesLoading ? 'Loading...' : `Export All (${fmt(allProperties.length)})`}
              />
            </div>
          </div>
        </>
      )}

      {/* ZIP List + Detail Panel */}
      {searched && !loading && (
        <div className="flex gap-6 relative items-start">
          {/* ZIP list */}
          <div className={`space-y-2 ${selectedProperty ? 'w-1/2 hidden lg:block' : 'w-full'}`}>
            {zips.map((z) => (
              <BulkZipRow
                key={z.zip}
                zip={z}
                isExpanded={expanded === z.zip}
                onToggle={() => setExpanded(expanded === z.zip ? null : z.zip)}
                properties={getPropertiesForZip(z.zip)}
                propertiesLoading={propertiesLoading}
                onSelectProperty={setSelectedProperty}
                selectedPropertyId={selectedProperty?.id ?? null}
              />
            ))}
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
      )}
    </div>
  );
}

function BulkZipRow({ zip, isExpanded, onToggle, properties, propertiesLoading, onSelectProperty, selectedPropertyId }: {
  zip: ZipAggregate;
  isExpanded: boolean;
  onToggle: () => void;
  properties: Property[];
  propertiesLoading: boolean;
  onSelectProperty: (p: Property) => void;
  selectedPropertyId: number | null;
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
                {zip.avg_rent > 0 && <AbbrCustom tooltip="Average monthly rent" className="text-xs text-muted-foreground">{fmtCurrency(zip.avg_rent)} avg rent</AbbrCustom>}
                {zip.avg_occupancy > 0 && <AbbrCustom tooltip="Average occupancy rate" className="text-xs text-muted-foreground">{fmtPercent(zip.avg_occupancy)} occ</AbbrCustom>}
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
        </button>

        {isExpanded && (
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Properties ({properties.length})
              </h4>
              <ExportButton properties={properties} label="Export ZIP" />
            </div>
            {propertiesLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading properties...
              </div>
            ) : properties.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No properties found</div>
            ) : (
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
                      <span className="text-xs text-muted-foreground block truncate">{p.address}, {p.city} {p.zip}</span>
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
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
