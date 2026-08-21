import { useQuery } from '@tanstack/react-query'

import { requestsService } from '../requests-service'

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: () => requestsService.list(),
  })
}
