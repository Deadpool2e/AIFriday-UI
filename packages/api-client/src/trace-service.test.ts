import { describe, expect, it } from 'vitest'
import type { TraceEvent } from '@platform/types'

import { deriveRequestId, foldTraceEvents } from './trace-service'

const executionId = 'EXEC-TEST-1'

describe('foldTraceEvents', () => {
  it('creates a running step on agent.started', () => {
    const events: TraceEvent[] = [
      { type: 'agent.started', executionId, timestamp: 't0', agent: 'Orchestrator', inputSummary: 'go' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ agent: 'Orchestrator', status: 'running', inputSummary: 'go' })
  })

  it('updates the same step in place from running to completed', () => {
    const events: TraceEvent[] = [
      { type: 'agent.started', executionId, timestamp: 't0', agent: 'Orchestrator', inputSummary: 'go' },
      {
        type: 'agent.completed',
        executionId,
        timestamp: 't1',
        agent: 'Orchestrator',
        durationMs: 145,
        tokens: 210,
        outputSummary: 'done',
      },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({
      status: 'completed',
      durationMs: 145,
      tokens: 210,
      outputSummary: 'done',
      inputSummary: 'go', // preserved from the started event, not overwritten
    })
  })

  it('marks a step failed without losing its earlier input summary', () => {
    const events: TraceEvent[] = [
      { type: 'agent.started', executionId, timestamp: 't0', agent: 'Risk Agent', inputSummary: 'assess' },
      { type: 'agent.failed', executionId, timestamp: 't1', agent: 'Risk Agent', durationMs: 500, error: 'timeout' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps[0]).toMatchObject({ status: 'failed', error: 'timeout', inputSummary: 'assess' })
  })

  it('keeps two different agents as two separate steps', () => {
    const events: TraceEvent[] = [
      { type: 'agent.started', executionId, timestamp: 't0', agent: 'Orchestrator', inputSummary: 'a' },
      { type: 'agent.started', executionId, timestamp: 't1', agent: 'RAG Agent', inputSummary: 'b' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps.map((s) => s.agent)).toEqual(['Orchestrator', 'RAG Agent'])
    expect(steps.every((s) => s.status === 'running')).toBe(true)
  })

  it('appends a completed Guardrails step on guardrail.passed', () => {
    const events: TraceEvent[] = [{ type: 'guardrail.passed', executionId, timestamp: 't0' }]
    const steps = foldTraceEvents(executionId, events)
    expect(steps[0]).toMatchObject({ agent: 'Guardrails', status: 'completed' })
  })

  it('appends a blocked Guardrails step with a formatted error on guardrail.blocked', () => {
    const events: TraceEvent[] = [
      { type: 'guardrail.blocked', executionId, timestamp: 't0', rule: 'PII Exposure Check', severity: 'high' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps[0].status).toBe('blocked')
    expect(steps[0].error).toContain('PII Exposure Check')
    expect(steps[0].error).toContain('high')
  })

  it('appends a pending Human Approval step on human.approval.required', () => {
    const events: TraceEvent[] = [
      { type: 'human.approval.required', executionId, timestamp: 't0', approvalId: 'APR-1' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps[0]).toMatchObject({ agent: 'Human Approval', status: 'pending' })
  })

  it('appends a completed Workflow step on workflow.completed', () => {
    const events: TraceEvent[] = [{ type: 'workflow.completed', executionId, timestamp: 't0' }]
    const steps = foldTraceEvents(executionId, events)
    expect(steps[0]).toMatchObject({ agent: 'Workflow', status: 'completed' })
  })

  it('folds a full realistic sequence into the expected step count and final statuses', () => {
    const events: TraceEvent[] = [
      { type: 'agent.started', executionId, timestamp: 't0', agent: 'Orchestrator', inputSummary: 'go' },
      {
        type: 'agent.completed',
        executionId,
        timestamp: 't1',
        agent: 'Orchestrator',
        durationMs: 100,
        tokens: 50,
        outputSummary: 'routed',
      },
      { type: 'guardrail.passed', executionId, timestamp: 't2' },
      { type: 'workflow.completed', executionId, timestamp: 't3' },
    ]
    const steps = foldTraceEvents(executionId, events)
    expect(steps).toHaveLength(3)
    expect(steps.map((s) => s.status)).toEqual(['completed', 'completed', 'completed'])
  })
})

describe('deriveRequestId', () => {
  it('is deterministic for the same executionId', () => {
    expect(deriveRequestId('EXEC-4102')).toBe(deriveRequestId('EXEC-4102'))
  })

  it('produces a REQ-##### shaped id', () => {
    expect(deriveRequestId('EXEC-4102')).toMatch(/^REQ-\d+$/)
  })

  it('differs for different executionIds (not a constant)', () => {
    const a = deriveRequestId('EXEC-4102')
    const b = deriveRequestId('EXEC-4103')
    // Not guaranteed unequal for every possible pair (it's a hash mod 47),
    // but true for this specific known pair — pins the actual behavior.
    expect(a === b).toBe(false)
  })
})
