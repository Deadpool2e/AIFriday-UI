// Local UI-only flags for Autowake. The actual voice profile lives
// server-side in Vizorion's Postgres (see Vizorion/adapters/persistence/
// models.py's SpeakerProfile) — these are just per-browser conveniences so
// the widget knows whether to show "enroll" vs. "enabled" without an extra
// network round trip on every render.

const ENABLED_KEY = 'autowake:enabled'
const ENROLLED_KEY = 'autowake:enrolled'

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeFlag(key: string, value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false')
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — Autowake just
    // won't remember the toggle across reloads, which is a fine fallback.
  }
}

export function isAutowakeEnabled(): boolean {
  return readFlag(ENABLED_KEY)
}

export function setAutowakeEnabled(enabled: boolean): void {
  writeFlag(ENABLED_KEY, enabled)
}

export function hasEnrolledProfile(): boolean {
  return readFlag(ENROLLED_KEY)
}

export function setHasEnrolledProfile(enrolled: boolean): void {
  writeFlag(ENROLLED_KEY, enrolled)
}
