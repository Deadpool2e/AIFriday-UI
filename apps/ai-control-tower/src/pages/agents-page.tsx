import * as React from 'react'
import { Link } from 'react-router'
import { useAgents } from '@platform/api-client'
import type { Agent, AgentStatus } from '@platform/types'
import {
  Badge,
  DataTable,
  type DataTableColumn,
  EmptyState,
  ErrorState,
  useDocumentTitle,
} from '@platform/ui'

const STATUS_RANK: Record<AgentStatus, number> = {
  running: 0,
  degraded: 1,
  idle: 2,
  failed: 3,
}

const STATUS_VARIANT: Record<AgentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  idle: 'secondary',
  degraded: 'outline',
  failed: 'destructive',
}

const PAGE_SIZE = 10

const columns: DataTableColumn<Agent>[] = [
  {
    id: 'name',
    header: 'Agent',
    sortable: true,
    sortValue: (a) => a.name,
    cell: (a) => (
      <Link
        to={`/control-tower/agents/${a.id}`}
        className="text-primary font-medium hover:underline"
      >
        {a.name}
      </Link>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sortValue: (a) => STATUS_RANK[a.status],
    cell: (a) => (
      <Badge variant={STATUS_VARIANT[a.status]} className="capitalize">
        {a.status}
      </Badge>
    ),
  },
  {
    id: 'requests',
    header: 'Requests',
    sortable: true,
    sortValue: (a) => a.requestsHandled,
    cellClassName: 'tabular-nums',
    cell: (a) => a.requestsHandled,
  },
  {
    id: 'successRate',
    header: 'Success Rate',
    sortable: true,
    sortValue: (a) => a.successRate,
    cellClassName: 'tabular-nums',
    cell: (a) => `${a.successRate}%`,
  },
  {
    id: 'avgLatency',
    header: 'Avg Latency',
    sortable: true,
    sortValue: (a) => a.avgLatencyMs,
    cellClassName: 'tabular-nums',
    cell: (a) => `${a.avgLatencyMs}ms`,
  },
  {
    id: 'tokens',
    header: 'Tokens',
    sortable: true,
    sortValue: (a) => a.tokensUsed,
    cellClassName: 'tabular-nums',
    cell: (a) => a.tokensUsed.toLocaleString('en-US'),
  },
  {
    id: 'lastExecution',
    header: 'Last Execution',
    sortable: true,
    sortValue: (a) => a.lastExecutionAt,
    cellClassName: 'tabular-nums',
    cell: (a) =>
      new Date(a.lastExecutionAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
  },
]

// Generic by construction: this table has zero knowledge of "Orchestrator"
// or "Risk Agent" specifically — it just renders whatever Agent[] the
// service returns. Adding a 6th agent to the mock data (or, later, the
// real backend) requires no change here.
export function AgentsPage() {
  useDocumentTitle('Agents — AI Control Tower')
  const agents = useAgents()
  const [page, setPage] = React.useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="text-muted-foreground text-sm">
          {agents.data ? `${agents.data.length} agents registered` : 'Loading…'}
        </p>
      </div>

      {agents.isError ? (
        <ErrorState
          title="Couldn't load agents"
          description="The agents service didn't respond. Try again."
          onRetry={() => agents.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={agents.data ?? []}
          getRowId={(a) => a.id}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={agents.isLoading}
          emptyState={
            <EmptyState title="No agents registered" description="Agents will show up here." />
          }
        />
      )}
    </div>
  )
}
