import * as React from 'react'

import { cn } from '../lib/cn'

interface SparklineProps extends React.ComponentProps<'div'> {
  data: number[]
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  // Gradient area fill under the line — on by default so a sparkline always
  // reads as live data, not a decorative squiggle; turn off for a very
  // dense strip where even that much ink is too much.
  filled?: boolean
}

const toneVar: Record<NonNullable<SparklineProps['tone']>, string> = {
  success: 'var(--color-chart-success)',
  danger: 'var(--color-chart-danger)',
  warning: 'var(--color-chart-warning)',
  info: 'var(--color-chart-info)',
  // A sparkline supports the number above it; it is not the headline. At
  // --color-primary (near-black in light mode, near-white in dark) an
  // untoned trend line out-shouted the metric it belonged to, which is
  // how the KPI row ended up looking like a row of mountain ranges.
  neutral: 'var(--color-muted-foreground)',
}

const VIEW_WIDTH = 100
const VIEW_HEIGHT = 32

// Hand-rolled rather than pulling recharts into the shared component
// library — a sparkline is a single polyline over 8-20 points, not worth
// a charting dependency in a package every remote imports.
function Sparkline({
  data,
  tone = 'neutral',
  filled = true,
  className,
  ...props
}: SparklineProps) {
  const gradientId = React.useId()
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * VIEW_WIDTH
    const y = VIEW_HEIGHT - ((value - min) / range) * VIEW_HEIGHT
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`
  const color = toneVar[tone]
  const lastY = points[points.length - 1][1]

  return (
    // The wrapper exists so the "latest value" dot can be a real DOM
    // element outside the stretched SVG coordinate space — see below.
    <div
      data-slot="sparkline"
      className={cn('relative h-8 w-full', className)}
      aria-hidden="true"
      {...props}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        // The line has to span the card's full width regardless of how
        // many points it has, so the viewBox is stretched non-uniformly.
        // That distorts anything measured in user units: a strokeWidth of
        // 2 came out ~8px wide horizontally and ~3.5px vertically, which
        // is what made these read as fat wedges rather than trend lines.
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {filled && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* Barely-there. The fill is here to give the line a base to
                  sit on, not to be a filled area chart in its own right. */}
              <stop offset="0%" stopColor={color} stopOpacity={0.14} />
              <stop offset="80%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        {filled && (
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        )}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          // Renders the stroke at a true 1.5 CSS pixels, immune to the
          // non-uniform viewBox scale above. This is the whole fix.
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* The latest point. A <circle> here would be squashed into an
          ellipse by the same anisotropic scale, so it lives outside the
          SVG and is positioned by percentage instead. */}
      <span
        className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: '100%',
          top: `${(lastY / VIEW_HEIGHT) * 100}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

export { Sparkline }
