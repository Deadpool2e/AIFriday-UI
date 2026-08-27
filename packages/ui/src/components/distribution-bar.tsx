import * as React from 'react'

import { cn } from '../lib/cn'
import { toneDotClass, toneMarkClass, type Tone } from '../lib/tone'
import { Skeleton } from './skeleton'

export interface DistributionSegment {
  id: string
  label: string
  value: number
  tone?: Tone
  // Hatches the fill. For the second slice of an ordered pair that shares
  // a hue on purpose — High and Critical risk are both "red", and two
  // adjacent red segments separated by a 2px gap read as one block. The
  // hatch keeps the severity reading ("still red") while making the two
  // tellable apart, including in greyscale.
  pattern?: boolean
  // Shown under the legend row — the one-line reason this slice matters
  // ("2 awaiting a human"), not a repeat of the number beside it.
  detail?: string
}

// A surface-coloured hatch laid over the fill, so it works on whatever
// tone it's applied to and in either theme.
const HATCH: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0 3px, color-mix(in oklab, var(--card) 60%, transparent) 3px 6px)',
}

interface DistributionBarProps extends React.ComponentProps<'div'> {
  segments: DistributionSegment[]
  // What the parts add up to, in words: "47 open requests". Rendered as
  // the panel's headline so the percentages below have a denominator the
  // reader can see.
  totalLabel?: string
  isLoading?: boolean
  emptyLabel?: string
}

// A composition: parts of one known whole, drawn as a single stacked bar
// with a legend under it.
//
// This is the form a ranked bar list gets wrong. Four risk levels are not
// four independent measurements to be ranked against the biggest one —
// they are four slices of the same queue, and the fact worth seeing is
// how the queue divides. One bar states that in a glance; four bars make
// the reader add the numbers up themselves. It also gives a page a second
// visual language, so two breakdowns side by side stop reading as the
// same tile printed twice.
function DistributionBar({
  segments,
  totalLabel,
  isLoading = false,
  emptyLabel = 'Nothing to show yet.',
  className,
  ...props
}: DistributionBarProps) {
  if (isLoading) {
    return (
      <div className={cn('@container/dist space-y-4', className)}>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="@md/dist:grid-cols-2 grid gap-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (segments.length === 0 || total === 0) {
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

  // A slice worth 0 has no width, and a 2px gap either side of nothing is
  // just a hole in the bar — so it lives in the legend only, where the
  // zero is the whole point ("Failed: 0").
  const drawn = segments.filter((segment) => segment.value > 0)

  return (
    <div className={cn('@container/dist space-y-4', className)} {...props}>
      {totalLabel && (
        <p className="text-sm font-semibold tracking-tight">{totalLabel}</p>
      )}

      {/* One mark per slice, separated by a 2px gap of the card surface so
          two adjacent tones never touch — the gap does the separating, not
          a border, which would eat into a 6px-tall mark. */}
      <div
        role="img"
        aria-label={segments
          .map(
            (segment) =>
              `${segment.label}: ${segment.value} of ${total} (${Math.round((segment.value / total) * 100)}%)`,
          )
          .join(', ')}
        className="flex h-2.5 gap-0.5 overflow-hidden"
      >
        {drawn.map((segment) => (
          <span
            key={segment.id}
            className={cn(
              // flex-grow, not transform: each segment's width is relative
              // to its siblings in one shared track, so there's no single
              // element to scaleX independently. Segment values change
              // rarely (an incident count, not a live stream), so the
              // layout-property cost here is low.
              'h-full rounded-full transition-[flex-grow] duration-(--duration-slow) ease-out',
              toneMarkClass[segment.tone ?? 'neutral'],
            )}
            // Grow rather than a percentage width: the 2px gaps come out
            // of the same row, so percentages would overflow by (n-1)×2px
            // and the last slice would be clipped.
            style={{
              flexGrow: segment.value,
              flexBasis: 0,
              ...(segment.pattern ? HATCH : null),
            }}
          />
        ))}
      </div>

      {/* Two columns only when the card is actually wide enough for them —
          a viewport breakpoint would put two legend columns inside a
          380px sidebar card on a desktop screen. */}
      <ul className="@md/dist:grid-cols-2 grid gap-x-6 gap-y-2.5">
        {segments.map((segment) => {
          const percent = Math.round((segment.value / total) * 100)
          const empty = segment.value === 0
          return (
            <li key={segment.id} className="flex items-baseline gap-2 text-sm">
              <span
                aria-hidden="true"
                style={segment.pattern && !empty ? HATCH : undefined}
                className={cn(
                  'size-2 shrink-0 translate-y-[-1px] rounded-full',
                  empty
                    ? 'ring-border bg-transparent ring-1'
                    : toneDotClass[segment.tone ?? 'neutral'],
                )}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  empty && 'text-muted-foreground',
                )}
              >
                {segment.label}
                {segment.detail && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {segment.detail}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'shrink-0 font-semibold tabular-nums',
                  empty && 'text-muted-foreground font-normal',
                )}
              >
                {segment.value.toLocaleString('en-US')}
              </span>
              <span className="text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums">
                {percent}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { DistributionBar }
