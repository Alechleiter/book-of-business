'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Property } from '@/types/database';

/**
 * Contact Quality Indicator — shows stars on property cards to highlight
 * how much contact/management info is available.
 *
 * ★       = Has Regional Supervisor on file
 * ★★      = Has Regional Supervisor + has their email or phone on file
 */
export function ContactQuality({ property: p }: { property: Property }) {
  if (!p.regional_supervisor) return null;

  const hasContactInfo = !!(p.regional_supervisor_email || p.phone || p.email);
  const stars = hasContactInfo ? 2 : 1;

  const tooltip = stars === 2
    ? `Regional Supervisor: ${p.regional_supervisor} — contact info on file`
    : `Regional Supervisor: ${p.regional_supervisor}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-px flex-shrink-0 cursor-help">
          <Star />
          {stars === 2 && <Star />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium text-xs">{stars === 2 ? '★★ High-Value Lead' : '★ Regional Contact'}</p>
        <p className="text-xs mt-0.5">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function Star() {
  return (
    <svg
      className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
