import * as React from 'react'
import { Navigate, useLocation } from 'react-router'
import { PermissionDenied } from '@platform/ui'

import { useAuth } from './auth-provider'
import type { Permission } from './permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  // A single permission, several (any one of which is sufficient), or
  // omitted entirely — meaning "just needs to be logged in."
  permission?: Permission | Permission[]
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { status, hasAnyPermission } = useAuth()
  const location = useLocation()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const required = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : []

  if (required.length > 0 && !hasAnyPermission(required)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <PermissionDenied />
      </div>
    )
  }

  return <>{children}</>
}
