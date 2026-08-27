import * as React from 'react'

import { cn } from '../lib/cn'

interface SkeletonProps extends React.ComponentProps<'div'> {
  // A flat, non-animating block. For skeletons rendered *inside* an
  // already-animating container (the staged loader), where a second
  // independent animation just adds noise.
  static?: boolean
}

// A directional sweep rather than a pulse: a pulsing block reads as
// "disabled", a sweep reads as "being filled in". The gradient is built
// from theme tokens so it inverts in dark mode for free, and the whole
// animation is zeroed automatically under [data-motion='reduced'].
function Skeleton({
  className,
  static: isStatic,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'bg-surface-muted relative overflow-hidden rounded-md',
        !isStatic &&
          'animate-[skeleton-sweep_1.6s_ease-in-out_infinite] bg-[length:200%_100%]',
        className,
      )}
      style={
        isStatic
          ? style
          : {
              backgroundImage:
                'linear-gradient(90deg, var(--color-surface-muted) 0%, var(--color-surface-muted) 35%, color-mix(in oklab, var(--color-foreground) 7%, var(--color-surface-muted)) 50%, var(--color-surface-muted) 65%, var(--color-surface-muted) 100%)',
              ...style,
            }
      }
      {...props}
    />
  )
}

// Multi-line text skeleton with a short last line, so a loading paragraph
// has the ragged edge a real one does instead of reading as a solid block.
function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<'div'> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-3.5"
          style={{ width: index === lines - 1 ? '62%' : '100%' }}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText }
