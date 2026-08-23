import * as React from 'react'

import { cn } from '../lib/cn'

export type ExecutionTimelineEventTone = 'default' | 'success' | 'danger' | 'warning' | 'info'

export interface ExecutionTimelineEvent {
  id: string
  timestamp: string
  label: string
  tone?: ExecutionTimelineEventTone
}

interface ExecutionTimelineProps extends React.ComponentProps<'ol'> {
  events: ExecutionTimelineEvent[]
}

const toneClassName: Record<ExecutionTimelineEventTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
}

// The raw, unaggregated sibling of AgentTrace — one row per underlying
// event exactly as it occurred (agent lifecycle, tool calls, handoffs,
// guardrail/approval decisions), newest first, instead of one row per
// agent. Consumers derive `label`/`tone` from their own event union (see
// describeTraceEvent in @platform/api-client) so this component stays
// decoupled from any specific event vocabulary.
function ExecutionTimeline({ events, className, ...props }: ExecutionTimelineProps) {
  const ordered = [...events].reverse()

  return (
    <ol
      data-slot="execution-timeline"
      className={cn('max-h-96 space-y-1.5 overflow-y-auto', className)}
      {...props}
    >
      {ordered.map((event) => (
        <li key={event.id} className="flex items-start gap-2 text-sm">
          <span className="text-muted-foreground shrink-0 pt-px text-xs tabular-nums">
            {new Date(event.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <span className={cn('min-w-0', toneClassName[event.tone ?? 'default'])}>
            {event.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

export { ExecutionTimeline }
