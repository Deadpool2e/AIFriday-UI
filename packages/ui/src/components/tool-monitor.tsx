import * as React from 'react'
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Badge, type badgeVariants } from './badge'
import type { VariantProps } from 'class-variance-authority'

export type ToolMonitorCallStatus = 'running' | 'success' | 'failed'

export interface ToolMonitorCall {
  id: string
  agent: string
  tool: string
  status: ToolMonitorCallStatus
  timestamp: string
  durationMs?: number
}

interface ToolMonitorProps extends React.ComponentProps<'ol'> {
  calls: ToolMonitorCall[]
}

const statusConfig: Record<
  ToolMonitorCallStatus,
  {
    icon: React.ReactNode
    variant: VariantProps<typeof badgeVariants>['variant']
    label: string
  }
> = {
  running: {
    icon: <Loader2Icon className="size-3" aria-hidden="true" />,
    variant: 'secondary',
    label: 'Running',
  },
  success: {
    icon: <CheckCircle2Icon className="size-3" aria-hidden="true" />,
    variant: 'default',
    label: 'Success',
  },
  failed: {
    icon: <XCircleIcon className="size-3" aria-hidden="true" />,
    variant: 'destructive',
    label: 'Failed',
  },
}

// Every deterministic-tool invocation an agent makes during an execution —
// distinct from AgentTrace's per-agent summary, this is the call-by-call
// detail (which tool, how long it took, did it succeed) underneath a
// single step.
function ToolMonitor({ calls, className, ...props }: ToolMonitorProps) {
  const ordered = [...calls].reverse()

  return (
    <ol
      data-slot="tool-monitor"
      className={cn('max-h-96 space-y-2 overflow-y-auto', className)}
      {...props}
    >
      {ordered.map((call) => {
        const config = statusConfig[call.status]
        return (
          <li
            key={call.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="min-w-0 truncate">
              <span className="font-medium">{call.agent}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="text-muted-foreground">{call.tool}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {call.durationMs !== undefined && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {call.durationMs}ms
                </span>
              )}
              <Badge variant={config.variant} className="gap-1">
                {config.icon}
                {config.label}
              </Badge>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { ToolMonitor }
