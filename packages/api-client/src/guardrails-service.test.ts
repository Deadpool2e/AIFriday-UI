import { describe, expect, it } from 'vitest'

import {
  mockGuardrailsService,
  triggerDemoGuardrailBlock,
} from './guardrails-service'

// Deliberately asserting invariants/relationships rather than hardcoded
// numbers pinned to today's mock data — these should stay true no matter
// how MOCK_GUARDRAIL_RULES/MOCK_GUARDRAIL_EVENTS content changes later.
describe('mockGuardrailsService.getSummary', () => {
  it('activeRules counts exactly the enabled rules', async () => {
    const rules = await mockGuardrailsService.getRules()
    const summary = await mockGuardrailsService.getSummary()
    expect(summary.activeRules).toBe(rules.filter((r) => r.enabled).length)
    expect(summary.totalRules).toBe(rules.length)
  })

  it('blocksLast24h counts exactly the blocked events', async () => {
    const events = await mockGuardrailsService.getEvents()
    const summary = await mockGuardrailsService.getSummary()
    expect(summary.blocksLast24h).toBe(
      events.filter((e) => e.action === 'blocked').length,
    )
  })

  it('topRule is the rule with the highest blockCount among rules that have blocked at least once', async () => {
    const rules = await mockGuardrailsService.getRules()
    const summary = await mockGuardrailsService.getSummary()
    const expectedTop = [...rules]
      .filter((r) => r.blockCount > 0)
      .sort((a, b) => b.blockCount - a.blockCount)[0]

    expect(summary.topRule?.name).toBe(expectedTop.name)
    expect(summary.topRule?.blockCount).toBe(expectedTop.blockCount)
  })

  it('blockRate is between 0 and 100', async () => {
    const summary = await mockGuardrailsService.getSummary()
    expect(summary.blockRate).toBeGreaterThanOrEqual(0)
    expect(summary.blockRate).toBeLessThanOrEqual(100)
  })
})

describe('triggerDemoGuardrailBlock', () => {
  it('adds a new blocked event to the front of the event list', async () => {
    // getEvents() returns the same live array both times (see
    // guardrails-service.ts) — capture .length as a plain number now, or
    // "before" and "after" alias one mutable array and both read the
    // post-mutation length.
    const beforeCount = (await mockGuardrailsService.getEvents()).length
    const event = triggerDemoGuardrailBlock()
    const after = await mockGuardrailsService.getEvents()

    expect(after.length).toBe(beforeCount + 1)
    expect(after[0]).toBe(event)
    expect(event.action).toBe('blocked')
  })

  it('increments the block count of the rule it targeted', async () => {
    // Same aliasing hazard as above: getRules() returns live rule objects
    // that get mutated in place, and which rule gets targeted isn't known
    // until after triggering — so snapshot every rule's blockCount as a
    // plain number keyed by id first, then compare by id afterward.
    const rulesBefore = await mockGuardrailsService.getRules()
    const blockCountsBefore = new Map(
      rulesBefore.map((r) => [r.id, r.blockCount]),
    )

    const event = triggerDemoGuardrailBlock()

    const rulesAfter = await mockGuardrailsService.getRules()
    const after = rulesAfter.find((r) => r.id === event.ruleId)!
    expect(after.blockCount).toBe(blockCountsBefore.get(event.ruleId)! + 1)
  })

  it('produces an executionId a trace can be built for (non-empty string)', () => {
    const event = triggerDemoGuardrailBlock()
    expect(event.executionId.length).toBeGreaterThan(0)
  })
})
