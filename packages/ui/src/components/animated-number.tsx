import * as React from 'react'

interface AnimatedNumberProps {
  value: number
  // Applied via Intl.NumberFormat right before render — kept as a plain
  // formatter function rather than separate `decimals`/`prefix`/`suffix`
  // props so callers can do "$1,234.56" or "94%" with one function instead
  // of composing several props.
  format?: (value: number) => string
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Reads `<html data-motion>` directly rather than @platform/theme's
// useTheme() — packages/ui stays framework-of-provider-agnostic (no
// dependency on the theme package), and this is the exact same attribute
// ThemeProvider already sets on the root element for the global
// `[data-motion='reduced'] *` CSS kill-switch, so the two stay in sync for
// free.
function prefersReducedMotion() {
  return typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced'
}

// Tweens on *change*, not on mount — the first render shows the real value
// immediately (counting up from 0 every page load reads as a gimmick, not
// live data, per the dashboard "don't fake liveness" rule this app already
// follows elsewhere). Skips straight to the final value when the user has
// reduced motion set.
function AnimatedNumber({ value, format = (v) => v.toLocaleString('en-US') }: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value)
  const fromRef = React.useRef(value)
  const mountedRef = React.useRef(false)
  const frameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      fromRef.current = value
      setDisplay(value)
      return
    }
    if (prefersReducedMotion() || value === fromRef.current) {
      fromRef.current = value
      setDisplay(value)
      return
    }

    const from = fromRef.current
    const delta = value - from
    const duration = 500
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      setDisplay(from + delta * easeOutExpo(t))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [value])

  return <span className="tabular-nums">{format(Math.round(display))}</span>
}

export { AnimatedNumber }
