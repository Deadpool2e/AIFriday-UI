import * as React from 'react'
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from 'lucide-react'

import { cn } from '../lib/cn'
import { toneTextClass } from '../lib/tone'
import { Button } from './button'

export interface AttentionItem {
  id: string
  label: string
  href?: string
  severity?: 'high' | 'medium' | 'low'
}

interface AttentionRequiredProps extends Omit<
  React.ComponentProps<'div'>,
  'title'
> {
  items: AttentionItem[]
  onItemClick?: (item: AttentionItem) => void
  emptyDescription?: string
  lastCheckedLabel?: string
}

const severityClass: Record<NonNullable<AttentionItem['severity']>, string> = {
  high: toneTextClass.danger,
  medium: toneTextClass.warning,
  low: toneTextClass.neutral,
}

// The dashboard's single most consequential widget — "what needs a human
// right now" beats another chart nobody acts on. Empty state is written as
// a real answer ("all clear, checked just now"), not a bare "No data".
function AttentionRequired({
  items,
  onItemClick,
  emptyDescription = 'All AI decisions are currently resolved.',
  lastCheckedLabel,
  className,
  ...props
}: AttentionRequiredProps) {
  return (
    <div
      data-slot="attention-required"
      className={cn('bg-surface rounded-xl border', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon
            className={cn(
              'size-4',
              items.length > 0 ? 'text-warning' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <p className="text-sm font-semibold tracking-tight">
            Attention required
          </p>
        </div>
        {items.length > 0 && (
          <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
            {items.length}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex items-start gap-2.5 px-4 py-4">
          <CheckCircle2Icon
            className="text-success mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm">{emptyDescription}</p>
            {lastCheckedLabel && (
              <p className="text-muted-foreground text-xs">
                Last checked: {lastCheckedLabel}
              </p>
            )}
          </div>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onItemClick?.(item)}
                className="hover:bg-surface-raised group flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-(--duration-fast)"
              >
                <span className="flex items-center gap-2.5">
                  <AlertTriangleIcon
                    className={cn(
                      'size-3.5 shrink-0',
                      severityClass[item.severity ?? 'medium'],
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
                <ArrowRightIcon className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <div className="border-t px-4 py-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onItemClick?.(items[0])}
          >
            Review
          </Button>
        </div>
      )}
    </div>
  )
}

export { AttentionRequired }
