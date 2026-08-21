export type LlmModelCategory = 'chat' | 'embedding'

export interface ModelUsage {
  model: string
  category: LlmModelCategory
  agents: string[]
  requests: number
  tokens: number
  estimatedCostUsd: number
  avgLatencyMs: number
}

export interface LlmUsageSummary {
  totalTokens: number
  totalCostUsd: number
  totalRequests: number
  avgCostPerRequest: number
}

export interface LlmUsagePoint {
  date: string
  tokens: number
  costUsd: number
}
