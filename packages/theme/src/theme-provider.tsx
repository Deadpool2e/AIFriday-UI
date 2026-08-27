import * as React from 'react'

export type ColorMode = 'light' | 'dark' | 'system'
export type Contrast = 'standard' | 'high'
export type TextSize = 'normal' | 'large' | 'xl'
export type Motion = 'normal' | 'reduced'
export type FocusStyle = 'standard' | 'enhanced'
export type KeyboardNavMode = 'standard' | 'enhanced'

export interface AccessibilitySettings {
  colorMode: ColorMode
  contrast: Contrast
  textSize: TextSize
  motion: Motion
  focusStyle: FocusStyle
  keyboardNav: KeyboardNavMode
}

const STORAGE_KEY = 'platform:accessibility-settings'

const DEFAULT_SETTINGS: AccessibilitySettings = {
  colorMode: 'system',
  contrast: 'standard',
  textSize: 'normal',
  motion: 'normal',
  focusStyle: 'standard',
  keyboardNav: 'standard',
}

function readStoredSettings(): AccessibilitySettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First-ever visit: no explicit choice yet, so default motion to
      // whatever the OS already says. Every other axis keeps its default.
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      return {
        ...DEFAULT_SETTINGS,
        motion: prefersReducedMotion ? 'reduced' : 'normal',
      }
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return mode
}

function applyToDocument(settings: AccessibilitySettings) {
  const root = document.documentElement
  root.classList.toggle('dark', resolveColorMode(settings.colorMode) === 'dark')
  root.dataset.contrast = settings.contrast
  root.dataset.textSize = settings.textSize
  root.dataset.motion = settings.motion
  root.dataset.focusStyle = settings.focusStyle
  root.dataset.keyboardNav = settings.keyboardNav
}

interface ThemeContextValue extends AccessibilitySettings {
  resolvedColorMode: 'light' | 'dark'
  setColorMode: (mode: ColorMode) => void
  setContrast: (contrast: Contrast) => void
  setTextSize: (size: TextSize) => void
  setMotion: (motion: Motion) => void
  setFocusStyle: (style: FocusStyle) => void
  setKeyboardNav: (mode: KeyboardNavMode) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] =
    React.useState<AccessibilitySettings>(readStoredSettings)
  const [announcement, setAnnouncement] = React.useState('')

  React.useEffect(() => {
    applyToDocument(settings)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // If the user picked "system", keep following the OS preference live
  // instead of only resolving it once at load.
  React.useEffect(() => {
    if (settings.colorMode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyToDocument(settings)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [settings])

  const update = React.useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
      announcementText: string,
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
      setAnnouncement(announcementText)
    },
    [],
  )

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...settings,
      resolvedColorMode: resolveColorMode(settings.colorMode),
      setColorMode: (mode) =>
        update('colorMode', mode, `Appearance set to ${mode}`),
      setContrast: (contrast) =>
        update('contrast', contrast, `Contrast set to ${contrast}`),
      setTextSize: (size) =>
        update('textSize', size, `Text size set to ${size}`),
      setMotion: (motion) =>
        update('motion', motion, `Motion set to ${motion}`),
      setFocusStyle: (style) =>
        update('focusStyle', style, `Focus indicator set to ${style}`),
      setKeyboardNav: (mode) =>
        update('keyboardNav', mode, `Keyboard navigation set to ${mode}`),
    }),
    [settings, update],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Screen-reader-only live region: announces every settings change
          without a visible toast, satisfying "screen-reader-friendly
          status messages" for this feature ahead of the real Notification
          Center (later phase). */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
