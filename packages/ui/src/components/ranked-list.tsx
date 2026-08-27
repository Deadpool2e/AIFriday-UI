import * as React from 'react'

import { cn } from '../lib/cn'
import { toneMarkClass, toneTextClass, type Tone } from '../lib/tone'
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
  tone?: Tone
}

interface RankedListProps extends Omit<React.ComponentProps<'ul'>, 'children'> {
  items: RankedListItem[]
  isLoading?: boolean
  // Rows to render while loading. Reserving the real row count keeps the
  // panel from resizing when data lands.
  loadingRows?: number
  emptyLabel?: string
  // 'bar' gives each row its own full-width track with the measurement
  // drawn inside it; 'inline' keeps the row to one line with a short
  // meter between the label and the figure. Two forms, so two ranked
  // breakdowns sitting side by side on a page don't read as one repeated
  // tile.
  variant?: 'bar' | 'inline'
  // What the fill is measured against. 'max' answers "how does this
  // compare to the leader" — the right question for a ranking, but it
  // pins the top row at 100% every time, so a set of near-equal values
  // renders as a stack of identical full-width slabs. 'total' answers
  // "how much of the whole is this", which keeps the differences honest
  // when the values are close.
  scale?: 'max' | 'total'
  // Renders each row's share of the total as a muted percentage beside
  // its figure. Only meaningful when the items partition a whole.
  showShare?: boolean
  // Position numerals down the left edge. For a ranking whose order is
  // the point (busiest agents), not for a fixed-order breakdown whose
  // rows always appear in the same sequence (risk levels).
  numbered?: boolean
  // Wraps each row in a link. The callback owns navigation so the app's
  // router does, not this component — it must return an element that is
  // block-level and full-width (`className="block"` on a router Link).
  renderLink?: (
    item: RankedListItem,
    children: React.ReactNode,
  ) => React.ReactNode
}

// A ranked breakdown that reads as a table but scans as a chart: relative
// magnitude is visible without looking at a single number, and the exact
// figure is still right there for anyone who needs it.
//
// The measurement is drawn as a fill inside a visible track, not as the
// row's own background. When the bar *was* the background, the largest row
// spanned the full width of its card edge to edge — with nothing to read it
// against, a 47-out-of-47 and a 15-out-of-16 both just looked like "a
// coloured card row", and five of them in a column merged into one slab.
// The track supplies the missing half of the comparison: the unfilled
// remainder.
function RankedList({
  items,
  isLoading = false,
  loadingRows = 5,
  emptyLabel = 'Nothing to show yet.',
  variant = 'bar',
  scale = 'max',
  showShare = false,
  numbered = false,
  renderLink,
  className,
  ...props
}: RankedListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(variant === 'bar' ? 'space-y-4' : 'space-y-2', className)}
      >
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton
            key={index}
            className={variant === 'bar' ? 'h-9 w-full' : 'h-7 w-full'}
          />
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

  const max = Math.max(...items.map((item) => item.value), 1)
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const basis = scale === 'total' ? Math.max(total, 1) : max

  return (
    <ul
      className={cn(variant === 'bar' ? 'space-y-3.5' : 'space-y-1', className)}
      {...props}
    >
      {items.map((item, index) => {
        // A zero draws no fill at all. A minimum-width stub would render
        // "Failed: 0" as a red nub, which reads as a small failure rather
        // than none — the empty track already says it.
        const share = item.value > 0 ? (item.value / basis) * 100 : 0
        const tone: Tone = item.tone ?? 'neutral'
        const percentOfTotal = total > 0 ? (item.value / total) * 100 : 0

        const label = (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {numbered && (
              <span className="text-muted-foreground w-3 shrink-0 text-xs tabular-nums">
                {index + 1}
              </span>
            )}
            {item.icon && (
              <span
                className={cn(
                  'shrink-0 [&_svg]:size-3.5',
                  item.value > 0
                    ? toneTextClass[tone]
                    : 'text-muted-foreground',
                )}
              >
                {item.icon}
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </span>
        )

        const figures = (
          <span className="flex shrink-0 items-baseline gap-2">
            {item.meta && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {item.meta}
              </span>
            )}
            <span
              className={cn(
                'font-semibold tabular-nums',
                item.value === 0 && 'text-muted-foreground font-normal',
              )}
            >
              {item.displayValue ?? item.value.toLocaleString('en-US')}
            </span>
            {showShare && (
              <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                {Math.round(percentOfTotal)}%
              </span>
            )}
          </span>
        )

        // Thin mark, rounded ends, drawn in a recessive track — the same
        // anatomy as every other bar in the product.
        const meter = (
          <span
            aria-hidden="true"
            className={cn(
              'bg-muted/60 block overflow-hidden rounded-full',
              variant === 'bar' ? 'h-1.5 w-full' : 'h-1 w-14 shrink-0',
            )}
          >
            <span
              className={cn(
                'block h-full w-full origin-left rounded-full transition-transform duration-(--duration-slow) ease-out',
                toneMarkClass[tone],
              )}
              style={{ transform: `scaleX(${share / 100})` }}
            />
          </span>
        )

        const row =
          variant === 'bar' ? (
            <div className="space-y-1.5 rounded-md px-1 py-0.5">
              <div className="flex items-baseline gap-3 text-sm">
                {label}
                {figures}
              </div>
              {meter}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm">
              {label}
              {meter}
              {figures}
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
