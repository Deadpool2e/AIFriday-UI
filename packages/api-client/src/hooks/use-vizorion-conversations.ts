import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { vizorionConversationsService } from '../vizorion-conversations-service'

const QUERY_KEY = ['vizorion', 'conversations']

export function useVizorionConversations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => vizorionConversationsService.list(),
  })
}

export function useCreateVizorionConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vizorionConversationsService.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteVizorionConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: string) => vizorionConversationsService.delete(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
