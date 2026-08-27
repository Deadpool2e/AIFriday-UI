import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Kbd,
} from '@platform/ui'

import { GO_TO_SHORTCUTS } from './use-keyboard-shortcuts'

const GLOBAL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'mod k', label: 'Open command palette' },
  { keys: 'mod j', label: 'Ask Vizorion' },
  { keys: 'shift t', label: 'Toggle light / dark' },
  { keys: '?', label: 'Show this help' },
  { keys: 'escape', label: 'Close the current overlay' },
]

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm">{label}</span>
      <Kbd keys={keys} size="sm" />
    </div>
  )
}

// Reachable with `?` from anywhere, and from the command palette for
// anyone who never discovers `?`. The list is generated from the same
// GO_TO_SHORTCUTS array the handler reads, so the documentation can't
// drift from the behaviour.
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Everything here is reachable by mouse too — these just skip a step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h3 className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-widest uppercase">
              Global
            </h3>
            <div className="divide-y">
              {GLOBAL_SHORTCUTS.map((shortcut) => (
                <ShortcutRow key={shortcut.keys} {...shortcut} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-widest uppercase">
              Go to
            </h3>
            <p className="text-muted-foreground mb-1 text-xs">
              Press <Kbd keys="g" size="sm" className="mx-0.5 align-middle" />{' '}
              then the page&apos;s letter.
            </p>
            <div className="divide-y">
              {GO_TO_SHORTCUTS.map((shortcut) => (
                <ShortcutRow
                  key={shortcut.key}
                  keys={`g ${shortcut.key}`}
                  label={shortcut.label}
                />
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
