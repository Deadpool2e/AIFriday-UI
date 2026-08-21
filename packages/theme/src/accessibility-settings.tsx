import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface OptionGroupProps<T extends string> {
  legend: string
  description?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

// A <fieldset>/<legend> group of toggle buttons instead of a hand-rolled
// ARIA radiogroup. Native <button> already gives correct keyboard/focus
// behavior for free; aria-pressed communicates the selected state to
// assistive tech without needing custom arrow-key roving-tabindex logic.
function OptionGroup<T extends string>({
  legend,
  description,
  value,
  options,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

export function AccessibilitySettings() {
  const theme = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility Center</CardTitle>
        <CardDescription>
          Saved on this device and applied across the whole application,
          including the AI Control Tower.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OptionGroup<ColorMode>
          legend="Appearance"
          value={theme.colorMode}
          onChange={theme.setColorMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
        <OptionGroup<Contrast>
          legend="Contrast"
          description="High contrast increases text and border contrast beyond WCAG AA minimums."
          value={theme.contrast}
          onChange={theme.setContrast}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'high', label: 'High contrast' },
          ]}
        />
        <OptionGroup<TextSize>
          legend="Text size"
          value={theme.textSize}
          onChange={theme.setTextSize}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
            { value: 'xl', label: 'Extra large' },
          ]}
        />
        <OptionGroup<Motion>
          legend="Motion"
          description="Reduced motion turns off transitions and animations app-wide."
          value={theme.motion}
          onChange={theme.setMotion}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'reduced', label: 'Reduced motion' },
          ]}
        />
        <OptionGroup<KeyboardNavMode>
          legend="Keyboard navigation"
          description="Always show a focus outline, even for mouse and touch interactions."
          value={theme.keyboardNav}
          onChange={theme.setKeyboardNav}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'enhanced', label: 'Always visible' },
          ]}
        />
        <OptionGroup<FocusStyle>
          legend="Focus indicators"
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
