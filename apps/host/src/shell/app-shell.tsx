import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useVizorionChat } from '@platform/api-client'
import { useTheme } from '@platform/theme'
import {
  AppLoadingView,
  ErrorBoundary,
  Kbd,
  SkipLink,
  type ProgressStage,
} from '@platform/ui'

import { AutowakeWidget } from './autowake/autowake-widget'
import { useAutowake } from './autowake/use-autowake'
import { CommandPalette } from './command-palette'
import { ShortcutsDialog } from './shortcuts-dialog'
import { MobileSidebar, Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'
import { VizorionLauncher } from './vizorion-launcher'

// Host-owned lazy routes (Settings, the design system) are a single local
// chunk, so this is a much shorter story than a federated remote's.
const ROUTE_STAGES: ProgressStage[] = [
  { id: 'chunk', label: 'Loading page module' },
  { id: 'data', label: 'Fetching page data' },
  { id: 'render', label: 'Rendering' },
]

function RouteLoadingFallback() {
  return <AppLoadingView title="Page" stages={ROUTE_STAGES} preview="detail" />
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [vizorionOpenState, setVizorionOpenState] = useState(false)
  const [autowakePanelOpenState, setAutowakePanelOpenState] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const location = useLocation()
  const { resolvedColorMode, setColorMode } = useTheme()

  // The Vizorion panel and the Autowake panel are both fixed to the same
  // bottom-right corner and their footprints overlap substantially when
  // both are open, so opening one closes the other rather than letting
  // two translucent glass panels stack on top of each other.
  function setVizorionOpen(next: boolean) {
    setVizorionOpenState(next)
    if (next) setAutowakePanelOpenState(false)
  }
  function setAutowakePanelOpen(next: boolean) {
    setAutowakePanelOpenState(next)
    if (next) setVizorionOpenState(false)
  }

  // Lifted here (rather than each owning its own) so a verified "Hey
  // Athena" wake streams into the same conversation VizorionLauncher's
  // panel shows, opens that panel automatically, and both it and
  // AutowakeWidget can render the same live listening/recording state.
  const vizorionChat = useVizorionChat({ conversationId: null })
  const autowake = useAutowake({
    chat: vizorionChat,
    onWakeVerified: () => setVizorionOpen(true),
  })

  // Disabled while an overlay owns the keyboard, so `g` typed into the
  // palette's search field searches instead of navigating.
  const { chord } = useKeyboardShortcuts({
    onOpenPalette: () => setPaletteOpen((prev) => !prev),
    onOpenShortcuts: () => setShortcutsOpen(true),
    onOpenAssistant: () => setVizorionOpen(true),
    onToggleTheme: () =>
      setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark'),
    enabled: !paletteOpen && !shortcutsOpen && !mobileNavOpen,
  })

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
        <Topbar
          onOpenSidebar={() => setMobileNavOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Keyed by pathname so a crashed page's error state clears
              automatically on navigation instead of sticking forever. */}
          <div
            key={location.pathname}
            className="animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-base) ease-out"
          >
            <ErrorBoundary fallbackTitle="This page failed to load">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Chord hint. A `g` prefix is invisible feedback otherwise — the
          user presses a key and nothing appears to happen for a second.
          This shows the shell heard it and is waiting for the second key. */}
      {chord && (
        <div
          role="status"
          className="bg-surface-elevated animate-in fade-in-0 zoom-in-95 fixed bottom-4 left-1/2 z-(--z-toast) flex -translate-x-1/2 items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-lg duration-(--duration-fast)"
        >
          <Kbd keys="g" size="sm" />
          <span className="text-muted-foreground">
            then a page key — Esc to cancel
          </span>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenVizorion={() => setVizorionOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      {!onFullChatPage && (
        <VizorionLauncher
          open={vizorionOpenState}
          onOpenChange={setVizorionOpen}
          chat={vizorionChat}
          autowake={autowake}
        />
      )}
      {/* Unlike VizorionLauncher, not hidden on /vizorion — wake-word
          listening should work app-wide, including on Vizorion's own full
          page, and its button sits in a different corner so it doesn't
          collide with that page's own controls. On /vizorion,
          onWakeVerified's setVizorionOpen(true) is a harmless no-op since
          VizorionLauncher isn't rendered there. */}
      <AutowakeWidget
        autowake={autowake}
        panelOpen={autowakePanelOpenState}
        onPanelOpenChange={setAutowakePanelOpen}
      />
    </div>
  )
}
