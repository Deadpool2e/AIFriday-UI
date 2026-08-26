import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { vizorionMemoryService } from '../vizorion-memory-service'

const QUERY_KEY = ['vizorion', 'memory']

export function useVizorionMemory() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => vizorionMemoryService.list(),
  })
}

export function useCreateVizorionMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ content, key }: { content: string; key?: string }) => vizorionMemoryService.create(content, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateVizorionMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memoryId, content }: { memoryId: string; content: string }) =>
      vizorionMemoryService.update(memoryId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteVizorionMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memoryId: string) => vizorionMemoryService.delete(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteAllVizorionMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vizorionMemoryService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
