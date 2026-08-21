export type ExplainabilityDecision = 'approve' | 'reject' | 'escalate' | 'review'

export interface DecisionFactor {
  name: string
  description: string
  weightPercent: number
}

export interface ConfidenceBand {
  band: 'high' | 'medium' | 'low'
  label: string
  count: number
}

export interface ExplainabilitySummary {
  avgConfidence: number
  decisionCounts: Record<ExplainabilityDecision, number>
  lowConfidenceCount: number
  humanReviewRate: number
}

export interface LowConfidenceDecision {
  requestId: string
  title: string
  decision: ExplainabilityDecision
  confidence: number
  risk: 'low' | 'medium' | 'high' | 'critical'
  summary: string
}
