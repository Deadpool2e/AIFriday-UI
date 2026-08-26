export interface VizorionAuditEntry {
  id: string
  timestamp: string
  action: string
  details?: Record<string, unknown>
}

// Vizorion doesn't currently have a formal audit service on the frontend
// side, but the backend exposes GET /v1/audit for retrieving the caller's
// own audit-log feed. This is a "nice to have" read-only view not yet
// integrated, since the reference UI includes it but it's not critical.
export async function fetchAuditLog(): Promise<VizorionAuditEntry[]> {
  return []
}
