import { useQuery } from '@tanstack/react-query'

import { mockRagService } from '../rag-service'

export function useRagDocuments() {
  return useQuery({
    queryKey: ['rag', 'documents'],
    queryFn: () => mockRagService.getDocuments(),
  })
}

export function useRagQueries() {
  return useQuery({
    queryKey: ['rag', 'queries'],
    queryFn: () => mockRagService.getQueries(),
  })
}

export function useRagSummary() {
  return useQuery({
    queryKey: ['rag', 'summary'],
    queryFn: () => mockRagService.getSummary(),
  })
}

export function useRagRelevanceTrend() {
  return useQuery({
    queryKey: ['rag', 'relevance-trend'],
    queryFn: () => mockRagService.getRelevanceTrend(),
  })
}
