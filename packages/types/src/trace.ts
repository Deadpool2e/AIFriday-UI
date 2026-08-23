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
  | (TraceEventBase & { type: 'tool.invoked'; agent: string; tool: string })
  | (TraceEventBase & {
      type: 'tool.completed'
      agent: string
      tool: string
      status: ToolCallStatus
      durationMs: number
    })
  | (TraceEventBase & { type: 'agent.message'; sender: string; receiver: string; summary: string })
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
  toolCalls: ToolCall[]
  messages: AgentMessage[]
}

// A single deterministic-tool invocation underneath one agent step — e.g.
// RAG Agent calling its vector-search tool. Folded from tool.invoked/
// tool.completed event pairs the same way TraceStep is folded from
// agent.started/agent.completed, but kept as its own list since one agent
// step can involve multiple tool calls.
export type ToolCallStatus = 'running' | 'success' | 'failed'

export interface ToolCall {
  id: string
  agent: string
  tool: string
  status: ToolCallStatus
  timestamp: string
  durationMs?: number
}

// One agent-to-agent handoff, folded from agent.message events — distinct
// from a TraceStep's own input/output summary, this is what one agent
// explicitly passed to the next.
export interface AgentMessage {
  id: string
  sender: string
  receiver: string
  summary: string
  timestamp: string
}

// The static pipeline topology behind an execution — which agents exist
// and how they hand off to one another. Node/edge *state* (status,
// whether an edge actually fired) is derived at render time from an
// execution's TraceStep[], since the same topology is shared by every
// execution but which conditional branch fires varies per run.
export interface AgentGraphNode {
  id: string
  label: string
}

export interface AgentGraphEdge {
  id: string
  source: string
  target: string
  conditional?: boolean
}

export interface AgentGraph {
  nodes: AgentGraphNode[]
  edges: AgentGraphEdge[]
}
