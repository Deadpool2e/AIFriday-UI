import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Request } from '@platform/types'

import {
  mockApprovalsService,
  type ApprovalActionInput,
} from '../approvals-service'

export function useSubmitApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ApprovalActionInput) =>
      mockApprovalsService.submitAction(input),

    // Optimistic removal. Deciding an approval is a commit the reviewer
    // has already made in their head — the queue should reflect it the
    // instant they click, not 400ms later when the service answers. The
    // item is dropped from the pending list immediately; onError puts it
    // back, and onSettled reconciles with whatever the service actually
    // did.
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: ['approvals', 'pending'] })
      const previous = queryClient.getQueryData<Request[]>([
        'approvals',
        'pending',
      ])
      if (previous) {
        queryClient.setQueryData<Request[]>(
          ['approvals', 'pending'],
          previous.filter((request) => request.id !== requestId),
        )
      }
      return { previous }
    },

    onError: (_error, _input, context) => {
      // Roll back to exactly what was on screen before, so a failed
      // submission doesn't quietly lose an item from the reviewer's queue.
      if (context?.previous) {
        queryClient.setQueryData(['approvals', 'pending'], context.previous)
      }
    },

    onSettled: () => {
      // The mock service mutates the shared MOCK_REQUESTS array in place —
      // TanStack Query doesn't know that happened, so every view reading
      // this data needs to be told to refetch explicitly. Invalidating
      // ['requests'] also covers ['requests', id] detail queries — Query
      // matches by key prefix unless `exact: true` is passed. Runs on both
      // success and failure so the optimistic list can never stay ahead of
      // the server's actual state.
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
