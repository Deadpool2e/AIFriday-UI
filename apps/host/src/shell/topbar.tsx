import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'
import { USE_MOCK_API } from '@platform/api-client'
import { Badge, Button } from '@platform/ui'
import { useTheme } from '@platform/theme'

import { Breadcrumbs } from './breadcrumbs'
import { NotificationCenter } from './notification-center'
import { ProfileMenu } from './profile-menu'

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
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
          className="text-muted-foreground hidden sm:inline-flex"
          title="VITE_USE_MOCK_API=false switches every service to the real backend — see .env.example"
        >
          Mock Data
        </Badge>
      )}
      <div className="ml-auto flex items-center gap-1">
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
