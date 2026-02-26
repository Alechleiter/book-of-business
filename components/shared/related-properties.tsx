'use client';

import { useState } from 'react';
import { useCompanyProperties, useRegionalProperties } from '@/lib/hooks/use-related-properties';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ContactQuality } from '@/components/shared/contact-quality';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { X, Building2, Users, ChevronRight } from 'lucide-react';
import type { Property } from '@/types/database';

/**
 * Shows all properties for a given management company.
 * Clickable rows to navigate to a property.
 */
export function CompanyPropertiesPanel({
  company,
  currentPropertyId,
  onSelectProperty,
  onClose,
}: {
  company: string;
  currentPropertyId: number;
  onSelectProperty: (p: Property) => void;
  onClose: () => void;
}) {
  const { properties, loading } = useCompanyProperties(company);

  return (
    <RelatedPanel
      icon={<Building2 className="h-4 w-4" />}
      title={company}
      subtitle={`${fmt(properties.length)} properties managed`}
      loading={loading}
      properties={properties}
      currentPropertyId={currentPropertyId}
      onSelectProperty={onSelectProperty}
      onClose={onClose}
    />
  );
}

/**
 * Shows all properties for a given regional supervisor.
 * Clickable rows to navigate to a property.
 */
export function RegionalPropertiesPanel({
  supervisor,
  currentPropertyId,
  onSelectProperty,
  onClose,
}: {
  supervisor: string;
  currentPropertyId: number;
  onSelectProperty: (p: Property) => void;
  onClose: () => void;
}) {
  const { properties, loading } = useRegionalProperties(supervisor);

  return (
    <RelatedPanel
      icon={<Users className="h-4 w-4" />}
      title={supervisor}
      subtitle={`${fmt(properties.length)} properties supervised`}
      loading={loading}
      properties={properties}
      currentPropertyId={currentPropertyId}
      onSelectProperty={onSelectProperty}
      onClose={onClose}
    />
  );
}

function RelatedPanel({
  icon,
  title,
  subtitle,
  loading,
  properties,
  currentPropertyId,
  onSelectProperty,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  loading: boolean;
  properties: Property[];
  currentPropertyId: number;
  onSelectProperty: (p: Property) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {properties.map((p) => (
            <button
              key={p.id}
              className={`w-full flex items-center justify-between text-sm py-2.5 px-3 rounded-lg text-left transition-colors hover:bg-accent/50 ${
                currentPropertyId === p.id ? 'bg-accent ring-1 ring-primary' : ''
              }`}
              onClick={() => onSelectProperty(p)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{p.name}</span>
                  <ContactQuality property={p} />
                </div>
                <span className="text-xs text-muted-foreground block truncate">{p.address}, {p.city} {p.zip}</span>
                <div className="flex gap-x-3 text-xs text-muted-foreground mt-0.5">
                  <span>{p.units} units</span>
                  {p.avg_rent > 0 && <span>{fmtCurrency(p.avg_rent)}</span>}
                  {p.occupancy > 0 && <span>{fmtPercent(p.occupancy)} occ</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <StatusBadge status={p.status} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
