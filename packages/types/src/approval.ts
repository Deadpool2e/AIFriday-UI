export type ApprovalAction = 'approve' | 'reject' | 'send_back' | 'request_info'

export interface ApprovalActionRecord {
  action: ApprovalAction
  comment?: string
  actedAt: string
  actedBy: string
}

// Deliberately minimal — just enough for the approval screen to show
// "did this pass guardrails." Phase 14 introduces the full GuardrailEvent
// model (categories, severity, rule detail, trace links) as its own
// dedicated feature; this is not that, and isn't meant to become that.
export interface GuardrailCheckSummary {
  id: string
  rule: string
  status: 'passed' | 'flagged' | 'blocked'
  detail?: string
}
