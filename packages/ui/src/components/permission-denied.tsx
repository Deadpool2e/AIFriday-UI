import * as React from 'react'
import { LockIcon } from 'lucide-react'

import { cn } from '../lib/cn'

interface PermissionDeniedProps extends React.ComponentProps<'div'> {
  title?: string
  description?: string
}

// Distinct from ErrorState (nothing failed) and EmptyState (there's
// nothing to show) — this is "there IS something here, you're just not
// allowed to see it." Frontend-only signal: the real gate is the backend
// permission check this UI can only anticipate, never replace.
function PermissionDenied({
  title = "You don't have access to this page",
  description = 'Ask an administrator for the required permission if you believe this is a mistake.',
  className,
  ...props
}: PermissionDeniedProps) {
  return (
    <div
      data-slot="permission-denied"
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center',
        className,
      )}
      {...props}
    >
      <LockIcon className="text-muted-foreground size-8" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
    </div>
  )
}

export { PermissionDenied }
