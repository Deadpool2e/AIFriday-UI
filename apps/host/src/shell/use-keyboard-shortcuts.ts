import * as React from 'react'
import { useNavigate } from 'react-router'

// Two-key "go to" sequences, Linear/Vim style: press `g`, then a letter.
// Chosen over single letters because a bare `r` for Requests would fire
// every time someone starts typing outside a field, and over modifiers
// because ⌘/Ctrl combinations collide with the browser's own.
export interface GoToShortcut {
  // The key pressed after `g`.
  key: string
  label: string
  to: string
}

export const GO_TO_SHORTCUTS: GoToShortcut[] = [
  { key: 'o', label: 'Overview', to: '/' },
  { key: 'r', label: 'Requests', to: '/requests' },
  { key: 'd', label: 'Documents', to: '/documents' },
  { key: 'a', label: 'Approvals', to: '/approvals' },
  { key: 'v', label: 'Vizorion', to: '/vizorion' },
  { key: 'c', label: 'Control Tower', to: '/control-tower' },
  { key: 's', label: 'Settings', to: '/settings' },
]

// How long the `g` prefix stays armed. Long enough to be typed
// deliberately, short enough that a stray `g` doesn't hijack the next
// keystroke a minute later.
const CHORD_WINDOW_MS = 1200

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

interface KeyboardShortcutsOptions {
  onOpenPalette: () => void
  onOpenShortcuts: () => void
  onOpenAssistant: () => void
  onToggleTheme: () => void
  // Suppressed while a dialog, drawer, or the palette owns the keyboard —
  // otherwise `g` inside the palette's own search field would navigate.
  enabled: boolean
}

// Returns the currently-armed chord prefix (or null) so the shell can show
// a small "g …" hint, which is what makes the shortcut layer discoverable
// instead of a secret only the presenter knows.
export function useKeyboardShortcuts({
  onOpenPalette,
  onOpenShortcuts,
  onOpenAssistant,
  onToggleTheme,
  enabled,
}: KeyboardShortcutsOptions) {
  const navigate = useNavigate()
  const [chord, setChord] = React.useState<string | null>(null)
  const chordTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearChord = React.useCallback(() => {
    if (chordTimer.current) clearTimeout(chordTimer.current)
    chordTimer.current = null
    setChord(null)
  }, [])

  const armChord = React.useCallback(() => {
    if (chordTimer.current) clearTimeout(chordTimer.current)
    setChord('g')
    chordTimer.current = setTimeout(() => setChord(null), CHORD_WINDOW_MS)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey

      // ⌘K is the one shortcut that must work from anywhere, including
      // from inside a text field and while the palette itself is open
      // (where it closes it) — so it's handled ahead of every guard.
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenPalette()
        return
      }

      if (!enabled || event.altKey || isTypingTarget(event.target)) return

      // A pending chord consumes the next key, whatever it is, so a
      // mistyped sequence fails silently instead of triggering something
      // unrelated.
      if (chord === 'g') {
        clearChord()
        const match = GO_TO_SHORTCUTS.find(
          (shortcut) => shortcut.key === event.key.toLowerCase(),
        )
        if (match) {
          event.preventDefault()
          navigate(match.to)
        }
        return
      }

      if (mod && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        onOpenAssistant()
        return
      }

      // Every other modifier combination belongs to the browser. Bare keys
      // only, from here down.
      if (mod) return

      // `?` and `T` are checked by the produced character rather than
      // key+shiftKey, since which physical key produces them varies by
      // keyboard layout.
      if (event.key === '?') {
        event.preventDefault()
        onOpenShortcuts()
        return
      }

      if (event.key === 'T') {
        event.preventDefault()
        onToggleTheme()
        return
      }

      if (event.key === 'g') {
        event.preventDefault()
        armChord()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    chord,
    enabled,
    armChord,
    clearChord,
    navigate,
    onOpenPalette,
    onOpenShortcuts,
    onOpenAssistant,
    onToggleTheme,
  ])

  React.useEffect(() => () => clearChord(), [clearChord])

  return { chord }
}
