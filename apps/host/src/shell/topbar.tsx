import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from 'lucide-react'
import { USE_MOCK_API } from '@platform/api-client'
import { Badge, Button } from '@platform/ui'
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

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
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
        <Badge
          variant="outline"
          className="text-muted-foreground hidden font-mono text-[10px] sm:inline-flex"
          title="VITE_USE_MOCK_API=false switches every service to the real backend — see .env.example"
        >
          Demo data
        </Badge>
      )}

      <button
        type="button"
        onClick={onOpenPalette}
        className="text-muted-foreground hover:border-border-strong hover:bg-accent ml-auto hidden max-w-64 flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors md:flex"
      >
        <SearchIcon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Search or jump to...</span>
        <kbd className="bg-muted ml-auto shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenPalette}
          aria-label="Search"
        >
          <SearchIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark')
          }
          aria-label={
            resolvedColorMode === 'dark'
              ? 'Switch to light theme'
              : 'Switch to dark theme'
          }
        >
          {resolvedColorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  )
}
