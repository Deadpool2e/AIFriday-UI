import {
  CartesianGrid,
  Legend,
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
  ClockIcon,
  FileTextIcon,
  ShieldAlertIcon,
  UserCheckIcon,
} from 'lucide-react'
import {
  useAiActivity,
  useDashboardMetrics,
  useRecentActivity,
  useRequestVolume,
  useRequests,
} from '@platform/api-client'
import type { RiskLevel } from '@platform/types'
import {
  ActivityFeed,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KPIWidget,
  RiskIndicator,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

import {
  chartAxisLine,
  chartAxisTick,
  chartGridStroke,
  chartTooltipStyle,
} from '../lib/chart-theme'

const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical']
const RISK_BAR_TONE: Record<RiskLevel, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-danger',
  critical: 'bg-danger',
}

const DECISION_LABEL: Record<string, string> = {
  approve: 'Approve',
  review: 'Review',
  escalate: 'Escalate',
  reject: 'Reject',
}

function ChartCardSkeleton() {
  return <Skeleton className="h-72 w-full" />
}

export function DashboardPage() {
  useDocumentTitle('Dashboard — Enterprise AI Platform')
  const metrics = useDashboardMetrics()
  const volume = useRequestVolume()
  const aiActivity = useAiActivity()
  const activity = useRecentActivity()
  const requests = useRequests()

  const riskCounts = RISK_ORDER.map((level) => ({
    level,
    count: requests.data?.filter((r) => r.risk === level).length ?? 0,
  }))
  const maxRiskCount = Math.max(1, ...riskCounts.map((r) => r.count))

  const decisionCounts = requests.data
    ? Object.entries(
        requests.data.reduce<Record<string, number>>((acc, request) => {
          const decision = request.aiRecommendation?.decision
          if (!decision) return acc
          acc[decision] = (acc[decision] ?? 0) + 1
          return acc
        }, {}),
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of request volume, AI processing, and what needs your attention.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : metrics.data ? (
          <>
            <KPIWidget
              label="Total Requests"
              value={metrics.data.totalRequests}
              icon={<FileTextIcon />}
            />
            <KPIWidget
              label="Completed"
              value={metrics.data.completed}
              icon={<CheckCircle2Icon />}
            />
            <KPIWidget label="Pending" value={metrics.data.pending} icon={<ClockIcon />} />
            <KPIWidget
              label="High Risk"
              value={metrics.data.highRisk}
              icon={<ShieldAlertIcon />}
            />
            <KPIWidget
              label="AI Processed"
              value={metrics.data.aiProcessed}
              icon={<BotIcon />}
            />
            <KPIWidget
              label="Human Review Required"
              value={metrics.data.humanReviewRequired}
              icon={<UserCheckIcon />}
            />
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request volume</CardTitle>
            <CardDescription>Submitted vs. completed, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {volume.isLoading || !volume.data ? (
              <ChartCardSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={volume.data} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted"
                    stroke="var(--color-chart-info)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-info)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
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
            <CardTitle>AI activity</CardTitle>
            <CardDescription>
              AI-processed vs. requiring human review, last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aiActivity.isLoading || !aiActivity.data ? (
              <ChartCardSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={aiActivity.data} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={32} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aiProcessed"
                    name="AI Processed"
                    stroke="var(--color-chart-info)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-info)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humanReview"
                    name="Human Review"
                    stroke="var(--color-chart-warning)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-warning)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity, risk, recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.isLoading || !activity.data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <ActivityFeed items={activity.data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              riskCounts.map(({ level, count }) => (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <RiskIndicator level={level} />
                    <span className="text-sm font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${RISK_BAR_TONE[level]}`}
                      style={{ width: `${(count / maxRiskCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI recommendations</CardTitle>
            <CardDescription>Decisions made by the AI pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {decisionCounts.map(([decision, count]) => (
                  <div key={decision} className="bg-surface-muted rounded-lg p-3">
                    <p className="text-2xl font-semibold tabular-nums">{count}</p>
                    <p className="text-muted-foreground text-xs">
                      {DECISION_LABEL[decision] ?? decision}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
