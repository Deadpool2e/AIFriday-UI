import { Navigate, useLocation, type Location } from 'react-router'
import { LoginForm, useAuth } from '@platform/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, useDocumentTitle } from '@platform/ui'

export function LoginPage() {
  useDocumentTitle('Sign In — Enterprise AI Platform')
  const { status } = useAuth()
  const location = useLocation()
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  // Already signed in (e.g. session restored from localStorage) — send
  // straight back to wherever ProtectedRoute redirected from, declaratively,
  // no effect needed.
  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enterprise AI Platform — demo access</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
