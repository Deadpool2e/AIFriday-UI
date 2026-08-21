import { describe, expect, it } from 'vitest'

import { mockExplainabilityService } from './explainability-service'

describe('mockExplainabilityService.getSummary', () => {
  it('decisionCounts sum to the number of requests with an aiRecommendation', async () => {
    const summary = await mockExplainabilityService.getSummary()
    const total = Object.values(summary.decisionCounts).reduce((sum, n) => sum + n, 0)
    // Every decided request has exactly one decision, so the counts must
    // sum to the same population getConfidenceBands() buckets.
    const bands = await mockExplainabilityService.getConfidenceBands()
    const bandTotal = bands.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(bandTotal)
  })

  it('avgConfidence is a plausible percentage', async () => {
    const summary = await mockExplainabilityService.getSummary()
    expect(summary.avgConfidence).toBeGreaterThanOrEqual(0)
    expect(summary.avgConfidence).toBeLessThanOrEqual(100)
  })

  it('humanReviewRate is a percentage', async () => {
    const summary = await mockExplainabilityService.getSummary()
    expect(summary.humanReviewRate).toBeGreaterThanOrEqual(0)
    expect(summary.humanReviewRate).toBeLessThanOrEqual(100)
  })
})

describe('mockExplainabilityService.getConfidenceBands', () => {
  it('returns exactly the high/medium/low bands, in that order', async () => {
    const bands = await mockExplainabilityService.getConfidenceBands()
    expect(bands.map((b) => b.band)).toEqual(['high', 'medium', 'low'])
  })

  it('every band count is non-negative', async () => {
    const bands = await mockExplainabilityService.getConfidenceBands()
    for (const band of bands) {
      expect(band.count).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('mockExplainabilityService.getLowConfidenceDecisions', () => {
  it('every returned decision is below the 75% review threshold', async () => {
    const decisions = await mockExplainabilityService.getLowConfidenceDecisions()
    for (const decision of decisions) {
      expect(decision.confidence).toBeLessThan(75)
    }
  })

  it('is sorted ascending by confidence (most concerning first)', async () => {
    const decisions = await mockExplainabilityService.getLowConfidenceDecisions()
    const confidences = decisions.map((d) => d.confidence)
    expect(confidences).toEqual([...confidences].sort((a, b) => a - b))
  })

  it('returns at most 8 decisions', async () => {
    const decisions = await mockExplainabilityService.getLowConfidenceDecisions()
    expect(decisions.length).toBeLessThanOrEqual(8)
  })
})

describe('mockExplainabilityService.getDecisionFactors', () => {
  it('weights sum to 100', async () => {
    const factors = await mockExplainabilityService.getDecisionFactors()
    const total = factors.reduce((sum, f) => sum + f.weightPercent, 0)
    expect(total).toBe(100)
  })

  it('every factor has a non-empty name and description', async () => {
    const factors = await mockExplainabilityService.getDecisionFactors()
    for (const factor of factors) {
      expect(factor.name.length).toBeGreaterThan(0)
      expect(factor.description.length).toBeGreaterThan(0)
    }
  })
})
