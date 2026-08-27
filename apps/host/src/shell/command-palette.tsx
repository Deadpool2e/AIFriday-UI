import * as React from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import {
  triggerDemoGuardrailBlock,
  triggerDemoIncident,
  triggerDemoPendingApproval,
  useRequests,
} from '@platform/api-client'
import { useAuth } from '@platform/auth'
import { useTheme } from '@platform/theme'
import { Kbd, RiskIndicator, useToast } from '@platform/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  KeyboardIcon,
  MessageCircleIcon,
  MoonIcon,
  RadioIcon,
  SearchIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  SunIcon,
  UserPlusIcon,
} from 'lucide-react'

import { navItems, settingsNavItem } from './nav-items'
import { GO_TO_SHORTCUTS } from './use-keyboard-shortcuts'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenVizorion: () => void
  onOpenShortcuts: () => void
}

const RECENT_KEY = 'platform:palette-recent'
const MAX_RECENT = 4
// Searching 47 requests is useful; rendering all 47 into the palette is
// not. Anything past this is a job for the Requests page's own filters,
// which the palette links to.
const MAX_REQUEST_RESULTS = 5

const groupClass =
  '**:[[cmdk-group-heading]]:text-muted-foreground/70 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase'
const itemClass =
  'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors duration-(--duration-instant)'

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenVizorion,
  onOpenShortcuts,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasAnyPermission } = useAuth()
  const { resolvedColorMode, setColorMode } = useTheme()
  const { toast } = useToast()
  const [search, setSearch] = React.useState('')
  const [recent, setRecent] = React.useState<string[]>(readRecent)

  // Requests are already in the query cache on most pages, so searching
  // them here costs nothing — and "jump straight to REQ-1042" is the
  // single most-used thing a palette can do in an app built around a
  // request queue.
  const requests = useRequests()

  // Start every session clean rather than resuming someone's half-typed
  // search from ten minutes ago. Reset on open (not close) and during
  // render rather than in an effect — clearing on close would re-render
  // the palette mid close-animation, visibly emptying the list on the way
  // out.
  const [lastOpen, setLastOpen] = React.useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setSearch('')
  }

  const pushRecent = React.useCallback((to: string) => {
    setRecent((prev) => {
      const next = [to, ...prev.filter((entry) => entry !== to)].slice(
        0,
        MAX_RECENT,
      )
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* localStorage unavailable — recents just won't persist */
      }
      return next
    })
  }, [])

  function run(action: () => void) {
    onOpenChange(false)
    action()
  }

  function goTo(to: string) {
    run(() => {
      pushRecent(to)
      navigate(to)
    })
  }

  function runDemoTrigger(
    title: string,
    description: string,
    action: () => void,
  ) {
    run(() => {
      action()
      queryClient.invalidateQueries()
      // Previously a console.info, which meant the presenter fired an
      // event and the room had no idea anything had happened until they
      // navigated somewhere it showed up.
      toast({ title, description, tone: 'warning' })
    })
  }

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.permission ||
      hasAnyPermission(
        Array.isArray(item.permission) ? item.permission : [item.permission],
      ),
  )
  const allNavItems = [...visibleNavItems, settingsNavItem]
  const shortcutFor = (to: string) =>
    GO_TO_SHORTCUTS.find((entry) => entry.to === to)

  const recentItems = recent
    .map((to) => allNavItems.find((item) => item.to === to))
    .filter((item): item is (typeof allNavItems)[number] => Boolean(item))

  const query = search.trim().toLowerCase()
  const matchingRequests = query
    ? (requests.data ?? [])
        .filter(
          (request) =>
            request.id.toLowerCase().includes(query) ||
            request.title.toLowerCase().includes(query) ||
            request.owner.toLowerCase().includes(query),
        )
        .slice(0, MAX_REQUEST_RESULTS)
    : []

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter
      overlayClassName="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-(--z-command-palette) bg-black/50 backdrop-blur-[2px]"
      contentClassName="bg-surface-elevated/85 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[18%] left-1/2 z-(--z-command-palette) w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-xl duration-(--duration-fast) ease-out"
    >
      <div className="flex items-center gap-2 border-b px-3">
        <SearchIcon
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden="true"
        />
        <Command.Input
          autoFocus
          value={search}
          onValueChange={setSearch}
          placeholder="Search requests, jump to a page, run a command…"
          className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
        />
        <Kbd
          keys="escape"
          size="sm"
          className="hidden shrink-0 sm:inline-flex"
        />
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="px-2 py-8 text-center">
          <p className="text-sm font-medium">No results for “{search}”</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Try a request ID, an owner&apos;s name, or a page name.
          </p>
        </Command.Empty>

        {/* Recents lead when the palette opens cold — the fastest path is
            almost always somewhere you already were. They disappear as
            soon as there's a query, since cmdk's own ranking is better
            than recency at that point. */}
        {!query && recentItems.length > 0 && (
          <Command.Group heading="Recent" className={groupClass}>
            {recentItems.map((item) => (
              <Command.Item
                key={`recent-${item.to}`}
                value={`recent ${item.label}`}
                onSelect={() => goTo(item.to)}
                className={itemClass}
              >
                <item.icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                {item.label}
                {shortcutFor(item.to) && (
                  <Kbd
                    keys={`g ${shortcutFor(item.to)!.key}`}
                    size="sm"
                    className="ml-auto opacity-60"
                  />
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {matchingRequests.length > 0 && (
          <Command.Group heading="Requests" className={groupClass}>
            {matchingRequests.map((request) => (
              <Command.Item
                key={request.id}
                value={`${request.id} ${request.title} ${request.owner}`}
                onSelect={() => run(() => navigate(`/requests/${request.id}`))}
                className={itemClass}
              >
                <span className="text-muted-foreground w-16 shrink-0 font-mono text-xs">
                  {request.id}
                </span>
                <span className="truncate">{request.title}</span>
                <span className="ml-auto shrink-0">
                  <RiskIndicator level={request.risk} />
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Navigation" className={groupClass}>
          {allNavItems.map((item) => (
            <Command.Item
              key={item.to}
              value={`go to ${item.label}`}
              onSelect={() => goTo(item.to)}
              className={itemClass}
            >
              <item.icon
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              Go to {item.label}
              {shortcutFor(item.to) && (
                <Kbd
                  keys={`g ${shortcutFor(item.to)!.key}`}
                  size="sm"
                  className="ml-auto opacity-60"
                />
              )}
            </Command.Item>
          ))}
        </Command.Group>

        {hasAnyPermission(['VIZORION_ASSISTANT']) && (
          <Command.Group heading="AI" className={groupClass}>
            <Command.Item
              onSelect={() => run(onOpenVizorion)}
              className={itemClass}
            >
              <MessageCircleIcon
                className="text-ai-accent size-4"
                aria-hidden="true"
              />
              Ask Vizorion
              <Kbd keys="mod j" size="sm" className="ml-auto opacity-60" />
            </Command.Item>
          </Command.Group>
        )}

        <Command.Group heading="System" className={groupClass}>
          <Command.Item
            onSelect={() =>
              run(() =>
                setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark'),
              )
            }
            className={itemClass}
          >
            {resolvedColorMode === 'dark' ? (
              <SunIcon
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            ) : (
              <MoonIcon
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
            )}
            Toggle dark mode
            <Kbd keys="shift t" size="sm" className="ml-auto opacity-60" />
          </Command.Item>
          <Command.Item
            onSelect={() => run(onOpenShortcuts)}
            className={itemClass}
          >
            <KeyboardIcon
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            Keyboard shortcuts
            <Kbd keys="?" size="sm" className="ml-auto opacity-60" />
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Demo Mode" className={groupClass}>
          <Command.Item
            onSelect={() =>
              runDemoTrigger(
                'Guardrail block triggered',
                'A new blocked call is now visible in Guardrails and Audit Logs.',
                triggerDemoGuardrailBlock,
              )
            }
            className={itemClass}
          >
            <ShieldAlertIcon
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            Simulate guardrail block
          </Command.Item>
          <Command.Item
            onSelect={() =>
              runDemoTrigger(
                'System incident triggered',
                'System Health and Overview now show a degraded service.',
                triggerDemoIncident,
              )
            }
            className={itemClass}
          >
            <ServerCrashIcon
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            Simulate system incident
          </Command.Item>
          <Command.Item
            onSelect={() =>
              runDemoTrigger(
                'Pending approval added',
                'A new request is waiting in Approvals.',
                triggerDemoPendingApproval,
              )
            }
            className={itemClass}
          >
            <UserPlusIcon
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            Simulate pending approval
          </Command.Item>
          <Command.Item
            onSelect={() => goTo('/settings')}
            className={itemClass}
          >
            <RadioIcon
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            Open Demo Mode settings
          </Command.Item>
        </Command.Group>
      </Command.List>

      {/* A persistent footer legend, the way Raycast teaches its own
          controls: the palette should never be a black box you have to
          guess your way around. */}
      <div className="text-muted-foreground flex items-center gap-4 border-t px-3 py-2 text-[11px]">
        <span className="flex items-center gap-1.5">
          <Kbd keys="arrowup arrowdown" size="sm" />
          Navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys="enter" size="sm" />
          Select
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd keys="?" size="sm" />
          Shortcuts
        </span>
      </div>
    </Command.Dialog>
  )
}
