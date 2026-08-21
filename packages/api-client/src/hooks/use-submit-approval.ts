import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mockApprovalsService, type ApprovalActionInput } from '../approvals-service'

export function useSubmitApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ApprovalActionInput) => mockApprovalsService.submitAction(input),
    onSuccess: () => {
      // The mock service mutates the shared MOCK_REQUESTS array in place —
      // TanStack Query doesn't know that happened, so every view reading
      // this data needs to be told to refetch explicitly. Invalidating
      // ['requests'] also covers ['requests', id] detail queries — Query
      // matches by key prefix unless `exact: true` is passed.
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
