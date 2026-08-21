import { useQuery } from '@tanstack/react-query'

import { mockMetricsService } from '../metrics-service'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => mockMetricsService.getDashboardMetrics(),
  })
}

export function useRequestVolume() {
  return useQuery({
    queryKey: ['metrics', 'request-volume'],
    queryFn: () => mockMetricsService.getRequestVolume(),
  })
}

export function useAiActivity() {
  return useQuery({
    queryKey: ['metrics', 'ai-activity'],
    queryFn: () => mockMetricsService.getAiActivity(),
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['metrics', 'recent-activity'],
    queryFn: () => mockMetricsService.getRecentActivity(),
  })
}
