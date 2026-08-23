import * as React from 'react'

import { cn } from '../lib/cn'

interface LiveIndicatorProps extends React.ComponentProps<'span'> {
  label?: string
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  // Demo data isn't actually live — showing "LIVE" over static mock data
  // would be dishonest, so this renders a quieter "Demo data" label
  // instead of the pulsing dot.
  isDemo?: boolean
}

const toneClass: Record<NonNullable<LiveIndicatorProps['tone']>, string> = {
  info: 'bg-info text-info',
  success: 'bg-success text-success',
  warning: 'bg-warning text-warning',
  danger: 'bg-danger text-danger',
  neutral: 'bg-muted-foreground text-muted-foreground',
}

const toneGlowClass: Record<NonNullable<LiveIndicatorProps['tone']>, string> = {
  info: 'shadow-[0_0_6px_var(--color-info)]',
  success: 'shadow-[0_0_6px_var(--color-success)]',
  warning: 'shadow-[0_0_6px_var(--color-warning)]',
  danger: 'shadow-[0_0_6px_var(--color-danger)]',
  neutral: 'shadow-none',
}

function LiveIndicator({ label = 'Live', tone = 'info', isDemo = false, className, ...props }: LiveIndicatorProps) {
  if (isDemo) {
    return (
      <span
        data-slot="live-indicator"
        className={cn(
          'text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wide',
          className,
        )}
        {...props}
      >
        <span className="border-muted-foreground/40 size-1.5 rounded-full border" aria-hidden="true" />
        Demo data
      </span>
    )
  }

  const [dotClass, textClass] = toneClass[tone].split(' ')

  return (
    <span
      data-slot="live-indicator"
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium tracking-wide', textClass, className)}
      {...props}
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotClass)} />
        <span className={cn('relative inline-flex size-1.5 rounded-full', dotClass, toneGlowClass[tone])} />
      </span>
      {label}
    </span>
  )
}

export { LiveIndicator }
