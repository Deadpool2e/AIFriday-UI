import { API_BASE_URL } from './env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  // Real services take the current session token as a parameter rather
  // than reading it themselves — this package has no dependency on
  // @platform/auth (same layering boundary audit-log-service.ts documents
  // for DEMO_USERS), so the caller (a hook, backed by useAuth()) supplies
  // it.
  token?: string
}

// Thin fetch wrapper every real service implementation goes through —
// base URL joining, JSON body/response handling, bearer token attachment,
// and normalized error handling live here once instead of being
// copy-pasted into every *-service.ts file that gets a real
// implementation.
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new ApiError(response.status, message || response.statusText)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
