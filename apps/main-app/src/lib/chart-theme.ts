// Shared Recharts styling so both dashboard charts read the same tokens.
// Colors are passed as CSS var() strings (not resolved hex) so they follow
// theme/contrast changes live — no re-render or JS-side recompute needed.
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
