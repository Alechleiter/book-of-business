'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmt } from '@/lib/format';
import { AbbrCustom } from '@/components/shared/abbr';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const MGMT_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444',
  '#10b981', '#f97316', '#6366f1', '#ec4899', '#14b8a6',
  '#a855f7', '#0ea5e9', '#eab308', '#d946ef', '#22d3ee',
  '#f472b6', '#84cc16', '#fb923c', '#2dd4bf', '#a78bfa',
];

interface ChartStats {
  mgmtByUnits: { name: string; units: number; properties: number }[];
  marketByUnits: { name: string; units: number; properties: number }[];
  classifications: { name: string; units: number }[];
  rentBuckets: { range: string; count: number }[];
}

export default function ChartsSection({ stats }: { stats: ChartStats }) {
  return (
    <>
      {/* Management Company Density by Units - TOP 20 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top 20 Management Companies by Unit Count</CardTitle>
          <p className="text-xs text-muted-foreground">Market density — who manages the most units in CA</p>
        </CardHeader>
        <CardContent className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.mgmtByUnits} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis type="number" fontSize={11} tickFormatter={(v) => fmt(Number(v))} />
              <YAxis
                type="category"
                dataKey="name"
                width={220}
                fontSize={11}
                tick={(props: any) => {
                  const name = props.payload.value.length > 30 ? props.payload.value.slice(0, 28) + '...' : props.payload.value;
                  return <text x={props.x} y={props.y} dy={4} textAnchor="end" fontSize={11} fill="currentColor">{name}</text>;
                }}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip
                formatter={(value: any, _name: any, props: any) =>
                  [`${fmt(Number(value || 0))} units (${fmt(props?.payload?.properties || 0)} properties)`, 'Total']
                }
              />
              <Bar dataKey="units" radius={[0, 4, 4, 0]}>
                {stats.mgmtByUnits.map((_, i) => (
                  <Cell key={i} fill={MGMT_COLORS[i % MGMT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom row: Market by Units + Classifications + Rent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market by Units */}
        <Card>
          <CardHeader><CardTitle className="text-sm"><AbbrCustom tooltip="California multi-family markets — geographic regions grouping cities and zip codes">Markets by Units</AbbrCustom></CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.marketByUnits} layout="vertical">
                <XAxis type="number" fontSize={11} tickFormatter={(v) => { const n = Number(v); return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n); }} />
                <YAxis type="category" dataKey="name" width={120} fontSize={10} />
                <Tooltip formatter={(value) => fmt(Number(value || 0)) + ' units'} />
                <Bar dataKey="units" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Classifications by Units */}
        <Card>
          <CardHeader><CardTitle className="text-sm"><AbbrCustom tooltip="Property quality grades from A+ (luxury) to D (distressed) — based on age, condition, amenities, and rent levels">Classifications by Units</AbbrCustom></CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.classifications}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => { const n = Number(v); return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n); }} />
                <Tooltip formatter={(value) => fmt(Number(value || 0)) + ' units'} />
                <Bar dataKey="units" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rent Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm"><AbbrCustom tooltip="Distribution of average monthly rents across all properties">Rent Distribution</AbbrCustom></CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rentBuckets}>
                <XAxis dataKey="range" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
