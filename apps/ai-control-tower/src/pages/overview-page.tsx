import {
  CartesianGrid,
  Line,
  LineChart,
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
  Skeleton,
  SystemHealth,
  useDocumentTitle,
} from '@platform/ui'

import {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Control Tower</h1>
        <p className="text-muted-foreground text-sm">
          Live view of every agent, system component, and AI execution across the platform.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.isLoading ? (
          Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : metrics.data ? (
          <>
            <KPIWidget label="Active Agents" value={metrics.data.activeAgents} icon={<BotIcon />} />
            <KPIWidget
              label="Requests"
              value={metrics.data.totalRequests}
              icon={<FileTextIcon />}
            />
            <KPIWidget
              label="Success Rate"
              value={`${metrics.data.successRate}%`}
              icon={<CheckCircle2Icon />}
            />
            <KPIWidget
              label="Avg Latency"
              value={`${metrics.data.avgLatencyMs}ms`}
              icon={<ClockIcon />}
            />
            <KPIWidget
              label="P95 Latency"
              value={`${metrics.data.p95LatencyMs}ms`}
              icon={<TrendingUpIcon />}
            />
            <KPIWidget
              label="Tokens Used"
              value={metrics.data.tokensUsed.toLocaleString('en-US')}
              icon={<ZapIcon />}
            />
            <KPIWidget
              label="Estimated Cost"
              value={`$${metrics.data.estimatedCostUsd.toFixed(2)}`}
              icon={<DollarSignIcon />}
            />
            <KPIWidget
              label="Guardrail Blocks"
              value={metrics.data.guardrailBlocks}
              icon={<ShieldAlertIcon />}
            />
            <KPIWidget
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
                <LineChart data={trend.data} margin={{ left: -16, right: 8 }}>
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
                    width={40}
                    domain={[70, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    {...chartTooltipStyle}
                    formatter={(value) => [`${value}%`, 'Success rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    stroke="var(--color-chart-success)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-success)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
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
                        className="text-primary flex items-center gap-2 font-medium hover:underline"
                      >
                        {EXECUTION_STATUS_ICON[execution.status]}
                        {execution.requestId}
                      </Link>
                      <span className="text-muted-foreground flex items-center gap-3 text-xs tabular-nums">
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
    </div>
  )
}
