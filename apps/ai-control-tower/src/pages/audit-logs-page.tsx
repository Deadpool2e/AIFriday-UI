import * as React from 'react'
import { Link } from 'react-router'
import {
  BotIcon,
  CheckSquareIcon,
  KeyRoundIcon,
  ListIcon,
  ServerIcon,
  ShieldAlertIcon,
} from 'lucide-react'
import { useAuditCategoryCounts, useAuditLog } from '@platform/api-client'
import type { AuditCategory, AuditLogEntry } from '@platform/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  DataTable,
  type DataTableColumn,
  EmptyState,
  KPIWidget,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

const CATEGORY_CONFIG: Record<
  AuditCategory,
  { label: string; icon: React.ReactNode }
> = {
  execution: { label: 'Execution', icon: <BotIcon className="size-3.5" /> },
  guardrail: {
    label: 'Guardrail',
    icon: <ShieldAlertIcon className="size-3.5" />,
  },
  approval: {
    label: 'Approval',
    icon: <CheckSquareIcon className="size-3.5" />,
  },
  access: { label: 'Access', icon: <KeyRoundIcon className="size-3.5" /> },
  system: { label: 'System', icon: <ServerIcon className="size-3.5" /> },
}

const FILTERS: { value: AuditCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'execution', label: 'Execution' },
  { value: 'guardrail', label: 'Guardrail' },
  { value: 'approval', label: 'Approval' },
  { value: 'access', label: 'Access' },
  { value: 'system', label: 'System' },
]

const PAGE_SIZE = 10

const columns: DataTableColumn<AuditLogEntry>[] = [
  {
    id: 'category',
    header: 'Category',
    sortable: true,
    sortValue: (e) => e.category,
    cell: (e) => (
      <Badge variant="outline" className="gap-1.5">
        {CATEGORY_CONFIG[e.category].icon}
        {CATEGORY_CONFIG[e.category].label}
      </Badge>
    ),
  },
  {
    id: 'actor',
    header: 'Actor',
    sortable: true,
    sortValue: (e) => e.actor.name,
    cell: (e) => (
      <span>
        {e.actor.name}
        <span className="text-muted-foreground"> ({e.actor.type})</span>
      </span>
    ),
  },
  {
    id: 'event',
    header: 'Event',
    cell: (e) => (
      <div>
        <p className="font-medium">{e.action}</p>
        <p className="text-muted-foreground text-xs">{e.detail}</p>
      </div>
    ),
  },
  {
    id: 'related',
    header: 'Related',
    cell: (e) =>
      e.executionId ? (
        <Link
          to={`/control-tower/executions/${e.executionId}`}
          className="text-primary font-mono text-xs hover:underline"
        >
          {e.executionId}
        </Link>
      ) : e.requestId ? (
        <span className="text-muted-foreground font-mono text-xs">
          {e.requestId}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'timestamp',
    header: 'When',
    sortable: true,
    sortValue: (e) => e.timestamp,
    cellClassName: 'text-muted-foreground font-mono text-xs whitespace-nowrap',
    cell: (e) => e.timestamp,
  },
]

// Generic by construction, same as every other Control Tower table — zero
// knowledge of specific rule names or agents, just renders whatever
// AuditLogEntry[] the service returns, filtered client-side by category.
export function AuditLogsPage() {
  useDocumentTitle('Audit Logs — AI Control Tower')
  const counts = useAuditCategoryCounts()
  const log = useAuditLog()
  const [filter, setFilter] = React.useState<AuditCategory | 'all'>('all')
  const [page, setPage] = React.useState(1)

  const filteredEntries = React.useMemo(() => {
    if (!log.data) return []
    return filter === 'all'
      ? log.data
      : log.data.filter((e) => e.category === filter)
  }, [log.data, filter])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground text-sm">
          Every execution, guardrail action, approval decision, and access
          event, in one trail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {counts.isLoading || !counts.data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : (
          <>
            <KPIWidget
              label="Total Events"
              value={Object.values(counts.data).reduce((sum, n) => sum + n, 0)}
              icon={<ListIcon />}
            />
            <KPIWidget
              label="Approvals"
              value={counts.data.approval}
              icon={<CheckSquareIcon />}
            />
            <KPIWidget
              label="Guardrail Actions"
              value={counts.data.guardrail}
              icon={<ShieldAlertIcon />}
            />
            <KPIWidget
              label="System Events"
              value={counts.data.system}
              icon={<ServerIcon />}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
          <CardDescription>
            Filter by category, or view the full trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                type="button"
                size="sm"
                variant={filter === f.value ? 'default' : 'outline'}
                onClick={() => {
                  setFilter(f.value)
                  setPage(1)
                }}
                className={cn(filter !== f.value && 'text-muted-foreground')}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={filteredEntries}
            getRowId={(e) => e.id}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isLoading={log.isLoading}
            emptyState={
              <EmptyState
                title="No matching events"
                description="Try a different category filter."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
