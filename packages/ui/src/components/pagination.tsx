import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'

interface PaginationProps extends React.ComponentProps<'nav'> {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
  pageSize,
  className,
  ...props
}: PaginationProps) {
  const canPrevious = page > 1
  const canNext = page < pageCount

  const rangeLabel =
    totalItems !== undefined && pageSize !== undefined
      ? (() => {
          const start = (page - 1) * pageSize + 1
          const end = Math.min(page * pageSize, totalItems)
          return `${start}–${end} of ${totalItems}`
        })()
      : `Page ${page} of ${pageCount}`

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4', className)}
      {...props}
    >
      <p className="text-muted-foreground text-sm tabular-nums">{rangeLabel}</p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}

export { Pagination }
