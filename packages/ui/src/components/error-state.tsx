import * as React from 'react'
import { AlertTriangleIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'

interface ErrorStateProps extends React.ComponentProps<'div'> {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        'border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-3 rounded-lg border p-10 text-center',
        className,
      )}
      {...props}
    >
      <AlertTriangleIcon className="text-destructive size-8" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm">
            {description}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
