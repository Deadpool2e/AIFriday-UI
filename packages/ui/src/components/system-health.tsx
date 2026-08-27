import * as React from 'react'
import { AlertTriangleIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'

import { cn } from '../lib/cn'

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
    icon: <CheckCircle2Icon className="size-4" aria-hidden="true" />,
    className: 'text-success',
  },
  degraded: {
    label: 'Degraded',
    icon: <AlertTriangleIcon className="size-4" aria-hidden="true" />,
    className: 'text-warning',
  },
  down: {
    label: 'Down',
    icon: <XCircleIcon className="size-4" aria-hidden="true" />,
    className: 'text-danger',
  },
}

function SystemHealth({ items, className, ...props }: SystemHealthProps) {
  return (
    <ul
      data-slot="system-health"
      className={cn('space-y-3', className)}
      {...props}
    >
      {items.map((item) => {
        const config = statusConfig[item.status]
        return (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="flex-1">{item.name}</span>
            <span className="flex flex-col items-end gap-0.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 font-medium',
                  config.className,
                )}
              >
                {config.icon}
                {config.label}
              </span>
              {item.detail && (
                <span className="text-muted-foreground max-w-[220px] text-right text-xs">
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
