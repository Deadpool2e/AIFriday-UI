import * as React from 'react'

import { cn } from '../lib/cn'

// Defined locally, not imported from @platform/types — packages/ui stays
// domain-agnostic and never depends on the app-contracts package (see
// the layering note on ActivityFeed for the full rationale).
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface RiskIndicatorProps extends React.ComponentProps<'span'> {
  level: RiskLevel
}

// The one place a RiskLevel becomes paint — VizorionApprovalCard imports
// riskLevelClassName below rather than hand-rolling its own copy, so a risk
// badge comes out the same color wherever it appears.
export const riskLevelClassName: Record<RiskLevel, string> = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-danger/10 text-danger border-danger/20',
  critical: 'bg-danger/20 text-danger border-danger/40 font-semibold',
}

// Text label carries the meaning, not color alone — "High" and "Critical"
// read distinctly even in grayscale/print.
const config: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low risk', className: riskLevelClassName.low },
  medium: { label: 'Medium risk', className: riskLevelClassName.medium },
  high: { label: 'High risk', className: riskLevelClassName.high },
  critical: {
    label: 'Critical risk',
    className: riskLevelClassName.critical,
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
