// Same styling as apps/main-app/src/lib/chart-theme.tsx — duplicated
// rather than shared, since it's a small, charting-library-specific
// concern (Recharts prop shapes), not a design-system primitive. Worth
// extracting to a shared package if a 3rd app ends up needing it too.
export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    fontSize: '12px',
    padding: '10px 12px',
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'blur(12px)',
  },
  labelStyle: {
    color: 'var(--color-surface-foreground)',
    fontWeight: 600,
    marginBottom: '4px',
  },
  itemStyle: {
    color: 'var(--color-muted-foreground)',
  },
}

export const chartAxisTick = { fill: 'var(--color-muted-foreground)', fontSize: 12 }
export const chartAxisLine = { stroke: 'var(--color-border)' }
export const chartGridStroke = 'var(--color-border)'

// A standard analytics-chart area fill (Vercel Analytics, PostHog, Datadog
// all ship this) — color fading to transparent, not a decorative UI
// gradient. Rendered once per series via <defs>, then referenced by
// `fill={`url(#${id})`}` on that series' <Area>/<Bar>.
export function ChartAreaGradient({ id, colorVar }: { id: string; colorVar: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={colorVar} stopOpacity={0.38} />
        <stop offset="100%" stopColor={colorVar} stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}
