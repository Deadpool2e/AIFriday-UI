// Same styling as apps/main-app/src/lib/chart-theme.tsx — duplicated
// rather than shared, since it's a small, charting-library-specific
// concern (Recharts prop shapes), not a design-system primitive. Worth
// extracting to a shared package if a 3rd app ends up needing it too.

export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    // rem, not px — SVG/inline-style font-size accepts either, and rem is
    // what scales with the Accessibility Center's text-size axis the way
    // every Tailwind text-* utility around this chart already does.
    fontSize: '0.75rem',
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

// Legacy inline-style tooltip config. Still used by the Control Tower
// pages that haven't moved to <ChartTooltip/> below; prefer that for
// anything new.
export const chartAxisTick = {
  fill: 'var(--color-muted-foreground)',
  fontSize: '0.6875rem',
}
export const chartAxisLine = { stroke: 'var(--color-border)' }
export const chartGridStroke = 'var(--color-border)'

// A standard analytics-chart area fill (Vercel Analytics, PostHog, Datadog
// all ship this) — color fading to transparent, not a decorative UI
// gradient. Rendered once per series via <defs>, then referenced by
// `fill={`url(#${id})`}` on that series' <Area>/<Bar>.
//
// Held at a low peak opacity on purpose: the fill exists to anchor the
// line to the axis, and a heavy wash turns a trend line into a solid
// coloured slab that fights the numbers above it for attention.
export function ChartAreaGradient({
  id,
  colorVar,
  intensity = 0.22,
}: {
  id: string
  colorVar: string
  intensity?: number
}) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={colorVar} stopOpacity={intensity} />
        <stop offset="100%" stopColor={colorVar} stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

// Recharts' built-in tooltip is styled through three separate inline-style
// props, which can't express a backdrop blur, a token-driven border, or
// per-row colour swatches. Rendering our own surface keeps it consistent
// with every other floating panel in the app (dropdown, palette, toast).
//
// Props are typed locally rather than from Recharts' own TooltipProps:
// in this version `payload` and `label` are read from context and aren't
// part of that public type, even though they are exactly what Recharts
// passes to a custom `content` element at runtime.
interface ChartTooltipEntry {
  name?: string | number
  value?: string | number
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipEntry[]
  label?: string | number
  valueFormatter?: (value: number, name: string) => string
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-surface-elevated/90 min-w-36 rounded-lg border p-2.5 shadow-lg backdrop-blur-md">
      <p className="text-muted-foreground mb-1.5 text-[11px] font-medium tracking-wide">
        {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li
            key={`${entry.name ?? index}`}
            className="flex items-center gap-2 text-xs whitespace-nowrap"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {valueFormatter && typeof entry.value === 'number'
                ? valueFormatter(entry.value, String(entry.name))
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// A vertical rule that follows the pointer, instead of Recharts' default
// full-opacity grey band. Reads as a measurement line rather than a
// selection highlight.
export const chartCursor = {
  stroke: 'var(--color-border-strong)',
  strokeWidth: 1,
  strokeDasharray: '3 3',
}
