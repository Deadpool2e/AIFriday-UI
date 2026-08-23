import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { AnimatedNumber } from './animated-number'
import { Sparkline } from './sparkline'

interface KPIWidgetDelta {
  value: string
  tone: 'positive' | 'negative' | 'neutral'
  direction?: 'up' | 'down'
}

export type KPIWidgetTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'

interface KPIWidgetProps extends React.ComponentProps<'div'> {
  label: string
  value: string | number
  icon?: React.ReactNode
  delta?: KPIWidgetDelta
  // Independent of delta.tone: a comparison period label ("vs last 7
  // days") sits under the delta so the number always reads with context
  // instead of a bare percentage.
  comparisonLabel?: string
  // 8-20 points, oldest first. Rendered as a filled trend line, colored by
  // delta.tone when present so an "improved" negative-direction metric
  // (e.g. latency down) still reads green.
  sparklineData?: number[]
  // What this metric *is*, not which way it moved — a Guardrail Blocks
  // count is inherently a "warning" category regardless of whether blocks
  // went up or down this week, so this is a separate axis from delta.tone.
  tone?: KPIWidgetTone
  // 'featured' is for the 1-2 cards a bento grid wants to lead with —
  // bigger number, taller sparkline, same data/props otherwise.
  size?: 'default' | 'featured'
}

const deltaToneClass: Record<KPIWidgetDelta['tone'], string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-muted-foreground',
}

const sparklineTone: Record<KPIWidgetDelta['tone'], 'success' | 'danger' | 'neutral'> = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
}

const toneCardClass: Record<KPIWidgetTone, string> = {
  neutral: 'bg-surface',
  success: 'bg-success/[0.04] border-success/20',
  warning: 'bg-warning/[0.04] border-warning/20',
  danger: 'bg-danger/[0.04] border-danger/20',
  info: 'bg-info/[0.04] border-info/20',
  ai: 'bg-ai-accent/[0.04] border-ai-accent/20',
}

const toneIconClass: Record<KPIWidgetTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  ai: 'bg-ai-accent/15 text-ai-accent',
}

function KPIWidget({
  label,
  value,
  icon,
  delta,
  comparisonLabel,
  sparklineData,
  tone = 'neutral',
  size = 'default',
  className,
  onClick,
  ...props
}: KPIWidgetProps) {
  const interactive = Boolean(onClick)
  const featured = size === 'featured'

  return (
    <div
      data-slot="kpi-widget"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200',
        toneCardClass[tone],
        featured && 'p-5',
        interactive
          ? 'hover:border-border-strong cursor-pointer hover:-translate-y-1 hover:shadow-lg'
          : 'hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        {icon && (
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-md [&_svg]:size-3.5',
              toneIconClass[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p
          className={cn(
            'font-semibold tracking-tighter tabular-nums',
            featured ? 'text-4xl md:text-5xl' : 'text-3xl',
          )}
        >
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        {delta && (
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                deltaToneClass[delta.tone],
              )}
            >
              {delta.direction === 'up' && <ArrowUpIcon className="size-3" />}
              {delta.direction === 'down' && <ArrowDownIcon className="size-3" />}
              {delta.value}
            </span>
            {comparisonLabel && (
              <span className="text-muted-foreground text-xs">{comparisonLabel}</span>
            )}
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <Sparkline
          data={sparklineData}
          tone={delta ? sparklineTone[delta.tone] : 'neutral'}
          className={featured ? 'h-14' : undefined}
        />
      )}
    </div>
  )
}

export { KPIWidget }
