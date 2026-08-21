import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary, Skeleton, SkipLink } from '@platform/ui'

import { DemoPanel } from './demo-panel'
import { MobileSidebar, Sidebar } from './sidebar'
import { Topbar } from './topbar'

function RouteLoadingFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer on every navigation. Adjusted during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in a useEffect, which would cause an extra render pass.
  const [lastPathname, setLastPathname] = useState(location.pathname)
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMobileNavOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SkipLink href="#main-content" />
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setMobileNavOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          {/* Keyed by pathname so a crashed page's error state clears
              automatically on navigation instead of sticking forever. */}
          <ErrorBoundary key={location.pathname} fallbackTitle="This page failed to load">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <DemoPanel />
    </div>
  )
}
