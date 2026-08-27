import * as React from 'react'
import { AlertTriangleIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { toneChipClass } from '../lib/tone'

export type SystemHealthStatus = 'healthy' | 'degraded' | 'down'

export interface SystemHealthItem {
  id: string
  name: string
  status: SystemHealthStatus
  detail?: string
}

interface SystemHealthProps extends React.ComponentProps<'ul'> {
  items: SystemHealthItem[]
}

// Icon + label, never color alone — a status color that's also
// distinguishable in grayscale/CVD, per the same rule RiskIndicator and
// GuardrailResult (Phase 14) follow.
const statusConfig: Record<
  SystemHealthStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  healthy: {
    label: 'Healthy',
    icon: <CheckCircle2Icon className="size-3.5" aria-hidden="true" />,
    className: toneChipClass.success,
  },
  degraded: {
    label: 'Degraded',
    icon: <AlertTriangleIcon className="size-3.5" aria-hidden="true" />,
    className: toneChipClass.warning,
  },
  down: {
    label: 'Down',
    icon: <XCircleIcon className="size-3.5" aria-hidden="true" />,
    className: toneChipClass.danger,
  },
}

function SystemHealth({ items, className, ...props }: SystemHealthProps) {
  return (
    // Hairline rules rather than plain vertical space: a service list is
    // read one row at a time ("is *that* one up?"), and a rule gives the
    // eye a rail to track along instead of leaving name and status
    // floating at opposite ends of an unmarked gap. The negative margin
    // keeps the first and last rules from doubling up with the card's own
    // padding.
    <ul
      data-slot="system-health"
      className={cn('divide-border/60 -my-2.5 divide-y', className)}
      {...props}
    >
      {items.map((item) => {
        const config = statusConfig[item.status]
        return (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 py-2.5 text-sm"
          >
            <span className="flex-1 pt-0.5">{item.name}</span>
            <span className="flex flex-col items-end gap-1">
              {/* A pill, not bare coloured text: it reads as a state badge
                  at a glance and keeps the status column a consistent
                  shape down the list whatever the word inside it. */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  config.className,
                )}
              >
                {config.icon}
                {config.label}
              </span>
              {item.detail && (
                <span className="text-muted-foreground max-w-[240px] text-right text-xs leading-snug">
                  {item.detail}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export { SystemHealth }
