export interface RagDocument {
  id: string
  title: string
  category: string
  chunkCount: number
  lastIndexedAt: string
  retrievalCount: number
  avgRelevance: number
}

export interface RagQuery {
  id: string
  executionId: string
  requestId: string
  agent: string
  query: string
  documentsRetrieved: number
  avgRelevance: number
  latencyMs: number
  timestamp: string
}

export interface RagRelevancePoint {
  date: string
  avgRelevance: number
}

export interface RagSummary {
  totalDocuments: number
  totalChunks: number
  queriesLast24h: number
  avgRetrievalLatencyMs: number
  avgRelevanceScore: number
}
