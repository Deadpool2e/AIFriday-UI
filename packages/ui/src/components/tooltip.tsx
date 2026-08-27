import * as React from 'react'

import { cn } from '../lib/cn'

type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  // The tooltip's text. Kept short on purpose: a tooltip that needs rich
  // content is a popover, and should be one.
  content: React.ReactNode
  side?: TooltipSide
  // Hover intent. Long enough that sweeping the pointer across a toolbar
  // doesn't fire a trail of tooltips; short enough to feel responsive when
  // someone actually pauses on a control. Focus opens with no delay —
  // a keyboard user has already committed.
  delayMs?: number
  // Optional keyboard hint rendered after the label, so a control can
  // teach its own shortcut where it's used.
  shortcut?: string
  children: React.ReactElement<{ 'aria-describedby'?: string }>
}

const GAP_PX = 8

const TRANSFORM: Record<TooltipSide, string> = {
  top: 'translate(-50%, -100%)',
  bottom: 'translate(-50%, 0)',
  left: 'translate(-100%, -50%)',
  right: 'translate(0, -50%)',
}

function anchorFor(rect: DOMRect, side: TooltipSide) {
  switch (side) {
    case 'bottom':
      return { top: rect.bottom + GAP_PX, left: rect.left + rect.width / 2 }
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - GAP_PX }
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + GAP_PX }
    default:
      return { top: rect.top - GAP_PX, left: rect.left + rect.width / 2 }
  }
}

// Positioned with fixed coordinates measured from the trigger rather than
// as an absolutely-positioned sibling: several of the places that need a
// tooltip (the collapsed sidebar rail, table cells) live inside scroll
// containers that would clip an in-flow tooltip.
//
// The trigger is measured from the event's own currentTarget rather than
// through a cloned ref — the child keeps whatever ref it already had, and
// this component never has to merge one.
function Tooltip({
  content,
  side = 'top',
  delayMs = 350,
  shortcut,
  children,
}: TooltipProps) {
  const [coords, setCoords] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = React.useId()

  const clear = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const hide = React.useCallback(() => {
    clear()
    setCoords(null)
  }, [clear])

  const show = React.useCallback(
    (element: HTMLElement, immediate: boolean) => {
      clear()
      const reveal = () =>
        setCoords(anchorFor(element.getBoundingClientRect(), side))
      if (immediate) reveal()
      else timer.current = setTimeout(reveal, delayMs)
    },
    [clear, delayMs, side],
  )

  React.useEffect(() => () => clear(), [clear])

  // Escape closes it, matching every other transient surface in the app.
  // Scrolling or resizing invalidates the measured position, so the
  // tooltip is dismissed rather than left stranded mid-page.
  React.useEffect(() => {
    if (!coords) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') hide()
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [coords, hide])

  const trigger = React.cloneElement(children, {
    'aria-describedby': coords ? id : undefined,
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) =>
      show(event.currentTarget, false),
    onMouseLeave: hide,
    onFocus: (event: React.FocusEvent<HTMLElement>) =>
      show(event.currentTarget, true),
    onBlur: hide,
  } as Record<string, unknown>)

  return (
    <>
      {trigger}
      {coords && (
        <div
          id={id}
          role="tooltip"
          style={{
            top: coords.top,
            left: coords.left,
            transform: TRANSFORM[side],
          }}
          className={cn(
            'bg-surface-elevated text-foreground animate-in fade-in-0 zoom-in-95 pointer-events-none fixed z-(--z-dropdown)',
            'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium shadow-md duration-(--duration-fast)',
          )}
        >
          {content}
          {shortcut && (
            <kbd className="bg-muted text-muted-foreground rounded border px-1 py-px font-mono text-[10px]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </>
  )
}

export { Tooltip }
