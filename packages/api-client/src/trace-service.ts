import type { AgentTrace, TraceEvent, TraceStep } from '@platform/types'

import { API_BASE_URL, resolveService } from './lib/env'
import { createMockEventSource, createSSESource, type EventStreamSource } from './lib/event-stream'
import { apiFetch } from './lib/http-client'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function simpleHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

interface AgentStageTemplate {
  agent: string
  inputSummary: string
  outputSummary: string
  durationMs: number
  tokens: number
}

// Request -> Orchestrator -> RAG -> Risk -> Compliance -> Decision ->
// Guardrails -> (Human Approval | Workflow Complete) — the exact flow from
// Section 21. One shared template applied to any executionId (mock data,
// not meant to vary wildly), with duration/requestId/approval-branch
// varied by a hash of the id so different executions still look distinct.
const STAGE_TEMPLATES: AgentStageTemplate[] = [
  {
    agent: 'Orchestrator',
    inputSummary: 'Route request through the multi-agent review pipeline.',
    outputSummary: 'Routed to RAG Agent, Risk Agent, Compliance Agent, and Decision Agent.',
    durationMs: 145,
    tokens: 210,
  },
  {
    agent: 'RAG Agent',
    inputSummary: 'Retrieve relevant policy and compliance context.',
    outputSummary:
      'Retrieved 3 documents: Risk Policy Manual, Compliance Guidelines 2026, Transaction Risk Scoring Guide.',
    durationMs: 320,
    tokens: 1450,
  },
  {
    agent: 'Risk Agent',
    inputSummary: 'Assess financial and operational risk using retrieved context.',
    outputSummary:
      'Composite risk score 62/100 (Medium) based on transaction pattern and historical data.',
    durationMs: 890,
    tokens: 680,
  },
  {
    agent: 'Compliance Agent',
    inputSummary: 'Check request against policy documents and regulatory rules.',
    outputSummary: 'No policy violations detected. Transaction within standard thresholds.',
    durationMs: 780,
    tokens: 590,
  },
  {
    agent: 'Decision Agent',
    inputSummary: 'Generate final recommendation from upstream agent output.',
    outputSummary: 'Recommendation: Approve with monitoring. Confidence 87%.',
    durationMs: 410,
    tokens: 340,
  },
]

// executionId hashes to the same requestId whether you fetch a snapshot or
// stream it live — both transports describe the same underlying execution.
export function deriveRequestId(executionId: string): string {
  return `REQ-${92800 + (simpleHash(executionId) % 47)}`
}

// The ordered TraceEvent stream plus how long to wait before firing each
// one — the schedule a real backend's SSE endpoint would push over the
// wire in real time. buildTrace() below drains it instantly for a REST-style
// snapshot; createTraceEventSource() plays it back through real delays for
// a live view. Event `timestamp` fields stay historically consistent
// (based on cumulative durationMs) independent of the demo playback pacing.
function buildTraceEventSchedule(executionId: string): { event: TraceEvent; delayMs: number }[] {
  const hash = simpleHash(executionId)
  const requiresApproval = hash % 3 === 0
  const schedule: { event: TraceEvent; delayMs: number }[] = []
  let cursor = Date.parse('2026-08-20T13:40:00Z') - (hash % 600) * 1000

  STAGE_TEMPLATES.forEach((template, index) => {
    schedule.push({
      event: {
        type: 'agent.started',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        agent: template.agent,
        inputSummary: template.inputSummary,
      },
      delayMs: index === 0 ? 200 : 150,
    })
    cursor += template.durationMs
    schedule.push({
      event: {
        type: 'agent.completed',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        agent: template.agent,
        durationMs: template.durationMs,
        tokens: template.tokens,
        outputSummary: template.outputSummary,
      },
      delayMs: template.durationMs,
    })
  })

  // Guardrails — rule-based, no LLM tokens, no separate "started" event.
  cursor += 95
  schedule.push({
    event: { type: 'guardrail.passed', executionId, timestamp: new Date(cursor).toISOString() },
    delayMs: 150,
  })

  if (requiresApproval) {
    schedule.push({
      event: {
        type: 'human.approval.required',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        approvalId: `APR-${hash % 9000}`,
      },
      delayMs: 95,
    })
  } else {
    cursor += 50
    schedule.push({
      event: { type: 'workflow.completed', executionId, timestamp: new Date(cursor).toISOString() },
      delayMs: 95 + 50,
    })
  }

  return schedule
}

// Collapses a raw TraceEvent stream into the aggregated TraceStep[] a
// viewer renders — one row per agent, built by folding a start+completion
// pair (or a single event, for stages with no separate start) as events
// arrive. Exported so both the instant REST-style snapshot (buildTrace)
// and the live streaming hook (useLiveAgentTrace, called incrementally as
// each new event lands) use the exact same reducer — a live view and a
// "replay everything now" view are the same fold, just fed at different
// speeds.
export function foldTraceEvents(executionId: string, events: TraceEvent[]): TraceStep[] {
  const steps: TraceStep[] = []
  const indexByAgent = new Map<string, number>()

  for (const event of events) {
    switch (event.type) {
      case 'agent.started': {
        indexByAgent.set(event.agent, steps.length)
        steps.push({
          id: `${executionId}-step-${steps.length}`,
          agent: event.agent,
          status: 'running',
          timestamp: event.timestamp,
          inputSummary: event.inputSummary,
        })
        break
      }
      case 'agent.completed': {
        const index = indexByAgent.get(event.agent)
        if (index !== undefined) {
          steps[index] = {
            ...steps[index],
            status: 'completed',
            durationMs: event.durationMs,
            tokens: event.tokens,
            outputSummary: event.outputSummary,
          }
        }
        break
      }
      case 'agent.failed': {
        const index = indexByAgent.get(event.agent)
        if (index !== undefined) {
          steps[index] = {
            ...steps[index],
            status: 'failed',
            durationMs: event.durationMs,
            error: event.error,
          }
        }
        break
      }
      case 'guardrail.passed': {
        steps.push({
          id: `${executionId}-guardrails`,
          agent: 'Guardrails',
          status: 'completed',
          timestamp: event.timestamp,
          inputSummary: 'Scan final recommendation for policy and safety violations.',
          outputSummary: 'No violations detected. Passed all checks.',
        })
        break
      }
      case 'guardrail.blocked': {
        steps.push({
          id: `${executionId}-guardrails`,
          agent: 'Guardrails',
          status: 'blocked',
          timestamp: event.timestamp,
          inputSummary: 'Scan final recommendation for policy and safety violations.',
          error: `Blocked by rule "${event.rule}" (${event.severity} severity).`,
        })
        break
      }
      case 'human.approval.required': {
        steps.push({
          id: `${executionId}-human-approval`,
          agent: 'Human Approval',
          status: 'pending',
          timestamp: event.timestamp,
          inputSummary: 'Escalated for manager review due to risk level.',
        })
        break
      }
      case 'workflow.completed': {
        steps.push({
          id: `${executionId}-workflow-complete`,
          agent: 'Workflow',
          status: 'completed',
          timestamp: event.timestamp,
          outputSummary: 'No human review required — recommendation applied automatically.',
        })
        break
      }
    }
  }

  return steps
}

function buildTrace(executionId: string): AgentTrace {
  const events = buildTraceEventSchedule(executionId).map((entry) => entry.event)
  return {
    executionId,
    requestId: deriveRequestId(executionId),
    events,
    steps: foldTraceEvents(executionId, events),
  }
}

export interface TraceService {
  getTrace(executionId: string): Promise<AgentTrace>
  streamTrace(executionId: string): EventStreamSource<TraceEvent>
}

// getTrace mirrors a real GET /api/ai/executions/{id} snapshot endpoint;
// streamTrace mirrors the GET /api/ai/executions/{id}/stream SSE endpoint
// from the same API — a real backend has both, so the mock keeps both.
export const mockTraceService: TraceService = {
  async getTrace(executionId) {
    await delay(400)
    return buildTrace(executionId)
  },
  streamTrace(executionId) {
    return createMockEventSource(buildTraceEventSchedule(executionId))
  },
}

// The second Phase 21 worked example, alongside requests-service.ts —
// this one shows the SSE side of the swap: createSSESource() (built in
// Phase 13, unused until now) replaces createMockEventSource() one-for-
// one, because both satisfy the same EventStreamSource<TraceEvent>
// contract. Nothing that calls streamTrace() needs to know which one it's
// getting.
export const realTraceService: TraceService = {
  async getTrace(executionId) {
    return apiFetch<AgentTrace>(`/api/ai/executions/${executionId}`)
  },
  streamTrace(executionId) {
    return createSSESource<TraceEvent>(`${API_BASE_URL}/api/ai/executions/${executionId}/stream`)
  },
}

// Every consumer reaches this service only through the hooks in
// hooks/use-agent-trace.ts. Toggling VITE_USE_MOCK_API (lib/env.ts) moves
// both the snapshot fetch and the live stream to the real backend
// together — there's no way to mix one mock and one real per this
// interface, which matches how a real deployment would actually work.
export const traceService: TraceService = resolveService(mockTraceService, realTraceService)
