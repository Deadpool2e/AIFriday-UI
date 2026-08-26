import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useVizorionChat } from '@platform/api-client'
import { ErrorBoundary, Skeleton, SkipLink } from '@platform/ui'

import { AutowakeWidget } from './autowake/autowake-widget'
import { useAutowake } from './autowake/use-autowake'
import { CommandPalette } from './command-palette'
import { MobileSidebar, Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { VizorionLauncher } from './vizorion-launcher'

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
  const [vizorionOpen, setVizorionOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()

  // Lifted here (rather than each owning its own) so a verified "Hey
  // Athena" wake streams into the same conversation VizorionLauncher's
  // panel shows, opens that panel automatically, and both it and
  // AutowakeWidget can render the same live listening/recording state.
  const vizorionChat = useVizorionChat({ conversationId: null })
  const autowake = useAutowake({ chat: vizorionChat, onWakeVerified: () => setVizorionOpen(true) })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Close the mobile drawer on every navigation. Adjusted during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in a useEffect, which would cause an extra render pass.
  const [lastPathname, setLastPathname] = useState(location.pathname)
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMobileNavOpen(false)
  }

  // The FAB is fixed to the bottom-right corner (right-4, bottom-4), same
  // corner as the full-page chat surface's own send/mic controls. Left
  // mounted there, it visually sits on top of those controls once the
  // full chat page fills the viewport, so hide the floating widget on
  // Vizorion's own full page — the page itself is already the chat.
  const onFullChatPage = location.pathname === '/vizorion'

  return (
    <div className="flex h-screen overflow-hidden">
      <SkipLink href="#main-content" />
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setMobileNavOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          {/* Keyed by pathname so a crashed page's error state clears
              automatically on navigation instead of sticking forever. */}
          <div key={location.pathname} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
            <ErrorBoundary fallbackTitle="This page failed to load">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenVizorion={() => setVizorionOpen(true)}
      />
      {!onFullChatPage && (
        <VizorionLauncher open={vizorionOpen} onOpenChange={setVizorionOpen} chat={vizorionChat} autowake={autowake} />
      )}
      {/* Unlike VizorionLauncher, not hidden on /vizorion — wake-word
          listening should work app-wide, including on Vizorion's own full
          page, and its button sits in a different corner so it doesn't
          collide with that page's own controls. On /vizorion,
          onWakeVerified's setVizorionOpen(true) is a harmless no-op since
          VizorionLauncher isn't rendered there. */}
      <AutowakeWidget autowake={autowake} />
    </div>
  )
}
