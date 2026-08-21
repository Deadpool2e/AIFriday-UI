import type {
  ConfidenceBand,
  DecisionFactor,
  ExplainabilityDecision,
  ExplainabilitySummary,
  LowConfidenceDecision,
} from '@platform/types'

import { MOCK_REQUESTS } from './mock-data'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Same confidence-band thresholds packages/ui's <ConfidenceScore> uses to
// color a single score (>=80 success, >=50 warning, else danger) — applied
// here across the whole population instead of one value, so a bucket
// labeled "High" always means what the badge color already taught a user
// to expect.
function confidenceBand(confidence: number): ConfidenceBand['band'] {
  if (confidence >= 80) return 'high'
  if (confidence >= 50) return 'medium'
  return 'low'
}

// Every number below is derived from the SAME MOCK_REQUESTS store Main
// App's dashboard and Control Tower's own metrics already read (see the
// Phase 9 and Phase 16 notes on this pattern) — not a second, disconnected
// "explainability dataset."
function decidedRequests() {
  return MOCK_REQUESTS.filter((r) => r.aiRecommendation !== undefined)
}

// The mock generator in mock-data.ts never produces a recommendation
// below 60% confidence (a system that already escalates true low-
// confidence cases upstream, before they'd ever reach a "decision," is a
// reasonable read on why) — so "needs a second look" here means the band
// just above that floor, not literally sub-50%. The bar is a judgment
// call, not a data quirk to work around. Used consistently for both the
// summary count and the list below it.
const NEEDS_REVIEW_CONFIDENCE_THRESHOLD = 75

function computeSummary(): ExplainabilitySummary {
  const decided = decidedRequests()
  const decisionCounts: Record<ExplainabilityDecision, number> = {
    approve: 0,
    review: 0,
    escalate: 0,
    reject: 0,
  }
  let confidenceSum = 0
  let lowConfidenceCount = 0

  for (const request of decided) {
    const rec = request.aiRecommendation!
    decisionCounts[rec.decision] += 1
    confidenceSum += rec.confidence
    if (rec.confidence < NEEDS_REVIEW_CONFIDENCE_THRESHOLD) lowConfidenceCount += 1
  }

  const humanReviewCount = MOCK_REQUESTS.filter((r) => r.humanReviewRequired).length

  return {
    avgConfidence: decided.length === 0 ? 0 : Math.round(confidenceSum / decided.length),
    decisionCounts,
    lowConfidenceCount,
    humanReviewRate:
      MOCK_REQUESTS.length === 0
        ? 0
        : Math.round((humanReviewCount / MOCK_REQUESTS.length) * 100),
  }
}

function computeConfidenceBands(): ConfidenceBand[] {
  const decided = decidedRequests()
  const counts: Record<ConfidenceBand['band'], number> = { high: 0, medium: 0, low: 0 }
  for (const request of decided) {
    counts[confidenceBand(request.aiRecommendation!.confidence)] += 1
  }
  return [
    { band: 'high', label: 'High (80-100%)', count: counts.high },
    { band: 'medium', label: 'Medium (50-79%)', count: counts.medium },
    { band: 'low', label: 'Low (below 50%)', count: counts.low },
  ]
}

function lowConfidenceDecisions(): LowConfidenceDecision[] {
  return decidedRequests()
    .filter((r) => r.aiRecommendation!.confidence < NEEDS_REVIEW_CONFIDENCE_THRESHOLD)
    .sort((a, b) => a.aiRecommendation!.confidence - b.aiRecommendation!.confidence)
    .slice(0, 8)
    .map((r) => ({
      requestId: r.id,
      title: r.title,
      decision: r.aiRecommendation!.decision,
      confidence: r.aiRecommendation!.confidence,
      risk: r.risk,
      summary: r.aiRecommendation!.summary,
    }))
}

// Not derived from any single request — this describes what tends to
// drive a decision across the whole system, the aggregate explanation a
// compliance reviewer wants before drilling into any one case. Static and
// deterministic on purpose: a real implementation would compute this from
// model feature-attribution data (Phase 22 backend integration), which
// this mock has no equivalent of.
const DECISION_FACTORS: DecisionFactor[] = [
  { name: 'Risk Score', description: 'Composite financial and operational risk score from the Risk Agent.', weightPercent: 28 },
  { name: 'Policy Compliance Match', description: 'How closely the request matches known compliant patterns.', weightPercent: 22 },
  { name: 'Historical Pattern Similarity', description: 'Similarity to previously approved or rejected requests.', weightPercent: 18 },
  { name: 'Sanctions / Watchlist Check', description: 'Screening result against active sanctions and watchlists.', weightPercent: 15 },
  { name: 'Transaction Amount Threshold', description: 'Whether the amount crosses a policy review threshold.', weightPercent: 10 },
  { name: 'Customer Due Diligence Status', description: 'Completeness of on-file customer due diligence.', weightPercent: 7 },
]

export interface ExplainabilityService {
  getSummary(): Promise<ExplainabilitySummary>
  getConfidenceBands(): Promise<ConfidenceBand[]>
  getDecisionFactors(): Promise<DecisionFactor[]>
  getLowConfidenceDecisions(): Promise<LowConfidenceDecision[]>
}

// Swap for a real implementation calling GET /api/explainability later
// (Phase 21). Every consumer reaches this only through the hooks in
// hooks/use-explainability.ts.
export const mockExplainabilityService: ExplainabilityService = {
  async getSummary() {
    await delay(300)
    return computeSummary()
  },
  async getConfidenceBands() {
    await delay(250)
    return computeConfidenceBands()
  },
  async getDecisionFactors() {
    await delay(250)
    return DECISION_FACTORS
  },
  async getLowConfidenceDecisions() {
    await delay(300)
    return lowConfidenceDecisions()
  },
}
