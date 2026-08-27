import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { AnimatedNumber } from './animated-number'
import { Skeleton } from './skeleton'

export interface MetricStripDelta {
  value: string
  tone: 'positive' | 'negative' | 'neutral'
  direction?: 'up' | 'down'
}

export interface MetricStripItem {
  id: string
  label: string
  value: string | number
  delta?: MetricStripDelta
  // Period this delta compares against — "vs prior 7 days".
  comparisonLabel?: string
  // A unit that belongs to the number rather than beside it: "ms", "%".
  // Rendered smaller and muted so the figure itself stays the shape the
  // eye locks onto when scanning the row.
  unit?: string
  // A live dot after the label, for a metric that is genuinely updating
  // rather than a total over a closed window.
  live?: boolean
  // Marks the metric as unavailable rather than zero. A dash reads as
  // "nothing to say"; a 0 reads as a measurement.
  empty?: boolean
  // The page that explains this number. Set it only where a real
  // destination exists — an arrow that leads nowhere useful is worse than
  // no arrow, and one on every tile stops meaning anything.
  href?: string
  // Overrides the link's accessible name. Defaults to "Open <label>".
  hrefLabel?: string
}

const deltaToneClass: Record<MetricStripDelta['tone'], string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-muted-foreground',
}

// `onSelect` and `label` both collide with native <div> attributes, so
// they're omitted from the spread props rather than renamed — these names
// are the right ones for what they do here.
interface MetricStripProps extends Omit<
  React.ComponentProps<'div'>,
  'onSelect' | 'label'
> {
  items: MetricStripItem[]
  // When set, the strip becomes a tablist driving a panel elsewhere on the
  // page. Omit both and it's a read-only summary bar.
  selectedId?: string
  onSelect?: (id: string) => void
  // Accessible name for the tablist / group. Required, since "a row of
  // numbers" tells a screen-reader user nothing.
  label: string
  isLoading?: boolean
  // Turns an item's `href` into a real link. Kept as a callback so the
  // app's router owns navigation rather than this package. Must return a
  // block-level element (`className="block"` on a router Link).
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode
}

// Horizontal padding sits on the outer tile so `first:` can flush the
// leading metric with the page edge; vertical padding sits on the inner
// body so a linked tile's hover and focus ring hug its content instead of
// bleeding into the gutter between metrics.
const TILE_OUTER = 'group relative min-w-0 flex-1 px-1 lg:px-5 lg:first:pl-0'
const TILE_BODY = 'py-4 text-left'

// A row of headline numbers held between two hairlines — no card, no
// per-metric borders, no dividers.
//
// The previous version boxed each metric in its own bordered cell, which
// drew five vertical rules through the most important row on the page and
// made six related figures read as six unrelated objects. Whitespace and a
// single shared baseline group them far better than borders do, and the
// ink saved goes back into the numbers.
function MetricStrip({
  items,
  selectedId,
  onSelect,
  label,
  isLoading = false,
  renderLink,
  className,
  ...props
}: MetricStripProps) {
  const selectable = Boolean(onSelect)

  return (
    <div
      data-slot="metric-strip"
      className={cn('border-y', className)}
      role={selectable ? 'tablist' : 'group'}
      aria-label={label}
      {...props}
    >
      {/* Wraps to two rows on narrow screens rather than scrolling
          horizontally — a metric you have to scroll to find is a metric
          nobody reads. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
        {isLoading
          ? Array.from({ length: Math.max(items.length, 4) }).map(
              (_, index) => (
                <div key={index} className={cn(TILE_OUTER, 'space-y-2 py-4')}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ),
            )
          : items.map((item) => {
              const selected = selectable && item.id === selectedId
              const linkable = Boolean(item.href && renderLink)

              const arrow = (
                <ArrowUpRightIcon
                  className="size-3.5 shrink-0 opacity-45 transition-opacity duration-(--duration-fast) group-hover:opacity-100"
                  aria-hidden="true"
                />
              )

              // The metric's identity: label, figure, comparison. Shared
              // by every branch below so a linked tile and a plain one are
              // pixel-identical apart from the arrow.
              const body = (
                <>
                  <p
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium transition-colors duration-(--duration-fast)',
                      selected || !selectable
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.live && (
                      <span
                        className="relative flex size-1.5 shrink-0"
                        aria-hidden="true"
                      >
                        <span className="bg-info absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                        <span className="bg-info relative inline-flex size-1.5 rounded-full" />
                      </span>
                    )}
                    {/* On a plain tile the whole thing is the link, so the
                        arrow sits inline right after the label — exactly
                        where the eye already is. */}
                    {linkable && !selectable && arrow}
                  </p>

                  <p className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums lg:text-[1.75rem]">
                      {item.empty ? (
                        <span className="text-muted-foreground">—</span>
                      ) : typeof item.value === 'number' ? (
                        <AnimatedNumber value={item.value} />
                      ) : (
                        item.value
                      )}
                    </span>
                    {item.unit && !item.empty && (
                      <span className="text-muted-foreground text-sm font-medium">
                        {item.unit}
                      </span>
                    )}
                  </p>

                  {/* Deliberately quieter than the figure above it: a
                      period-over-period change is context for the number,
                      not a competing headline. The row is always rendered
                      so every metric's value sits on one baseline. */}
                  <p className="mt-1 flex min-h-4 items-center gap-1.5 text-[11px]">
                    {item.delta && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 font-medium tabular-nums',
                          deltaToneClass[item.delta.tone],
                        )}
                      >
                        {item.delta.direction === 'up' && (
                          <ArrowUpIcon className="size-2.5" />
                        )}
                        {item.delta.direction === 'down' && (
                          <ArrowDownIcon className="size-2.5" />
                        )}
                        {item.delta.value}
                      </span>
                    )}
                    {item.comparisonLabel && (
                      <span className="text-muted-foreground/80 truncate">
                        {item.comparisonLabel}
                      </span>
                    )}
                  </p>
                </>
              )

              // A selectable tile is a tab; its click already means
              // "chart this". The link therefore cannot live inside it —
              // an <a> nested in a <button> is invalid HTML, and two
              // actions in one target is ambiguous regardless. It sits as
              // a sibling, pinned to the tile's top-right so it still
              // reads as belonging to the label.
              if (selectable) {
                return (
                  <div key={item.id} className={TILE_OUTER}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => onSelect?.(item.id)}
                      className={cn(
                        TILE_BODY,
                        'focus-visible:ring-ring/50 w-full cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none',
                      )}
                    >
                      {/* The selected marker sits on the strip's own
                          bottom hairline, so choosing a metric reads as a
                          tab being picked rather than a tile being
                          highlighted — no fill, no extra border. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-0 -bottom-px h-0.5 transition-all duration-(--duration-base) ease-out',
                          selected
                            ? 'bg-primary opacity-100'
                            : 'bg-border-strong opacity-0 group-hover:opacity-100',
                        )}
                      />
                      {body}
                    </button>
                    {linkable &&
                      renderLink!(
                        item.href!,
                        <span
                          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-4 right-1 inline-flex rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none lg:right-5"
                          aria-label={item.hrefLabel ?? `Open ${item.label}`}
                        >
                          {arrow}
                        </span>,
                      )}
                  </div>
                )
              }

              if (linkable) {
                return (
                  <div key={item.id} className={TILE_OUTER}>
                    {renderLink!(
                      item.href!,
                      <span
                        className={cn(
                          TILE_BODY,
                          'hover:bg-accent/25 focus-visible:ring-ring/50 -mx-2 block rounded-md px-2 transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none',
                        )}
                      >
                        {body}
                      </span>,
                    )}
                  </div>
                )
              }

              return (
                <div key={item.id} className={TILE_OUTER}>
                  <div className={TILE_BODY}>{body}</div>
                </div>
              )
            })}
      </div>
    </div>
  )
}

export { MetricStrip }
