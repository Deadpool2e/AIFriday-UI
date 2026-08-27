// One place where a semantic tone becomes paint.
//
// Before this file, every component that drew a tinted anything carried its
// own Record<tone, string> — ranked rows, KPI chips and status dots each
// picked their own alpha, so the same "warning" came out three different
// colours on one screen. The maps below are the only ones allowed to
// decide that, split by *what the paint is for* rather than by component:
//
//   Mark  — a chart mark (meter fill, stacked segment). Full-strength
//           chart-* tokens, which are lightness-tuned to sit on both the
//           light and dark chart surfaces.
//   Chip  — a small icon square that categorises a panel or tile.
//   Dot   — a legend/status bullet, always paired with a text label.
//   Text  — a figure or label that has to carry the tone itself.

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'

export const toneMarkClass: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/50',
  success: 'bg-chart-success',
  warning: 'bg-chart-warning',
  danger: 'bg-chart-danger',
  info: 'bg-chart-info',
  ai: 'bg-ai-accent',
}

export const toneChipClass: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  ai: 'bg-ai-accent/15 text-ai-accent',
}

export const toneDotClass: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/60',
  success: 'bg-chart-success',
  warning: 'bg-chart-warning',
  danger: 'bg-chart-danger',
  info: 'bg-chart-info',
  ai: 'bg-ai-accent',
}

export const toneTextClass: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  ai: 'text-ai-accent',
}
