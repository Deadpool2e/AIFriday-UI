// Shared frontend contract for a business "Request" — the generic unit of
// work this platform routes through AI review (Section 44: keep this
// domain-agnostic; a real hackathon problem statement plugs in as a
// business module on top, it does not redefine this shape).
//
// Field names here are deliberately chosen to map cleanly onto a future
// FastAPI/Pydantic model of the same name (see docs/api-contracts.md,
// written in Phase 22) — camelCase on the wire AND here (apiFetch does no
// case conversion, so the backend exposes camelCase JSON directly, e.g.
// via Pydantic's alias_generator=to_camel if the model's own fields are
// snake_case internally), otherwise a 1:1 field correspondence.

import type { ApprovalActionRecord, GuardrailCheckSummary } from './approval'

export type RequestStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'blocked'
  | 'escalated'
  | 'degraded'
  | 'failed'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ApprovalState = 'not_required' | 'pending' | 'approved' | 'rejected'

export interface RequestDocument {
  id: string
  name: string
  type: string
  sizeLabel: string
}

export interface AgentExecutionSummary {
  agent: string
  status: 'completed' | 'running' | 'failed' | 'skipped'
  durationMs: number
}

export interface AIRecommendation {
  decision: 'approve' | 'reject' | 'escalate' | 'review'
  confidence: number // 0-100
  risk: RiskLevel
  summary: string
}

export interface TimelineEvent {
  id: string
  label: string
  timestamp: string
  status: 'completed' | 'current' | 'upcoming'
}

export interface Request {
  id: string
  title: string
  status: RequestStatus
  priority: RequestPriority
  risk: RiskLevel
  owner: string
  createdAt: string
  updatedAt: string
  aiProcessed: boolean
  humanReviewRequired: boolean
  approvalState: ApprovalState
  aiRecommendation?: AIRecommendation
  agentExecutions: AgentExecutionSummary[]
  documents: RequestDocument[]
  timeline: TimelineEvent[]
  guardrailChecks: GuardrailCheckSummary[]
  lastApprovalAction?: ApprovalActionRecord
}
