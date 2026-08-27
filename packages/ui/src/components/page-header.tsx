import * as React from 'react'

import { cn } from '../lib/cn'

interface PageHeaderProps extends Omit<
  React.ComponentProps<'header'>,
  'title'
> {
  // The nav group this page belongs to ("Workspace", "AI Operations").
  // Answers "where am I?" before the title answers "what is this?".
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  // Primary/secondary actions, right-aligned. Overflow belongs in a
  // dropdown here, not a fourth button.
  actions?: React.ReactNode
  // Status chips (live indicator, demo-data badge) — visually separated
  // from actions because they're information, not affordances.
  meta?: React.ReactNode
  // Tabs or a filter bar bound to this page, rendered inside the header's
  // border so it reads as part of the page frame rather than as the first
  // piece of content.
  toolbar?: React.ReactNode
  // A soft radial wash, reserved for the two landing screens (Overview,
  // Control Tower) — the places a first-time user arrives. Every other
  // page stays flat, so the wash still means something.
  ambient?: boolean
  // Full-bleed to the main scroll container's padding edge. Correct for a
  // full-width page; wrong for one inside a max-width column (Settings,
  // the design system), where the bleed would escape on the left and stop
  // mid-page on the right.
  bleed?: boolean
}

// One page frame for every screen in both federated apps. Previously each
// page hand-rolled its own eyebrow/h1/description stack, which is how the
// same header ended up at text-3xl in Main App and text-2xl in Control
// Tower with different margins under each. Titles are deliberately at
// text-xl: a page title is a landmark, not a billboard, and the vertical
// space it used to eat is content the user actually came for.
function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  toolbar,
  ambient = false,
  bleed = true,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'relative border-b pb-4',
        // The negative margins pull the header out to the main scroll
        // container's own padding so its bottom border spans the full
        // width, the way an application chrome edge should.
        bleed && '-mx-4 -mt-4 px-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6',
        className,
      )}
      style={
        ambient
          ? { backgroundImage: 'var(--gradient-primary-radial)' }
          : undefined
      }
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
            {meta}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {/* Header-level content — a stat strip, a summary row. Sits between
          the title block and the toolbar so the page's numbers are part of
          its identity rather than the first card below it. */}
      {children && <div className="mt-4">{children}</div>}
      {/* The toolbar is flush with the header's bottom border, so tabs
          read as attached to the page frame instead of floating above the
          content. */}
      {toolbar && <div className="-mb-4 mt-4">{toolbar}</div>}
    </header>
  )
}

export { PageHeader }
