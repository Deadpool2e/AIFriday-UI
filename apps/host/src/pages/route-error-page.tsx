import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { ErrorState, useDocumentTitle } from '@platform/ui'

// Catches router-level failures (bad loader, thrown route element, etc.) —
// distinct from the render-time ErrorBoundary in AppShell, which catches
// errors thrown while a page is already rendering.
export function RouteErrorPage() {
  useDocumentTitle('Something Went Wrong — Enterprise AI Platform')
  const error = useRouteError()
  const navigate = useNavigate()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <ErrorState
        title="Something went wrong"
        description={message}
        onRetry={() => navigate('/')}
        retryLabel="Back to Dashboard"
        className="max-w-md"
      />
    </div>
  )
}
