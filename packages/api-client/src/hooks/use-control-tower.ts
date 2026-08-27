import { useQuery } from '@tanstack/react-query'

import { mockControlTowerService } from '../control-tower-service'

export function useControlTowerMetrics() {
  return useQuery({
    queryKey: ['control-tower', 'metrics'],
    queryFn: () => mockControlTowerService.getMetrics(),
  })
}

export function useAgents() {
  return useQuery({
    queryKey: ['control-tower', 'agents'],
    queryFn: () => mockControlTowerService.getAgents(),
  })
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: ['control-tower', 'agents', id],
    queryFn: () => mockControlTowerService.getAgentById(id!),
    enabled: !!id,
  })
}

export function useAgentExecutions(id: string | undefined) {
  return useQuery({
    queryKey: ['control-tower', 'agents', id, 'executions'],
    queryFn: () => mockControlTowerService.getAgentExecutions(id!),
    enabled: !!id,
  })
}

export function useAgentPerformanceTrend(id: string | undefined) {
  return useQuery({
    queryKey: ['control-tower', 'agents', id, 'trend'],
    queryFn: () => mockControlTowerService.getAgentPerformanceTrend(id!),
    enabled: !!id,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['control-tower', 'system-health'],
    queryFn: () => mockControlTowerService.getSystemHealth(),
  })
}

export function useAgentSuccessRateTrend() {
  return useQuery({
    queryKey: ['control-tower', 'success-rate-trend'],
    queryFn: () => mockControlTowerService.getAgentSuccessRateTrend(),
  })
}

export function useRecentExecutions() {
  return useQuery({
    queryKey: ['control-tower', 'recent-executions'],
    queryFn: () => mockControlTowerService.getRecentExecutions(),
  })
}

export function useControlTowerMetricsTrend() {
  return useQuery({
    queryKey: ['control-tower', 'metrics-trend'],
    queryFn: () => mockControlTowerService.getMetricsTrend(),
  })
}
