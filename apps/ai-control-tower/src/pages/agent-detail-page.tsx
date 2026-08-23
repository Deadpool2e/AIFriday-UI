import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CheckCircle2Icon, CircleDashedIcon, XCircleIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useAgent, useAgentExecutions, useAgentPerformanceTrend } from '@platform/api-client'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
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

const EXECUTION_STATUS_ICON = {
  completed: <CheckCircle2Icon className="text-success size-4" />,
  running: <CircleDashedIcon className="text-info size-4 animate-spin" />,
  failed: <XCircleIcon className="text-danger size-4" />,
}

// Reusable for any future agent — every value here comes from the Agent
// entity and its own execution/trend queries, nothing is hardcoded to a
// specific agent's identity.
export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: agent, isLoading, isError, refetch } = useAgent(id)
  const executions = useAgentExecutions(id)
  const trend = useAgentPerformanceTrend(id)
  useDocumentTitle(`${agent?.name ?? id ?? 'Agent'} — AI Control Tower`)

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load this agent"
        description="The agents service didn't respond. Try again."
        onRetry={() => refetch()}
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  if (!agent) {
    return (
      <EmptyState
        title="Agent not found"
        description={`No agent matches "${id}".`}
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
          <Badge variant="outline" className="capitalize">
            {agent.status}
          </Badge>
          <Badge variant="secondary">{agent.model}</Badge>
        </div>
        <p className="text-muted-foreground">{agent.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPIWidget label="Requests" value={agent.requestsHandled} />
        <KPIWidget
          label="Success Rate"
          value={`${agent.successRate}%`}
          sparklineData={trend.data?.map((p) => p.successRate)}
        />
        <KPIWidget label="Avg Latency" value={`${agent.avgLatencyMs}ms`} />
        <KPIWidget label="Tokens Used" value={agent.tokensUsed.toLocaleString('en-US')} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance trend</CardTitle>
          <CardDescription>Success rate, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.isLoading || !trend.data ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend.data} margin={{ left: 0, right: 8 }}>
                <ChartAreaGradient id="agent-perf-trend" colorVar="var(--color-chart-info)" />
                <CartesianGrid stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="date" tick={chartAxisTick} axisLine={chartAxisLine} tickLine={false} />
                <YAxis
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  domain={[40, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip {...chartTooltipStyle} formatter={(value) => [`${value}%`, 'Success rate']} />
                <Area
                  type="monotone"
                  dataKey="successRate"
                  stroke="var(--color-chart-info)"
                  strokeWidth={2}
                  fill="url(#agent-perf-trend)"
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
          <CardTitle>Recent executions</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !executions.data || executions.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No executions recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {executions.data.map((execution) => (
                <li key={execution.id} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/control-tower/executions/${execution.id}`}
                      className="text-primary flex items-center gap-2 font-mono text-xs font-medium hover:underline"
                    >
                      {EXECUTION_STATUS_ICON[execution.status]}
                      {execution.requestId}
                    </Link>
                    <span className="text-muted-foreground flex items-center gap-3 font-mono text-xs tabular-nums">
                      <span>{execution.durationMs}ms</span>
                      <span>{execution.timestamp}</span>
                    </span>
                  </div>
                  {execution.error && (
                    <p className="text-danger mt-0.5 pl-6 text-xs">{execution.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
