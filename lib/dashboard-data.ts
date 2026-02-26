import { unstable_cache } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  avgRent: number;
  activeProperties: number;
  avgOccupancy: number;
  mgmtByUnits: { name: string; units: number; properties: number }[];
  housingTypeUnits: { name: string; units: number; properties: number }[];
  marketByUnits: { name: string; units: number; properties: number }[];
  classifications: { name: string; units: number }[];
  rentBuckets: { range: string; count: number }[];
}

function categorizeHousingType(raw: string | null): string[] {
  if (!raw) return ['Unknown'];
  const categories: string[] = [];
  const lower = raw.toLowerCase();
  if (lower.includes('conventional')) categories.push('Conventional');
  if (lower.includes('section 8')) categories.push('Section 8 / Affordable');
  if (lower.includes('tax credit')) categories.push('Tax Credit');
  if (lower.includes('senior')) categories.push('Senior Housing');
  if (lower.includes('student')) categories.push('Student Housing');
  if (lower.includes('btr') || lower.includes('sfr')) categories.push('BTR/SFR');
  if (lower.includes('mixed use')) categories.push('Mixed Use');
  if (lower.includes('income restricted')) categories.push('Income Restricted');
  if (lower.includes('corporate')) categories.push('Corporate Housing');
  if (categories.length === 0) categories.push('Other');
  return categories;
}

async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const sb = getServerSupabase();

  const PAGE_SIZE = 1000;
  const fields = 'management_company, housing_type, units, market, classification, avg_rent, occupancy, status';
  const allProps: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from('properties')
      .select(fields)
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    allProps.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (allProps.length === 0) return null;

  const totalProperties = allProps.length;
  let totalUnits = 0, activeProperties = 0;
  let rentSum = 0, rentCount = 0, occSum = 0, occCount = 0;

  const mgmtMap: Record<string, { units: number; properties: number }> = {};
  const htMap: Record<string, { units: number; properties: number }> = {};
  const marketMap: Record<string, { units: number; properties: number }> = {};
  const clMap: Record<string, number> = {};
  const buckets = [
    { range: '<$1K', min: 0, max: 1000, count: 0 },
    { range: '$1-1.5K', min: 1000, max: 1500, count: 0 },
    { range: '$1.5-2K', min: 1500, max: 2000, count: 0 },
    { range: '$2-2.5K', min: 2000, max: 2500, count: 0 },
    { range: '$2.5-3K', min: 2500, max: 3000, count: 0 },
    { range: '$3K+', min: 3000, max: 999999, count: 0 },
  ];

  for (const p of allProps) {
    const u = p.units || 0;
    totalUnits += u;
    if (p.status === 'active') activeProperties++;
    if (p.avg_rent > 0) { rentSum += p.avg_rent; rentCount++; }
    if (p.occupancy > 0) { occSum += p.occupancy; occCount++; }

    const mc = p.management_company || 'Unknown';
    if (!mgmtMap[mc]) mgmtMap[mc] = { units: 0, properties: 0 };
    mgmtMap[mc].units += u;
    mgmtMap[mc].properties++;

    const cats = categorizeHousingType(p.housing_type);
    for (const cat of cats) {
      if (!htMap[cat]) htMap[cat] = { units: 0, properties: 0 };
      htMap[cat].units += u;
      htMap[cat].properties++;
    }

    const m = p.market || 'Unknown';
    if (!marketMap[m]) marketMap[m] = { units: 0, properties: 0 };
    marketMap[m].units += u;
    marketMap[m].properties++;

    const cl = p.classification || 'Unknown';
    clMap[cl] = (clMap[cl] || 0) + u;

    if (p.avg_rent > 0) {
      for (const b of buckets) {
        if (p.avg_rent >= b.min && p.avg_rent < b.max) { b.count++; break; }
      }
    }
  }

  const avgRent = rentCount > 0 ? Math.round(rentSum / rentCount) : 0;
  const avgOccupancy = occCount > 0 ? Math.round((occSum / occCount) * 10) / 10 : 0;

  const mgmtByUnits = Object.entries(mgmtMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 20);

  const housingTypeUnits = Object.entries(htMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units);

  const marketByUnits = Object.entries(marketMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.units - a.units);

  const clOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'Unknown'];
  const classifications = Object.entries(clMap)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => clOrder.indexOf(a.name) - clOrder.indexOf(b.name));

  const rentBuckets = buckets.map(b => ({ range: b.range, count: b.count }));

  return {
    totalProperties, totalUnits, avgRent, activeProperties, avgOccupancy,
    mgmtByUnits, housingTypeUnits, marketByUnits, classifications, rentBuckets,
  };
}

export const getDashboardStats = unstable_cache(
  fetchDashboardStats,
  ['dashboard-stats'],
  { revalidate: 300 } // cache for 5 minutes
);
