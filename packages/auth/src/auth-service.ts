import { DEMO_USERS, type User } from './demo-users'

export class AuthError extends Error {}

export interface AuthService {
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toPublicUser(demoUser: (typeof DEMO_USERS)[number]): User {
  const { id, name, email, role, initials } = demoUser
  return { id, name, email, role, initials }
}

// Swap this implementation for a real one (JWT/OAuth/SSO against the
// Python backend) later. AuthProvider and every consuming component only
// ever call the AuthService interface above, never DEMO_USERS directly —
// so the swap touches exactly this one file, not the UI.
export const demoAuthService: AuthService = {
  async login(email, password) {
    await delay(400)
    const match = DEMO_USERS.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.toLowerCase() &&
        candidate.password === password,
    )
    if (!match) {
      throw new AuthError('Incorrect email or password.')
    }
    return toPublicUser(match)
  },

  async logout() {
    await delay(150)
  },
}
