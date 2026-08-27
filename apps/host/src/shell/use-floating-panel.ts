import * as React from 'react'

// Escape-to-close and focus-restore for a non-modal floating panel (its
// own trigger button, not a full Dialog) — shared by VizorionLauncher and
// AutowakeWidget. Neither panel is a true modal (the rest of the page
// stays interactive behind it), so it doesn't get Radix Dialog's focus
// trap for free, but it should still behave like every other overlay in
// the app: Escape closes it, and closing returns focus to whatever opened
// it.
export function useFloatingPanel(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return

    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [open, onClose])
}
