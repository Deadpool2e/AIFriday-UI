import * as React from 'react'

import { cn } from '../lib/cn'
import { Skeleton } from './skeleton'
import {
  StagedProgress,
  useStagedProgress,
  type ProgressStage,
} from './staged-progress'

export type LoadingPreview = 'dashboard' | 'table' | 'detail' | 'none'

interface AppLoadingViewProps extends React.ComponentProps<'div'> {
  // What is being loaded, in the user's terms — "AI Control Tower", not
  // "control-tower remoteEntry.js".
  title: string
  stages: ProgressStage[]
  isError?: boolean
  errorMessage?: string
  // Shape of the content about to appear. Rendering the *right* skeleton
  // is what makes the swap to real content read as the page filling in
  // rather than one screen replacing another.
  preview?: LoadingPreview
  // Loaders that appear instantly make fast operations feel slower — the
  // eye registers the flash as a stutter. Anything that resolves inside
  // this window shows nothing at all.
  delayMs?: number
}

function useDelayedVisible(delayMs: number) {
  const [visible, setVisible] = React.useState(delayMs === 0)
  React.useEffect(() => {
    if (delayMs === 0) return
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])
  return visible
}

// The brand mark, breathing. Deliberately the same geometry as the
// sidebar's logo tile so the loader reads as *this* product waking up
// rather than a generic spinner borrowed from a library.
function BootMark() {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center">
      <span
        aria-hidden="true"
        className="bg-primary/20 animate-ambient-pulse absolute inset-0 rounded-lg"
      />
      <span className="bg-primary text-primary-foreground relative flex size-9 items-center justify-center rounded-lg text-sm font-semibold">
        E
      </span>
    </span>
  )
}

function PreviewSkeleton({ preview }: { preview: LoadingPreview }) {
  if (preview === 'none') return null

  if (preview === 'table') {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-t px-4 py-3">
              <Skeleton
                className="h-3.5"
                style={{ width: `${88 - index * 6}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (preview === 'detail') {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="space-y-2 rounded-xl border p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="col-span-2 h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  )
}

// The application's one loading experience. Replaces the two-grey-bars
// fallback that used to stand in for every async boundary: a branded mark,
// a named operation, the actual stages of that operation as they run, and
// a skeleton of the layout that's about to land — so a slow federated
// bundle fetch reads as a system doing real work rather than a stalled
// page.
function AppLoadingView({
  title,
  stages,
  isError = false,
  errorMessage,
  preview = 'dashboard',
  delayMs = 180,
  className,
  ...props
}: AppLoadingViewProps) {
  const visible = useDelayedVisible(delayMs)
  const { activeIndex, status } = useStagedProgress({
    stages,
    isActive: !isError,
    isError,
  })

  if (!visible) return null

  return (
    <div
      data-slot="app-loading-view"
      className={cn(
        'animate-in fade-in-0 space-y-6 duration-(--duration-base)',
        className,
      )}
      {...props}
    >
      <div className="bg-surface flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-start sm:gap-5">
        <BootMark />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
              {isError ? 'Failed to load' : 'Loading'}
            </p>
            <p className="text-base font-semibold tracking-tight">{title}</p>
          </div>
          <StagedProgress
            stages={stages}
            activeIndex={activeIndex}
            status={status}
            errorMessage={errorMessage}
          />
        </div>
      </div>
      <PreviewSkeleton preview={preview} />
    </div>
  )
}

export { AppLoadingView, BootMark }
