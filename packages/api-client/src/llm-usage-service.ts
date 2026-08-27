import type {
  LlmModelCategory,
  LlmUsagePoint,
  LlmUsageSummary,
  ModelUsage,
} from '@platform/types'

import { MOCK_AGENTS } from './control-tower-service'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Roughly mirrors real Azure OpenAI pricing shape (chat models priced per
// token, embedding models far cheaper) — realistic relative costs, not
// exact rates. $ per 1K tokens.
const MODEL_RATES: Record<
  string,
  { costPer1kTokens: number; category: LlmModelCategory }
> = {
  'azure/genailab-maas-gpt-4o': { costPer1kTokens: 0.005, category: 'chat' },
  'azure/genailab-maas-gpt-4o-mini': {
    costPer1kTokens: 0.00015,
    category: 'chat',
  },
  'azure/genailab-maas-text-embedding-3-large': {
    costPer1kTokens: 0.00013,
    category: 'embedding',
  },
}

// Grouped straight from the same MOCK_AGENTS the Agents page and Overview
// KPIs read (see the export note in control-tower-service.ts) — a token
// spent by an agent shows up identically here and there, never invented
// twice.
function buildModelUsage(): ModelUsage[] {
  const byModel = new Map<string, ModelUsage>()

  for (const agent of MOCK_AGENTS) {
    const rate = MODEL_RATES[agent.model] ?? {
      costPer1kTokens: 0.001,
      category: 'chat' as const,
    }
    const existing = byModel.get(agent.model)
    const cost = (agent.tokensUsed / 1000) * rate.costPer1kTokens

    if (existing) {
      const totalRequests = existing.requests + agent.requestsHandled
      existing.avgLatencyMs =
        totalRequests === 0
          ? existing.avgLatencyMs
          : Math.round(
              (existing.avgLatencyMs * existing.requests +
                agent.avgLatencyMs * agent.requestsHandled) /
                totalRequests,
            )
      existing.agents.push(agent.name)
      existing.requests = totalRequests
      existing.tokens += agent.tokensUsed
      existing.estimatedCostUsd =
        Math.round((existing.estimatedCostUsd + cost) * 100) / 100
    } else {
      byModel.set(agent.model, {
        model: agent.model,
        category: rate.category,
        agents: [agent.name],
        requests: agent.requestsHandled,
        tokens: agent.tokensUsed,
        estimatedCostUsd: Math.round(cost * 100) / 100,
        avgLatencyMs: agent.avgLatencyMs,
      })
    }
  }

  return [...byModel.values()].sort((a, b) => b.tokens - a.tokens)
}

function computeSummary(usage: ModelUsage[]): LlmUsageSummary {
  const totalTokens = usage.reduce((sum, u) => sum + u.tokens, 0)
  const totalCostUsd =
    Math.round(usage.reduce((sum, u) => sum + u.estimatedCostUsd, 0) * 100) /
    100
  const totalRequests = usage.reduce((sum, u) => sum + u.requests, 0)

  return {
    totalTokens,
    totalCostUsd,
    totalRequests,
    avgCostPerRequest:
      totalRequests === 0
        ? 0
        : Math.round((totalCostUsd / totalRequests) * 10_000) / 10_000,
  }
}

function generateUsageTrend(
  days: number,
  dailyTokens: number,
  dailyCostUsd: number,
): LlmUsagePoint[] {
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: LlmUsagePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    const wobble = 1 + (((i * 7) % 11) - 5) / 100
    points.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      tokens: Math.round(dailyTokens * wobble),
      costUsd: Math.round(dailyCostUsd * wobble * 100) / 100,
    })
  }
  return points
}

export interface LlmUsageService {
  getModelUsage(): Promise<ModelUsage[]>
  getSummary(): Promise<LlmUsageSummary>
  getUsageTrend(): Promise<LlmUsagePoint[]>
}

// Swap for a real implementation calling GET /api/llm/usage later
// (Phase 21). Every consumer reaches this only through the hooks in
// hooks/use-llm-usage.ts.
export const mockLlmUsageService: LlmUsageService = {
  async getModelUsage() {
    await delay(300)
    return buildModelUsage()
  },
  async getSummary() {
    await delay(250)
    return computeSummary(buildModelUsage())
  },
  async getUsageTrend() {
    await delay(300)
    const summary = computeSummary(buildModelUsage())
    return generateUsageTrend(
      14,
      summary.totalTokens / 14,
      summary.totalCostUsd / 14,
    )
  },
}
