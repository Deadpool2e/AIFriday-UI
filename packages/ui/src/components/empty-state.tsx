import * as React from 'react'

import { cn } from '../lib/cn'

interface EmptyStateProps extends React.ComponentProps<'div'> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  // 'compact' is for empty states nested inside a card or a dropdown,
  // where the full-page version's padding and illustration scale would
  // dominate the container holding it.
  size?: 'default' | 'compact'
}

function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'default',
  className,
  ...props
}: EmptyStateProps) {
  const compact = size === 'compact'

  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed text-center',
        compact ? 'gap-2 p-6' : 'gap-3 p-10',
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            'text-muted-foreground',
            // 14 was large enough that the illustration became the
            // subject of the panel rather than the message.
            compact ? '[&_svg]:size-8' : '[&_svg]:size-12',
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm text-pretty">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
