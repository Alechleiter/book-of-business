'use client';

import { useFavorites } from '@/lib/hooks/use-favorites';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ExportButton } from '@/components/shared/export-button';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { Star, Trash2 } from 'lucide-react';
import { AbbrCustom } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';
import type { Property } from '@/types/database';

export default function FavoritesPage() {
  const { favorites, loading, toggle } = useFavorites();

  const properties = favorites
    .map((f) => f.properties)
    .filter(Boolean) as Property[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{favorites.length} saved properties</p>
        <ExportButton properties={properties} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No saved properties yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click the star icon on any property to save it</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((f) => {
            const p = f.properties;
            if (!p) return null;
            return (
              <Card key={f.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                      <ContactQuality property={p} />
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.address}, {p.city} {p.zip}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>{p.units} units</span>
                      {p.avg_rent > 0 && <span>{fmtCurrency(p.avg_rent)}/mo</span>}
                      {p.occupancy > 0 && <AbbrCustom tooltip="Occupancy rate — percentage of units currently leased" className="text-xs text-muted-foreground">{fmtPercent(p.occupancy)} occ</AbbrCustom>}
                      {p.management_company && <span className="truncate max-w-[200px]">{p.management_company}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0" onClick={() => toggle(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
