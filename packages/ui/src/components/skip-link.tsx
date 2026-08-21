import * as React from 'react'

import { cn } from '../lib/cn'

// Visually hidden until focused. Must be the first focusable element on
// the page — a keyboard user's very first Tab press should reveal it,
// letting them jump past repeated nav/sidebar chrome straight to the main
// content instead of tabbing through every nav link first.
function SkipLink({
  className,
  children = 'Skip to main content',
  ...props
}: React.ComponentProps<'a'>) {
  return (
    <a
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export { SkipLink }
