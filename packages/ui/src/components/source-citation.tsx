import * as React from 'react'
import { FileTextIcon } from 'lucide-react'

import { cn } from '../lib/cn'

interface SourceCitationProps extends React.ComponentProps<'div'> {
  title: string
  snippet: string
  relevance?: number
}

function SourceCitation({
  title,
  snippet,
  relevance,
  className,
  ...props
}: SourceCitationProps) {
  return (
    <div
      data-slot="source-citation"
      className={cn('flex gap-2 rounded-md border p-3 text-sm', className)}
      {...props}
    >
      <FileTextIcon
        className="text-muted-foreground mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{title}</p>
          {relevance !== undefined && (
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {relevance}% match
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{snippet}</p>
      </div>
    </div>
  )
}

export { SourceCitation }
