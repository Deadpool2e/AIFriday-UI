# API contracts

This is the endpoint contract for whatever real backend eventually replaces the mock data in `@platform/api-client`. Every shape here is copied directly from `packages/types/src/*.ts` — those files are the actual source of truth (TypeScript will fail to build if a real service implementation returns something that doesn't match), this document just organizes them by endpoint for a backend engineer who doesn't want to read the frontend to find them.

## How the swap works

Every domain has a `*-service.ts` file in `packages/api-client/src/` exporting:
- A `mock*Service` — the built-in mock data every page works against today.
- A `real*Service` (only built out for two domains so far — see "Status" below) — the same interface, backed by `apiFetch()` (`packages/api-client/src/lib/http-client.ts`).
- A resolved export (e.g. `requestsService`, `traceService`) chosen by `resolveService()` (`packages/api-client/src/lib/env.ts`) based on `VITE_USE_MOCK_API`.

Hooks and pages only ever call the resolved export. Wiring a domain up to a real backend means: implement `real*Service` against the endpoints below, export it next to the mock, and change the resolved export to use `resolveService()` — no component, hook, or page changes.

**Status:** `requests-service.ts` and `trace-service.ts` have real implementations already (Phase 21 — see those files for the worked examples, including the SSE one). Every other service below is mock-only; its endpoints are documented so the same pattern can be applied, not because they're already wired.

## Conventions

- **Base URL** — `VITE_API_BASE_URL` (`.env`, default `http://localhost:8000`). Must be set identically across `apps/host`, `apps/main-app`, and `apps/ai-control-tower`'s own `.env` files — see the comment in each `.env.example` for why.
- **Auth** — `Authorization: Bearer <token>` on every request. See `docs/rbac.md` for what the backend must do with it.
- **JSON casing — camelCase on the wire**, matching the TypeScript interfaces below exactly. `apiFetch()` does no case conversion. If the backend's internal models are snake_case (typical for Pydantic), expose camelCase at the API boundary — e.g. Pydantic v2's `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)`.
- **Errors** — any non-2xx response. `apiFetch()` reads the body as text and throws `ApiError(status, message)`; a JSON error body's raw text becomes the message, so `{"detail": "not found"}` shows literally. If the backend wants structured errors surfaced more precisely, `ApiError` is the one place to extend (currently just `{status, message}`).
- **No server-side pagination expected today.** Every list endpoint below returns its full collection in one response; the frontend's `DataTable` paginates client-side. This is a reasonable place to add real pagination later (it wasn't needed to reach parity with the current mock data, which tops out around 47 items), but doing so means updating the corresponding service AND the page's `DataTable` usage together.
- **Timestamps** — ISO 8601 strings (e.g. `"2026-08-20T13:42:00Z"`), consumed via `new Date(...)`. A few mock fields use pre-formatted relative strings like `"8 min ago"` instead (noted per-field below) — a real backend should send a real ISO timestamp and let the frontend format it; those mock fields exist only because there was no real clock to compute "ago" from.

---

## Requests — `requests-service.ts` (real implementation exists)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/requests` | `Request[]` |
| GET | `/api/requests/{id}` | `Request` (404 → frontend treats as `null`, not an error) |

```ts
interface Request {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'blocked' | 'escalated' | 'degraded' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  risk: 'low' | 'medium' | 'high' | 'critical'
  owner: string
  createdAt: string
  updatedAt: string
  aiProcessed: boolean
  humanReviewRequired: boolean
  approvalState: 'not_required' | 'pending' | 'approved' | 'rejected'
  aiRecommendation?: {
    decision: 'approve' | 'reject' | 'escalate' | 'review'
    confidence: number // 0-100
    risk: 'low' | 'medium' | 'high' | 'critical'
    summary: string
  }
  agentExecutions: { agent: string; status: 'completed' | 'running' | 'failed' | 'skipped'; durationMs: number }[]
  documents: { id: string; name: string; type: string; sizeLabel: string }[]
  timeline: { id: string; label: string; timestamp: string; status: 'completed' | 'current' | 'upcoming' }[]
  guardrailChecks: { id: string; rule: string; status: 'passed' | 'flagged' | 'blocked'; detail?: string }[]
  lastApprovalAction?: { action: 'approve' | 'reject' | 'send_back' | 'request_info'; comment?: string; actedAt: string; actedBy: string }
}
```

## Approvals — `approvals-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/approvals/pending` | `Request[]` — only requests where `humanReviewRequired && approvalState === 'pending' && aiRecommendation` exists and hasn't already been acted on this session |
| POST | `/api/approvals/{id}/action` | `Request` (the updated request) |

POST body:
```ts
interface ApprovalActionInput {
  requestId: string
  action: 'approve' | 'reject' | 'send_back' | 'request_info'
  comment?: string
}
```
Effect on the request (`approvalState`/`status`), for backend parity with current mock behavior:
- `approve` → `approvalState: 'approved'`, `status: 'completed'`
- `reject` → `approvalState: 'rejected'`, `status: 'blocked'`
- `send_back` / `request_info` → `approvalState: 'pending'`, `status: 'pending'` (stays in the queue conceptually, but the frontend hides it once `lastApprovalAction` is set — a real backend should decide whether "sent back" requests reappear in `/api/approvals/pending` on a later poll, which the mock currently does NOT do)

## Dashboard metrics — `metrics-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/metrics` | `DashboardMetrics` |
| GET | `/api/metrics/request-volume` | `RequestVolumePoint[]` (14-day series) |
| GET | `/api/metrics/ai-activity` | `AiActivityPoint[]` (14-day series) |
| GET | `/api/metrics/recent-activity` | `ActivityItem[]` |

```ts
interface DashboardMetrics {
  totalRequests: number
  completed: number
  pending: number
  highRisk: number
  aiProcessed: number
  humanReviewRequired: number
}
interface RequestVolumePoint { date: string; submitted: number; completed: number }
interface AiActivityPoint { date: string; aiProcessed: number; humanReview: number }
interface ActivityItem { id: string; message: string; timestamp: string; severity: 'info' | 'success' | 'warning' | 'danger' }
```

## AI Assistant — `ai-assistant-service.ts`

Chat-facing, coarse-grained 6-stage pipeline view (contrast with Agent Trace below, which is the per-agent detail view of the same underlying execution).

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/ai/query` | Kicks off a run for a prompt; returns an execution id to stream |
| GET | `/api/ai/executions/{id}/stream` | SSE — see below |

SSE events (one JSON-encoded `AIAssistantEvent` per `message`, `done` event when finished):
```ts
type AIAssistantEvent =
  | { type: 'step.started'; step: AIExecutionStageId }
  | { type: 'step.completed'; step: AIExecutionStageId; detail?: string; durationMs: number }
  | { type: 'citations.found'; citations: SourceCitation[] }
  | { type: 'result'; result: AIExecutionResult; message: string }
  | { type: 'error'; message: string }

type AIExecutionStageId = 'understanding' | 'rag_retrieval' | 'agent_execution' | 'guardrail_check' | 'recommendation' | 'human_approval'
interface SourceCitation { id: string; title: string; snippet: string; relevance: number }
interface AIExecutionResult {
  steps: { id: AIExecutionStageId; label: string; status: 'pending' | 'running' | 'completed' | 'failed'; detail?: string; durationMs?: number }[]
  citations: SourceCitation[]
  recommendation: Request['aiRecommendation'] // same shape, always present here
  requiresApproval: boolean
}
```
**Implementation note:** the current mock (`mockAIAssistantService.sendMessage(prompt, onEvent)`) delivers these events via a plain callback, not through the `EventStreamSource` abstraction `trace-service.ts` uses (see `packages/api-client/src/lib/event-stream.ts`). A real implementation should route this through the same `EventStreamSource`/`createSSESource()` pattern for consistency — that refactor hasn't been done yet, since there's no backend to test it against.

## Control Tower — `control-tower-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/agents/metrics` | `ControlTowerMetrics` |
| GET | `/api/agents` | `Agent[]` |
| GET | `/api/agents/{id}` | `Agent \| null` |
| GET | `/api/agents/{id}/executions` | `RecentExecution[]` |
| GET | `/api/agents/{id}/performance-trend` | `AgentSuccessRatePoint[]` (14-day) |
| GET | `/api/agents/success-rate-trend` | `AgentSuccessRatePoint[]` (14-day, all agents) |
| GET | `/api/system/health` | `SystemHealthItem[]` |
| GET | `/api/executions/recent` | `RecentExecution[]` |

```ts
type AgentStatus = 'running' | 'idle' | 'degraded' | 'failed'
interface Agent {
  id: string; name: string; description: string; model: string; status: AgentStatus
  requestsHandled: number; successRate: number; avgLatencyMs: number; tokensUsed: number
  lastExecutionAt: string
}
type SystemHealthStatus = 'healthy' | 'degraded' | 'down'
interface SystemHealthItem { id: string; name: string; status: SystemHealthStatus; detail?: string }
interface AgentSuccessRatePoint { date: string; successRate: number }
interface RecentExecution {
  id: string; requestId: string; agent: string; status: 'completed' | 'failed' | 'running'
  durationMs: number; timestamp: string; error?: string
}
interface ControlTowerMetrics {
  activeAgents: number; totalRequests: number; successRate: number; avgLatencyMs: number
  p95LatencyMs: number; tokensUsed: number; estimatedCostUsd: number
  guardrailBlocks: number; humanEscalations: number
}
```
Note: the mock derives `guardrailBlocks`/`humanEscalations`/`totalRequests` directly from the same request data `/api/requests` serves, not a separate count — a real backend should keep these consistent for the same reason (Main App's dashboard and Control Tower's Overview show the same total-requests number today, which is a deliberate cross-page consistency check, not a coincidence).

## Agent Trace — `trace-service.ts` (real implementation exists)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/ai/executions/{id}` | `AgentTrace` — REST snapshot of a (possibly already-finished) execution |
| GET | `/api/ai/executions/{id}/stream` | SSE — live version of the same data |

```ts
interface TraceEventBase { executionId: string; timestamp: string }
type TraceEvent =
  | (TraceEventBase & { type: 'agent.started'; agent: string; inputSummary: string })
  | (TraceEventBase & { type: 'agent.completed'; agent: string; durationMs: number; tokens: number; outputSummary: string })
  | (TraceEventBase & { type: 'agent.failed'; agent: string; durationMs: number; error: string })
  | (TraceEventBase & { type: 'guardrail.blocked'; rule: string; severity: 'low' | 'medium' | 'high' | 'critical' })
  | (TraceEventBase & { type: 'guardrail.passed' })
  | (TraceEventBase & { type: 'human.approval.required'; approvalId: string })
  | (TraceEventBase & { type: 'workflow.completed' })

interface AgentTrace { executionId: string; requestId: string; events: TraceEvent[]; steps: TraceStep[] }
// steps = TraceEvent[] folded via foldTraceEvents() (packages/api-client/src/trace-service.ts) —
// a real backend can send events only; the frontend derives `steps` itself either way.
```
SSE: one JSON-encoded `TraceEvent` per `message`, `done` event when the execution finishes (no more events coming). `packages/api-client/src/lib/event-stream.ts`'s `createSSESource()` already implements this consumer contract — a real backend just needs to match it.

## Guardrails — `guardrails-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/guardrails/rules` | `GuardrailRule[]` |
| GET | `/api/guardrails/events` | `GuardrailEvent[]` |
| GET | `/api/guardrails/summary` | `GuardrailSummary` |

```ts
type GuardrailCategory = 'pii' | 'prompt_injection' | 'jailbreak' | 'toxicity' | 'data_leakage' | 'policy'
type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical'
interface GuardrailRule {
  id: string; name: string; category: GuardrailCategory; description: string; severity: GuardrailSeverity
  enabled: boolean; blockCount: number; passCount: number
}
interface GuardrailEvent {
  id: string; ruleId: string; ruleName: string; severity: GuardrailSeverity; action: 'blocked' | 'flagged'
  agent: string; executionId: string; requestId: string; timestamp: string
}
interface GuardrailSummary {
  totalRules: number; activeRules: number; blocksLast24h: number; blockRate: number
  topRule: { name: string; blockCount: number } | null
}
```

## RAG Monitoring — `rag-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/rag/documents` | `RagDocument[]` |
| GET | `/api/rag/queries` | `RagQuery[]` |
| GET | `/api/rag/summary` | `RagSummary` |
| GET | `/api/rag/relevance-trend` | `RagRelevancePoint[]` (14-day) |

```ts
interface RagDocument {
  id: string; title: string; category: string; chunkCount: number; lastIndexedAt: string
  retrievalCount: number; avgRelevance: number
}
interface RagQuery {
  id: string; executionId: string; requestId: string; agent: string; query: string
  documentsRetrieved: number; avgRelevance: number; latencyMs: number; timestamp: string
}
interface RagRelevancePoint { date: string; avgRelevance: number }
interface RagSummary { totalDocuments: number; totalChunks: number; queriesLast24h: number; avgRetrievalLatencyMs: number; avgRelevanceScore: number }
```

## LLM Usage — `llm-usage-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/llm/usage` | `ModelUsage[]` |
| GET | `/api/llm/usage/summary` | `LlmUsageSummary` |
| GET | `/api/llm/usage/trend` | `LlmUsagePoint[]` (14-day) |

```ts
type LlmModelCategory = 'chat' | 'embedding'
interface ModelUsage {
  model: string; category: LlmModelCategory; agents: string[]; requests: number
  tokens: number; estimatedCostUsd: number; avgLatencyMs: number
}
interface LlmUsageSummary { totalTokens: number; totalCostUsd: number; totalRequests: number; avgCostPerRequest: number }
interface LlmUsagePoint { date: string; tokens: number; costUsd: number }
```

## Latency — `latency-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/latency/by-agent` | `AgentLatencyBreakdown[]` |
| GET | `/api/latency/summary` | `LatencySummary` |
| GET | `/api/latency/trend` | `LatencyTrendPoint[]` (14-day) |
| GET | `/api/latency/slow-executions` | `SlowExecution[]` |

```ts
interface AgentLatencyBreakdown { agent: string; avgLatencyMs: number; p50LatencyMs: number; p95LatencyMs: number; p99LatencyMs: number }
interface LatencyTrendPoint { date: string; avgLatencyMs: number; p95LatencyMs: number }
interface SlowExecution { id: string; executionId: string; requestId: string; agent: string; durationMs: number; timestamp: string }
interface LatencySummary { avgLatencyMs: number; p50LatencyMs: number; p95LatencyMs: number; p99LatencyMs: number }
```

## System Health — `system-health-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/system/health/components` | `SystemComponentMetric[]` — enriched version of `/api/system/health` above (same components, plus uptime/response time) |
| GET | `/api/system/incidents` | `SystemIncident[]` |

```ts
interface SystemComponentMetric { id: string; name: string; status: SystemHealthStatus; detail?: string; uptimePercent: number; avgResponseMs: number }
interface SystemIncident {
  id: string; component: string; status: 'investigating' | 'monitoring' | 'resolved'
  summary: string; startedAt: string; resolvedAt?: string
}
```

## Audit Logs — `audit-log-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/audit/log` | `AuditLogEntry[]` |
| GET | `/api/audit/log/category-counts` | `Record<AuditCategory, number>` |

```ts
type AuditCategory = 'execution' | 'guardrail' | 'approval' | 'access' | 'system'
interface AuditActor { type: 'user' | 'agent' | 'system'; name: string }
interface AuditLogEntry {
  id: string; category: AuditCategory; action: string; actor: AuditActor; detail: string
  timestamp: string; executionId?: string; requestId?: string
}
```
This is the one endpoint set gated by `AUDIT_VIEW` at the route level (see `docs/rbac.md`) — the backend should treat it the same way: audit log access is meaningfully more sensitive than the other Control Tower read endpoints.

## Explainability — `explainability-service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/api/explainability/summary` | `ExplainabilitySummary` |
| GET | `/api/explainability/confidence-bands` | `ConfidenceBand[]` |
| GET | `/api/explainability/decision-factors` | `DecisionFactor[]` |
| GET | `/api/explainability/low-confidence` | `LowConfidenceDecision[]` |

```ts
type ExplainabilityDecision = 'approve' | 'reject' | 'escalate' | 'review'
interface DecisionFactor { name: string; description: string; weightPercent: number }
interface ConfidenceBand { band: 'high' | 'medium' | 'low'; label: string; count: number }
interface ExplainabilitySummary {
  avgConfidence: number; decisionCounts: Record<ExplainabilityDecision, number>
  lowConfidenceCount: number; humanReviewRate: number
}
interface LowConfidenceDecision {
  requestId: string; title: string; decision: ExplainabilityDecision
  confidence: number; risk: 'low' | 'medium' | 'high' | 'critical'; summary: string
}
```
**`decisionFactors` is the one response on this page that isn't derived from request data** — the mock ships a static, hand-written list because there's no real feature-attribution/SHAP-style data to compute it from. A real backend computing genuine per-decision factor weights (not just a fixed aggregate list) would be a real upgrade over what the frontend currently expects, not a requirement to match it.
