import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router'
import { DatabaseIcon, GaugeIcon, SearchIcon, TargetIcon } from 'lucide-react'
import {
  useRagDocuments,
  useRagQueries,
  useRagRelevanceTrend,
  useRagSummary,
} from '@platform/api-client'
import type { RagDocument } from '@platform/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  EmptyState,
  KPIWidget,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

import {
  ChartAreaGradient,
  chartAxisLine,
  chartAxisTick,
  chartGridStroke,
  chartTooltipStyle,
} from '../lib/chart-theme'

const PAGE_SIZE = 10

const columns: DataTableColumn<RagDocument>[] = [
  {
    id: 'title',
    header: 'Document',
    sortable: true,
    sortValue: (d) => d.title,
    cell: (d) => <span className="font-medium">{d.title}</span>,
  },
  {
    id: 'category',
    header: 'Category',
    sortable: true,
    sortValue: (d) => d.category,
    cell: (d) => d.category,
  },
  {
    id: 'chunks',
    header: 'Chunks',
    sortable: true,
    sortValue: (d) => d.chunkCount,
    cellClassName: 'tabular-nums',
    cell: (d) => d.chunkCount.toLocaleString('en-US'),
  },
  {
    id: 'retrievals',
    header: 'Retrievals',
    sortable: true,
    sortValue: (d) => d.retrievalCount,
    cellClassName: 'tabular-nums',
    cell: (d) => d.retrievalCount.toLocaleString('en-US'),
  },
  {
    id: 'avgRelevance',
    header: 'Avg Relevance',
    sortable: true,
    sortValue: (d) => d.avgRelevance,
    cellClassName: 'tabular-nums',
    cell: (d) => `${d.avgRelevance}%`,
  },
  {
    id: 'lastIndexed',
    header: 'Last Indexed',
    sortable: true,
    sortValue: (d) => d.lastIndexedAt,
    cellClassName: 'tabular-nums',
    cell: (d) =>
      new Date(d.lastIndexedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  },
]

// Generic by construction, same as AgentsPage/GuardrailsPage — this table
// and query list have zero knowledge of specific document titles; they
// render whatever the service returns.
export function RagMonitoringPage() {
  useDocumentTitle('RAG Monitoring — AI Control Tower')
  const summary = useRagSummary()
  const documents = useRagDocuments()
  const queries = useRagQueries()
  const trend = useRagRelevanceTrend()
  const [page, setPage] = React.useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">RAG Monitoring</h1>
        <p className="text-muted-foreground text-sm">
          What the retrieval layer is finding, how relevant it is, and how fast.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : summary.data ? (
          <>
            <KPIWidget
              label="Documents Indexed"
              value={summary.data.totalDocuments}
              icon={<DatabaseIcon />}
            />
            <KPIWidget
              label="Queries (recent)"
              value={summary.data.queriesLast24h}
              icon={<SearchIcon />}
            />
            <KPIWidget
              label="Avg Retrieval Latency"
              value={`${summary.data.avgRetrievalLatencyMs}ms`}
              icon={<GaugeIcon />}
            />
            <KPIWidget
              label="Avg Relevance"
              value={`${summary.data.avgRelevanceScore}%`}
              icon={<TargetIcon />}
              sparklineData={trend.data?.map((p) => p.avgRelevance)}
            />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relevance trend</CardTitle>
          <CardDescription>Average retrieval relevance score, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.isLoading || !trend.data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend.data} margin={{ left: 0, right: 8 }}>
                <ChartAreaGradient id="rag-relevance" colorVar="var(--color-chart-info)" />
                <CartesianGrid stroke={chartGridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={chartAxisTick}
                  axisLine={chartAxisLine}
                  tickLine={false}
                />
                <YAxis
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  domain={[50, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  {...chartTooltipStyle}
                  formatter={(value) => [`${value}%`, 'Avg relevance']}
                />
                <Area
                  type="monotone"
                  dataKey="avgRelevance"
                  stroke="var(--color-chart-info)"
                  strokeWidth={2}
                  fill="url(#rag-relevance)"
                  dot={{
                    r: 4,
                    fill: 'var(--color-chart-info)',
                    stroke: 'var(--color-surface)',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge base</CardTitle>
          <CardDescription>Every document currently indexed for retrieval.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={documents.data ?? []}
            getRowId={(d) => d.id}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isLoading={documents.isLoading}
            emptyState={
              <EmptyState title="No documents indexed" description="Indexed documents will show up here." />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent retrieval queries</CardTitle>
          <CardDescription>What agents asked the retrieval layer, and what it found.</CardDescription>
        </CardHeader>
        <CardContent>
          {queries.isLoading || !queries.data ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : queries.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No retrieval activity recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {queries.data.map((query) => (
                <li key={query.id} className="text-sm">
                  <p>
                    <Link
                      to={`/control-tower/executions/${query.executionId}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {query.query}
                    </Link>
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs tabular-nums">
                    <span>{query.agent}</span>
                    <span>{query.documentsRetrieved} documents retrieved</span>
                    <span>{query.avgRelevance}% avg relevance</span>
                    <span>{query.latencyMs}ms</span>
                    <span>{query.timestamp}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
