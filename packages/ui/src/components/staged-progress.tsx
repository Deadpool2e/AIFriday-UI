import * as React from 'react'
import { CheckIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { toneDotClass, toneMarkClass } from '../lib/tone'

export interface ProgressStage {
  id: string
  // Present participle, describing work in flight: "Extracting content",
  // not "Extraction" or "Step 2". The label is the whole point of this
  // component — it's what a spinner can't tell you.
  label: string
  // Optional one-line detail shown only while this stage is active, for
  // the stage that genuinely needs it. Not every stage should have one.
  detail?: string
  // Rough share of total work, used to weight the progress bar so a long
  // stage doesn't advance at the same rate as a fast one. Defaults to an
  // even split when omitted on every stage.
  weight?: number
}

export type StagedProgressStatus = 'running' | 'complete' | 'failed'

interface StagedProgressProps extends React.ComponentProps<'div'> {
  stages: ProgressStage[]
  // Index of the stage currently running. Equal to stages.length once
  // everything is done.
  activeIndex: number
  status?: StagedProgressStatus
  // Shown in place of the running stage's label when status is 'failed'.
  errorMessage?: string
  // The compact form drops the stage list and keeps only the bar plus the
  // active label — for inline use inside a card or a toolbar, where a full
  // stage list would dominate.
  variant?: 'default' | 'compact'
}

function resolveProgress(
  stages: ProgressStage[],
  activeIndex: number,
  status: StagedProgressStatus,
) {
  if (status === 'complete') return 1
  const weights = stages.map((stage) => stage.weight ?? 1)
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1
  const done = weights
    .slice(0, Math.max(0, activeIndex))
    .reduce((sum, weight) => sum + weight, 0)
  // Credit the in-flight stage with half its weight: the bar keeps moving
  // between stage boundaries instead of sitting frozen, without ever
  // claiming a stage finished before it did.
  const inFlight = (weights[activeIndex] ?? 0) / 2
  return Math.min(1, (done + inFlight) / total)
}

function StagedProgress({
  stages,
  activeIndex,
  status = 'running',
  errorMessage,
  variant = 'default',
  className,
  ...props
}: StagedProgressProps) {
  const progress = resolveProgress(stages, activeIndex, status)
  const activeStage = stages[Math.min(activeIndex, stages.length - 1)]
  const isComplete = status === 'complete'
  const isFailed = status === 'failed'

  const barToneClass = isFailed
    ? toneMarkClass.danger
    : isComplete
      ? toneMarkClass.success
      : 'bg-primary'

  return (
    <div
      data-slot="staged-progress"
      role="status"
      // The bar is the visual; the live region is what a screen reader
      // gets. Announcing only the stage label (not the percentage) keeps
      // it from reading a new number on every animation frame.
      aria-live="polite"
      aria-label={
        isFailed
          ? (errorMessage ?? 'Failed')
          : isComplete
            ? 'Complete'
            : (activeStage?.label ?? 'Working')
      }
      className={cn('space-y-3', className)}
      {...props}
    >
      <div className="bg-surface-muted relative h-1 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full w-full origin-left rounded-full transition-transform duration-(--duration-slow) ease-out',
            barToneClass,
          )}
          style={{ transform: `scaleX(${progress})` }}
        />
        {/* An indeterminate sweep rides on top of the determinate fill
            while work is genuinely in flight, so the bar never looks
            stalled during a long stage. It disappears the moment the
            operation resolves either way. */}
        {!isComplete && !isFailed && (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/4 animate-[progress-indeterminate_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        )}
      </div>

      {variant === 'compact' ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <span
            className={cn('size-1.5 rounded-full', barToneClass)}
            aria-hidden="true"
          />
          {isFailed
            ? (errorMessage ?? 'Failed')
            : isComplete
              ? 'Complete'
              : activeStage?.label}
        </p>
      ) : (
        <ol className="space-y-0.5">
          {stages.map((stage, index) => {
            const done = index < activeIndex || isComplete
            const running = index === activeIndex && !isComplete && !isFailed
            const failed = index === activeIndex && isFailed
            return (
              <li
                key={stage.id}
                className={cn(
                  'flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-(--duration-instant) ease-snap',
                  running && 'bg-surface-muted/60',
                )}
              >
                <span className="relative mt-[3px] flex size-3.5 shrink-0 items-center justify-center">
                  {running && (
                    <span
                      aria-hidden="true"
                      className="bg-primary/30 animate-ambient-pulse absolute inset-0 rounded-full"
                    />
                  )}
                  {done ? (
                    <CheckIcon
                      className="text-success size-3.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'relative size-1.5 rounded-full transition-colors duration-(--duration-instant) ease-snap',
                        failed
                          ? toneDotClass.danger
                          : running
                            ? 'bg-primary'
                            : 'bg-border-strong',
                      )}
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm transition-colors duration-(--duration-instant) ease-snap',
                      running && 'text-foreground font-medium',
                      done && 'text-muted-foreground',
                      !running && !done && 'text-muted-foreground/55',
                      failed && 'text-danger font-medium',
                    )}
                  >
                    {failed ? (errorMessage ?? stage.label) : stage.label}
                  </span>
                  {running && stage.detail && (
                    <span className="text-muted-foreground animate-in fade-in-0 mt-0.5 block text-xs duration-(--duration-base)">
                      {stage.detail}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

interface UseStagedProgressOptions {
  stages: ProgressStage[]
  // While true the stage index advances on its own. Flipping it to false
  // snaps to complete.
  isActive: boolean
  isError?: boolean
  // How long to dwell on each stage before advancing. The last stage is
  // held indefinitely — we'd rather sit on "Generating insights" than
  // claim completion the work hasn't reached.
  stepMs?: number
}

// Drives a StagedProgress for operations whose real internal phases we
// can't observe (a federated bundle fetch, a lazy route, a third-party
// call). The stage names still describe what is genuinely happening — the
// only thing being estimated is *when* each one starts. It never
// auto-completes: completion comes exclusively from isActive going false,
// so the UI can't claim work finished before it did.
function useStagedProgress({
  stages,
  isActive,
  isError,
  stepMs = 700,
}: UseStagedProgressOptions) {
  const [index, setIndex] = React.useState(0)

  // Rewind when a new run starts. Adjusted during render (React's
  // documented "reset state when a prop changes" pattern, used elsewhere
  // in this codebase) rather than in an effect, which would render the
  // stale final stage for one frame before snapping back to the first.
  const [lastActive, setLastActive] = React.useState(isActive)
  if (isActive !== lastActive) {
    setLastActive(isActive)
    if (isActive) setIndex(0)
  }

  React.useEffect(() => {
    if (!isActive || isError) return
    const timer = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, stages.length - 1))
    }, stepMs)
    return () => clearInterval(timer)
  }, [isActive, isError, stages.length, stepMs])

  // Status is fully determined by the two inputs, so it's derived at
  // render rather than mirrored into state — one less thing that can be
  // momentarily out of sync with the props that produced it.
  const status: StagedProgressStatus = isError
    ? 'failed'
    : isActive
      ? 'running'
      : 'complete'

  return { activeIndex: index, status }
}

export { StagedProgress, useStagedProgress }
