import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import { USE_MOCK_API } from '@platform/api-client'
import { Badge, Button, Kbd, Tooltip } from '@platform/ui'
import { useTheme } from '@platform/theme'

import { Breadcrumbs } from './breadcrumbs'
import { NotificationCenter } from './notification-center'
import { ProfileMenu } from './profile-menu'

interface TopbarProps {
  onOpenSidebar: () => void
  onOpenPalette: () => void
}

export function Topbar({ onOpenSidebar, onOpenPalette }: TopbarProps) {
  const { resolvedColorMode, setColorMode } = useTheme()
  const isDark = resolvedColorMode === 'dark'

  return (
    <header className="bg-background/80 sticky top-0 z-(--z-sticky) flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
      >
        <MenuIcon />
      </Button>
      <Breadcrumbs />
      {USE_MOCK_API && (
        <Tooltip
          content="VITE_USE_MOCK_API=false switches every service to the real backend"
          side="bottom"
        >
          <Badge
            variant="outline"
            className="text-muted-foreground hidden font-mono text-[10px] sm:inline-flex"
          >
            Demo data
          </Badge>
        </Tooltip>
      )}

      {/* The palette trigger is the topbar's centre of gravity: it's the
          fastest route to anything in the app, so it gets real estate and
          teaches its own shortcut rather than hiding behind an icon. */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="text-muted-foreground hover:border-border-strong hover:bg-accent focus-visible:ring-ring/50 ml-auto hidden max-w-72 flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none md:flex"
      >
        <SearchIcon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Search or jump to…</span>
        <Kbd keys="mod k" size="sm" className="ml-auto shrink-0" />
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Tooltip content="Search" side="bottom" shortcut="⌘K">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenPalette}
            aria-label="Search"
          >
            <SearchIcon />
          </Button>
        </Tooltip>
        <Tooltip
          content={isDark ? 'Light theme' : 'Dark theme'}
          side="bottom"
          shortcut="⇧T"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setColorMode(isDark ? 'light' : 'dark')}
            aria-label={
              isDark ? 'Switch to light theme' : 'Switch to dark theme'
            }
          >
            {/* Crossfade + quarter-turn rather than a hard icon swap, so
                the theme change reads as one continuous state transition
                instead of two unrelated repaints. */}
            <span className="relative flex size-4 items-center justify-center">
              <SunIcon
                className={`absolute transition-all duration-(--duration-base) ease-out ${
                  isDark
                    ? 'scale-100 rotate-0 opacity-100'
                    : 'scale-75 -rotate-90 opacity-0'
                }`}
              />
              <MoonIcon
                className={`absolute transition-all duration-(--duration-base) ease-out ${
                  isDark
                    ? 'scale-75 rotate-90 opacity-0'
                    : 'scale-100 rotate-0 opacity-100'
                }`}
              />
            </span>
          </Button>
        </Tooltip>
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  )
}
