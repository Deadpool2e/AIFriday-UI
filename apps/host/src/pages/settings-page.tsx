import { AccessibilitySettings } from '@platform/theme'
import { useDocumentTitle } from '@platform/ui'

export function SettingsPage() {
  useDocumentTitle('Settings — Enterprise AI Platform')
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Application preferences. More sections (profile, notifications,
          integrations) arrive alongside the features they configure.
        </p>
      </div>
      <AccessibilitySettings />
    </div>
  )
}
