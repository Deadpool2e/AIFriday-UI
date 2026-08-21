import type { AuditCategory, AuditLogEntry } from '@platform/types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Spans every category on purpose, reusing the exact same request/execution
// IDs, rule names, and persona names (Priya Nair / Marcus Webb / Elena
// Torres — the same three demo users from @platform/auth's DEMO_USERS,
// duplicated as plain strings here rather than imported, since api-client
// has no dependency on the auth package) that show up everywhere else in
// Control Tower — an audit log is only convincing if it's clearly the same
// system's history, not a disconnected list.
const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'AUDIT-1024',
    category: 'approval',
    action: 'Approved request',
    actor: { type: 'user', name: 'Marcus Webb' },
    detail: 'Approved REQ-92809 after reviewing the Compliance Agent flag.',
    requestId: 'REQ-92809',
    timestamp: '18 min ago',
  },
  {
    id: 'AUDIT-1023',
    category: 'guardrail',
    action: 'Blocked response',
    actor: { type: 'agent', name: 'Guardrails' },
    detail: 'PII Exposure Check blocked Decision Agent output for REQ-92809.',
    executionId: 'EXEC-4101',
    requestId: 'REQ-92809',
    timestamp: '21 min ago',
  },
  {
    id: 'AUDIT-1022',
    category: 'execution',
    action: 'Execution completed',
    actor: { type: 'agent', name: 'Decision Agent' },
    detail: 'Generated a recommendation for REQ-92831 with 87% confidence.',
    executionId: 'EXEC-4102',
    requestId: 'REQ-92831',
    timestamp: '26 min ago',
  },
  {
    id: 'AUDIT-1021',
    category: 'access',
    action: 'Viewed Guardrails',
    actor: { type: 'user', name: 'Elena Torres' },
    detail: 'Opened the Guardrails page in AI Control Tower.',
    timestamp: '34 min ago',
  },
  {
    id: 'AUDIT-1020',
    category: 'system',
    action: 'Incident opened',
    actor: { type: 'system', name: 'Monitoring' },
    detail: 'Vector Database query latency exceeded threshold (p95 > 800ms). Incident INC-118 opened.',
    timestamp: '45 min ago',
  },
  {
    id: 'AUDIT-1019',
    category: 'approval',
    action: 'Requested more information',
    actor: { type: 'user', name: 'Marcus Webb' },
    detail: 'Sent REQ-92844 back for additional documentation before deciding.',
    requestId: 'REQ-92844',
    timestamp: '52 min ago',
  },
  {
    id: 'AUDIT-1018',
    category: 'guardrail',
    action: 'Blocked response',
    actor: { type: 'agent', name: 'Guardrails' },
    detail: 'Prompt Injection Filter blocked retrieved content for REQ-92844.',
    executionId: 'EXEC-4100',
    requestId: 'REQ-92844',
    timestamp: '1 hour ago',
  },
  {
    id: 'AUDIT-1017',
    category: 'execution',
    action: 'Execution completed',
    actor: { type: 'agent', name: 'Risk Agent' },
    detail: 'Scored REQ-92822 at 62/100 composite risk (Medium).',
    executionId: 'EXEC-4099',
    requestId: 'REQ-92822',
    timestamp: '1 hour ago',
  },
  {
    id: 'AUDIT-1016',
    category: 'access',
    action: 'Signed in',
    actor: { type: 'user', name: 'Priya Nair' },
    detail: 'Signed in as Analyst.',
    timestamp: '2 hours ago',
  },
  {
    id: 'AUDIT-1015',
    category: 'system',
    action: 'Incident resolved',
    actor: { type: 'system', name: 'Monitoring' },
    detail: 'LLM Gateway rate-limit errors resolved after upstream traffic normalized. Incident INC-117 closed.',
    timestamp: '2 days ago',
  },
  {
    id: 'AUDIT-1014',
    category: 'approval',
    action: 'Rejected request',
    actor: { type: 'user', name: 'Marcus Webb' },
    detail: 'Rejected REQ-92780 — did not meet policy thresholds even after review.',
    requestId: 'REQ-92780',
    timestamp: '3 days ago',
  },
  {
    id: 'AUDIT-1013',
    category: 'access',
    action: 'Permission denied',
    actor: { type: 'user', name: 'Priya Nair' },
    detail: 'Attempted to open the Guardrails page without GUARDRAIL_VIEW permission.',
    timestamp: '3 days ago',
  },
]

function computeCategoryCounts(entries: AuditLogEntry[]): Record<AuditCategory, number> {
  return {
    execution: entries.filter((e) => e.category === 'execution').length,
    guardrail: entries.filter((e) => e.category === 'guardrail').length,
    approval: entries.filter((e) => e.category === 'approval').length,
    access: entries.filter((e) => e.category === 'access').length,
    system: entries.filter((e) => e.category === 'system').length,
  }
}

export interface AuditLogService {
  getEntries(): Promise<AuditLogEntry[]>
  getCategoryCounts(): Promise<Record<AuditCategory, number>>
}

// Swap for a real implementation calling GET /api/audit/log later
// (Phase 21). Every consumer reaches this only through the hooks in
// hooks/use-audit-log.ts.
export const mockAuditLogService: AuditLogService = {
  async getEntries() {
    await delay(300)
    return MOCK_AUDIT_LOG
  },
  async getCategoryCounts() {
    await delay(250)
    return computeCategoryCounts(MOCK_AUDIT_LOG)
  },
}
