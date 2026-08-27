import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { toneChipClass, toneTextClass, type Tone } from '../lib/tone'
import { AnimatedNumber } from './animated-number'
import { Sparkline } from './sparkline'

interface KPIWidgetDelta {
  value: string
  tone: 'positive' | 'negative' | 'neutral'
  direction?: 'up' | 'down'
}

export type KPIWidgetTone = Tone

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
  positive: toneTextClass.success,
  negative: toneTextClass.danger,
  neutral: toneTextClass.neutral,
}

const sparklineTone: Record<
  KPIWidgetDelta['tone'],
  'success' | 'danger' | 'neutral'
> = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
}

// Every tile sits on the same neutral surface. Tinting the card body per
// tone turned a six-metric row into six pastel rectangles — four different
// washes competing at equal strength, which is noise, not hierarchy. The
// tone now lives entirely in the icon chip below: enough to categorise the
// metric at a glance, small enough that the numbers stay the loudest thing
// on the row.
const CARD_SURFACE = 'bg-surface'

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
  const hasSparkline = Boolean(sparklineData && sparklineData.length > 1)

  return (
    <div
      data-slot="kpi-widget"
      onClick={onClick}
      // A clickable tile has to be reachable and operable without a mouse.
      // It was previously a bare <div onClick>, invisible to keyboard and
      // screen-reader users; role/tabIndex/Enter+Space fix that without
      // changing the markup any consumer depends on.
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>)
              }
            }
          : undefined
      }
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border p-4',
        CARD_SURFACE,
        featured && 'p-5',
        // Only the tiles that actually navigate somewhere react to the
        // pointer. A static metric that lifts on hover is a promise the
        // card can't keep.
        interactive &&
          'focus-visible:ring-ring/50 hover:border-border-strong cursor-pointer transition-[border-color,box-shadow,transform] duration-(--duration-fast) ease-out hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
          {label}
          {/* Drill-in affordance. Hidden until hover/focus so the resting
              state stays quiet, but present so the tile isn't a mystery
              click target. */}
          {interactive && (
            <ArrowUpRightIcon
              className="size-3 opacity-45 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          )}
        </p>
        {icon && (
          <div
            // Painted from the shared tone map, so a KPI tile's chip and a
            // card heading's chip of the same tone come out the same
            // colour rather than two hand-tuned near-misses.
            className={cn(
              'flex size-7 items-center justify-center rounded-md [&_svg]:size-3.5',
              toneChipClass[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* A tile with no trend data has nothing to put under its number, so
          on a row where a sibling *does* have a sparkline the grid stretches
          it and the value is left stranded at the top over an empty half-
          card. Centring the value block in the leftover space turns that
          void into deliberate breathing room. */}
      <div
        className={cn(
          'space-y-1',
          !hasSparkline && 'flex flex-1 flex-col justify-center',
        )}
      >
        <p
          className={cn(
            // 5xl was billboard-sized: a two-digit count rendered ~48px
            // tall dominated its own card and every card beside it.
            'font-semibold tracking-tight tabular-nums',
            featured ? 'text-3xl md:text-4xl' : 'text-2xl',
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
              {delta.direction === 'down' && (
                <ArrowDownIcon className="size-3" />
              )}
              {delta.value}
            </span>
            {comparisonLabel && (
              <span className="text-muted-foreground text-xs">
                {comparisonLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {hasSparkline && (
        <Sparkline
          data={sparklineData!}
          tone={delta ? sparklineTone[delta.tone] : 'neutral'}
          // 14 (56px) gave the trend line more vertical room than the
          // metric it annotates. It is a footnote to the number, sized
          // accordingly.
          className={featured ? 'mt-auto h-10' : 'mt-auto h-7'}
        />
      )}
    </div>
  )
}

export { KPIWidget }
