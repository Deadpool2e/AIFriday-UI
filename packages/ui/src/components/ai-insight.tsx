import * as React from 'react'
import { SparklesIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'

interface AIInsightProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  observation: string
  driver?: string
  actionLabel?: string
  onAction?: () => void
}

// Deliberately distinct from KPIWidget/Card — a soft glow ring plus a
// radial wash in the single reserved AI-accent hue, so an AI-generated
// observation reads as categorically different from a raw metric even at a
// glance, without repeating the same accent anywhere else on the page.
function AIInsight({
  observation,
  driver,
  actionLabel,
  onAction,
  className,
  ...props
}: AIInsightProps) {
  return (
    <div
      data-slot="ai-insight"
      className={cn(
        'bg-surface ring-ai-accent/25 relative overflow-hidden rounded-xl p-4 shadow-[0_0_0_1px_var(--color-ai-accent)_inset,0_8px_24px_-8px_var(--color-ai-accent)] ring-1',
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'var(--gradient-ai-radial)' }}
        aria-hidden="true"
      />
      <div className="relative space-y-2">
        <p className="text-ai-accent flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <SparklesIcon className="size-3.5" aria-hidden="true" />
          AI insight
        </p>
        <p className="text-sm leading-snug">{observation}</p>
        {driver && (
          <p className="text-muted-foreground text-xs">
            Primary driver: <span className="text-foreground">{driver}</span>
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export { AIInsight }
