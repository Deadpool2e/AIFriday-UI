import * as React from 'react'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  SparklesIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'

import { cn } from '../lib/cn'
import { toneMarkClass, toneTextClass } from '../lib/tone'

export type ToastTone =
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'pending'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  // 0 keeps the toast up until it is dismissed or updated — used for
  // 'pending' toasts that resolve when their async work finishes.
  durationMs?: number
  action?: { label: string; onClick: () => void }
}

interface ToastRecord extends ToastOptions {
  id: string
  // Drives the exit animation: the record stays mounted for one animation
  // duration after dismissal so it can animate out instead of vanishing.
  leaving?: boolean
}

interface ToastContextValue {
  // Returns the toast's id so a caller can promote a 'pending' toast to a
  // success/failure result rather than stacking a second toast on top.
  toast: (options: ToastOptions) => string
  update: (id: string, options: Partial<ToastOptions>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 4500
const EXIT_DURATION_MS = 140
// A stack taller than this stops being feedback and starts being a wall.
const MAX_VISIBLE = 4

const toneConfig: Record<
  ToastTone,
  { icon: React.ReactNode; iconClass: string; accentClass: string }
> = {
  default: {
    icon: <InfoIcon />,
    iconClass: 'text-muted-foreground',
    accentClass: 'bg-border',
  },
  success: {
    icon: <CheckCircle2Icon />,
    iconClass: toneTextClass.success,
    accentClass: toneMarkClass.success,
  },
  warning: {
    icon: <AlertTriangleIcon />,
    iconClass: toneTextClass.warning,
    accentClass: toneMarkClass.warning,
  },
  danger: {
    icon: <XCircleIcon />,
    iconClass: toneTextClass.danger,
    accentClass: toneMarkClass.danger,
  },
  info: {
    icon: <InfoIcon />,
    iconClass: toneTextClass.info,
    accentClass: toneMarkClass.info,
  },
  ai: {
    icon: <SparklesIcon />,
    iconClass: toneTextClass.ai,
    accentClass: toneMarkClass.ai,
  },
  pending: {
    icon: <Loader2Icon className="animate-spin" />,
    iconClass: toneTextClass.info,
    accentClass: toneMarkClass.info,
  },
}

// A danger toast or one carrying an action is the user's one chance to see
// or act on it — it must not vanish on a timer. Pending is already
// persistent (it resolves when the async work does, not on a clock).
function isPersistent(options: Pick<ToastOptions, 'tone' | 'action'>) {
  return (
    options.tone === 'pending' ||
    options.tone === 'danger' ||
    Boolean(options.action)
  )
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([])
  // Keyed by toast id so an update (pending -> success) can cancel the
  // timer the previous state scheduled instead of firing it late.
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const clearTimer = React.useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const dismiss = React.useCallback(
    (id: string) => {
      clearTimer(id)
      setToasts((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, leaving: true } : entry,
        ),
      )
      setTimeout(() => remove(id), EXIT_DURATION_MS)
    },
    [clearTimer, remove],
  )

  const schedule = React.useCallback(
    (id: string, durationMs: number) => {
      clearTimer(id)
      if (durationMs <= 0) return
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      )
    },
    [clearTimer, dismiss],
  )

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const duration =
        options.durationMs ?? (isPersistent(options) ? 0 : DEFAULT_DURATION_MS)
      setToasts((prev) => [...prev, { ...options, id }].slice(-MAX_VISIBLE))
      schedule(id, duration)
      return id
    },
    [schedule],
  )

  const update = React.useCallback(
    (id: string, options: Partial<ToastOptions>) => {
      // Captured from the merge itself so persistence is judged on the
      // resulting toast (existing tone/action plus this update), not just
      // whatever this particular call happened to pass.
      let merged: ToastRecord | undefined
      setToasts((prev) =>
        prev.map((entry) => {
          if (entry.id !== id) return entry
          merged = { ...entry, ...options, leaving: false }
          return merged
        }),
      )
      if (!merged) return
      schedule(
        id,
        options.durationMs ?? (isPersistent(merged) ? 0 : DEFAULT_DURATION_MS),
      )
    },
    [schedule],
  )

  React.useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = React.useMemo(
    () => ({ toast, update, dismiss }),
    [toast, update, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
}) {
  return (
    // aria-live on the container (not each toast) so a screen reader
    // announces new entries as they arrive without re-reading the stack.
    // 'polite' rather than 'assertive': none of these interrupt a task.
    <div
      role="region"
      aria-label="Notifications"
      // Top-right, under the topbar, rather than the conventional
      // bottom-right: that corner already belongs to the Vizorion
      // launcher, the Autowake widget, and the chat panel those two open.
      // Docking here also puts feedback next to the notification bell it
      // is conceptually related to.
      className="pointer-events-none fixed top-16 right-4 z-(--z-toast) flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6"
    >
      <div aria-live="polite" aria-atomic="false" className="contents">
        {toasts.map((entry) => (
          <ToastItem key={entry.id} toast={entry} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord
  onDismiss: (id: string) => void
}) {
  const config = toneConfig[toast.tone ?? 'default']
  // A CSS transition, not a keyframe animation, so a toast that starts
  // leaving mid-entrance (or gets promoted back via update()) retargets
  // smoothly from wherever it currently is instead of restarting from zero.
  const [entered, setEntered] = React.useState(false)

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const visible = entered && !toast.leaving

  return (
    <div
      className={cn(
        'bg-surface-elevated pointer-events-auto relative flex gap-3 overflow-hidden rounded-lg border py-3 pr-3 pl-4 shadow-lg transition-[transform,opacity] duration-(--duration-fast)',
        toast.leaving ? 'ease-snap' : 'ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      {/* A 2px tone rail instead of tinting the whole surface — the status
          is legible at a glance without the toast becoming a colored card. */}
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-0.5', config.accentClass)}
      />
      <span
        className={cn('mt-0.5 shrink-0 [&_svg]:size-4', config.iconClass)}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm leading-snug font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick()
              onDismiss(toast.id)
            }}
            className="text-primary hover:text-primary/80 focus-visible:ring-ring/50 mt-1.5 rounded text-xs font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 -mt-0.5 -mr-0.5 size-6 shrink-0 rounded transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none"
      >
        <XIcon className="mx-auto size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

// Throws rather than silently no-oping: a component that fires feedback
// nobody can see is a bug we want surfaced in development, not swallowed.
function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>')
  }
  return context
}

export { ToastProvider, useToast }
