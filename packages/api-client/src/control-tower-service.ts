import type {
  Agent,
  AgentSuccessRatePoint,
  ControlTowerMetrics,
  ControlTowerTrendPoint,
  RecentExecution,
  SystemHealthItem,
} from '@platform/types'

import { MOCK_REQUESTS } from './mock-data'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Same model-gateway naming convention as the org's real LLM proxy
// (azure/genailab-maas-*) — realistic, not "gpt-4" or a made-up name.
// Exported so llm-usage-service.ts can derive per-model token/cost
// breakdowns from the exact same agents, the same way
// computeControlTowerMetrics() below derives its own totals — one
// underlying store, not two coincidentally matching mocks.
export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-orchestrator',
    name: 'Orchestrator',
    description:
      'Routes each request through the multi-agent pipeline and aggregates results.',
    model: 'azure/genailab-maas-gpt-4o-mini',
    status: 'running',
    requestsHandled: 47,
    successRate: 98,
    avgLatencyMs: 145,
    tokensUsed: 12_400,
    lastExecutionAt: '2026-08-20T13:42:00Z',
  },
  {
    id: 'agent-rag',
    name: 'RAG Agent',
    description:
      'Retrieves relevant policy and compliance documents for each request.',
    model: 'azure/genailab-maas-text-embedding-3-large',
    status: 'idle',
    requestsHandled: 41,
    successRate: 95,
    avgLatencyMs: 320,
    tokensUsed: 28_900,
    lastExecutionAt: '2026-08-20T13:38:00Z',
  },
  {
    id: 'agent-risk',
    name: 'Risk Agent',
    description: 'Scores each request for financial and operational risk.',
    model: 'azure/genailab-maas-gpt-4o-mini',
    status: 'running',
    requestsHandled: 47,
    successRate: 92,
    avgLatencyMs: 890,
    tokensUsed: 54_200,
    lastExecutionAt: '2026-08-20T13:43:00Z',
  },
  {
    id: 'agent-compliance',
    name: 'Compliance Agent',
    description:
      'Checks each request against policy documents and regulatory rules.',
    model: 'azure/genailab-maas-gpt-4o-mini',
    status: 'degraded',
    requestsHandled: 47,
    successRate: 87,
    avgLatencyMs: 780,
    tokensUsed: 49_800,
    lastExecutionAt: '2026-08-20T13:41:00Z',
  },
  {
    id: 'agent-decision',
    name: 'Decision Agent',
    description:
      'Generates the final recommendation from all upstream agent output.',
    model: 'azure/genailab-maas-gpt-4o',
    status: 'idle',
    requestsHandled: 47,
    successRate: 96,
    avgLatencyMs: 410,
    tokensUsed: 31_200,
    lastExecutionAt: '2026-08-20T13:39:00Z',
  },
]

// Exported so system-health-service.ts can enrich the exact same
// components with uptime/response-time data, the same way
// llm-usage-service.ts and latency-service.ts derive from MOCK_AGENTS
// instead of inventing a parallel component list.
export const MOCK_SYSTEM_HEALTH: SystemHealthItem[] = [
  { id: 'backend', name: 'Backend (FastAPI)', status: 'healthy' },
  { id: 'llm', name: 'LLM Gateway', status: 'healthy' },
  {
    id: 'vector-db',
    name: 'Vector Database',
    status: 'degraded',
    detail: 'Elevated query latency (p95 > 800ms) over the last 15 minutes.',
  },
  { id: 'orchestrator', name: 'Agent Orchestrator', status: 'healthy' },
  { id: 'guardrails', name: 'Guardrails Service', status: 'healthy' },
]

const MOCK_RECENT_EXECUTIONS: RecentExecution[] = [
  {
    id: 'EXEC-4102',
    requestId: 'REQ-92831',
    agent: 'Decision Agent',
    status: 'completed',
    durationMs: 410,
    timestamp: '8 min ago',
  },
  {
    id: 'EXEC-4101',
    requestId: 'REQ-92809',
    agent: 'Compliance Agent',
    status: 'failed',
    durationMs: 780,
    timestamp: '22 min ago',
  },
  {
    id: 'EXEC-4100',
    requestId: 'REQ-92844',
    agent: 'RAG Agent',
    status: 'completed',
    durationMs: 320,
    timestamp: '31 min ago',
  },
  {
    id: 'EXEC-4099',
    requestId: 'REQ-92822',
    agent: 'Risk Agent',
    status: 'completed',
    durationMs: 890,
    timestamp: '1 hour ago',
  },
  {
    id: 'EXEC-4098',
    requestId: 'REQ-92815',
    agent: 'Orchestrator',
    status: 'running',
    durationMs: 145,
    timestamp: '2 hours ago',
  },
]

const ERROR_MESSAGES = [
  'LLM request timed out after 30s',
  'Rate limit exceeded on model gateway',
  'Guardrail check flagged ambiguous policy match',
  'Failed to parse structured output from model response',
  'Vector database query timed out',
]

// Failure frequency is derived from the agent's own successRate — a
// degraded agent (Compliance, 87%) shows real failures in its history;
// Orchestrator (98%) shows almost none. Deterministic, not random, so a
// demo re-run always looks the same.
function generateAgentExecutions(
  agent: Agent,
  count: number,
): RecentExecution[] {
  const failureRate = Math.max(0, 100 - agent.successRate)
  const executions: RecentExecution[] = []
  for (let i = 0; i < count; i++) {
    const shouldFail = ((i + 1) * 37) % 100 < failureRate
    const requestIndex = 92800 + ((i * 7) % 47)
    const isLatest = i === 0
    executions.push({
      id: `EXEC-${agent.id}-${i}`,
      requestId: `REQ-${requestIndex}`,
      agent: agent.name,
      status: shouldFail
        ? 'failed'
        : isLatest && agent.status === 'running'
          ? 'running'
          : 'completed',
      durationMs: Math.max(50, agent.avgLatencyMs + (((i * 53) % 200) - 100)),
      timestamp: i === 0 ? 'Just now' : `${i * 12} min ago`,
      error: shouldFail ? ERROR_MESSAGES[i % ERROR_MESSAGES.length] : undefined,
    })
  }
  return executions
}

function generateAgentTrend(
  agent: Agent,
  days: number,
): AgentSuccessRatePoint[] {
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: AgentSuccessRatePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    const wobble = ((i * 5) % 7) - 3
    points.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      successRate: Math.min(100, Math.max(50, agent.successRate + wobble)),
    })
  }
  return points
}

function generateSuccessRateTrend(days: number): AgentSuccessRatePoint[] {
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: AgentSuccessRatePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    points.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      successRate: 88 + ((i * 3) % 10),
    })
  }
  return points
}

// Platform-wide operational history, anchored to today's real numbers.
//
// The final point of every series is exactly what computeControlTowerMetrics
// reports right now, and earlier days wobble around it deterministically —
// so the Control Tower's charts and its KPI strip can never disagree, and
// a demo trigger that moves a metric moves the end of its chart with it.
// Same approach as generateAgentPerformanceTrend above, one level up.
function generateMetricsTrend(days: number): ControlTowerTrendPoint[] {
  const current = computeControlTowerMetrics()
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: ControlTowerTrendPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    // i === 0 is today: no wobble, the real value.
    const swing = i === 0 ? 0 : ((i * 37) % 21) - 10

    points.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      // Clamped to a plausible band rather than allowed to run past 100%
      // or below zero, which a raw percentage wobble would do.
      successRate: Math.min(100, Math.max(60, current.successRate + Math.round(swing * 0.6))),
      avgLatencyMs: Math.max(50, current.avgLatencyMs + swing * 8),
      tokensUsed: Math.max(0, Math.round(current.tokensUsed * (1 + swing / 100))),
      guardrailBlocks: Math.max(0, current.guardrailBlocks + Math.round(swing / 4)),
    })
  }

  return points
}

// Derived from the SAME MOCK_REQUESTS store Main App reads (shared
// singleton across the federation boundary — see Phase 9) rather than
// invented separately. This is what makes "47 total requests" on Main
// App's dashboard and Control Tower's KPI row the same number: they
// really are reading one underlying store, not two coincidentally
// matching mocks.
function computeControlTowerMetrics(): ControlTowerMetrics {
  const totalTokens = MOCK_AGENTS.reduce((sum, a) => sum + a.tokensUsed, 0)
  const avgSuccessRate =
    MOCK_AGENTS.reduce((sum, a) => sum + a.successRate, 0) / MOCK_AGENTS.length
  const guardrailBlocks = MOCK_REQUESTS.reduce(
    (count, r) =>
      count + r.guardrailChecks.filter((g) => g.status === 'blocked').length,
    0,
  )
  const humanEscalations = MOCK_REQUESTS.filter(
    (r) => r.status === 'escalated',
  ).length

  return {
    activeAgents: MOCK_AGENTS.filter((a) => a.status === 'running').length,
    totalRequests: MOCK_REQUESTS.length,
    successRate: Math.round(avgSuccessRate),
    avgLatencyMs: Math.round(
      MOCK_AGENTS.reduce((sum, a) => sum + a.avgLatencyMs, 0) /
        MOCK_AGENTS.length,
    ),
    p95LatencyMs: Math.round(
      Math.max(...MOCK_AGENTS.map((a) => a.avgLatencyMs)) * 1.15,
    ),
    tokensUsed: totalTokens,
    estimatedCostUsd: Math.round(totalTokens * 0.000_002 * 100) / 100,
    guardrailBlocks,
    humanEscalations,
  }
}

export interface ControlTowerService {
  getMetrics(): Promise<ControlTowerMetrics>
  getAgents(): Promise<Agent[]>
  getAgentById(id: string): Promise<Agent | null>
  getAgentExecutions(agentId: string): Promise<RecentExecution[]>
  getAgentPerformanceTrend(agentId: string): Promise<AgentSuccessRatePoint[]>
  getSystemHealth(): Promise<SystemHealthItem[]>
  getAgentSuccessRateTrend(): Promise<AgentSuccessRatePoint[]>
  getMetricsTrend(): Promise<ControlTowerTrendPoint[]>
  getRecentExecutions(): Promise<RecentExecution[]>
}

// Swap for a real implementation calling GET /api/metrics, GET /api/agents,
// etc. later (Phase 21). Every consumer calls this interface only through
// the useControlTower*() hooks below.
export const mockControlTowerService: ControlTowerService = {
  async getMetrics() {
    await delay(300)
    return computeControlTowerMetrics()
  },
  async getAgents() {
    await delay(300)
    return MOCK_AGENTS
  },
  async getAgentById(id) {
    await delay(250)
    return MOCK_AGENTS.find((a) => a.id === id) ?? null
  },
  async getAgentExecutions(agentId) {
    await delay(300)
    const agent = MOCK_AGENTS.find((a) => a.id === agentId)
    if (!agent) return []
    return generateAgentExecutions(agent, 8)
  },
  async getAgentPerformanceTrend(agentId) {
    await delay(300)
    const agent = MOCK_AGENTS.find((a) => a.id === agentId)
    if (!agent) return []
    return generateAgentTrend(agent, 14)
  },
  async getSystemHealth() {
    await delay(250)
    return MOCK_SYSTEM_HEALTH
  },
  async getAgentSuccessRateTrend() {
    await delay(300)
    return generateSuccessRateTrend(14)
  },
  async getMetricsTrend() {
    await delay(300)
    return generateMetricsTrend(14)
  },
  async getRecentExecutions() {
    await delay(250)
    return MOCK_RECENT_EXECUTIONS
  },
}
