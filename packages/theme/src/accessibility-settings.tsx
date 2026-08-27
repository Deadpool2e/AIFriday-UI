import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SegmentedControl,
} from '@platform/ui'

import { useTheme } from './theme-provider'
import type {
  ColorMode,
  Contrast,
  FocusStyle,
  KeyboardNavMode,
  Motion,
  TextSize,
} from './theme-provider'

interface SettingRowProps<T extends string> {
  label: string
  description?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

// Label and description on the left, control on the right — the layout a
// settings screen wants, because it puts every control on one vertical
// axis so the eye scans the *choices* down one column instead of hunting
// for each row's buttons at whatever x-position its label ended at.
//
// Collapses to stacked on narrow screens, where a two-column split would
// leave both halves too cramped to read.
function SettingRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: SettingRowProps<T>) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-muted-foreground max-w-md text-xs text-pretty">
            {description}
          </p>
        )}
      </div>
      {/* A real radiogroup rather than a row of aria-pressed buttons.
          These options are mutually exclusive, and the previous rendering
          — selected filled solid, unselected outlined — gave the two
          states such different visual weight that the *unselected* ones
          read as the primary actions. A segmented control shows the whole
          choice set as one object with one thing picked inside it. */}
      <SegmentedControl
        options={options}
        value={value}
        onChange={onChange}
        label={label}
        className="shrink-0 self-start sm:self-auto"
      />
    </div>
  )
}

export function AccessibilitySettings() {
  const theme = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          Saved on this device and applied across the whole application,
          including the AI Control Tower.
        </CardDescription>
      </CardHeader>
      {/* divide-y rather than space-y: a hairline between rows makes each
          setting's label, description and control read as one unit, which
          matters most in the rows where the description wraps. */}
      <CardContent className="divide-y">
        <SettingRow<ColorMode>
          label="Appearance"
          description="System follows your operating system's light or dark preference."
          value={theme.colorMode}
          onChange={theme.setColorMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
        <SettingRow<Contrast>
          label="Contrast"
          description="High contrast increases text and border contrast beyond WCAG AA minimums."
          value={theme.contrast}
          onChange={theme.setContrast}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'high', label: 'High' },
          ]}
        />
        <SettingRow<TextSize>
          label="Text size"
          description="Scales every size in the interface, not just body copy."
          value={theme.textSize}
          onChange={theme.setTextSize}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
            { value: 'xl', label: 'Extra large' },
          ]}
        />
        <SettingRow<Motion>
          label="Motion"
          description="Reduced motion turns off transitions and animations app-wide."
          value={theme.motion}
          onChange={theme.setMotion}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'reduced', label: 'Reduced' },
          ]}
        />
        <SettingRow<KeyboardNavMode>
          label="Keyboard navigation"
          description="Always show a focus outline, even for mouse and touch interactions."
          value={theme.keyboardNav}
          onChange={theme.setKeyboardNav}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'enhanced', label: 'Always visible' },
          ]}
        />
        <SettingRow<FocusStyle>
          label="Focus indicators"
          description="Enhanced uses a thicker, higher-contrast focus ring."
          value={theme.focusStyle}
          onChange={theme.setFocusStyle}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'enhanced', label: 'Enhanced' },
          ]}
        />
      </CardContent>
    </Card>
  )
}
