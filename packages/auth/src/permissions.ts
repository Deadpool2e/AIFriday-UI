export const PERMISSIONS = [
  'REQUEST_VIEW',
  'REQUEST_CREATE',
  'REQUEST_APPROVE',
  'DOCUMENT_VIEW',
  'AI_TRACE_VIEW',
  'GUARDRAIL_VIEW',
  'AUDIT_VIEW',
  'AGENT_VIEW',
  'SYSTEM_SETTINGS',
  'VIZORION_ASSISTANT',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type Role = 'analyst' | 'manager' | 'admin'

// This map is the frontend's source of truth for *visibility* only — it
// decides what the UI shows or hides. It is not, and must never be
// treated as, the authorization boundary: the real backend re-checks
// every one of these permissions server-side on every request regardless
// of what this map says. See docs/rbac.md (written in Phase 22) for the
// full contract.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  analyst: [
    'REQUEST_VIEW',
    'REQUEST_CREATE',
    'DOCUMENT_VIEW',
    'VIZORION_ASSISTANT',
  ],
  manager: [
    'REQUEST_VIEW',
    'REQUEST_CREATE',
    'REQUEST_APPROVE',
    'DOCUMENT_VIEW',
    'AI_TRACE_VIEW',
    'VIZORION_ASSISTANT',
  ],
  admin: [...PERMISSIONS],
}
