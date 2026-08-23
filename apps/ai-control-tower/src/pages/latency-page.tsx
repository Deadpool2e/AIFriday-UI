import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router'
import { ClockIcon, GaugeIcon, TimerIcon, ZapIcon } from 'lucide-react'
import {
  useAgentLatencyBreakdown,
  useLatencySummary,
  useLatencyTrend,
  useSlowExecutions,
} from '@platform/api-client'
import type { AgentLatencyBreakdown } from '@platform/types'
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

const columns: DataTableColumn<AgentLatencyBreakdown>[] = [
  {
    id: 'agent',
    header: 'Agent',
    sortable: true,
    sortValue: (b) => b.agent,
    cell: (b) => <span className="font-medium">{b.agent}</span>,
  },
  {
    id: 'avg',
    header: 'Avg',
    sortable: true,
    sortValue: (b) => b.avgLatencyMs,
    cellClassName: 'tabular-nums',
    cell: (b) => `${b.avgLatencyMs}ms`,
  },
  {
    id: 'p50',
    header: 'P50',
    sortable: true,
    sortValue: (b) => b.p50LatencyMs,
    cellClassName: 'tabular-nums',
    cell: (b) => `${b.p50LatencyMs}ms`,
  },
  {
    id: 'p95',
    header: 'P95',
    sortable: true,
    sortValue: (b) => b.p95LatencyMs,
    cellClassName: 'tabular-nums',
    cell: (b) => `${b.p95LatencyMs}ms`,
  },
  {
    id: 'p99',
    header: 'P99',
    sortable: true,
    sortValue: (b) => b.p99LatencyMs,
    cellClassName: 'tabular-nums',
    cell: (b) => `${b.p99LatencyMs}ms`,
  },
]

// Generic by construction, same as the other Control Tower pages — this
// table has zero knowledge of "Risk Agent" specifically, it renders
// whatever AgentLatencyBreakdown[] the service returns (derived from the
// same MOCK_AGENTS the Agents page and LLM Usage page read).
export function LatencyPage() {
  useDocumentTitle('Latency — AI Control Tower')
  const summary = useLatencySummary()
  const breakdown = useAgentLatencyBreakdown()
  const trend = useLatencyTrend()
  const slow = useSlowExecutions()
  const [page, setPage] = React.useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Latency</h1>
        <p className="text-muted-foreground text-sm">
          How fast every agent responds, end to end, and what's currently slow.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : summary.data ? (
          <>
            <KPIWidget
              label="Avg Latency"
              value={`${summary.data.avgLatencyMs}ms`}
              icon={<ZapIcon />}
              sparklineData={trend.data?.map((p) => p.avgLatencyMs)}
            />
            <KPIWidget label="P50" value={`${summary.data.p50LatencyMs}ms`} icon={<GaugeIcon />} />
            <KPIWidget
              label="P95"
              value={`${summary.data.p95LatencyMs}ms`}
              icon={<ClockIcon />}
              sparklineData={trend.data?.map((p) => p.p95LatencyMs)}
            />
            <KPIWidget label="P99" value={`${summary.data.p99LatencyMs}ms`} icon={<TimerIcon />} />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latency trend</CardTitle>
          <CardDescription>Average vs. P95 latency across all agents, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.isLoading || !trend.data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend.data} margin={{ left: 0, right: 8, top: 8 }}>
                <ChartAreaGradient id="latency-avg" colorVar="var(--color-chart-success)" />
                <ChartAreaGradient id="latency-p95" colorVar="var(--color-chart-warning)" />
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
                  width={56}
                  tickFormatter={(v: number) => `${v}ms`}
                />
                <Tooltip {...chartTooltipStyle} formatter={(value, name) => [`${value}ms`, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="avgLatencyMs"
                  name="Average"
                  stroke="var(--color-chart-success)"
                  strokeWidth={2}
                  fill="url(#latency-avg)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="p95LatencyMs"
                  name="P95"
                  stroke="var(--color-chart-warning)"
                  strokeWidth={2}
                  fill="url(#latency-p95)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latency by agent</CardTitle>
          <CardDescription>Average and tail latency percentiles for each agent.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={breakdown.data ?? []}
            getRowId={(b) => b.agent}
            page={page}
            pageSize={20}
            onPageChange={setPage}
            isLoading={breakdown.isLoading}
            emptyState={<EmptyState title="No latency data" description="Agent latency will show up here." />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slowest recent executions</CardTitle>
          <CardDescription>The highest-duration executions across all agents right now.</CardDescription>
        </CardHeader>
        <CardContent>
          {slow.isLoading || !slow.data ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {slow.data.map((execution) => (
                <li key={execution.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Link
                      to={`/control-tower/executions/${execution.executionId}`}
                      className="text-primary font-mono text-xs font-medium hover:underline"
                    >
                      {execution.requestId}
                    </Link>
                    <span className="text-muted-foreground">{execution.agent}</span>
                  </span>
                  <span className="text-muted-foreground flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span className="text-warning font-medium">{execution.durationMs}ms</span>
                    <span>{execution.timestamp}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
