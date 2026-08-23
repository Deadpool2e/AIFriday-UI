import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BotIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UserCheckIcon,
  XCircleIcon,
  ZapIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import {
  useAgents,
  useAgentSuccessRateTrend,
  useControlTowerMetrics,
  useRecentExecutions,
  useSystemHealth,
} from '@platform/api-client'
import type { AgentStatus } from '@platform/types'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KPIWidget,
  LiveIndicator,
  Skeleton,
  SystemHealth,
  useDocumentTitle,
} from '@platform/ui'

import {
  ChartAreaGradient,
  chartAxisLine,
  chartAxisTick,
  chartGridStroke,
  chartTooltipStyle,
} from '../lib/chart-theme'

const AGENT_STATUS_ORDER: AgentStatus[] = ['running', 'idle', 'degraded', 'failed']
const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  degraded: 'Degraded',
  failed: 'Failed',
}
const AGENT_STATUS_TONE: Record<AgentStatus, string> = {
  running: 'bg-success',
  idle: 'bg-muted-foreground',
  degraded: 'bg-warning',
  failed: 'bg-danger',
}
const EXECUTION_STATUS_ICON = {
  completed: <CheckCircle2Icon className="text-success size-4" />,
  running: <CircleDashedIcon className="text-info size-4 animate-spin" />,
  failed: <XCircleIcon className="text-danger size-4" />,
}

export function OverviewPage() {
  useDocumentTitle('AI Control Tower — Enterprise AI Platform')
  const metrics = useControlTowerMetrics()
  const agents = useAgents()
  const health = useSystemHealth()
  const trend = useAgentSuccessRateTrend()
  const executions = useRecentExecutions()

  const statusCounts = AGENT_STATUS_ORDER.map((status) => ({
    status,
    count: agents.data?.filter((a) => a.status === status).length ?? 0,
  }))
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count))

  const successRateSeries = trend.data?.map((point) => point.successRate)

  return (
    <div className="space-y-6">
      {/* KPI row — Active Agents and Success Rate lead as featured bento
          cards; the rest carry a semantic tone instead of uniform white. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.isLoading ? (
          Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : metrics.data ? (
          <>
            <KPIWidget
              className="animate-card-in col-span-2 sm:col-span-3 lg:col-span-2"
              style={{ animationDelay: '0ms' }}
              size="featured"
              tone="ai"
              label="Active Agents"
              value={metrics.data.activeAgents}
              icon={<BotIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '40ms' }}
              label="Requests"
              value={metrics.data.totalRequests}
              icon={<FileTextIcon />}
            />
            <KPIWidget
              className="animate-card-in col-span-2 sm:col-span-3 lg:col-span-2"
              style={{ animationDelay: '80ms' }}
              size="featured"
              tone="success"
              label="Success Rate"
              value={`${metrics.data.successRate}%`}
              icon={<CheckCircle2Icon />}
              sparklineData={successRateSeries}
              delta={
                successRateSeries && successRateSeries.length > 1
                  ? {
                      value: `${Math.abs(successRateSeries[successRateSeries.length - 1] - successRateSeries[0]).toFixed(1)}pt`,
                      tone: successRateSeries[successRateSeries.length - 1] >= successRateSeries[0] ? 'positive' : 'negative',
                      direction: successRateSeries[successRateSeries.length - 1] >= successRateSeries[0] ? 'up' : 'down',
                    }
                  : undefined
              }
              comparisonLabel="over 14 days"
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '120ms' }}
              label="Avg Latency"
              value={`${metrics.data.avgLatencyMs}ms`}
              icon={<ClockIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '160ms' }}
              label="P95 Latency"
              value={`${metrics.data.p95LatencyMs}ms`}
              icon={<TrendingUpIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '200ms' }}
              tone="info"
              label="Tokens Used"
              value={metrics.data.tokensUsed.toLocaleString('en-US')}
              icon={<ZapIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '240ms' }}
              label="Estimated Cost"
              value={`$${metrics.data.estimatedCostUsd.toFixed(2)}`}
              icon={<DollarSignIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '280ms' }}
              tone="warning"
              label="Guardrail Blocks"
              value={metrics.data.guardrailBlocks}
              icon={<ShieldAlertIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '320ms' }}
              tone="warning"
              label="Human Escalations"
              value={metrics.data.humanEscalations}
              icon={<UserCheckIcon />}
            />
          </>
        ) : null}
      </div>

      {/* Chart + system health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent success rate</CardTitle>
            <CardDescription>Rolling average across all agents, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isLoading || !trend.data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend.data} margin={{ left: 0, right: 8 }}>
                  <ChartAreaGradient id="agent-success-rate" colorVar="var(--color-chart-success)" />
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
                    domain={[70, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    {...chartTooltipStyle}
                    formatter={(value) => [`${value}%`, 'Success rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="successRate"
                    stroke="var(--color-chart-success)"
                    strokeWidth={2}
                    fill="url(#agent-success-rate)"
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-success)',
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
            <CardTitle>System health</CardTitle>
          </CardHeader>
          <CardContent>
            {health.isLoading || !health.data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <SystemHealth items={health.data} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent activity + recent executions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent activity</CardTitle>
            <CardDescription>{agents.data?.length ?? 0} agents registered</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/control-tower/agents">View all agents</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              statusCounts.map(({ status, count }) => (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{AGENT_STATUS_LABEL[status]}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${AGENT_STATUS_TONE[status]}`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent executions</CardTitle>
          </CardHeader>
          <CardContent>
            {executions.isLoading || !executions.data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
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
                      {execution.status === 'running' ? (
                        <LiveIndicator tone="info" label="Running" />
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-3 font-mono text-xs tabular-nums">
                          <span>{execution.durationMs}ms</span>
                          <span>{execution.timestamp}</span>
                        </span>
                      )}
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
    </div>
  )
}
