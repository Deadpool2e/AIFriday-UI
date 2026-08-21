import * as React from 'react'

import { demoAuthService } from './auth-service'
import type { User } from './demo-users'
import { ROLE_PERMISSIONS, type Permission } from './permissions'

const SESSION_STORAGE_KEY = 'platform:auth-session'

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading'

function readStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  permissions: Permission[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(readStoredUser)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  // No separate "loading" state for session restoration — like
  // ThemeProvider, the stored session is read synchronously before first
  // render, so status resolves to authenticated/unauthenticated
  // immediately. "loading" only ever means "a login() call is in flight."
  const status: AuthStatus = isLoggingIn
    ? 'loading'
    : user
      ? 'authenticated'
      : 'unauthenticated'

  const login = React.useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true)
    try {
      const loggedInUser = await demoAuthService.login(email, password)
      setUser(loggedInUser)
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(loggedInUser),
      )
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = React.useCallback(async () => {
    await demoAuthService.logout()
    setUser(null)
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [])

  const permissions = React.useMemo(
    () => (user ? ROLE_PERMISSIONS[user.role] : []),
    [user],
  )

  const hasPermission = React.useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions],
  )

  const hasAnyPermission = React.useCallback(
    (required: Permission[]) =>
      required.some((permission) => permissions.includes(permission)),
    [permissions],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      permissions,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
    }),
    [user, status, permissions, login, logout, hasPermission, hasAnyPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
