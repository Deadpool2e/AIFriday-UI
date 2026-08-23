import * as React from 'react'

import { cn } from '../lib/cn'

interface SparklineProps extends React.ComponentProps<'svg'> {
  data: number[]
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  // Gradient area fill under the line — on by default so a sparkline always
  // reads as live data, not a decorative squiggle; turn off for a very
  // dense strip where even that much ink is too much.
  filled?: boolean
}

const toneVar: Record<NonNullable<SparklineProps['tone']>, string> = {
  success: 'var(--color-chart-success)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-chart-warning)',
  info: 'var(--color-chart-info)',
  // Neutral used to map to muted-foreground (gray), which made a sparkline
  // with no explicit tone look disabled. It now uses the brand primary so
  // "no particular tone" still reads as confident, live data.
  neutral: 'var(--color-primary)',
}

// Hand-rolled rather than pulling recharts into the shared component
// library — a sparkline is a single polyline over 8-20 points, not worth
// a charting dependency in a package every remote imports.
function Sparkline({ data, tone = 'neutral', filled = true, className, ...props }: SparklineProps) {
  const gradientId = React.useId()
  const width = 100
  const height = 32
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const color = toneVar[tone]
  const last = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full overflow-visible', className)}
      aria-hidden="true"
      {...props}
    >
      {filled && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.25} fill={color} />
    </svg>
  )
}

export { Sparkline }
