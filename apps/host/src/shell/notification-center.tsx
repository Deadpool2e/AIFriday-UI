import { useState } from 'react'
import { BellIcon, CheckCheckIcon } from 'lucide-react'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
} from '@platform/ui'

interface NotificationItem {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'danger' | 'success'
  read: boolean
  timestamp: string
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
  },
  {
    id: 'NOTIF-2',
    title: 'Guardrail triggered',
    description:
      'Prompt injection pattern detected on EXEC-4021 — request blocked.',
    severity: 'danger',
    read: false,
    timestamp: '22 min ago',
  },
  {
    id: 'NOTIF-3',
    title: 'AI workflow completed',
    description: 'REQ-92831 finished processing with 94% confidence.',
    severity: 'success',
    read: true,
    timestamp: '1 hour ago',
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
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <DropdownMenu>
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
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-1.5 py-1 text-xs"
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((item) => ({ ...item, read: true })),
                )
              }
            >
              <CheckCheckIcon className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" className="border-none p-6" />
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    severityDot[item.severity],
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 space-y-0.5">
                  <span
                    className={cn('block', !item.read && 'font-medium')}
                  >
                    {item.title}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {item.description}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {item.timestamp}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
