import * as React from 'react'

import { cn } from '../lib/cn'
import { toneDotClass, toneTextClass } from '../lib/tone'

interface LiveIndicatorProps extends React.ComponentProps<'span'> {
  label?: string
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  // Demo data isn't actually live — showing "LIVE" over static mock data
  // would be dishonest, so this renders a quieter "Demo data" label
  // instead of the pulsing dot.
  isDemo?: boolean
}

// The dot is a status bullet paired with a label — lib/tone.ts's own Dot
// role — so it draws from the chart-tuned scale like every other dot/mark
// in the app, not the badge-tuned scale this used to hand-roll locally.
const toneGlowClass: Record<NonNullable<LiveIndicatorProps['tone']>, string> = {
  info: 'shadow-[0_0_6px_var(--color-chart-info)]',
  success: 'shadow-[0_0_6px_var(--color-chart-success)]',
  warning: 'shadow-[0_0_6px_var(--color-chart-warning)]',
  danger: 'shadow-[0_0_6px_var(--color-chart-danger)]',
  neutral: 'shadow-none',
}

interface LiveDotProps extends React.ComponentProps<'span'> {
  // The dot's paint, as a raw bg-* class (e.g. 'bg-info') rather than a Tone,
  // since call sites already compute this from mixed conditions (degraded
  // vs. operational, agent count, etc.) rather than a single semantic tone.
  dotClassName: string
  glowClassName?: string
  size?: 'sm' | 'md'
  // Whether the dot is announcing something currently happening (streaming,
  // an active agent) vs. a static status — an idle dot shouldn't animate.
  pulse?: boolean
}

// The "ambient life" halo shared by every live/streaming/active indicator in
// the app. Uses `animate-ambient-pulse`, not `animate-ping` — tokens.css is
// explicit that animate-ping's hard 1s pulse reads as an alarm, which is the
// wrong signal for "this is live," not wrong.
function LiveDot({
  dotClassName,
  glowClassName,
  size = 'sm',
  pulse = true,
  className,
  ...props
}: LiveDotProps) {
  const sizeClass = size === 'md' ? 'size-2' : 'size-1.5'
  return (
    <span
      className={cn('relative flex shrink-0', sizeClass, className)}
      aria-hidden="true"
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex size-full animate-ambient-pulse rounded-full opacity-60',
            dotClassName,
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizeClass,
          dotClassName,
          glowClassName,
        )}
      />
    </span>
  )
}

function LiveIndicator({
  label = 'Live',
  tone = 'info',
  isDemo = false,
  className,
  ...props
}: LiveIndicatorProps) {
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
        <span
          className="border-muted-foreground/40 size-1.5 rounded-full border"
          aria-hidden="true"
        />
        Demo data
      </span>
    )
  }

  return (
    <span
      data-slot="live-indicator"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium tracking-wide',
        toneTextClass[tone === 'neutral' ? 'neutral' : tone],
        className,
      )}
      {...props}
    >
      <LiveDot
        dotClassName={toneDotClass[tone === 'neutral' ? 'neutral' : tone]}
        glowClassName={toneGlowClass[tone]}
      />
      {label}
    </span>
  )
}

export { LiveIndicator, LiveDot }
