import { useQuery } from '@tanstack/react-query'

import { mockAuditLogService } from '../audit-log-service'

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log', 'entries'],
    queryFn: () => mockAuditLogService.getEntries(),
  })
}

export function useAuditCategoryCounts() {
  return useQuery({
    queryKey: ['audit-log', 'category-counts'],
    queryFn: () => mockAuditLogService.getCategoryCounts(),
  })
}
