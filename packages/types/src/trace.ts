// The frontend event model Section 21/46 asks for — shaped so Phase 13 can
// swap the transport (mock generator -> real EventSource) without changing
// this contract or anything that consumes it. A discriminated union keyed
// by `type`, exactly like AIAssistantEvent (Phase 7) — same pattern,
// applied to Control Tower's richer per-agent trace instead of the
// chat-facing 6-stage flow.

interface TraceEventBase {
  executionId: string
  timestamp: string
}

export type TraceEvent =
  | (TraceEventBase & { type: 'agent.started'; agent: string; inputSummary: string })
  | (TraceEventBase & {
      type: 'agent.completed'
      agent: string
      durationMs: number
      tokens: number
      outputSummary: string
    })
  | (TraceEventBase & { type: 'agent.failed'; agent: string; durationMs: number; error: string })
  | (TraceEventBase & {
      type: 'guardrail.blocked'
      rule: string
      severity: 'low' | 'medium' | 'high' | 'critical'
    })
  | (TraceEventBase & { type: 'guardrail.passed' })
  | (TraceEventBase & { type: 'human.approval.required'; approvalId: string })
  | (TraceEventBase & { type: 'workflow.completed' })

// The UI-facing, AGGREGATED view a viewer actually renders — one row per
// agent/stage, built by collapsing a start+completion event pair (or a
// single event, for stages with no separate start). The mock trace
// service builds this today the same way a real SSE consumer will build
// it in Phase 13: fold incoming TraceEvents into TraceSteps as they arrive.
export type TraceStepStatus = 'completed' | 'running' | 'failed' | 'blocked' | 'pending'

export interface TraceStep {
  id: string
  agent: string
  status: TraceStepStatus
  timestamp: string
  durationMs?: number
  tokens?: number
  inputSummary?: string
  outputSummary?: string
  error?: string
}

export interface AgentTrace {
  executionId: string
  requestId: string
  events: TraceEvent[]
  steps: TraceStep[]
}
