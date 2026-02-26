'use client';

import { useState } from 'react';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StageBadge, StatusBadge } from '@/components/shared/status-badge';
import { fmt, fmtCurrency } from '@/lib/format';
import { PIPELINE_STAGES } from '@/lib/constants';
import { TrendingUp, Trash2 } from 'lucide-react';
import { AbbrCustom } from '@/components/shared/abbr';
import { ContactQuality } from '@/components/shared/contact-quality';

const STAGE_TOOLTIPS: Record<string, string> = {
  prospect: 'Initial identification — property identified as a potential lead',
  contacted: 'First contact made — reached out to property management or ownership',
  proposal: 'Proposal sent — formal proposal or bid submitted to the decision maker',
  negotiation: 'In negotiation — actively discussing terms, pricing, or contract details',
  won: 'Deal closed — contract signed and business secured',
  lost: 'Deal lost — property went with another provider or declined',
};

export default function PipelinePage() {
  const [stageFilter, setStageFilter] = useState('');
  const { items, loading, updateStage, removeFromPipeline } = usePipeline(stageFilter);

  return (
    <div className="space-y-4">
      {/* Stage filter chips */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={stageFilter === '' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setStageFilter('')}>
          All ({items.length})
        </Button>
        {PIPELINE_STAGES.map((s) => (
          <Button key={s.value} variant={stageFilter === s.value ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setStageFilter(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No pipeline items</p>
          <p className="text-xs text-muted-foreground mt-1">Add properties to your pipeline from the Properties page</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const p = item.properties;
            if (!p) return null;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                        <ContactQuality property={p} />
                        <StageBadge stage={item.stage} />
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.address}, {p.city} {p.zip}</p>
                      <div className="flex gap-x-4 mt-1 text-xs text-muted-foreground">
                        <span>{p.units} units</span>
                        {p.avg_rent > 0 && <span>{fmtCurrency(p.avg_rent)}/mo</span>}
                        {p.management_company && <span>{p.management_company}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 flex-shrink-0" onClick={() => removeFromPipeline(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Stage selector */}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {PIPELINE_STAGES.map((s) => (
                      <Button
                        key={s.value}
                        variant={item.stage === s.value ? 'default' : 'outline'}
                        size="sm"
                        className="text-[10px] h-6 px-2"
                        onClick={() => updateStage(p.id, s.value)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
