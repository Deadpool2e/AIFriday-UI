import * as React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CoinsIcon, DollarSignIcon, ReceiptIcon, ZapIcon } from 'lucide-react'
import { useLlmUsageSummary, useLlmUsageTrend, useModelUsage } from '@platform/api-client'
import type { ModelUsage } from '@platform/types'
import {
  Badge,
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

const columns: DataTableColumn<ModelUsage>[] = [
  {
    id: 'model',
    header: 'Model',
    sortable: true,
    sortValue: (m) => m.model,
    cell: (m) => <span className="font-mono text-xs">{m.model}</span>,
  },
  {
    id: 'category',
    header: 'Type',
    sortable: true,
    sortValue: (m) => m.category,
    cell: (m) => (
      <Badge variant="outline" className="capitalize">
        {m.category}
      </Badge>
    ),
  },
  {
    id: 'agents',
    header: 'Used By',
    cell: (m) => m.agents.join(', '),
  },
  {
    id: 'requests',
    header: 'Requests',
    sortable: true,
    sortValue: (m) => m.requests,
    cellClassName: 'tabular-nums',
    cell: (m) => m.requests.toLocaleString('en-US'),
  },
  {
    id: 'tokens',
    header: 'Tokens',
    sortable: true,
    sortValue: (m) => m.tokens,
    cellClassName: 'tabular-nums',
    cell: (m) => m.tokens.toLocaleString('en-US'),
  },
  {
    id: 'cost',
    header: 'Est. Cost',
    sortable: true,
    sortValue: (m) => m.estimatedCostUsd,
    cellClassName: 'tabular-nums',
    cell: (m) => `$${m.estimatedCostUsd.toFixed(2)}`,
  },
  {
    id: 'avgLatency',
    header: 'Avg Latency',
    sortable: true,
    sortValue: (m) => m.avgLatencyMs,
    cellClassName: 'tabular-nums',
    cell: (m) => `${m.avgLatencyMs}ms`,
  },
]

// Generic by construction — this table has zero knowledge of "gpt-4o" or
// "Orchestrator" specifically, it just renders whatever ModelUsage[] the
// service returns (which itself is grouped straight from MOCK_AGENTS, the
// same store the Agents page reads).
export function LlmUsagePage() {
  useDocumentTitle('LLM Usage — AI Control Tower')
  const summary = useLlmUsageSummary()
  const usage = useModelUsage()
  const trend = useLlmUsageTrend()
  const [page, setPage] = React.useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LLM Usage</h1>
        <p className="text-muted-foreground text-sm">
          Token consumption and estimated spend, broken down by model and agent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : summary.data ? (
          <>
            <KPIWidget
              label="Total Tokens"
              value={summary.data.totalTokens.toLocaleString('en-US')}
              icon={<ZapIcon />}
              sparklineData={trend.data?.map((p) => p.tokens)}
            />
            <KPIWidget
              label="Estimated Cost"
              value={`$${summary.data.totalCostUsd.toFixed(2)}`}
              icon={<DollarSignIcon />}
            />
            <KPIWidget
              label="Total Requests"
              value={summary.data.totalRequests.toLocaleString('en-US')}
              icon={<ReceiptIcon />}
            />
            <KPIWidget
              label="Avg Cost / Request"
              value={`$${summary.data.avgCostPerRequest.toFixed(4)}`}
              icon={<CoinsIcon />}
            />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token usage trend</CardTitle>
          <CardDescription>Estimated daily token consumption, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.isLoading || !trend.data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend.data} margin={{ left: 0, right: 8 }}>
                <ChartAreaGradient id="llm-tokens" colorVar="var(--color-chart-warning)" />
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
                  tickFormatter={(v: number) => v.toLocaleString('en-US')}
                />
                <Tooltip
                  {...chartTooltipStyle}
                  formatter={(value) => [`${Number(value).toLocaleString('en-US')} tokens`, 'Usage']}
                />
                <Bar dataKey="tokens" fill="url(#llm-tokens)" stroke="var(--color-chart-warning)" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage by model</CardTitle>
          <CardDescription>Every model currently in use, grouped from the same agent data as the Agents page.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={usage.data ?? []}
            getRowId={(m) => m.model}
            page={page}
            pageSize={20}
            onPageChange={setPage}
            isLoading={usage.isLoading}
            emptyState={
              <EmptyState title="No usage recorded" description="Model usage will show up here." />
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
