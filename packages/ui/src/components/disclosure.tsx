import * as React from 'react'
import { ChevronRightIcon } from 'lucide-react'

import { cn } from '../lib/cn'

interface DisclosureProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title: React.ReactNode
  // A one-line result shown on the trigger row itself — "3 passed, 1
  // flagged", "5 sources". This is what makes collapsing safe: the
  // section's conclusion stays visible, only the evidence folds away.
  summary?: React.ReactNode
  defaultOpen?: boolean
  // Section is present but has nothing in it. Renders the row greyed and
  // non-interactive rather than expanding into an empty box.
  disabled?: boolean
}

// Built on <details>/<summary> rather than a state-driven div: it is
// keyboard-operable, screen-reader-announced, and findable by the
// browser's own in-page search when collapsed — all for free, and all
// things a hand-rolled toggle gets wrong.
function Disclosure({
  title,
  summary,
  defaultOpen = false,
  disabled = false,
  className,
  children,
  ...props
}: DisclosureProps) {
  if (disabled) {
    return (
      <div
        className={cn(
          'text-muted-foreground flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm',
          className,
        )}
        {...props}
      >
        <span>{title}</span>
        {summary && <span className="text-xs">{summary}</span>}
      </div>
    )
  }

  return (
    <details
      className={cn('group rounded-lg border', className)}
      open={defaultOpen}
      {...(props as React.ComponentProps<'details'>)}
    >
      <summary className="hover:bg-accent/40 focus-visible:ring-ring/50 flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          className="text-muted-foreground size-3.5 shrink-0 transition-transform duration-(--duration-fast) ease-out group-open:rotate-90"
          aria-hidden="true"
        />
        <span className="font-medium">{title}</span>
        {summary && (
          <span className="text-muted-foreground ml-auto text-xs">
            {summary}
          </span>
        )}
      </summary>
      <div className="animate-in fade-in-0 slide-in-from-top-1 border-t px-3 py-3 duration-(--duration-fast)">
        {children}
      </div>
    </details>
  )
}

export { Disclosure }
