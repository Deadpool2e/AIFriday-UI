import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { API_BASE_URL } from './env'
import { ApiError, apiFetch } from './http-client'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('apiFetch', () => {
  it('resolves with the parsed JSON body on a 2xx response', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/requests`, () =>
        HttpResponse.json([{ id: 'REQ-1' }]),
      ),
    )

    const result = await apiFetch<{ id: string }[]>('/api/requests')
    expect(result).toEqual([{ id: 'REQ-1' }])
  })

  it('sends the Authorization header when a token is provided', async () => {
    let capturedAuth: string | null = null
    server.use(
      http.get(`${API_BASE_URL}/api/requests`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await apiFetch('/api/requests', { token: 'demo-token-123' })
    expect(capturedAuth).toBe('Bearer demo-token-123')
  })

  it('sends a JSON-encoded body and Content-Type header for POST requests', async () => {
    let capturedBody: unknown = null
    server.use(
      http.post(
        `${API_BASE_URL}/api/approvals/REQ-1/action`,
        async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ ok: true })
        },
      ),
    )

    await apiFetch('/api/approvals/REQ-1/action', {
      method: 'POST',
      body: { action: 'approve' },
    })
    expect(capturedBody).toEqual({ action: 'approve' })
  })

  it('throws an ApiError with the response status on a non-2xx response', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/api/requests/missing`,
        () => new HttpResponse('not found', { status: 404 }),
      ),
    )

    await expect(apiFetch('/api/requests/missing')).rejects.toMatchObject({
      status: 404,
    })
    await expect(apiFetch('/api/requests/missing')).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('returns undefined for a 204 No Content response', async () => {
    server.use(
      http.post(
        `${API_BASE_URL}/api/noop`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    const result = await apiFetch('/api/noop', { method: 'POST' })
    expect(result).toBeUndefined()
  })
})
