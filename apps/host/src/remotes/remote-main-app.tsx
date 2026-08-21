import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@platform/ui'

import { RemoteLoadingFallback } from './remote-loading-fallback'

// import() of a federated specifier — resolved at runtime against
// apps/main-app's remoteEntry.js (http://localhost:5174 in dev), not
// bundled into the Host at build time. See src/types/remotes.d.ts for why
// this typechecks despite main-app not being a workspace dependency of
// apps/host.
const MainAppRoutes = lazy(() => import('main_app/MainAppRoutes'))

export function RemoteMainApp() {
  return (
    <ErrorBoundary
      fallbackTitle="Main App unavailable"
      fallbackDescription="The business application couldn't be loaded. Make sure apps/main-app's dev server is running, then retry."
    >
      <Suspense fallback={<RemoteLoadingFallback />}>
        <MainAppRoutes />
      </Suspense>
    </ErrorBoundary>
  )
}
