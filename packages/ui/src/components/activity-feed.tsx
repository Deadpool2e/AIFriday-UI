import * as React from 'react'

import { cn } from '../lib/cn'
import { toneDotClass } from '../lib/tone'

// Defined locally rather than importing ActivityItem from @platform/types.
// Layering rule for this whole design system: packages/ui never depends on
// packages/types (or any app-specific package) — it only knows generic
// shapes. packages/api-client is where the app's real ActivityItem gets
// mapped onto this shape. This keeps @platform/ui reusable by literally
// any future project, not just this one.
export interface ActivityFeedItem {
  id: string
  message: string
  timestamp: string
  severity: 'info' | 'success' | 'warning' | 'danger'
}

interface ActivityFeedProps extends React.ComponentProps<'ul'> {
  items: ActivityFeedItem[]
}

function ActivityFeed({ items, className, ...props }: ActivityFeedProps) {
  return (
    <ul
      data-slot="activity-feed"
      className={cn('space-y-3', className)}
      {...props}
    >
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 text-sm">
          <span
            className={cn(
              'mt-1.5 size-1.5 shrink-0 rounded-full',
              toneDotClass[item.severity],
            )}
            aria-hidden="true"
          />
          <div className="flex-1 space-y-0.5">
            <p>{item.message}</p>
            <p className="text-muted-foreground text-xs">{item.timestamp}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export { ActivityFeed }
