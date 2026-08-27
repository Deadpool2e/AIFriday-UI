import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { VizorionDocument } from '@platform/types'

import { vizorionFilesService } from '../vizorion-files-service'

const QUERY_KEY = ['vizorion', 'files']

export function useVizorionFiles() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => vizorionFilesService.list(),
    initialData: [] as VizorionDocument[],
  })
}

export function useUploadVizorionFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => vizorionFilesService.upload(file),
    onSuccess: (document) => {
      // Vizorion has no GET /v1/files list endpoint (see
      // vizorion-files-service.ts) — documents this session has touched
      // are tracked directly in the query cache instead of refetched.
      queryClient.setQueryData<VizorionDocument[]>(QUERY_KEY, (prev = []) => [
        document,
        ...prev,
      ])
    },
  })
}

function useDocumentLifecycleMutation(
  action: (documentId: string) => Promise<VizorionDocument>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: (document) => {
      queryClient.setQueryData<VizorionDocument[]>(QUERY_KEY, (prev = []) =>
        prev.map((d) => (d.id === document.id ? document : d)),
      )
    },
  })
}

export function usePublishVizorionFile() {
  return useDocumentLifecycleMutation((documentId) =>
    vizorionFilesService.publish(documentId),
  )
}

export function useUnpublishVizorionFile() {
  return useDocumentLifecycleMutation((documentId) =>
    vizorionFilesService.unpublish(documentId),
  )
}

export function useArchiveVizorionFile() {
  return useDocumentLifecycleMutation((documentId) =>
    vizorionFilesService.archive(documentId),
  )
}

export function useDeleteVizorionFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => vizorionFilesService.delete(documentId),
    onSuccess: (_result, documentId) => {
      queryClient.setQueryData<VizorionDocument[]>(QUERY_KEY, (prev = []) =>
        prev.filter((d) => d.id !== documentId),
      )
    },
  })
}
