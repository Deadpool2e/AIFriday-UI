export type AuditCategory =
  'execution' | 'guardrail' | 'approval' | 'access' | 'system'

export interface AuditActor {
  type: 'user' | 'agent' | 'system'
  name: string
}

export interface AuditLogEntry {
  id: string
  category: AuditCategory
  action: string
  actor: AuditActor
  detail: string
  timestamp: string
  executionId?: string
  requestId?: string
}
