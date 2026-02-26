'use client';

import { useState, useRef, useEffect } from 'react';
import { useProperties } from '@/lib/hooks/use-properties';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { useFilterStore } from '@/lib/stores/filter-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ExportButton } from '@/components/shared/export-button';
import { PropertyDetailPanel } from '@/components/shared/property-detail-panel';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { MARKETS, HOUSING_TYPES, CLASSIFICATIONS } from '@/lib/constants';
import { Search, Star, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { AbbrCustom } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';
import type { Property } from '@/types/database';

export default function PropertiesPage() {
  const { filters, setFilter, clearFilters, activeFilterCount } = useFilterStore();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Property | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { properties, count, loading } = useProperties(filters, page);
  const { favoriteIds, toggle: toggleFav } = useFavorites();
  const { addToPipeline } = usePipeline();

  const totalPages = Math.ceil(count / 50);

  // Refs for scroll alignment
  const listContainerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // When a property is selected, scroll the detail panel to align with the clicked card
  useEffect(() => {
    if (!selected || !detailRef.current || !listContainerRef.current) return;
    const cardEl = cardRefs.current.get(selected.id);
    if (!cardEl) return;

    const listRect = listContainerRef.current.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const offsetFromList = cardRect.top - listRect.top;

    detailRef.current.style.marginTop = `${Math.max(0, offsetFromList)}px`;
  }, [selected]);

  const handleSelect = (p: Property) => {
    setSelected(p);
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search properties..."
            value={filters.search || ''}
            onChange={(e) => { setFilter('search', e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters {activeFilterCount() > 0 && `(${activeFilterCount()})`}
          </Button>
          {activeFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setPage(0); }}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
          <ExportButton properties={properties} />
        </div>
      </div>

      {/* Quick Filters */}
      {showFilters && (
        <Card>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            <FilterSelect label="Status" value={filters.status} onChange={(v) => { setFilter('status', v); setPage(0); }} options={['active', 'inactive']} />
            <FilterSelect label="Market" value={filters.market} onChange={(v) => { setFilter('market', v); setPage(0); }} options={MARKETS} />
            <FilterSelect label="Housing Type" tooltip="Filter by property housing category (Conventional, Affordable, Student, etc.)" value={filters.housing_type} onChange={(v) => { setFilter('housing_type', v); setPage(0); }} options={HOUSING_TYPES} />
            <FilterSelect label="Classification" tooltip="Property quality grade from A+ (luxury) to D (distressed)" value={filters.classification} onChange={(v) => { setFilter('classification', v); setPage(0); }} options={CLASSIFICATIONS} />
            <div>
              <label className="text-xs text-muted-foreground">Min Units</label>
              <Input type="number" className="h-8 text-sm" value={filters.min_units || ''} onChange={(e) => { setFilter('min_units', e.target.value ? Number(e.target.value) : undefined); setPage(0); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Units</label>
              <Input type="number" className="h-8 text-sm" value={filters.max_units || ''} onChange={(e) => { setFilter('max_units', e.target.value ? Number(e.target.value) : undefined); setPage(0); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min Rent</label>
              <Input type="number" className="h-8 text-sm" value={filters.min_rent || ''} onChange={(e) => { setFilter('min_rent', e.target.value ? Number(e.target.value) : undefined); setPage(0); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Rent</label>
              <Input type="number" className="h-8 text-sm" value={filters.max_rent || ''} onChange={(e) => { setFilter('max_rent', e.target.value ? Number(e.target.value) : undefined); setPage(0); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Submarket</label>
              <Input className="h-8 text-sm" placeholder="Type submarket..." value={filters.submarket || ''} onChange={(e) => { setFilter('submarket', e.target.value || undefined); setPage(0); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Neighborhood</label>
              <Input className="h-8 text-sm" placeholder="Type neighborhood..." value={filters.neighborhood || ''} onChange={(e) => { setFilter('neighborhood', e.target.value || undefined); setPage(0); }} />
            </div>
            <div>
              <AbbrCustom tooltip="Search by regional supervisor name — the person overseeing multiple properties in the area" className="text-xs text-muted-foreground">Regional Supervisor</AbbrCustom>
              <Input className="h-8 text-sm" placeholder="Type name..." value={filters.regional_supervisor || ''} onChange={(e) => { setFilter('regional_supervisor', e.target.value || undefined); setPage(0); }} />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!filters.has_phone} onChange={(e) => { setFilter('has_phone', e.target.checked || undefined); setPage(0); }} />
                Has Phone
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!filters.has_email} onChange={(e) => { setFilter('has_email', e.target.checked || undefined); setPage(0); }} />
                Has Email
              </label>
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!filters.has_concessions} onChange={(e) => { setFilter('has_concessions', e.target.checked || undefined); setPage(0); }} />
                Has Concessions
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!filters.has_regional} onChange={(e) => { setFilter('has_regional', e.target.checked || undefined); setPage(0); }} />
                <AbbrCustom tooltip="Only show properties that have a regional supervisor on file" className="text-xs">Has Regional Mgr</AbbrCustom>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{fmt(count)} properties found</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">{page + 1} / {totalPages || 1}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Property List + Detail */}
      <div className="flex gap-6 relative items-start">
        <div ref={listContainerRef} className={`space-y-2 ${selected ? 'w-1/2 hidden lg:block' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No properties found</p>
          ) : (
            properties.map((p) => (
              <Card
                key={p.id}
                ref={(el) => { if (el) cardRefs.current.set(p.id, el); }}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected?.id === p.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelect(p)}
              >
                <CardContent className="flex items-start justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                      <ContactQuality property={p} />
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.address}, {p.city} {p.zip}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>{p.units} units</span>
                      {p.avg_rent > 0 && <span>{fmtCurrency(p.avg_rent)}/mo</span>}
                      {p.occupancy > 0 && <AbbrCustom tooltip="Occupancy rate — percentage of units currently leased" className="text-xs text-muted-foreground">{fmtPercent(p.occupancy)} occ</AbbrCustom>}
                      {p.management_company && <span className="truncate max-w-[200px]">{p.management_company}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
                  >
                    <Star className={`h-4 w-4 ${favoriteIds.has(p.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div ref={detailRef} className="w-full lg:w-1/2 lg:sticky lg:top-4 transition-[margin] duration-200">
            <PropertyDetailPanel
              property={selected}
              onClose={() => setSelected(null)}
              onSelectProperty={(p) => setSelected(p)}
              isFavorite={favoriteIds.has(selected.id)}
              onToggleFav={() => toggleFav(selected.id)}
              onAddToPipeline={() => addToPipeline(selected.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, tooltip }: { label: string; value?: string; onChange: (v: string) => void; options: string[]; tooltip?: string }) {
  return (
    <div>
      {tooltip ? (
        <AbbrCustom tooltip={tooltip} className="text-xs text-muted-foreground">{label}</AbbrCustom>
      ) : (
        <label className="text-xs text-muted-foreground">{label}</label>
      )}
      <select
        className="w-full h-8 rounded-md border bg-background px-2 text-sm"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
