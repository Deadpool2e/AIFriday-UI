import * as React from 'react'

import { cn } from '../lib/cn'

// Platform-correct modifier glyphs. Rendering "Ctrl+K" to a Mac user (or
// "⌘K" to a Windows one) is a small thing that reads as the product not
// knowing where it's running. Resolved once, at module scope, because it
// cannot change during a session.
const IS_APPLE =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

const GLYPHS: Record<string, string> = {
  mod: IS_APPLE ? '⌘' : 'Ctrl',
  meta: IS_APPLE ? '⌘' : 'Win',
  alt: IS_APPLE ? '⌥' : 'Alt',
  shift: IS_APPLE ? '⇧' : 'Shift',
  enter: '↵',
  escape: 'Esc',
  esc: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  backspace: '⌫',
  space: 'Space',
}

interface KbdProps extends React.ComponentProps<'span'> {
  // Space-separated keys, e.g. "mod k" or "g r". Modifier aliases above
  // are translated; anything else is shown uppercased as typed.
  keys: string
  size?: 'sm' | 'default'
}

function Kbd({ keys, size = 'default', className, ...props }: KbdProps) {
  const parts = keys.trim().split(/\s+/)

  return (
    <span
      data-slot="kbd"
      className={cn('inline-flex items-center gap-0.5 font-mono', className)}
      {...props}
    >
      {parts.map((part, index) => {
        const glyph = GLYPHS[part.toLowerCase()] ?? part.toUpperCase()
        return (
          <kbd
            key={`${part}-${index}`}
            className={cn(
              'bg-muted text-muted-foreground inline-flex items-center justify-center rounded border font-medium',
              size === 'sm'
                ? 'h-4 min-w-4 px-1 text-[10px]'
                : 'h-5 min-w-5 px-1.5 text-[11px]',
            )}
          >
            {glyph}
          </kbd>
        )
      })}
    </span>
  )
}

export { Kbd, IS_APPLE }
