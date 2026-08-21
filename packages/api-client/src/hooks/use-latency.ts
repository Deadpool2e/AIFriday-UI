import { useQuery } from '@tanstack/react-query'

import { mockLatencyService } from '../latency-service'

export function useAgentLatencyBreakdown() {
  return useQuery({
    queryKey: ['latency', 'agent-breakdown'],
    queryFn: () => mockLatencyService.getAgentBreakdown(),
  })
}

export function useLatencySummary() {
  return useQuery({
    queryKey: ['latency', 'summary'],
    queryFn: () => mockLatencyService.getSummary(),
  })
}

export function useLatencyTrend() {
  return useQuery({
    queryKey: ['latency', 'trend'],
    queryFn: () => mockLatencyService.getTrend(),
  })
}

export function useSlowExecutions() {
  return useQuery({
    queryKey: ['latency', 'slow-executions'],
    queryFn: () => mockLatencyService.getSlowExecutions(),
  })
}
