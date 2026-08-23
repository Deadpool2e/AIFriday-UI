import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'
import { Badge, type badgeVariants } from './badge'
import { ConfidenceScore } from './confidence-score'
import { RiskIndicator, type RiskLevel } from './risk-indicator'

export type AIDecision = 'approve' | 'reject' | 'escalate' | 'review'

interface AIRecommendationCardProps extends React.ComponentProps<'div'> {
  decision: AIDecision
  confidence: number
  risk: RiskLevel
  summary: string
}

const decisionConfig: Record<
  AIDecision,
  { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }
> = {
  approve: { label: 'Approve', variant: 'default' },
  review: { label: 'Needs review', variant: 'secondary' },
  escalate: { label: 'Escalate', variant: 'destructive' },
  reject: { label: 'Reject', variant: 'destructive' },
}

function AIRecommendationCard({
  decision,
  confidence,
  risk,
  summary,
  className,
  ...props
}: AIRecommendationCardProps) {
  const config = decisionConfig[decision]
  return (
    <div
      data-slot="ai-recommendation-card"
      className={cn(
        'bg-surface border-ai-accent/20 border-t-ai-accent space-y-3 rounded-lg border-x border-t-2 border-b p-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        <RiskIndicator level={risk} />
      </div>
      <p className="text-sm">{summary}</p>
      <ConfidenceScore value={confidence} />
    </div>
  )
}

export { AIRecommendationCard }
