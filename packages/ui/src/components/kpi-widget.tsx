import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { cn } from '../lib/cn'

interface KPIWidgetDelta {
  value: string
  tone: 'positive' | 'negative' | 'neutral'
  direction?: 'up' | 'down'
}

interface KPIWidgetProps extends React.ComponentProps<'div'> {
  label: string
  value: string | number
  icon?: React.ReactNode
  delta?: KPIWidgetDelta
}

const deltaToneClass: Record<KPIWidgetDelta['tone'], string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-muted-foreground',
}

function KPIWidget({
  label,
  value,
  icon,
  delta,
  className,
  ...props
}: KPIWidgetProps) {
  return (
    <div
      data-slot="kpi-widget"
      className={cn('bg-surface rounded-xl border p-4', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {icon && <div className="text-muted-foreground [&_svg]:size-4">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {/* Proportional figures for the hero-ish value, per the stat-tile
            contract — tabular-nums is reserved for columns of numbers that
            must align vertically (table cells, axis ticks), not a single
            standalone figure like this one. */}
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              deltaToneClass[delta.tone],
            )}
          >
            {delta.direction === 'up' && <ArrowUpIcon className="size-3" />}
            {delta.direction === 'down' && <ArrowDownIcon className="size-3" />}
            {delta.value}
          </span>
        )}
      </div>
    </div>
  )
}

export { KPIWidget }
