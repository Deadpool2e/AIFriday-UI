// Single source of truth for "are we talking to a real backend, or the
// mock data every service in this package ships with." No real backend
// exists yet (that's the actual hackathon problem statement's job, wired
// up in Phase 22) — this defaults to mock so the app works out of the box.
// Flip VITE_USE_MOCK_API=false in a .env once a real API exists, and every
// service built on resolveService() below switches without any component
// or hook changing.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Picks the mock or real implementation of a service at module-load time,
// based on USE_MOCK_API — the one place this decision gets made, so a
// service file just calls this instead of an inline ternary.
export function resolveService<T>(mock: T, real: T): T {
  return USE_MOCK_API ? mock : real
}
