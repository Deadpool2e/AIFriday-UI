import * as React from 'react'

import { cn } from '../lib/cn'

interface CardProps extends React.ComponentProps<'div'> {
  // Opt in to hover affordance. Previously every Card lifted and gained a
  // shadow on hover, including the ~90% that aren't clickable — motion
  // that promises an interaction the card can't deliver, which is exactly
  // the "everything animates" tell we're trying to remove. A static
  // container now stays still; only a card you can actually click
  // responds to the pointer.
  interactive?: boolean
}

// Vertical padding lives on the Card, horizontal on its slots.
//
// It used to be split the other way — CardHeader owned pt-6 and CardFooter
// owned pb-6 — which meant a card with no footer had *no bottom padding at
// all* and its last row sat flush against the border. That's most cards in
// this app; the bug was only invisible where a grid stretched the card
// taller than its content. Padding is a property of the container, not of
// whichever child happens to be last.
function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive || undefined}
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-xs',
        interactive &&
          'hover:border-border-strong focus-within:border-border-strong cursor-pointer transition-[border-color,box-shadow,transform] duration-(--duration-fast) ease-out hover:-translate-y-px hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
}
