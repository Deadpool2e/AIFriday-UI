import {
  AppLoadingView,
  type LoadingPreview,
  type ProgressStage,
} from '@platform/ui'

// These are the actual phases of a Module Federation load, in order, not
// invented filler: Host fetches the remote's remoteEntry.js, negotiates
// which shared singletons (React, the router, the query client) it can
// reuse from Host instead of duplicating, pulls the exposed module's
// chunks, then hands the shared auth session to the mounted routes. It's
// the slowest thing that happens in this app and it used to be two grey
// bars, which told the user nothing about why they were waiting.
const FEDERATION_STAGES: ProgressStage[] = [
  { id: 'entry', label: 'Connecting to application', weight: 1 },
  {
    id: 'shared',
    label: 'Negotiating shared runtime',
    detail: 'Reusing the host’s React, router, and query cache',
    weight: 1.5,
  },
  { id: 'chunks', label: 'Fetching application modules', weight: 2 },
  { id: 'session', label: 'Restoring session and permissions', weight: 1 },
  { id: 'render', label: 'Preparing your workspace', weight: 1 },
]

export function RemoteLoadingFallback({
  title = 'Workspace',
  preview = 'dashboard',
}: {
  title?: string
  preview?: LoadingPreview
}) {
  return (
    <AppLoadingView
      title={title}
      stages={FEDERATION_STAGES}
      preview={preview}
    />
  )
}
