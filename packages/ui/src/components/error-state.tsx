import * as React from 'react'
import { AlertTriangleIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'

interface ErrorStateProps extends React.ComponentProps<'div'> {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  // Technical cause — a status code, a message from the service. Folded
  // away by default: the person who needs it will open it, and everyone
  // else is better served by the plain-language line above.
  detail?: string
  isRetrying?: boolean
}

// The whole panel used to be tinted danger, which made an ordinary
// "couldn't reach the service, try again" read like a system failure. The
// surface is neutral now and only the icon carries the tone — the error
// is stated, not shouted.
function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
  detail,
  isRetrying = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        'bg-surface flex flex-col items-center justify-center gap-3 rounded-lg border p-10 text-center',
        className,
      )}
      {...props}
    >
      <span
        className="bg-danger/10 text-danger flex size-10 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <AlertTriangleIcon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm text-pretty">
            {description}
          </p>
        )}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          pending={isRetrying}
          pendingLabel="Retrying…"
        >
          {retryLabel}
        </Button>
      )}
      {detail && (
        <details className="w-full max-w-sm text-left">
          <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 cursor-pointer rounded text-xs transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none">
            Technical details
          </summary>
          <pre className="bg-surface-muted text-muted-foreground mt-2 overflow-x-auto rounded-md p-2.5 text-[11px] whitespace-pre-wrap">
            {detail}
          </pre>
        </details>
      )}
    </div>
  )
}

export { ErrorState }
