import type {
  AgentGraph,
  AgentMessage,
  AgentTrace,
  ToolCall,
  TraceEvent,
  TraceStep,
} from '@platform/types'

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

// The deterministic tool each stage's agent calls before it ever needs an
// LLM — mirrors Gyros' "deterministic layer first" agent design. Purely
// presentational for this mock (Tool Monitor), one tool per stage.
const STAGE_TOOLS: Record<string, string> = {
  Orchestrator: 'routing-engine',
  'RAG Agent': 'vector-search',
  'Risk Agent': 'risk-scoring-model',
  'Compliance Agent': 'policy-lookup',
  'Decision Agent': 'recommendation-engine',
  Guardrails: 'policy-scanner',
}

// The handoff message one stage passes to the next — what populates the
// Agent Communication feed. Keyed by the receiving agent, since that's who
// the message arrives "at" in the schedule below.
const HANDOFF_MESSAGES: Record<string, string> = {
  'RAG Agent': 'Forwarding request context and retrieval scope.',
  'Risk Agent': 'Sharing retrieved policy and compliance context.',
  'Compliance Agent': 'Sharing composite risk score for policy cross-check.',
  'Decision Agent': 'Confirming no policy violations; clear to recommend.',
  Guardrails: 'Submitting final recommendation for safety review.',
}

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
    // The handoff from whichever stage just finished — Orchestrator (index
    // 0) has no upstream sender, every other stage does.
    if (index > 0) {
      const previous = STAGE_TEMPLATES[index - 1]
      schedule.push({
        event: {
          type: 'agent.message',
          executionId,
          timestamp: new Date(cursor).toISOString(),
          sender: previous.agent,
          receiver: template.agent,
          summary: HANDOFF_MESSAGES[template.agent],
        },
        delayMs: 80,
      })
    }

    schedule.push({
      event: {
        type: 'agent.started',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        agent: template.agent,
        inputSummary: template.inputSummary,
      },
      delayMs: index === 0 ? 200 : 120,
    })

    // Every agent calls its deterministic tool before it would ever reach
    // for an LLM — a slice of the stage's own duration, not extra time.
    const tool = STAGE_TOOLS[template.agent]
    schedule.push({
      event: {
        type: 'tool.invoked',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        agent: template.agent,
        tool,
      },
      delayMs: 60,
    })

    const toolDurationMs = Math.max(20, Math.round(template.durationMs * 0.3))
    cursor += toolDurationMs
    schedule.push({
      event: {
        type: 'tool.completed',
        executionId,
        timestamp: new Date(cursor).toISOString(),
        agent: template.agent,
        tool,
        status: 'success',
        durationMs: toolDurationMs,
      },
      delayMs: template.durationMs - toolDurationMs,
    })

    cursor += template.durationMs - toolDurationMs
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
      delayMs: 90,
    })
  })

  // Guardrails — rule-based, no LLM tokens, no separate "started" event —
  // but it's still handed off to from Decision Agent and still calls its
  // own deterministic tool, same as every other stage above.
  const lastStageAgent = STAGE_TEMPLATES[STAGE_TEMPLATES.length - 1].agent
  schedule.push({
    event: {
      type: 'agent.message',
      executionId,
      timestamp: new Date(cursor).toISOString(),
      sender: lastStageAgent,
      receiver: 'Guardrails',
      summary: HANDOFF_MESSAGES.Guardrails,
    },
    delayMs: 80,
  })

  const guardrailTool = STAGE_TOOLS.Guardrails
  schedule.push({
    event: {
      type: 'tool.invoked',
      executionId,
      timestamp: new Date(cursor).toISOString(),
      agent: 'Guardrails',
      tool: guardrailTool,
    },
    delayMs: 60,
  })
  cursor += 70
  schedule.push({
    event: {
      type: 'tool.completed',
      executionId,
      timestamp: new Date(cursor).toISOString(),
      agent: 'Guardrails',
      tool: guardrailTool,
      status: 'success',
      durationMs: 70,
    },
    delayMs: 90,
  })

  cursor += 25
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

// The Tool Monitor's data source — folds tool.invoked/tool.completed pairs
// into one ToolCall per invocation, same fold-as-events-arrive shape as
// foldTraceEvents above so live streaming and snapshot replay build it
// identically.
export function foldToolCalls(executionId: string, events: TraceEvent[]): ToolCall[] {
  const calls: ToolCall[] = []
  const indexByKey = new Map<string, number>()

  for (const event of events) {
    if (event.type === 'tool.invoked') {
      indexByKey.set(`${event.agent}:${event.tool}`, calls.length)
      calls.push({
        id: `${executionId}-tool-${calls.length}`,
        agent: event.agent,
        tool: event.tool,
        status: 'running',
        timestamp: event.timestamp,
      })
    } else if (event.type === 'tool.completed') {
      const index = indexByKey.get(`${event.agent}:${event.tool}`)
      if (index !== undefined) {
        calls[index] = { ...calls[index], status: event.status, durationMs: event.durationMs }
      }
    }
  }

  return calls
}

// The Agent Communication feed's data source — one entry per agent.message
// event, in the order they occurred.
export function foldAgentMessages(executionId: string, events: TraceEvent[]): AgentMessage[] {
  return events
    .filter((event): event is Extract<TraceEvent, { type: 'agent.message' }> =>
      event.type === 'agent.message',
    )
    .map((event, index) => ({
      id: `${executionId}-message-${index}`,
      sender: event.sender,
      receiver: event.receiver,
      summary: event.summary,
      timestamp: event.timestamp,
    }))
}

export type TraceEventTone = 'default' | 'success' | 'danger' | 'warning' | 'info'

// The Execution Timeline's data source — a human-readable label and a
// color tone for any raw TraceEvent, so the timeline stays a thin renderer
// over whatever the event vocabulary grows to instead of duplicating this
// switch itself.
export function describeTraceEvent(event: TraceEvent): { label: string; tone: TraceEventTone } {
  switch (event.type) {
    case 'agent.started':
      return { label: `${event.agent} started`, tone: 'info' }
    case 'agent.completed':
      return { label: `${event.agent} completed (${event.durationMs}ms, ${event.tokens} tokens)`, tone: 'success' }
    case 'agent.failed':
      return { label: `${event.agent} failed — ${event.error}`, tone: 'danger' }
    case 'tool.invoked':
      return { label: `${event.agent} invoked ${event.tool}`, tone: 'default' }
    case 'tool.completed':
      return {
        label: `${event.tool} ${event.status === 'success' ? 'succeeded' : 'failed'} (${event.durationMs}ms)`,
        tone: event.status === 'success' ? 'success' : 'danger',
      }
    case 'agent.message':
      return { label: `${event.sender} → ${event.receiver}: ${event.summary}`, tone: 'default' }
    case 'guardrail.blocked':
      return { label: `Guardrails blocked — ${event.rule} (${event.severity} severity)`, tone: 'danger' }
    case 'guardrail.passed':
      return { label: 'Guardrails passed', tone: 'success' }
    case 'human.approval.required':
      return { label: `Human approval required (${event.approvalId})`, tone: 'warning' }
    case 'workflow.completed':
      return { label: 'Workflow completed', tone: 'success' }
  }
}

// The static agent pipeline topology (Section 21's flow, same one
// STAGE_TEMPLATES/HANDOFF_MESSAGES above encode) — identical for every
// execution. A viewer derives each node's live status and each edge's
// "did this actually fire" state from that execution's own TraceStep[];
// this function only ever describes the shape, never the state.
export function buildAgentGraphTopology(): AgentGraph {
  return {
    nodes: [
      { id: 'Orchestrator', label: 'Orchestrator' },
      { id: 'RAG Agent', label: 'RAG Agent' },
      { id: 'Risk Agent', label: 'Risk Agent' },
      { id: 'Compliance Agent', label: 'Compliance Agent' },
      { id: 'Decision Agent', label: 'Decision Agent' },
      { id: 'Guardrails', label: 'Guardrails' },
      { id: 'Human Approval', label: 'Human Approval' },
      { id: 'Workflow', label: 'Workflow Complete' },
    ],
    edges: [
      { id: 'e-orchestrator-rag', source: 'Orchestrator', target: 'RAG Agent' },
      { id: 'e-rag-risk', source: 'RAG Agent', target: 'Risk Agent' },
      { id: 'e-risk-compliance', source: 'Risk Agent', target: 'Compliance Agent' },
      { id: 'e-compliance-decision', source: 'Compliance Agent', target: 'Decision Agent' },
      { id: 'e-decision-guardrails', source: 'Decision Agent', target: 'Guardrails' },
      {
        id: 'e-guardrails-approval',
        source: 'Guardrails',
        target: 'Human Approval',
        conditional: true,
      },
      { id: 'e-guardrails-workflow', source: 'Guardrails', target: 'Workflow', conditional: true },
    ],
  }
}

function buildTrace(executionId: string): AgentTrace {
  const events = buildTraceEventSchedule(executionId).map((entry) => entry.event)
  return {
    executionId,
    requestId: deriveRequestId(executionId),
    events,
    steps: foldTraceEvents(executionId, events),
    toolCalls: foldToolCalls(executionId, events),
    messages: foldAgentMessages(executionId, events),
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
