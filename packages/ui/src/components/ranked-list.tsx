import * as React from 'react'

import { cn } from '../lib/cn'
import { Skeleton } from './skeleton'

export interface RankedListItem {
  id: string
  label: React.ReactNode
  value: number
  // Overrides the rendered figure without changing the bar's maths — for
  // a value that needs a unit, a currency, or an abbreviation.
  displayValue?: string
  // A muted secondary figure shown just before the value: a success rate
  // next to a request count, a share next to a total. Keeps two related
  // numbers in one row without welding them into a single string.
  meta?: string
  icon?: React.ReactNode
  // Bar colour. Defaults to a neutral fill; set it where the category
  // already has a meaning in the product (risk level, guardrail status).
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'
}

// Low-alpha fills with a full-strength left edge. A heavier wash turned
// each row into a solid colour block — at 20-25% over a dark surface the
// warning tone in particular came out muddy olive, and five slabs of it
// read as decoration rather than data. The bar is a secondary cue; the
// number is the measurement.
const toneFillClass: Record<NonNullable<RankedListItem['tone']>, string> = {
  neutral: 'bg-muted-foreground/10 border-muted-foreground/40',
  success: 'bg-success/12 border-success',
  warning: 'bg-warning/12 border-warning',
  danger: 'bg-danger/12 border-danger',
  info: 'bg-info/12 border-info',
  ai: 'bg-ai-accent/12 border-ai-accent',
}

interface RankedListProps extends React.ComponentProps<'ul'> {
  items: RankedListItem[]
  isLoading?: boolean
  // Rows to render while loading. Reserving the real row count keeps the
  // panel from resizing when data lands.
  loadingRows?: number
  emptyLabel?: string
  // Wraps each row in a link. The callback owns navigation so the app's
  // router does, not this component — it must return an element that is
  // block-level and full-width (`className="block"` on a router Link).
  renderLink?: (
    item: RankedListItem,
    children: React.ReactNode,
  ) => React.ReactNode
}

// A ranked breakdown where each row's bar *is* its background, rather than
// a separate bar chart sitting next to a separate list of labels.
//
// It reads as a table but scans as a chart: relative magnitude is visible
// without looking at a single number, and the exact figure is still right
// there for anyone who needs it. Far denser than a bar chart, and it
// survives long labels — which a horizontal bar chart's axis does not.
function RankedList({
  items,
  isLoading = false,
  loadingRows = 5,
  emptyLabel = 'Nothing to show yet.',
  renderLink,
  className,
  ...props
}: RankedListProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-1', className)}>
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p
        className={cn(
          'text-muted-foreground py-6 text-center text-sm',
          className,
        )}
      >
        {emptyLabel}
      </p>
    )
  }

  // Scaled against the largest row, not the total: the question a ranked
  // list answers is "how does this compare to the top one", and share-of-
  // total makes every row unreadably short as soon as there's a long tail.
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul className={cn('space-y-px', className)} {...props}>
      {items.map((item) => {
        const share = (item.value / max) * 100

        const row = (
          <div className="relative flex items-center gap-3 overflow-hidden rounded-md px-2.5 py-2 text-sm">
            {/* Positioned behind the row's content so a long label is
                never squeezed by it. A zero draws nothing at all — a
                minimum-width stub would render "Failed: 0" as a red nub,
                which reads as a small failure rather than none. */}
            {item.value > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-y-0 left-0 rounded-md border-l-2 transition-[width] duration-(--duration-slow) ease-out',
                  toneFillClass[item.tone ?? 'neutral'],
                )}
                style={{ width: `${Math.max(share, 1.5)}%` }}
              />
            )}

            <span className="relative flex min-w-0 flex-1 items-center gap-2">
              {item.icon && (
                <span className="text-muted-foreground shrink-0 [&_svg]:size-3.5">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </span>

            {item.meta && (
              <span className="text-muted-foreground relative shrink-0 text-xs tabular-nums">
                {item.meta}
              </span>
            )}
            {/* Right-aligned in a fixed-width column so the figures form a
                clean edge down the list instead of drifting with label
                length. */}
            <span className="relative shrink-0 text-right font-medium tabular-nums">
              {item.displayValue ?? item.value.toLocaleString('en-US')}
            </span>
          </div>
        )

        return (
          <li key={item.id}>
            {renderLink
              ? renderLink(
                  item,
                  <span className="hover:bg-accent/40 focus-visible:ring-ring/50 block rounded-md transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none">
                    {row}
                  </span>,
                )
              : row}
          </li>
        )
      })}
    </ul>
  )
}

export { RankedList }
