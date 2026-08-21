import * as React from 'react'
import { CheckCircle2Icon, ClockIcon, Loader2Icon, XCircleIcon } from 'lucide-react'

import { cn } from '../lib/cn'

export type AgentTraceStepStatus = 'completed' | 'running' | 'failed' | 'blocked' | 'pending'

export interface AgentTraceStep {
  id: string
  agent: string
  status: AgentTraceStepStatus
  timestamp: string
  durationMs?: number
  tokens?: number
  inputSummary?: string
  outputSummary?: string
  error?: string
}

interface AgentTraceProps extends React.ComponentProps<'ol'> {
  steps: AgentTraceStep[]
}

const statusConfig: Record<
  AgentTraceStepStatus,
  { icon: React.ReactNode; nodeClassName: string; label: string }
> = {
  completed: {
    icon: <CheckCircle2Icon className="size-4" aria-hidden="true" />,
    nodeClassName: 'bg-success text-success-foreground',
    label: 'Completed',
  },
  running: {
    icon: <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />,
    nodeClassName: 'bg-info text-info-foreground',
    label: 'Running',
  },
  failed: {
    icon: <XCircleIcon className="size-4" aria-hidden="true" />,
    nodeClassName: 'bg-danger text-danger-foreground',
    label: 'Failed',
  },
  blocked: {
    icon: <XCircleIcon className="size-4" aria-hidden="true" />,
    nodeClassName: 'bg-danger text-danger-foreground',
    label: 'Blocked',
  },
  pending: {
    icon: <ClockIcon className="size-4" aria-hidden="true" />,
    nodeClassName: 'bg-muted text-muted-foreground',
    label: 'Pending',
  },
}

// The richer sibling of WorkflowStepper (Phase 7) — that one is a compact
// label+status list for the chat's live progress; this shows a full
// execution's per-agent input/output/duration/token detail as a connected
// vertical timeline, which is what Section 21's "execution trace viewer"
// actually needs. Same status-icon vocabulary as WorkflowStepper on
// purpose, so the two read as one visual language across the app.
function AgentTrace({ steps, className, ...props }: AgentTraceProps) {
  return (
    <ol data-slot="agent-trace" className={cn('space-y-6', className)} {...props}>
      {steps.map((step, index) => {
        const config = statusConfig[step.status]
        const isLast = index === steps.length - 1
        return (
          <li key={step.id} className="relative flex gap-4">
            {!isLast && (
              <span
                aria-hidden="true"
                className="bg-border absolute top-8 left-4 -ml-px h-[calc(100%+1.5rem)] w-0.5"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
                config.nodeClassName,
              )}
            >
              {config.icon}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{step.agent}</span>
                <span className="text-muted-foreground text-xs">{config.label}</span>
              </div>
              <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs tabular-nums">
                <span>
                  {new Date(step.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                {step.durationMs !== undefined && <span>{step.durationMs}ms</span>}
                {step.tokens !== undefined && (
                  <span>{step.tokens.toLocaleString('en-US')} tokens</span>
                )}
              </div>
              {step.inputSummary && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Input: </span>
                  {step.inputSummary}
                </p>
              )}
              {step.outputSummary && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Output: </span>
                  {step.outputSummary}
                </p>
              )}
              {step.error && <p className="text-danger text-sm">{step.error}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { AgentTrace }
