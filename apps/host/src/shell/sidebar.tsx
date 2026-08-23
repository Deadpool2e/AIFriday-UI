import * as React from 'react'
import { NavLink } from 'react-router'
import { useAgents, useSystemHealth } from '@platform/api-client'
import { useAuth, type Permission } from '@platform/auth'
import {
  cn,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@platform/ui'
import { ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'

import { navGroupOrder, navItems, settingsNavItem, type NavItem } from './nav-items'

const COLLAPSE_KEY = 'platform:sidebar-collapsed'

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="bg-primary absolute inset-y-1.5 left-0 w-1 rounded-full shadow-[0_0_8px_var(--color-primary)]"
              aria-hidden="true"
            />
          )}
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && item.label}
        </>
      )}
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

function AISystemStatus({ collapsed }: { collapsed?: boolean }) {
  const agents = useAgents()
  const health = useSystemHealth()

  const activeAgents = agents.data?.filter((a) => a.status === 'running').length ?? 0
  const hasDegraded = health.data?.some((item) => item.status !== 'healthy') ?? false

  let dotClass = 'bg-success'
  let label = 'All systems operational'
  let pulse = false

  if (activeAgents > 0) {
    dotClass = 'bg-info'
    label = `${activeAgents} agent${activeAgents === 1 ? '' : 's'} active`
    pulse = true
  } else if (hasDegraded) {
    dotClass = 'bg-warning'
    label = 'Degraded performance'
  }

  if (collapsed) {
    return (
      <div className="flex justify-center py-3" title={label}>
        <span className="relative flex size-2">
          {pulse && (
            <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotClass)} />
          )}
          <span className={cn('relative inline-flex size-2 rounded-full', dotClass)} />
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-3 text-xs">
      <span className="relative flex size-1.5 shrink-0">
        {pulse && (
          <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotClass)} />
        )}
        <span className={cn('relative inline-flex size-1.5 rounded-full', dotClass)} />
      </span>
      <span className="text-muted-foreground truncate">{label}</span>
    </div>
  )
}

function SidebarContent({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const { hasAnyPermission } = useAuth()
  const visibleItems = navItems.filter((item) => canView(item, hasAnyPermission))

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center gap-2 border-b px-4', collapsed && 'justify-center px-0')}>
        <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold shadow-[0_2px_10px_-2px_var(--color-primary)]">
          E
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">Enterprise AI Platform</span>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Primary">
        {navGroupOrder.map((group) => {
          const groupItems = visibleItems.filter((item) => item.group === group)
          if (groupItems.length === 0) return null
          return (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <p className="text-muted-foreground/70 px-3 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                  {group}
                </p>
              )}
              {groupItems.map((item) => (
                <SidebarNavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          )
        })}
      </nav>
      <div className="border-t">
        <AISystemStatus collapsed={collapsed} />
      </div>
      <div className="space-y-1 border-t px-3 py-3">
        <SidebarNavLink item={settingsNavItem} collapsed={collapsed} onNavigate={onNavigate} />
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRightIcon className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeftIcon className="size-4 shrink-0" aria-hidden="true" />
                Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Persistent on large screens. Collapsible to an icon rail; state persists
// across sessions since a user who prefers the compact rail wants it every
// time, not just for one visit.
export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* localStorage unavailable — collapse state just won't persist */
    }
  }, [collapsed])

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r transition-[width] duration-200 lg:flex',
        collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64',
      )}
      aria-label="Sidebar"
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((prev) => !prev)} />
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
