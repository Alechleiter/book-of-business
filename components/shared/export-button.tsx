'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Property } from '@/types/database';

export function ExportButton({ properties, label = 'Export CSV' }: { properties: Property[]; label?: string }) {
  const handleExport = () => {
    if (!properties.length) return;

    const headers = [
      'Name', 'Address', 'City', 'ZIP', 'County', 'State', 'Market', 'Submarket',
      'Management Company', 'Onsite Manager', 'Phone', 'Email', 'Units', 'Stories',
      'Year Built', 'Classification', 'Housing Type', 'Avg Rent', 'Occupancy %',
      'Status', 'Software System', 'Built Type', 'Concessions',
    ];

    const rows = properties.map((p) => [
      p.name, p.address, p.city, p.zip, p.county, p.state, p.market, p.submarket,
      p.management_company, p.onsite_manager, p.phone, p.email, p.units, p.stories,
      p.year_built, p.classification, p.housing_type, p.avg_rent, p.occupancy,
      p.status, p.software_system, p.built_type, p.concessions_text,
    ]);

    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `properties_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!properties.length}>
      <Download className="h-4 w-4 mr-2" /> {label}
    </Button>
  );
}
