import { useQuery } from '@tanstack/react-query'

import { mockApprovalsService } from '../approvals-service'

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => mockApprovalsService.listPending(),
  })
}
