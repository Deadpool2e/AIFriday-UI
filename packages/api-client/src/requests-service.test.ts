import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Request } from '@platform/types'

import { API_BASE_URL } from './lib/env'
import { mockRequestsService, realRequestsService } from './requests-service'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('mockRequestsService', () => {
  it('list() returns the shared mock request array', async () => {
    const requests = await mockRequestsService.list()
    expect(requests.length).toBeGreaterThan(0)
  })

  it('getById() returns null for an id that does not exist', async () => {
    const request = await mockRequestsService.getById('REQ-DOES-NOT-EXIST')
    expect(request).toBeNull()
  })

  it('getById() returns the matching request', async () => {
    const [first] = await mockRequestsService.list()
    const found = await mockRequestsService.getById(first.id)
    expect(found?.id).toBe(first.id)
  })
})

// realRequestsService is the Phase 21 worked example — these tests exist
// specifically to prove the real transport (apiFetch, mocked here via
// MSW instead of a live backend) behaves correctly, especially the 404 ->
// null translation that mockRequestsService also implements, so the two
// stay behaviorally interchangeable.
describe('realRequestsService', () => {
  it('list() returns whatever the backend responds with', async () => {
    const fixture: Partial<Request>[] = [{ id: 'REQ-1' }, { id: 'REQ-2' }]
    server.use(http.get(`${API_BASE_URL}/api/requests`, () => HttpResponse.json(fixture)))

    const requests = await realRequestsService.list()
    expect(requests).toEqual(fixture)
  })

  it('getById() returns the request on a 200', async () => {
    const fixture: Partial<Request> = { id: 'REQ-1', title: 'Test request' }
    server.use(http.get(`${API_BASE_URL}/api/requests/REQ-1`, () => HttpResponse.json(fixture)))

    const request = await realRequestsService.getById('REQ-1')
    expect(request).toEqual(fixture)
  })

  it('getById() translates a 404 into null instead of throwing', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/requests/missing`, () => new HttpResponse('not found', { status: 404 })),
    )

    const request = await realRequestsService.getById('missing')
    expect(request).toBeNull()
  })

  it('getById() still throws on a non-404 error', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/requests/broken`, () => new HttpResponse('server error', { status: 500 })),
    )

    await expect(realRequestsService.getById('broken')).rejects.toMatchObject({ status: 500 })
  })
})
