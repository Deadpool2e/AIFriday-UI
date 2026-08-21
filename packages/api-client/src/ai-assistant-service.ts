import type {
  AIAssistantEvent,
  AIExecutionResult,
  AIExecutionStageId,
  AIExecutionStep,
  RiskLevel,
  SourceCitation,
} from '@platform/types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const STEP_LABELS: Record<AIExecutionStageId, string> = {
  understanding: 'Understanding request',
  rag_retrieval: 'Retrieving relevant context',
  agent_execution: 'Running specialist agents',
  guardrail_check: 'Checking guardrails',
  recommendation: 'Generating recommendation',
  human_approval: 'Awaiting human approval',
}

const MOCK_CITATIONS: SourceCitation[] = [
  {
    id: 'DOC-1',
    title: 'Risk Policy Manual',
    snippet: 'Transactions exceeding $10,000 require secondary review before processing.',
    relevance: 92,
  },
  {
    id: 'DOC-2',
    title: 'Compliance Guidelines 2026',
    snippet: 'Cross-border transfers must be screened against active sanctions lists.',
    relevance: 84,
  },
  {
    id: 'DOC-3',
    title: 'Transaction Risk Scoring Guide',
    snippet: 'Composite risk scores above 70 trigger automatic escalation to a human reviewer.',
    relevance: 76,
  },
]

// Keyword heuristic so the mock demo actually feels responsive to what you
// type, without building the full deterministic Demo Mode yet (Phase 20).
function inferRisk(prompt: string): RiskLevel {
  const lower = prompt.toLowerCase()
  if (lower.includes('critical') || lower.includes('urgent') || lower.includes('fraud')) {
    return 'critical'
  }
  if (
    lower.includes('risk') ||
    lower.includes('high') ||
    lower.includes('block') ||
    lower.includes('suspicious')
  ) {
    return 'high'
  }
  if (lower.includes('review') || lower.includes('check') || lower.includes('verify')) {
    return 'medium'
  }
  return 'low'
}

export interface AIAssistantService {
  sendMessage(
    prompt: string,
    onEvent: (event: AIAssistantEvent) => void,
  ): { cancel: () => void }
}

// Swap for a real implementation posting to POST /api/ai/query and
// consuming GET /api/ai/executions/{id}/stream (SSE) later (Phase 13/21).
// useAIAssistant only ever calls this interface, and only ever reacts to
// AIAssistantEvent — neither changes when the transport does.
export const mockAIAssistantService: AIAssistantService = {
  sendMessage(prompt, onEvent) {
    let cancelled = false
    const steps: AIExecutionStep[] = []

    async function run() {
      const stageOrder: AIExecutionStageId[] = [
        'understanding',
        'rag_retrieval',
        'agent_execution',
        'guardrail_check',
        'recommendation',
      ]
      const risk = inferRisk(prompt)
      const requiresApproval = risk === 'high' || risk === 'critical'

      for (const stage of stageOrder) {
        if (cancelled) return
        onEvent({ type: 'step.started', step: stage })
        const start = Date.now()
        await delay(500 + Math.random() * 500)
        if (cancelled) return
        const durationMs = Date.now() - start

        if (stage === 'rag_retrieval') {
          onEvent({ type: 'citations.found', citations: MOCK_CITATIONS })
        }

        const detail =
          stage === 'agent_execution'
            ? 'Risk Agent, Compliance Agent, and Decision Agent completed'
            : stage === 'guardrail_check'
              ? requiresApproval
                ? '1 policy flag raised'
                : 'No policy violations detected'
              : undefined

        steps.push({ id: stage, label: STEP_LABELS[stage], status: 'completed', detail, durationMs })
        onEvent({ type: 'step.completed', step: stage, detail, durationMs })
      }

      if (cancelled) return

      if (requiresApproval) {
        onEvent({ type: 'step.started', step: 'human_approval' })
        await delay(300)
        if (cancelled) return
        steps.push({ id: 'human_approval', label: STEP_LABELS.human_approval, status: 'completed' })
        onEvent({ type: 'step.completed', step: 'human_approval', durationMs: 300 })
      }

      const decision =
        risk === 'critical'
          ? 'escalate'
          : risk === 'high' || risk === 'medium'
            ? 'review'
            : 'approve'
      const confidence =
        risk === 'low'
          ? 88 + Math.round(Math.random() * 10)
          : risk === 'medium'
            ? 65 + Math.round(Math.random() * 15)
            : risk === 'high'
              ? 55 + Math.round(Math.random() * 15)
              : 40 + Math.round(Math.random() * 15)

      const result: AIExecutionResult = {
        steps,
        citations: MOCK_CITATIONS,
        recommendation: {
          decision,
          confidence,
          risk,
          summary: `Based on policy documents and historical patterns, this request presents ${risk} risk. ${
            requiresApproval
              ? 'Recommend human review before proceeding.'
              : 'Safe to proceed automatically.'
          }`,
        },
        requiresApproval,
      }

      onEvent({
        type: 'result',
        result,
        message: requiresApproval
          ? `I've reviewed your request and found ${risk} risk factors that need a human decision — see the recommendation below.`
          : "I've reviewed your request — here's what I found.",
      })
    }

    run().catch((error: unknown) => {
      if (!cancelled) {
        onEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong.',
        })
      }
    })

    return {
      cancel() {
        cancelled = true
      },
    }
  },
}
