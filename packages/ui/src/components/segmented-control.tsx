import * as React from 'react'

import { cn } from '../lib/cn'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  // Longer form for assistive tech, when the visible label is an
  // abbreviation ("14d" -> "Last 14 days").
  description?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'default'
  className?: string
}

// A small set of mutually exclusive choices where all options are worth
// showing at once — a time range, a granularity. Anything longer than four
// options belongs in a Select; this is deliberately not a general-purpose
// tab bar.
//
// Arrow keys move between options, matching the radiogroup pattern, so it
// is one tab stop rather than four.
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'default',
  className,
}: SegmentedControlProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (delta === 0) return
    event.preventDefault()
    const next = (index + delta + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'bg-surface-muted inline-flex gap-0.5 rounded-lg p-0.5',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.description}
            // Only the selected option is in the tab order; arrow keys
            // handle movement once focus is inside.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'focus-visible:ring-ring/50 rounded-md font-medium transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none',
              size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs',
              selected
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
