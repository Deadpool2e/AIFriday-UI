import { useQuery } from '@tanstack/react-query'

import { mockSystemHealthService } from '../system-health-service'

export function useSystemComponentMetrics() {
  return useQuery({
    queryKey: ['system-health', 'components'],
    queryFn: () => mockSystemHealthService.getComponentMetrics(),
  })
}

export function useSystemIncidents() {
  return useQuery({
    queryKey: ['system-health', 'incidents'],
    queryFn: () => mockSystemHealthService.getIncidents(),
  })
}
