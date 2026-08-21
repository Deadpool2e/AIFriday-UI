import type { RagDocument, RagQuery, RagRelevancePoint, RagSummary } from '@platform/types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Same three documents the RAG Agent stage in trace-service.ts describes
// retrieving, and the same titles ai-assistant-service.ts cites in chat —
// one knowledge base, referenced consistently everywhere it shows up.
const MOCK_RAG_DOCUMENTS: RagDocument[] = [
  {
    id: 'doc-risk-policy',
    title: 'Risk Policy Manual',
    category: 'Risk',
    chunkCount: 142,
    lastIndexedAt: '2026-08-14T09:00:00Z',
    retrievalCount: 486,
    avgRelevance: 91,
  },
  {
    id: 'doc-compliance-guidelines',
    title: 'Compliance Guidelines 2026',
    category: 'Compliance',
    chunkCount: 208,
    lastIndexedAt: '2026-08-10T09:00:00Z',
    retrievalCount: 512,
    avgRelevance: 88,
  },
  {
    id: 'doc-risk-scoring-guide',
    title: 'Transaction Risk Scoring Guide',
    category: 'Risk',
    chunkCount: 76,
    lastIndexedAt: '2026-08-17T09:00:00Z',
    retrievalCount: 398,
    avgRelevance: 84,
  },
  {
    id: 'doc-aml-screening',
    title: 'AML Screening Procedures',
    category: 'Compliance',
    chunkCount: 119,
    lastIndexedAt: '2026-08-05T09:00:00Z',
    retrievalCount: 271,
    avgRelevance: 79,
  },
  {
    id: 'doc-cdd-handbook',
    title: 'Customer Due Diligence Handbook',
    category: 'Compliance',
    chunkCount: 164,
    lastIndexedAt: '2026-07-29T09:00:00Z',
    retrievalCount: 203,
    avgRelevance: 76,
  },
  {
    id: 'doc-data-retention',
    title: 'Data Retention Policy',
    category: 'Governance',
    chunkCount: 54,
    lastIndexedAt: '2026-07-22T09:00:00Z',
    retrievalCount: 88,
    avgRelevance: 68,
  },
]

const MOCK_RAG_QUERIES: RagQuery[] = [
  {
    id: 'RAG-Q-812',
    executionId: 'EXEC-4102',
    requestId: 'REQ-92831',
    agent: 'RAG Agent',
    query: 'Retrieve relevant policy and compliance context for a high-value transfer review.',
    documentsRetrieved: 3,
    avgRelevance: 92,
    latencyMs: 320,
    timestamp: '8 min ago',
  },
  {
    id: 'RAG-Q-811',
    executionId: 'EXEC-4101',
    requestId: 'REQ-92809',
    agent: 'RAG Agent',
    query: 'Find sanctions screening requirements for cross-border transfers.',
    documentsRetrieved: 2,
    avgRelevance: 85,
    latencyMs: 410,
    timestamp: '22 min ago',
  },
  {
    id: 'RAG-Q-810',
    executionId: 'EXEC-4100',
    requestId: 'REQ-92844',
    agent: 'RAG Agent',
    query: 'Look up escalation thresholds for composite risk scores above 70.',
    documentsRetrieved: 3,
    avgRelevance: 89,
    latencyMs: 295,
    timestamp: '31 min ago',
  },
  {
    id: 'RAG-Q-809',
    executionId: 'EXEC-4099',
    requestId: 'REQ-92822',
    agent: 'RAG Agent',
    query: 'Retrieve customer due diligence steps for a new commercial account.',
    documentsRetrieved: 4,
    avgRelevance: 74,
    latencyMs: 512,
    timestamp: '1 hour ago',
  },
  {
    id: 'RAG-Q-808',
    executionId: 'EXEC-4098',
    requestId: 'REQ-92815',
    agent: 'RAG Agent',
    query: 'Check data retention rules applicable to flagged transaction records.',
    documentsRetrieved: 1,
    avgRelevance: 61,
    latencyMs: 268,
    timestamp: '2 hours ago',
  },
]

function generateRelevanceTrend(days: number): RagRelevancePoint[] {
  const base = Date.parse('2026-08-20T00:00:00Z')
  const points: RagRelevancePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(base - i * 24 * 60 * 60 * 1000)
    const wobble = ((i * 4) % 9) - 4
    points.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgRelevance: Math.min(100, Math.max(60, 84 + wobble)),
    })
  }
  return points
}

function computeSummary(documents: RagDocument[], queries: RagQuery[]): RagSummary {
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0)
  const avgLatency = queries.reduce((sum, q) => sum + q.latencyMs, 0) / queries.length
  const avgRelevance = queries.reduce((sum, q) => sum + q.avgRelevance, 0) / queries.length

  return {
    totalDocuments: documents.length,
    totalChunks,
    queriesLast24h: queries.length,
    avgRetrievalLatencyMs: Math.round(avgLatency),
    avgRelevanceScore: Math.round(avgRelevance),
  }
}

export interface RagService {
  getDocuments(): Promise<RagDocument[]>
  getQueries(): Promise<RagQuery[]>
  getSummary(): Promise<RagSummary>
  getRelevanceTrend(): Promise<RagRelevancePoint[]>
}

// Swap for a real implementation calling GET /api/rag/documents and
// GET /api/rag/queries later (Phase 21). Every consumer reaches this only
// through the hooks in hooks/use-rag.ts.
export const mockRagService: RagService = {
  async getDocuments() {
    await delay(300)
    return MOCK_RAG_DOCUMENTS
  },
  async getQueries() {
    await delay(300)
    return MOCK_RAG_QUERIES
  },
  async getSummary() {
    await delay(250)
    return computeSummary(MOCK_RAG_DOCUMENTS, MOCK_RAG_QUERIES)
  },
  async getRelevanceTrend() {
    await delay(300)
    return generateRelevanceTrend(14)
  },
}
