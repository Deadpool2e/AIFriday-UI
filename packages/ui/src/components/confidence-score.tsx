import * as React from 'react'

import { cn } from '../lib/cn'

interface ConfidenceScoreProps extends React.ComponentProps<'div'> {
  value: number // 0-100
  label?: string
}

function ConfidenceScore({
  value,
  label = 'Confidence',
  className,
  ...props
}: ConfidenceScoreProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))
  const tone =
    clamped >= 80 ? 'bg-success' : clamped >= 50 ? 'bg-warning' : 'bg-danger'

  return (
    <div data-slot="confidence-score" className={cn('space-y-1', className)} {...props}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn('h-full rounded-full transition-[width]', tone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export { ConfidenceScore }
