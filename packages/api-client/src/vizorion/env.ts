// Vizorion runs as its own separate, already-real service — unlike every
// other *-service.ts in this package, which points at an API_BASE_URL /
// USE_MOCK_API pair with no real backend behind it yet. Deliberately its
// own toggle rather than reusing USE_MOCK_API: that flag being false
// would also switch dashboard/requests/control-tower services to "real,"
// and none of those has a backend to call. This way Vizorion can run for
// real while the rest of the platform stays on its mocks.
// Defaults to mock, same polarity as USE_MOCK_API in ../lib/env — unset
// or anything other than 'false' means mock.
export const VIZORION_USE_MOCK = import.meta.env.VITE_VIZORION_USE_MOCK !== 'false'

export const VIZORION_API_BASE_URL = import.meta.env.VITE_VIZORION_API_URL ?? 'http://localhost:8000'

// Baked into the client bundle and visible in devtools — acceptable for
// an internal/demo deployment only. Swap for a per-user token issued by a
// backend-for-frontend before this ships anywhere public (same gap
// documented in docs/rbac.md for the platform's own auth token).
export const VIZORION_API_KEY = import.meta.env.VITE_VIZORION_API_KEY ?? ''

// Vizorion's own mock/real seam — see the VIZORION_USE_MOCK comment above
// for why this doesn't just reuse ../lib/env's resolveService/USE_MOCK_API.
export function resolveVizorionService<T>(mock: T, real: T): T {
  return VIZORION_USE_MOCK ? mock : real
}
