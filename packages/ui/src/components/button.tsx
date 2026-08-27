import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2Icon } from 'lucide-react'

import { cn } from '../lib/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    // Press feedback: a 1% scale-down that resolves in 90ms. Small enough
    // that it reads as the surface depressing rather than the button
    // shrinking, and it fires on pointer-down, so the UI acknowledges the
    // click before any async work has started.
    'transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-fast) ease-snap active:scale-[0.99]',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    // While pending the button keeps its footprint and stays interactive
    // to a screen reader (aria-busy), but swallows clicks.
    'aria-[busy=true]:pointer-events-none aria-[busy=true]:cursor-progress',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-border-strong',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline active:scale-100',
        // Reserved for AI-initiated actions, so an "Ask Vizorion" button is
        // visibly a different *kind* of action than "Save" — see the
        // --ai-accent token's own note in tokens.css.
        ai: 'bg-ai-accent text-ai-accent-foreground shadow-xs hover:bg-ai-accent/90',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  // Async in-flight state. Owned by the button rather than re-implemented
  // per call site (which is how we ended up with "Signing in…" as a hand
  // -swapped string in one place and a bare disabled prop in another).
  // The label stays put and the spinner replaces the leading icon, so the
  // button never changes width mid-action.
  pending?: boolean
  // Announced to assistive tech while pending, and shown as the visible
  // label when there is room for it.
  pendingLabel?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  pending = false,
  pendingLabel,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  // asChild delegates rendering entirely to the child (a Link, usually) —
  // injecting a spinner there would break its single-child contract, so
  // pending only decorates real buttons.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

export { Button, buttonVariants }
