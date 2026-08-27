import * as React from 'react'
import { Link } from 'react-router'
import { SearchIcon, SearchXIcon } from 'lucide-react'
import { useRequests } from '@platform/api-client'
import type {
  Request,
  RequestPriority,
  RequestStatus,
  RiskLevel,
} from '@platform/types'
import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  RiskIndicator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useDocumentTitle,
} from '@platform/ui'

const STATUS_OPTIONS: RequestStatus[] = [
  'pending',
  'running',
  'completed',
  'blocked',
  'escalated',
  'degraded',
  'failed',
]
const RISK_OPTIONS: RiskLevel[] = ['low', 'medium', 'high', 'critical']
const PRIORITY_OPTIONS: RequestPriority[] = ['low', 'normal', 'high', 'urgent']

const PRIORITY_RANK: Record<RequestPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
}
const RISK_RANK: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

const PAGE_SIZE = 10

const columns: DataTableColumn<Request>[] = [
  {
    id: 'id',
    header: 'ID',
    sortable: true,
    sortValue: (r) => r.id,
    cell: (r) => (
      <Link
        to={`/requests/${r.id}`}
        className="text-primary font-medium hover:underline"
      >
        {r.id}
      </Link>
    ),
  },
  {
    id: 'title',
    header: 'Title',
    cell: (r) => <span className="line-clamp-1 max-w-xs">{r.title}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sortValue: (r) => r.status,
    cell: (r) => (
      <Badge variant="outline" className="capitalize">
        {r.status}
      </Badge>
    ),
  },
  {
    id: 'priority',
    header: 'Priority',
    sortable: true,
    sortValue: (r) => PRIORITY_RANK[r.priority],
    cell: (r) => <span className="capitalize">{r.priority}</span>,
  },
  {
    id: 'risk',
    header: 'Risk',
    sortable: true,
    sortValue: (r) => RISK_RANK[r.risk],
    cell: (r) => <RiskIndicator level={r.risk} />,
  },
  {
    id: 'owner',
    header: 'Owner',
    sortable: true,
    sortValue: (r) => r.owner,
    cell: (r) => r.owner,
  },
  {
    id: 'createdAt',
    header: 'Created',
    sortable: true,
    sortValue: (r) => r.createdAt,
    cellClassName: 'tabular-nums',
    cell: (r) =>
      new Date(r.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
  },
]

export function RequestsPage() {
  useDocumentTitle('Requests — Enterprise AI Platform')
  const requests = useRequests()

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<RequestStatus | 'all'>(
    'all',
  )
  const [riskFilter, setRiskFilter] = React.useState<RiskLevel | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<
    RequestPriority | 'all'
  >('all')
  const [page, setPage] = React.useState(1)

  // Reset to page 1 whenever a filter changes — adjusted during render
  // (see AppShell for why this beats a useEffect for this exact case).
  const filterSignature = `${search}|${statusFilter}|${riskFilter}|${priorityFilter}`
  const [lastFilterSignature, setLastFilterSignature] =
    React.useState(filterSignature)
  if (filterSignature !== lastFilterSignature) {
    setLastFilterSignature(filterSignature)
    setPage(1)
  }

  const filtered = (requests.data ?? []).filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (riskFilter !== 'all' && r.risk !== riskFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.title.toLowerCase().includes(q) &&
        !r.owner.toLowerCase().includes(q)
      ) {
        return false
      }
    }
    return true
  })

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    riskFilter !== 'all' ||
    priorityFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setRiskFilter('all')
    setPriorityFilter('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Requests"
        description={
          requests.data
            ? `${filtered.length} of ${requests.data.length} requests${hasActiveFilters ? ' match your filters' : ''}`
            : 'Loading requests…'
        }
        // The filter bar belongs to the page frame, not to the content:
        // it stays put while the table below it changes, which is exactly
        // what the header's job is.
        toolbar={
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <div className="relative min-w-[220px] flex-1">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, title, or owner..."
                className="pl-8"
                aria-label="Search requests"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as RequestStatus | 'all')}
            >
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={riskFilter}
              onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}
            >
              <SelectTrigger className="w-36" aria-label="Filter by risk">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                {RISK_OPTIONS.map((risk) => (
                  <SelectItem key={risk} value={risk} className="capitalize">
                    {risk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as RequestPriority | 'all')
              }
            >
              <SelectTrigger className="w-36" aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem
                    key={priority}
                    value={priority}
                    className="capitalize"
                  >
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        }
      />

      {requests.isError ? (
        <ErrorState
          title="Couldn't load requests"
          description="The request service didn't respond. Try again."
          onRetry={() => requests.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(r) => r.id}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={requests.isLoading}
          emptyState={
            hasActiveFilters ? (
              <EmptyState
                icon={<SearchXIcon />}
                title="No requests match your filters"
                description="Try a different search term or clear your filters."
                action={
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No requests yet"
                description="Requests will show up here."
              />
            )
          }
        />
      )}
    </div>
  )
}
