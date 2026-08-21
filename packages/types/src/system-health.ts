import type { SystemHealthStatus } from './agent'

// Extends the same component identity/status SystemHealthItem already
// carries with the extra detail a dedicated System Health page needs but
// the compact Overview card doesn't (uptime, response time). Deliberately
// not folded into SystemHealthItem itself — that type stays lean because
// packages/ui's <SystemHealth> component (which renders it structurally,
// not by importing this package) only ever needs id/name/status/detail.
export interface SystemComponentMetric {
  id: string
  name: string
  status: SystemHealthStatus
  detail?: string
  uptimePercent: number
  avgResponseMs: number
}

export interface SystemIncident {
  id: string
  component: string
  status: 'investigating' | 'monitoring' | 'resolved'
  summary: string
  startedAt: string
  resolvedAt?: string
}
