import * as React from 'react'

import { cn } from '../lib/cn'
import { Badge } from './badge'
import { RiskIndicator, type RiskLevel } from './risk-indicator'
import type { AIDecision } from './ai-recommendation-card'

interface ApprovalCardProps extends React.ComponentProps<'div'> {
  id: string
  title: string
  owner: string
  risk: RiskLevel
  confidence?: number
  decision?: AIDecision
  // Slot for a "Review" button/link — navigation stays out of packages/ui
  // (see DataTable's ID column for the same reasoning: this component
  // never assumes react-router is even installed).
  action?: React.ReactNode
}

function ApprovalCard({
  id,
  title,
  owner,
  risk,
  confidence,
  decision,
  action,
  className,
  ...props
}: ApprovalCardProps) {
  return (
    <div
      data-slot="approval-card"
      className={cn(
        'bg-surface flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{id}</span>
          {decision && (
            <Badge variant="outline" className="capitalize">
              {decision}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground truncate text-sm">{title}</p>
        <p className="text-muted-foreground text-xs">Owner: {owner}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <RiskIndicator level={risk} />
        {confidence !== undefined && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {confidence}% confidence
          </span>
        )}
        {action}
      </div>
    </div>
  )
}

export { ApprovalCard }
