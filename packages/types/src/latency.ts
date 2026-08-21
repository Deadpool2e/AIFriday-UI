export interface AgentLatencyBreakdown {
  agent: string
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
}

export interface LatencyTrendPoint {
  date: string
  avgLatencyMs: number
  p95LatencyMs: number
}

export interface SlowExecution {
  id: string
  executionId: string
  requestId: string
  agent: string
  durationMs: number
  timestamp: string
}

export interface LatencySummary {
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
}
