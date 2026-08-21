import type { Request } from '@platform/types'

import { resolveService } from './lib/env'
import { ApiError, apiFetch } from './lib/http-client'
import { MOCK_REQUESTS } from './mock-data'

export interface RequestsService {
  list(): Promise<Request[]>
  getById(id: string): Promise<Request | null>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockRequestsService: RequestsService = {
  async list() {
    await delay(350)
    return MOCK_REQUESTS
  },

  async getById(id) {
    await delay(250)
    return MOCK_REQUESTS.find((request) => request.id === id) ?? null
  },
}

// The Phase 21 worked example — every other *-service.ts in this package
// still only has a mock implementation (see docs/api-contracts.md, Phase
// 22, for the endpoint contracts they'd follow). This one demonstrates
// the actual swap end to end: same RequestsService interface, backed by
// fetch() instead of MOCK_REQUESTS, wired through the same resolveService()
// every future real implementation would use.
export const realRequestsService: RequestsService = {
  async list() {
    return apiFetch<Request[]>('/api/requests')
  },

  async getById(id) {
    try {
      return await apiFetch<Request>(`/api/requests/${id}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },
}

// What every hook in hooks/use-requests.ts / hooks/use-request.ts actually
// calls. Toggling VITE_USE_MOCK_API (see lib/env.ts) is the only change
// needed to move this app from mock data to a real backend — no hook or
// component touches mockRequestsService/realRequestsService directly.
export const requestsService: RequestsService = resolveService(
  mockRequestsService,
  realRequestsService,
)
