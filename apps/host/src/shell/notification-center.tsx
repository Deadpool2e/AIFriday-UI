import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BellIcon, CheckCheckIcon } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ShieldClearIllustration,
} from '@platform/ui'

interface NotificationItem {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'danger' | 'success'
  read: boolean
  timestamp: string
  // Where this event actually happened. A notification you can't act on
  // is just a log line; every one of these opens the screen that shows
  // the thing it's telling you about.
  to: string
}

// Local-only mock state for now — becomes a real API + SSE feed once the
// telemetry/API layers exist (Phase 13/21). Shapes intentionally mirror
// the event categories from the SSE event contract (Section 46).
const initialNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    title: 'Human approval required',
    description: 'REQ-92833 needs manager sign-off before proceeding.',
    severity: 'warning',
    read: false,
    timestamp: '5 min ago',
    to: '/approvals',
  },
  {
    id: 'NOTIF-2',
    title: 'Guardrail triggered',
    description:
      'Prompt injection pattern detected on EXEC-4021 — request blocked.',
    severity: 'danger',
    read: false,
    timestamp: '22 min ago',
    to: '/control-tower/guardrails',
  },
  {
    id: 'NOTIF-3',
    title: 'AI workflow completed',
    description: 'REQ-92831 finished processing with 94% confidence.',
    severity: 'success',
    read: true,
    timestamp: '1 hour ago',
    to: '/requests/REQ-92831',
  },
]

const severityDot: Record<NotificationItem['severity'], string> = {
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  success: 'bg-success',
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const navigate = useNavigate()
  const unreadCount = notifications.filter((item) => !item.read).length

  function open(item: NotificationItem) {
    setNotifications((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry,
      ),
    )
    navigate(item.to)
  }

  return (
    <DropdownMenu>
      {/* No tooltip on this trigger: it opens a panel that names itself,
          and a tooltip that lingers over an open menu is noise. The
          accessible name carries the unread count instead. */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <BellIcon />
          {/* A dot, not a red count chip. The count is already in the
                accessible name and at the top of the panel; a permanent
                red badge in the chrome trains people to ignore red. */}
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="bg-info ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-84 p-1">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <DropdownMenuLabel className="p-0">
            Notifications
            {unreadCount > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs font-normal tabular-nums">
                {unreadCount} unread
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-1.5 py-1 text-xs"
              onClick={(event) => {
                // Keep the panel open — marking everything read is a
                // maintenance action, not a navigation, and closing on it
                // hides the result of what you just did.
                event.preventDefault()
                setNotifications((prev) =>
                  prev.map((item) => ({ ...item, read: true })),
                )
              }}
            >
              <CheckCheckIcon className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <EmptyState
            icon={<ShieldClearIllustration />}
            title="Nothing new"
            description="Alerts, approvals, and guardrail events show up here."
            size="compact"
            className="border-none"
          />
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-sm',
                  'transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none',
                  !item.read && 'bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    severityDot[item.severity],
                    item.read && 'opacity-40',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className={cn('block', !item.read && 'font-medium')}>
                    {item.title}
                  </span>
                  <span className="text-muted-foreground block text-xs text-pretty">
                    {item.description}
                  </span>
                  <span className="text-muted-foreground/70 block text-[11px]">
                    {item.timestamp}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
