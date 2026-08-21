import type { AIRecommendation } from './request'

// The 6-stage flow from the AI Assistant spec: Understanding -> RAG ->
// Agent execution -> Guardrail checks -> Recommendation -> Human approval
// (last stage only when required). Per-agent detail (which specific agent
// ran, its token usage) is deliberately NOT modeled here — that's Agent
// Trace's job (Phase 12). This is the coarser, chat-facing view.
export type AIExecutionStageId =
  | 'understanding'
  | 'rag_retrieval'
  | 'agent_execution'
  | 'guardrail_check'
  | 'recommendation'
  | 'human_approval'

export type AIExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AIExecutionStep {
  id: AIExecutionStageId
  label: string
  status: AIExecutionStepStatus
  detail?: string
  durationMs?: number
}

export interface SourceCitation {
  id: string
  title: string
  snippet: string
  relevance: number // 0-100
}

export interface AIExecutionResult {
  steps: AIExecutionStep[]
  citations: SourceCitation[]
  recommendation: AIRecommendation
  requiresApproval: boolean
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  // Present only on assistant messages that completed the full pipeline —
  // this is what lets a past message in the transcript still show its full
  // trace/citations/recommendation on scroll-back, without re-running anything.
  execution?: AIExecutionResult
}

// Deliberately shaped like a future SSE payload (Section 46) — a
// discriminated union keyed by `type`. The mock service in
// packages/api-client emits exactly these events today via a plain
// callback; Phase 13 swaps the producer for a real EventSource and the
// consumer (useAIAssistant) barely changes, because it already only knows
// how to react to this event shape, never how events arrive.
export type AIAssistantEvent =
  | { type: 'step.started'; step: AIExecutionStageId }
  | { type: 'step.completed'; step: AIExecutionStageId; detail?: string; durationMs: number }
  | { type: 'citations.found'; citations: SourceCitation[] }
  | { type: 'result'; result: AIExecutionResult; message: string }
  | { type: 'error'; message: string }
