import { NavLink } from 'react-router'
import { useAuth, type Permission } from '@platform/auth'
import {
  cn,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@platform/ui'

import { navItems, settingsNavItem, type NavItem } from './nav-items'

function SidebarNavLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      <item.icon className="size-4" aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

function canView(
  item: NavItem,
  hasAnyPermission: (p: Permission[]) => boolean,
) {
  if (!item.permission) return true
  const required = Array.isArray(item.permission)
    ? item.permission
    : [item.permission]
  return hasAnyPermission(required)
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { hasAnyPermission } = useAuth()
  const visibleItems = navItems.filter((item) => canView(item, hasAnyPermission))

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-semibold">
          E
        </div>
        <span className="text-sm font-semibold">Enterprise AI Platform</span>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Primary"
      >
        {visibleItems.map((item) => (
          <SidebarNavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t px-3 py-3">
        <SidebarNavLink item={settingsNavItem} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

// Persistent on large screens.
export function Sidebar() {
  return (
    <aside
      className="hidden border-r lg:flex lg:w-64 lg:shrink-0 lg:flex-col"
      aria-label="Sidebar"
    >
      <SidebarContent />
    </aside>
  )
}

// Slide-in overlay below the lg breakpoint, opened from Topbar's menu button.
export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" className="w-72 p-0" showCloseButton={false}>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>Primary navigation menu</DrawerDescription>
        </DrawerHeader>
        <SidebarContent onNavigate={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  )
}
