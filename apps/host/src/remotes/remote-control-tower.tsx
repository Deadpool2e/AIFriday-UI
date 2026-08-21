import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@platform/ui'

import { RemoteLoadingFallback } from './remote-loading-fallback'

const ControlTowerRoutes = lazy(() => import('ai_control_tower/ControlTowerRoutes'))

export function RemoteControlTower() {
  return (
    <ErrorBoundary
      fallbackTitle="AI Control Tower unavailable"
      fallbackDescription="The AI Control Tower couldn't be loaded. Make sure apps/ai-control-tower's dev server is running, then retry."
    >
      <Suspense fallback={<RemoteLoadingFallback />}>
        <ControlTowerRoutes />
      </Suspense>
    </ErrorBoundary>
  )
}
