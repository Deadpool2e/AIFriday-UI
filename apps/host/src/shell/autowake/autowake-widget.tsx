import * as React from 'react'
import { Loader2Icon, MicIcon, MicOffIcon, SquareIcon, Volume2Icon, XIcon } from 'lucide-react'
import { useAuth } from '@platform/auth'
import { Button, cn } from '@platform/ui'

import { AutowakeEnrollmentDialog } from './autowake-enrollment-dialog'
import { AUTOWAKE_STATE_LABEL } from './autowake-labels'
import type { useAutowake, AutowakeState } from './use-autowake'

// Renders directly rather than returning a component reference to assign
// to a local variable — picking a component by state and stashing it in a
// variable used as a JSX tag trips react-hooks/static-components (it can't
// tell that's just a stable lookup, not a new component each render).
function renderStateIcon(state: AutowakeState, className: string) {
  switch (state) {
    case 'disabled':
    case 'unsupported':
      return <MicOffIcon className={className} aria-hidden="true" />
    case 'rejected':
      return <XIcon className={className} aria-hidden="true" />
    case 'verifying':
    case 'transcribing':
    case 'thinking':
      return <Loader2Icon className={cn(className, 'animate-spin')} aria-hidden="true" />
    case 'speaking':
      return <Volume2Icon className={className} aria-hidden="true" />
    default:
      return <MicIcon className={className} aria-hidden="true" />
  }
}

function stateColorClass(state: AutowakeState): string {
  switch (state) {
    case 'disabled':
    case 'unsupported':
      return 'text-muted-foreground'
    case 'not-enrolled':
      return 'text-warning'
    case 'idle-listening':
      return 'text-ai-accent'
    case 'rejected':
    case 'recording':
      return 'text-danger'
    case 'verifying':
    case 'transcribing':
    case 'thinking':
      return 'text-info'
    case 'speaking':
      return 'text-success'
  }
}

interface AutowakeWidgetProps {
  // Lifted to app-shell.tsx and shared with VizorionLauncher, which also
  // renders a listening/recording indicator driven by this same instance.
  autowake: ReturnType<typeof useAutowake>
}

// Global "Hey Athena" wake-word widget — mounted in app-shell.tsx next to
// VizorionLauncher, always listening (once enabled + enrolled) regardless
// of route. Deliberately not built on ChatPanel itself: this is just
// status/controls (state indicator, enroll, enable toggle, stop button) —
// the actual conversation is shown in VizorionLauncher's panel, which a
// verified wake opens automatically via onWakeVerified.
export function AutowakeWidget({ autowake }: AutowakeWidgetProps) {
  const { hasAnyPermission } = useAuth()
  const canUseVizorion = hasAnyPermission(['VIZORION_ASSISTANT'])
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [enrollOpen, setEnrollOpen] = React.useState(false)

  if (!canUseVizorion) return null

  const isPulsing = autowake.state === 'idle-listening' || autowake.state === 'recording'

  return (
    <>
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Autowake"
          className="bg-surface-elevated/85 ring-ai-accent/20 animate-in fade-in-0 zoom-in-95 fixed right-36 bottom-20 z-(--z-floating-action) w-72 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border p-4 shadow-xl ring-1 backdrop-blur-xl duration-150"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Autowake</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setPanelOpen(false)}
              aria-label="Close Autowake panel"
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          <p className={cn('flex items-center gap-1.5 text-xs', stateColorClass(autowake.state))}>
            {renderStateIcon(autowake.state, 'size-3.5')}
            {AUTOWAKE_STATE_LABEL[autowake.state]}
          </p>

          {autowake.error && <p className="text-danger text-xs">{autowake.error}</p>}

          {autowake.state === 'recording' && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={autowake.stopRecordingNow}
            >
              <SquareIcon className="mr-2 size-3.5" />
              Stop
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setEnrollOpen(true)}>
              {autowake.enrolled ? 'Re-enroll voice' : 'Enroll voice'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={autowake.enabled ? 'destructive' : 'default'}
              className="flex-1"
              onClick={autowake.toggleEnabled}
              disabled={!autowake.supported}
            >
              {autowake.enabled ? 'Turn off' : 'Turn on'}
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => setPanelOpen((prev) => !prev)}
        aria-label="Autowake"
        title={AUTOWAKE_STATE_LABEL[autowake.state]}
        className={cn(
          'fixed right-36 bottom-4 z-(--z-floating-action) size-12 rounded-full shadow-md transition-transform hover:scale-105',
          panelOpen && 'ring-ai-accent/50 ring-2 ring-offset-2',
          isPulsing && 'animate-pulse',
        )}
      >
        {renderStateIcon(autowake.state, cn('size-5', stateColorClass(autowake.state)))}
      </Button>

      <AutowakeEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onEnroll={autowake.enroll}
        isEnrolling={autowake.isEnrolling}
      />
    </>
  )
}
