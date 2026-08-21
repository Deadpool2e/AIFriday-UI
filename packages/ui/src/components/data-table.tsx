import * as React from 'react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

import { Pagination } from './pagination'
import { Skeleton } from './skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

export interface DataTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number
  headerClassName?: string
  cellClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  loadingRowCount?: number
  emptyState?: React.ReactNode
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null

// Navigation (e.g. "click a row to open its detail page") is intentionally
// left to the caller via a real <Link> inside a column's cell(), not an
// onRowClick prop here — a <tr onClick> is not keyboard-focusable or
// right-click-openable, which fails the "accessible tables" requirement a
// real anchor satisfies for free.
function DataTable<T>({
  columns,
  data,
  getRowId,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  loadingRowCount = 5,
  emptyState,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null)

  const sortedData = React.useMemo(() => {
    if (!sort) return data
    const column = columns.find((c) => c.id === sort.columnId)
    if (!column?.sortValue) return data
    const getValue = column.sortValue
    return [...data].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      if (av < bv) return sort.direction === 'asc' ? -1 : 1
      if (av > bv) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sort, columns])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const clampedPage = Math.min(page, pageCount)
  const pageData = sortedData.slice(
    (clampedPage - 1) * pageSize,
    clampedPage * pageSize,
  )

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return
    setSort((prev) => {
      if (prev?.columnId !== column.id) return { columnId: column.id, direction: 'asc' }
      if (prev.direction === 'asc') return { columnId: column.id, direction: 'desc' }
      return null
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: loadingRowCount }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return <>{emptyState}</>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const isSorted = sort?.columnId === column.id
                return (
                  <TableHead
                    key={column.id}
                    className={column.headerClassName}
                    aria-sort={
                      column.sortable
                        ? isSorted
                          ? sort.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className="hover:text-foreground flex items-center gap-1"
                      >
                        {column.header}
                        {isSorted ? (
                          sort.direction === 'asc' ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : (
                            <ArrowDownIcon className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDownIcon className="size-3.5 opacity-30" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.cellClassName}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <Pagination
          page={clampedPage}
          pageCount={pageCount}
          onPageChange={onPageChange}
          totalItems={sortedData.length}
          pageSize={pageSize}
        />
      )}
    </div>
  )
}

export { DataTable }
