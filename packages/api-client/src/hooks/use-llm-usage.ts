import { useQuery } from '@tanstack/react-query'

import { mockLlmUsageService } from '../llm-usage-service'

export function useModelUsage() {
  return useQuery({
    queryKey: ['llm-usage', 'models'],
    queryFn: () => mockLlmUsageService.getModelUsage(),
  })
}

export function useLlmUsageSummary() {
  return useQuery({
    queryKey: ['llm-usage', 'summary'],
    queryFn: () => mockLlmUsageService.getSummary(),
  })
}

export function useLlmUsageTrend() {
  return useQuery({
    queryKey: ['llm-usage', 'trend'],
    queryFn: () => mockLlmUsageService.getUsageTrend(),
  })
}
