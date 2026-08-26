import * as React from 'react'
import { CheckCircle2Icon, Loader2Icon, WrenchIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Badge } from './badge'

export type VizorionToolCallChipStatus = 'running' | 'completed'

interface VizorionToolCallChipProps extends React.ComponentProps<'span'> {
  name: string
  status: VizorionToolCallChipStatus
  detail?: string
}

// A single tool invocation, for Vizorion's tool_calls array and its
// streamed tool_started/tool_completed events. Distinct from
// packages/ui's existing ToolMonitor — that's shaped around the AI
// Assistant's per-agent call log (agent + tool + duration); this is
// Vizorion's simpler tool-name + running/completed pill.
function VizorionToolCallChip({ name, status, detail, className, ...props }: VizorionToolCallChipProps) {
  return (
    <span
      data-slot="vizorion-tool-call-chip"
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      <Badge variant={status === 'running' ? 'secondary' : 'outline'} className="gap-1.5">
        {status === 'running' ? (
          <Loader2Icon className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2Icon className="text-success size-3" aria-hidden="true" />
        )}
        <WrenchIcon className="size-3" aria-hidden="true" />
        {name}
        {detail && <span className="text-muted-foreground">— {detail}</span>}
      </Badge>
    </span>
  )
}

export { VizorionToolCallChip }
