'use client';

import { useState } from 'react';
import { useManagementSearch, useCompanyProperties } from '@/lib/hooks/use-management';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ExportButton } from '@/components/shared/export-button';
import { fmt, fmtCurrency, fmtPercent } from '@/lib/format';
import { Search, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AbbrCustom } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';

export default function ManagementPage() {
  const { companies, loading, search, setSearch } = useManagementSearch();
  const [selected, setSelected] = useState<string | null>(null);
  const { properties, loading: propsLoading } = useCompanyProperties(selected);

  const selectedCompany = companies.find((c) => c.management_company === selected);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search management companies..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-6">
        {/* Company List */}
        <div className={`space-y-2 ${selected ? 'w-1/2 hidden lg:block' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No companies found</p>
          ) : (
            companies.map((c) => (
              <Card
                key={c.management_company}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected === c.management_company ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelected(c.management_company)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{c.management_company}</h3>
                      <div className="flex gap-x-4 text-xs text-muted-foreground">
                        <span>{fmt(c.total_units)} units</span>
                        <AbbrCustom tooltip="Total properties managed by this company" className="text-xs text-muted-foreground">{fmt(c.total_properties)} props</AbbrCustom>
                        <span>{fmt(c.active_count)} active</span>
                        <AbbrCustom tooltip="Number of unique ZIP codes where this company has properties" className="text-xs text-muted-foreground hidden sm:inline">{fmt(c.zip_count)} zips</AbbrCustom>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Company Detail */}
        {selected && (
          <div className="w-full lg:w-1/2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{selected}</CardTitle>
                <div className="flex gap-2">
                  <ExportButton properties={properties} label="Export" />
                  <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="lg:hidden">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCompany && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox label="Total Units" value={fmt(selectedCompany.total_units)} />
                    <StatBox label="Properties" value={fmt(selectedCompany.total_properties)} />
                    <StatBox label="Active" value={fmt(selectedCompany.active_count)} />
                    <StatBox label="ZIP Codes" value={fmt(selectedCompany.zip_count)} />
                  </div>
                )}

                <h4 className="text-sm font-semibold">Properties ({properties.length})</h4>
                {propsLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-4">Loading...</div>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {properties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium truncate">{p.name}</p>
                            <ContactQuality property={p} />
                          </div>
                          <p className="text-xs text-muted-foreground">{p.address}, {p.city} {p.zip}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <AbbrCustom tooltip="Total apartment units" className="text-xs">{p.units}u</AbbrCustom>
                          {p.avg_rent > 0 && <span className="text-xs">{fmtCurrency(p.avg_rent)}</span>}
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
