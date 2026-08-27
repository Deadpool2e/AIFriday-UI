// Types for the Vizorion chatbot integration (Vizorion repo, package
// `advanced_chatbot`). Deliberately mirror the backend's wire format
// (snake_case field names) instead of this codebase's usual camelCase
// domain types — these are external API payloads being typed, not
// internal domain modeling, and matching the wire avoids a translation
// layer that could silently drift from the real API. See
// Vizorion/app/api/schemas/*.py and Vizorion/sdk/typescript/src/index.ts
// for the source of truth.

export interface VizorionConversation {
  id: string
  title: string | null
  summary: string | null
  branched_from_id: string | null
  branched_from_message_id: string | null
  created_at: string
  updated_at: string
}

export interface VizorionCitation {
  document_id: string
  document_version?: string
  page?: number | null
  text: string
}

export interface VizorionToolCall {
  name: string
  arguments: Record<string, unknown>
  result: string
}

export interface VizorionMessageVersion {
  id: string
  version_type: string
  content: string
  citations: VizorionCitation[]
  tool_calls: VizorionToolCall[]
  created_at: string
}

export type VizorionMessageRole = 'user' | 'assistant'

export interface VizorionMessage {
  id: string
  role: VizorionMessageRole
  created_at: string
  versions: VizorionMessageVersion[]
}

// Shape of ChatResponse.approval / the approval_required stream event's
// data — a run paused for human-in-the-loop review of a tool call.
export interface VizorionPendingApproval {
  id: string
  tool_name: string
  arguments: Record<string, unknown>
  risk_level: string
}

// GET /v1/approvals returns this shape instead — same underlying record,
// listed rather than embedded in a chat response, so `payload` stands in
// for `arguments` and there's no risk_level.
export interface VizorionApprovalListItem {
  id: string
  conversation_id: string
  tool_name: string
  payload: Record<string, unknown>
}

export type VizorionApprovalResolution = 'approved' | 'edited' | 'rejected'

export interface VizorionChatResponse {
  conversation_id: string
  message_id: string
  run_id: string
  content: string
  citations: VizorionCitation[]
  tool_calls: VizorionToolCall[]
  suggestions: string[]
  approval: VizorionPendingApproval | null
  usage: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface VizorionMemory {
  id: string
  content: string
  key: string | null
  source: string
  created_at: string
}

export type VizorionDocumentStatus = string

export interface VizorionDocument {
  id: string
  status: VizorionDocumentStatus
  source?: string | null
}

export type VizorionRegenerateStyle = 'shorter' | 'detailed' | 'with_citations'

export interface VizorionRegenerateResult {
  message_id: string
  version_id: string
  content: string
}

// Discriminated union over the exact SSE event names POST /v1/chat/stream
// emits (Vizorion/app/api/routes/chat.py) — one JSON-encoded `data` per
// named `event`, framed as conventional SSE (`event: <name>\ndata: <json>\n\n`).
// Note this arrives over a POST response body, not a native browser
// EventSource (GET-only) — see packages/api-client/src/vizorion/sse.ts.
export type VizorionStreamEvent =
  | { event: 'run_started'; data: { conversation_id: string } }
  | { event: 'message_started'; data: Record<string, never> }
  | { event: 'reasoning_delta'; data: { delta: string } }
  | { event: 'message_delta'; data: { delta: string } }
  | { event: 'message_completed'; data: Record<string, never> }
  | { event: 'tool_started'; data: { tool: string | null } }
  | { event: 'tool_completed'; data: { tool: string | null } }
  | { event: 'approval_required'; data: VizorionPendingApproval }
  | {
      event: 'run_completed'
      data: {
        message_id: string
        run_id: string
        usage: Record<string, unknown>
      }
    }
  | { event: 'error'; data: { message: string } }
