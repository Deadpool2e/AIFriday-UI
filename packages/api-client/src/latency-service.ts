import type {
  AgentLatencyBreakdown,
  LatencySummary,
  LatencyTrendPoint,
  SlowExecution,
} from '@platform/types'

import { MOCK_AGENTS } from './control-tower-service'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Percentiles synthesized as fixed multipliers of each agent's average —
// deterministic, not random, so the numbers stay stable across reloads.
// Derived from the same MOCK_AGENTS the Agents page and LLM Usage read.
function buildAgentBreakdown(): AgentLatencyBreakdown[] {
  return MOCK_AGENTS.map((agent) => ({
    agent: agent.name,
    avgLatencyMs: agent.avgLatencyMs,
    p50LatencyMs: Math.round(agent.avgLatencyMs * 0.82),
    p95LatencyMs: Math.round(agent.avgLatencyMs * 1.55),
    p99LatencyMs: Math.round(agent.avgLatencyMs * 1.95),
  }))
}

function computeSummary(breakdown: AgentLatencyBreakdown[]): LatencySummary {
  const totalRequests = MOCK_AGENTS.reduce(
    (sum, a) => sum + a.requestsHandled,
    0,
  )
  const weighted = (pick: (b: AgentLatencyBreakdown) => number) =>
    Math.round(
      breakdown.reduce(
        (sum, b, i) => sum + pick(b) * MOCK_AGENTS[i].requestsHandled,
        0,
      ) / totalRequests,
    )

  return {
    avgLatencyMs: weighted((b) => b.avgLatencyMs),
    p50LatencyMs: weighted((b) => b.p50LatencyMs),
    p95LatencyMs: weighted((b) => b.p95LatencyMs),
    p99LatencyMs: weighted((b) => b.p99LatencyMs),
  }
}

function generateLatencyTrend(
  days: number,
  summary: LatencySummary,
): LatencyTrendPoint[] {
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: LatencyTrendPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    const wobble = 1 + (((i * 6) % 13) - 6) / 100
    points.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      avgLatencyMs: Math.round(summary.avgLatencyMs * wobble),
      p95LatencyMs: Math.round(summary.p95LatencyMs * wobble),
    })
  }
  return points
}

const MOCK_SLOW_EXECUTIONS: SlowExecution[] = [
  {
    id: 'SLOW-1',
    executionId: 'EXEC-4099',
    requestId: 'REQ-92822',
    agent: 'Risk Agent',
    durationMs: 1840,
    timestamp: '1 hour ago',
  },
  {
    id: 'SLOW-2',
    executionId: 'EXEC-4101',
    requestId: 'REQ-92809',
    agent: 'Compliance Agent',
    durationMs: 1520,
    timestamp: '22 min ago',
  },
  {
    id: 'SLOW-3',
    executionId: 'EXEC-4100',
    requestId: 'REQ-92844',
    agent: 'RAG Agent',
    durationMs: 980,
    timestamp: '31 min ago',
  },
  {
    id: 'SLOW-4',
    executionId: 'EXEC-4098',
    requestId: 'REQ-92815',
    agent: 'Decision Agent',
    durationMs: 890,
    timestamp: '2 hours ago',
  },
  {
    id: 'SLOW-5',
    executionId: 'EXEC-4096',
    requestId: 'REQ-92780',
    agent: 'Orchestrator',
    durationMs: 610,
    timestamp: '5 hours ago',
  },
]

export interface LatencyService {
  getAgentBreakdown(): Promise<AgentLatencyBreakdown[]>
  getSummary(): Promise<LatencySummary>
  getTrend(): Promise<LatencyTrendPoint[]>
  getSlowExecutions(): Promise<SlowExecution[]>
}

// Swap for a real implementation calling GET /api/latency later
// (Phase 21). Every consumer reaches this only through the hooks in
// hooks/use-latency.ts.
export const mockLatencyService: LatencyService = {
  async getAgentBreakdown() {
    await delay(300)
    return buildAgentBreakdown()
  },
  async getSummary() {
    await delay(250)
    return computeSummary(buildAgentBreakdown())
  },
  async getTrend() {
    await delay(300)
    return generateLatencyTrend(14, computeSummary(buildAgentBreakdown()))
  },
  async getSlowExecutions() {
    await delay(250)
    return [...MOCK_SLOW_EXECUTIONS].sort((a, b) => b.durationMs - a.durationMs)
  },
}
