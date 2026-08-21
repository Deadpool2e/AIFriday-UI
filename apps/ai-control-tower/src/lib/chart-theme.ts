// Same styling as apps/main-app/src/lib/chart-theme.ts — duplicated
// rather than shared, since it's a small, charting-library-specific
// concern (Recharts prop shapes), not a design-system primitive. Worth
// extracting to a shared package if a 3rd app ends up needing it too.
export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
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
