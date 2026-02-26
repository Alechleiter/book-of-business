import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-[10px] font-medium uppercase',
        status === 'active' && 'bg-green-500/15 text-green-600 dark:text-green-400',
        status === 'inactive' && 'bg-zinc-500/15 text-zinc-500',
      )}
    >
      {status}
    </Badge>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    prospect: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    contacted: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    proposal: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    negotiation: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    won: 'bg-green-500/15 text-green-600 dark:text-green-400',
    lost: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };
  return (
    <Badge variant="secondary" className={cn('text-[10px] font-medium uppercase', colors[stage])}>
      {stage}
    </Badge>
  );
}
