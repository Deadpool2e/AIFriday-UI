import * as React from 'react'

import { cn } from '../lib/cn'

// Defined locally, not imported from @platform/types — packages/ui stays
// domain-agnostic and never depends on the app-contracts package (see
// the layering note on ActivityFeed for the full rationale).
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface RiskIndicatorProps extends React.ComponentProps<'span'> {
  level: RiskLevel
}

// Text label carries the meaning, not color alone — "High" and "Critical"
// read distinctly even in grayscale/print.
const config: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low risk', className: 'bg-success/10 text-success border-success/20' },
  medium: {
    label: 'Medium risk',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  high: { label: 'High risk', className: 'bg-danger/10 text-danger border-danger/20' },
  critical: {
    label: 'Critical risk',
    className: 'bg-danger/20 text-danger border-danger/40 font-semibold',
  },
}

function RiskIndicator({ level, className, ...props }: RiskIndicatorProps) {
  const { label, className: toneClassName } = config[level]
  return (
    <span
      data-slot="risk-indicator"
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        toneClassName,
        className,
      )}
      {...props}
    >
      {label}
    </span>
  )
}

export { RiskIndicator }
