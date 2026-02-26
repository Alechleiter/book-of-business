'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Industry acronyms and abbreviations with their full meanings.
 * Used to show hover tooltips explaining what acronyms stand for.
 */
export const ACRONYM_MAP: Record<string, string> = {
  // Housing Types
  'BTR/SFR': 'Build-to-Rent / Single Family Rental',
  'BTR': 'Build-to-Rent',
  'SFR': 'Single Family Rental',
  'Section 8': 'HUD Housing Choice Voucher Program — government-subsidized affordable housing',
  'Section 8 / Affordable': 'HUD Housing Choice Voucher Program — government-subsidized affordable housing',
  'Tax Credit': 'Low-Income Housing Tax Credit (LIHTC) — tax incentives for affordable housing development',
  'LIHTC': 'Low-Income Housing Tax Credit',
  'Income Restricted': 'Units with income limits — tenants must earn below a set threshold to qualify',
  'Mixed Use': 'Property combining residential units with commercial/retail space',
  'Corporate Housing': 'Furnished apartments rented to businesses for employee relocations or temporary assignments',

  // Metrics & Stats
  'Avg Rent': 'Average monthly rent across all units at the property',
  'Avg Eff Rent': 'Average Effective Rent — actual rent after concessions and discounts',
  'Avg Sqft': 'Average Square Footage per unit',
  'Avg Occupancy': 'Average Occupancy Rate — percentage of units currently leased',
  '$/Sqft': 'Average Rent Price per Square Foot',
  'Eff $/Sqft': 'Effective Rent Price per Square Foot (after concessions)',
  'Total Sqft': 'Total Rentable Square Footage across all units',
  'Min Lease': 'Minimum Lease Term — shortest lease option offered',
  'Flat Fee': 'Fixed management fee (not percentage-based)',
  'KPI': 'Key Performance Indicator',

  // Abbreviations used in the UI
  'occ': 'Occupancy Rate — percentage of units currently leased',
  'props': 'Properties',
  'mo': 'Months',
  'Mgmt': 'Management',

  // Classification grades
  'A+': 'Class A+ — luxury, newest construction, top-tier amenities, premium rents',
  'A': 'Class A — high-end, recent construction (< 10 yrs), premium amenities',
  'A-': 'Class A- — high quality, recent construction, strong amenities',
  'B+': 'Class B+ — above-average quality, well-maintained, moderate amenities',
  'B': 'Class B — average quality, some renovations, standard amenities',
  'B-': 'Class B- — below-average, may need updates, basic amenities',
  'C+': 'Class C+ — older but functional, limited amenities, lower rents',
  'C': 'Class C — older construction (20+ yrs), minimal amenities, value-oriented',
  'C-': 'Class C- — aging, below-average condition, most affordable rents',
  'D': 'Class D — distressed or functionally obsolete, significant deferred maintenance',

  // Software Systems
  'MRI': 'MRI Software — property management & real estate accounting platform',
  'AIM': 'AIM — Affordable & Investment Management software for LIHTC and HUD properties',

  // Built Types
  'Low Rise': 'Low Rise — 1-4 story building',
  'Mid Rise': 'Mid Rise — 5-9 story building',
  'High Rise': 'High Rise — 10-24 story building',
  'Sky Rise': 'Sky Rise — 25+ story building',
};

/**
 * Smart text processor that wraps known acronyms and abbreviations
 * in hoverable tooltips. Handles common patterns in property data.
 */
export function Abbr({ text, className }: { text: string; className?: string }) {
  // Check if the entire text is a known acronym
  if (ACRONYM_MAP[text]) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help ${className || ''}`}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{ACRONYM_MAP[text]}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // If not a direct match, return plain text
  return <span className={className}>{text}</span>;
}

/**
 * Inline abbreviation with explicit tooltip text.
 * Use when you want to provide a custom explanation.
 */
export function AbbrCustom({
  children,
  tooltip,
  className,
}: {
  children: React.ReactNode;
  tooltip: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help ${className || ''}`}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
