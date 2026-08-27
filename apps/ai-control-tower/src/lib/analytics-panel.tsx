import * as React from 'react'
import {
  Area,
  AreaChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  MetricStrip,
  SegmentedControl,
  Skeleton,
  type MetricStripItem,
} from '@platform/ui'

import { ChartAreaGradient, ChartTooltip, chartCursor } from './chart-theme'

// Mirrored in apps/main-app/src/lib/analytics-panel.tsx. Kept as a
// per-app file rather than a @platform/ui component for the same reason
// chart-theme.tsx is: it is bound to Recharts, and Recharts is a dependency
// of the two apps that draw charts, not of the design system every remote
// imports.

export type TrendPoint = { date: string } & Record<string, string | number>

export interface TrendSeries {
  // Key into each TrendPoint.
  id: string
  label: string
  // A CSS custom property reference, e.g. 'var(--color-chart-info)'.
  color: string
  // How the strip's headline number is derived from the visible window.
  // 'sum' for counts of things that happened per day; 'last' for a level
  // that is already a running total or a current rate.
  aggregate: 'sum' | 'last' | 'avg'
  // Whether an increase is good news. Guardrail blocks going up is not the
  // same story as completions going up, and the delta is coloured from
  // this rather than from the sign alone.
  toneForIncrease: 'positive' | 'negative' | 'neutral'
  format?: (value: number) => string
  unit?: string
  live?: boolean
  // The page that owns this metric in depth. Surfaces as a small arrow
  // beside the metric's label, so the strip doubles as a way in to the
  // section that explains the number.
  href?: string
}

interface AnalyticsPanelProps {
  title: string
  series: TrendSeries[]
  data: TrendPoint[] | undefined
  isLoading?: boolean
  // Passed straight through to MetricStrip so this file stays free of any
  // router import — see the note at the top about why it lives per-app.
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode
}

type RangeKey = '7d' | '14d'

const RANGE_OPTIONS = [
  { value: '7d' as const, label: '7 days', description: 'Last 7 days' },
  { value: '14d' as const, label: '14 days', description: 'Last 14 days' },
]

const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '14d': 14 }

function readValue(point: TrendPoint | undefined, key: string) {
  const raw = point?.[key]
  return typeof raw === 'number' ? raw : 0
}

function aggregate(points: TrendPoint[], serie: TrendSeries) {
  if (points.length === 0) return 0
  if (serie.aggregate === 'last')
    return readValue(points[points.length - 1], serie.id)
  const total = points.reduce(
    (sum, point) => sum + readValue(point, serie.id),
    0,
  )
  return serie.aggregate === 'avg' ? total / points.length : total
}

function formatValue(value: number, serie: TrendSeries) {
  if (serie.format) return serie.format(value)
  return Math.round(value).toLocaleString('en-US')
}

// One selectable metric strip driving one large chart, rather than a wall
// of small charts nobody reads. Picking the metric is the primary
// interaction on the page, so it is also the page's most prominent
// control — the numbers themselves are the tabs.
export function AnalyticsPanel({
  title,
  series,
  data,
  isLoading = false,
  renderLink,
}: AnalyticsPanelProps) {
  const [selectedId, setSelectedId] = React.useState(series[0]?.id)
  const [range, setRange] = React.useState<RangeKey>('14d')

  const days = RANGE_DAYS[range]
  const points = data ?? []
  const visible = points.slice(-days)
  // The window immediately before the visible one, when the dataset is
  // long enough to have it. This is what makes the delta and the ghost
  // comparison line real rather than a decorative "vs last period".
  const previous =
    points.length >= days * 2 ? points.slice(-days * 2, -days) : null

  const selected = series.find((serie) => serie.id === selectedId) ?? series[0]

  const items: MetricStripItem[] = series.map((serie) => {
    const current = aggregate(visible, serie)

    // Prefer comparing against the preceding window of the same length.
    // Failing that (the 14-day view has no 14 days before it), compare the
    // window's own second half against its first — labelled differently,
    // because it is a different claim.
    const half = Math.floor(visible.length / 2)
    const comparisonPoints = previous ?? visible.slice(0, half)
    const currentPoints = previous ? visible : visible.slice(half)
    const baseline = aggregate(comparisonPoints, serie)
    const compared = aggregate(currentPoints, serie)

    let delta: MetricStripItem['delta']
    if (baseline > 0 && comparisonPoints.length > 0) {
      const pct = ((compared - baseline) / baseline) * 100
      const rising = pct >= 0
      delta = {
        value: `${Math.abs(pct).toFixed(1)}%`,
        direction: rising ? 'up' : 'down',
        tone:
          serie.toneForIncrease === 'neutral'
            ? 'neutral'
            : rising === (serie.toneForIncrease === 'positive')
              ? 'positive'
              : 'negative',
      }
    }

    return {
      id: serie.id,
      label: serie.label,
      value: formatValue(current, serie),
      unit: serie.unit,
      live: serie.live,
      href: serie.href,
      delta,
      comparisonLabel: previous
        ? `vs previous ${days} days`
        : `vs first ${half} days`,
      empty: visible.length === 0,
    }
  })

  const chartData = visible.map((point, index) => ({
    date: point.date,
    current: readValue(point, selected.id),
    previous: previous ? readValue(previous[index], selected.id) : undefined,
  }))

  const gradientId = `analytics-${selected.id}`
  const peak = chartData.length
    ? Math.max(...chartData.map((point) => point.current))
    : 0

  return (
    <section className="space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-3">
          {previous && (
            <span className="text-muted-foreground hidden items-center gap-1.5 text-[11px] sm:flex">
              <span
                aria-hidden="true"
                className="border-muted-foreground/60 inline-block w-4 border-t border-dashed"
              />
              Previous {days} days
            </span>
          )}
          <SegmentedControl
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            label="Time range"
            size="sm"
          />
        </div>
      </div>

      <MetricStrip
        label={`${title} — choose a metric to chart`}
        items={items}
        selectedId={selected.id}
        onSelect={setSelectedId}
        isLoading={isLoading}
        renderLink={renderLink}
      />

      {isLoading || !data ? (
        <Skeleton className="mt-6 h-56 w-full" />
      ) : (
        <div
          role="tabpanel"
          aria-label={`${selected.label} over the last ${days} days`}
          className="pt-5"
        >
          {/* The chart's scale, stated once, in the corner. A full y-axis
              of repeated gridlines and tick labels costs a permanent
              column of ink to answer a question the reader asks once —
              "how big does this get?" — and the tooltip answers every
              other one exactly. */}
          <p className="text-muted-foreground mb-1 text-[11px] tabular-nums">
            {formatValue(peak, selected)}
          </p>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
            >
              <ChartAreaGradient id={gradientId} colorVar={selected.color} />
              {/* Both axes exist only to establish the scale Recharts
                  draws against — neither renders anything. */}
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                cursor={chartCursor}
                content={
                  <ChartTooltip
                    valueFormatter={(value: number) =>
                      formatValue(value, selected)
                    }
                  />
                }
              />
              {previous && (
                <Line
                  type="linear"
                  dataKey="previous"
                  name={`Previous ${days} days`}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                  dot={false}
                  activeDot={false}
                />
              )}
              <Area
                // Straight segments between readings, not a spline. A
                // monotone curve invents values between two days that were
                // never measured, and smooths away the single-day spikes
                // an operations chart exists to show.
                type="linear"
                dataKey="current"
                name={selected.label}
                stroke={selected.color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                // Dots on every point turn a 14-point line into beads on a
                // string; the active dot on hover is the only one that
                // tells the reader anything.
                dot={false}
                activeDot={{
                  r: 4,
                  fill: selected.color,
                  stroke: 'var(--color-surface)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Endpoints only. Fourteen rotated date ticks to say "these are
              consecutive days" is thirteen more than the reader needs. */}
          <div className="text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </section>
  )
}
