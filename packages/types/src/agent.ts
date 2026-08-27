// Control Tower's domain — deliberately separate from Request's
// agentExecutions (a per-request summary of which agents touched THAT
// request). This is the standalone Agent registry: one row per agent,
// independent of any single request, which is what Agent Monitoring
// (Phase 11) and this Overview page both read from.

export type AgentStatus = 'running' | 'idle' | 'degraded' | 'failed'

export interface Agent {
  id: string
  name: string
  description: string
  model: string
  status: AgentStatus
  requestsHandled: number
  successRate: number // 0-100
  avgLatencyMs: number
  tokensUsed: number
  lastExecutionAt: string
}

export type SystemHealthStatus = 'healthy' | 'degraded' | 'down'

export interface SystemHealthItem {
  id: string
  name: string
  status: SystemHealthStatus
  detail?: string
}

export interface AgentSuccessRatePoint {
  date: string
  successRate: number
}

export interface RecentExecution {
  id: string
  requestId: string
  agent: string
  status: 'completed' | 'failed' | 'running'
  durationMs: number
  timestamp: string
  error?: string
}

// A day of platform-wide operational history. Every series here ends on
// the value ControlTowerMetrics currently reports, so the last point of
// any chart drawn from this is the same number shown in the KPI above it —
// the history around it is deterministic wobble, the same technique
// getAgentPerformanceTrend already uses per agent.
export interface ControlTowerTrendPoint {
  date: string
  successRate: number
  avgLatencyMs: number
  tokensUsed: number
  guardrailBlocks: number
}

export interface ControlTowerMetrics {
  activeAgents: number
  totalRequests: number
  successRate: number
  avgLatencyMs: number
  p95LatencyMs: number
  tokensUsed: number
  estimatedCostUsd: number
  guardrailBlocks: number
  humanEscalations: number
}
