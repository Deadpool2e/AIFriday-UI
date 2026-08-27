import type {
  SystemComponentMetric,
  SystemHealthStatus,
  SystemIncident,
} from '@platform/types'

import { MOCK_SYSTEM_HEALTH } from './control-tower-service'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Deterministic uptime/response-time bands per status, applied to the
// exact same components Overview's <SystemHealth> card reads — this page
// enriches that list rather than maintaining a second one.
const STATUS_UPTIME: Record<SystemHealthStatus, number> = {
  healthy: 99.98,
  degraded: 98.4,
  down: 91.2,
}
const STATUS_RESPONSE_MS: Record<SystemHealthStatus, number> = {
  healthy: 45,
  degraded: 320,
  down: 0,
}

function buildComponentMetrics(): SystemComponentMetric[] {
  return MOCK_SYSTEM_HEALTH.map((item, index) => ({
    id: item.id,
    name: item.name,
    status: item.status,
    detail: item.detail,
    uptimePercent: STATUS_UPTIME[item.status] - (index % 3) * 0.03,
    avgResponseMs: STATUS_RESPONSE_MS[item.status] + (index % 3) * 4,
  }))
}

const MOCK_INCIDENTS: SystemIncident[] = [
  {
    id: 'INC-118',
    component: 'Vector Database',
    status: 'monitoring',
    summary:
      'Elevated query latency (p95 > 800ms) traced to a re-indexing job. Job throttled, latency recovering.',
    startedAt: '2026-08-20T13:15:00Z',
  },
  {
    id: 'INC-117',
    component: 'LLM Gateway',
    status: 'resolved',
    summary:
      'Brief rate-limit errors from the upstream model provider during a traffic spike.',
    startedAt: '2026-08-18T09:40:00Z',
    resolvedAt: '2026-08-18T10:05:00Z',
  },
  {
    id: 'INC-116',
    component: 'Agent Orchestrator',
    status: 'resolved',
    summary:
      'Deployment rollout briefly increased orchestration latency for in-flight requests.',
    startedAt: '2026-08-15T22:10:00Z',
    resolvedAt: '2026-08-15T22:24:00Z',
  },
]

let demoIncidentCounter = 0

// Phase 20 (Demo Mode): mutates the same MOCK_INCIDENTS array this
// service already reads, AND flips a component's status in the exact
// MOCK_SYSTEM_HEALTH array Overview's compact <SystemHealth> card reads
// (imported from control-tower-service.ts) — one click degrades a real
// component live, visible on both this page and Overview simultaneously.
export function triggerDemoIncident(): SystemIncident {
  demoIncidentCounter += 1
  const healthyIndex = MOCK_SYSTEM_HEALTH.findIndex(
    (c) => c.status === 'healthy',
  )
  const targetIndex = healthyIndex === -1 ? 0 : healthyIndex
  const target = MOCK_SYSTEM_HEALTH[targetIndex]
  const detail =
    'Elevated error rate detected. Investigating — triggered from the Demo Panel.'

  MOCK_SYSTEM_HEALTH[targetIndex] = { ...target, status: 'degraded', detail }

  const incident: SystemIncident = {
    id: `INC-DEMO-${demoIncidentCounter}`,
    component: target.name,
    status: 'investigating',
    summary: detail,
    startedAt: new Date().toISOString(),
  }

  MOCK_INCIDENTS.unshift(incident)
  return incident
}

export interface SystemHealthService {
  getComponentMetrics(): Promise<SystemComponentMetric[]>
  getIncidents(): Promise<SystemIncident[]>
}

// Swap for a real implementation calling GET /api/system/health and
// GET /api/system/incidents later (Phase 21). Every consumer reaches this
// only through the hooks in hooks/use-system-health-detail.ts.
export const mockSystemHealthService: SystemHealthService = {
  async getComponentMetrics() {
    await delay(300)
    return buildComponentMetrics()
  },
  async getIncidents() {
    await delay(250)
    return MOCK_INCIDENTS
  },
}
