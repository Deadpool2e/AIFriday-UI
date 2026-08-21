import { useQuery } from '@tanstack/react-query'

import { requestsService } from '../requests-service'

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsService.getById(id!),
    enabled: !!id,
  })
}
