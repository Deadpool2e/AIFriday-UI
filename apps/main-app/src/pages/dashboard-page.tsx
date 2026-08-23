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
import {
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  ShieldAlertIcon,
  UserCheckIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  USE_MOCK_API,
  useAiActivity,
  useDashboardMetrics,
  usePendingApprovals,
  useRecentActivity,
  useRequestVolume,
  useRequests,
} from '@platform/api-client'
import type { RiskLevel } from '@platform/types'
import {
  ActivityFeed,
  AIInsight,
  AttentionRequired,
  type AttentionItem,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KPIWidget,
  LiveIndicator,
  RiskIndicator,
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

// Trend deltas aren't stored fields in DashboardMetrics — they're derived
// client-side from the 14-day series each chart already fetches (first
// half vs. second half), so the KPI strip never fabricates a number that
// doesn't trace back to real mock data. `toneForIncrease` lets each metric
// decide whether "more" is good, bad, or neutral — an increase in Human
// Review Required is not the same news as an increase in Completed.
function computeTrend(series: number[], toneForIncrease: 'positive' | 'negative' | 'neutral') {
  if (series.length < 4) return undefined
  const mid = Math.floor(series.length / 2)
  const previous = series.slice(0, mid).reduce((a, b) => a + b, 0)
  const recent = series.slice(mid).reduce((a, b) => a + b, 0)
  if (previous === 0) return undefined
  const pct = ((recent - previous) / previous) * 100
  const direction: 'up' | 'down' = pct >= 0 ? 'up' : 'down'
  const tone: 'positive' | 'negative' | 'neutral' =
    toneForIncrease === 'neutral' ? 'neutral' : pct >= 0 ? toneForIncrease : toneForIncrease === 'positive' ? 'negative' : 'positive'
  return {
    delta: { value: `${Math.abs(pct).toFixed(1)}%`, tone, direction },
    comparisonLabel: 'vs prior 7 days',
    sparklineData: series,
  }
}

export function DashboardPage() {
  useDocumentTitle('Overview — Enterprise AI Platform')
  const navigate = useNavigate()
  const metrics = useDashboardMetrics()
  const volume = useRequestVolume()
  const aiActivity = useAiActivity()
  const activity = useRecentActivity()
  const requests = useRequests()
  const pendingApprovals = usePendingApprovals()

  const riskCounts = RISK_ORDER.map((level) => ({
    level,
    count: requests.data?.filter((r) => r.risk === level).length ?? 0,
  }))
  const maxRiskCount = Math.max(1, ...riskCounts.map((r) => r.count))
  const highRiskCount = (riskCounts.find((r) => r.level === 'high')?.count ?? 0) +
    (riskCounts.find((r) => r.level === 'critical')?.count ?? 0)

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
  const topDecision = decisionCounts.length
    ? decisionCounts.reduce((a, b) => (b[1] > a[1] ? b : a))
    : undefined

  const submittedTrend = volume.data
    ? computeTrend(volume.data.map((d) => d.submitted), 'neutral')
    : undefined
  const completedTrend = volume.data
    ? computeTrend(volume.data.map((d) => d.completed), 'positive')
    : undefined
  const aiProcessedTrend = aiActivity.data
    ? computeTrend(aiActivity.data.map((d) => d.aiProcessed), 'positive')
    : undefined
  const humanReviewTrend = aiActivity.data
    ? computeTrend(aiActivity.data.map((d) => d.humanReview), 'negative')
    : undefined

  const attentionItems: AttentionItem[] = []
  if (pendingApprovals.data && pendingApprovals.data.length > 0) {
    attentionItems.push({
      id: 'pending-approvals',
      label: `${pendingApprovals.data.length} request${pendingApprovals.data.length === 1 ? '' : 's'} awaiting your approval`,
      severity: 'high',
    })
  }
  if (highRiskCount > 0) {
    attentionItems.push({
      id: 'high-risk',
      label: `${highRiskCount} high or critical-risk request${highRiskCount === 1 ? '' : 's'} in the queue`,
      severity: 'medium',
    })
  }

  const volumeSum = volume.data?.reduce((a, d) => a + d.submitted, 0) ?? 0
  const volumeTrendPct = submittedTrend ? submittedTrend.delta.value : null

  return (
    <div className="space-y-6">
      <div
        className="relative -mx-6 -mt-6 flex flex-wrap items-start justify-between gap-3 border-b px-6 pt-6 pb-5"
        style={{ backgroundImage: 'var(--gradient-primary-radial)' }}
      >
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Request volume, AI processing, and what needs your attention right now.
          </p>
        </div>
        <LiveIndicator isDemo={USE_MOCK_API} label="Live" tone="info" />
      </div>

      {/* KPI row — bento layout: Total Requests and AI Processed lead as
          featured cards, the rest stay compact so the eye has a clear
          entry point instead of six identical boxes. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : metrics.data ? (
          <>
            <KPIWidget
              className="animate-card-in col-span-2 sm:col-span-3 lg:col-span-2"
              style={{ animationDelay: '0ms' }}
              size="featured"
              label="Total Requests"
              value={metrics.data.totalRequests}
              icon={<FileTextIcon />}
              delta={submittedTrend?.delta}
              comparisonLabel={submittedTrend?.comparisonLabel}
              sparklineData={submittedTrend?.sparklineData}
              onClick={() => navigate('/requests')}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '40ms' }}
              tone="success"
              label="Completed"
              value={metrics.data.completed}
              icon={<CheckCircle2Icon />}
              delta={completedTrend?.delta}
              comparisonLabel={completedTrend?.comparisonLabel}
              sparklineData={completedTrend?.sparklineData}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '80ms' }}
              label="Pending"
              value={metrics.data.pending}
              icon={<ClockIcon />}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '120ms' }}
              tone="danger"
              label="High Risk"
              value={metrics.data.highRisk}
              icon={<ShieldAlertIcon />}
              onClick={() => navigate('/requests')}
            />
            <KPIWidget
              className="animate-card-in col-span-2 sm:col-span-3 lg:col-span-2"
              style={{ animationDelay: '160ms' }}
              size="featured"
              tone="ai"
              label="AI Processed"
              value={metrics.data.aiProcessed}
              icon={<BotIcon />}
              delta={aiProcessedTrend?.delta}
              comparisonLabel={aiProcessedTrend?.comparisonLabel}
              sparklineData={aiProcessedTrend?.sparklineData}
            />
            <KPIWidget
              className="animate-card-in"
              style={{ animationDelay: '200ms' }}
              tone="warning"
              label="Human Review Required"
              value={metrics.data.humanReviewRequired}
              icon={<UserCheckIcon />}
              delta={humanReviewTrend?.delta}
              comparisonLabel={humanReviewTrend?.comparisonLabel}
              sparklineData={humanReviewTrend?.sparklineData}
              onClick={() => navigate('/approvals')}
            />
          </>
        ) : null}
      </div>

      {/* What needs attention + AI insight */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionRequired
          className="lg:col-span-2"
          items={attentionItems}
          lastCheckedLabel="just now"
          onItemClick={(item) => navigate(item.id === 'pending-approvals' ? '/approvals' : '/requests')}
        />
        {volumeTrendPct && topDecision ? (
          <AIInsight
            observation={`Request volume ${submittedTrend!.delta.direction === 'up' ? 'increased' : 'decreased'} ${volumeTrendPct} over the last 7 days, totaling ${volumeSum} requests.`}
            driver={`${DECISION_LABEL[topDecision[0]] ?? topDecision[0]} was the most common AI decision (${topDecision[1]} requests).`}
            actionLabel="View requests"
            onAction={() => navigate('/requests')}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI insight</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        )}
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
                <AreaChart data={volume.data} margin={{ left: 0, right: 8 }}>
                  <ChartAreaGradient id="volume-submitted" colorVar="var(--color-chart-info)" />
                  <ChartAreaGradient id="volume-completed" colorVar="var(--color-chart-success)" />
                  <CartesianGrid stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={40} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted"
                    stroke="var(--color-chart-info)"
                    strokeWidth={2}
                    fill="url(#volume-submitted)"
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-info)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="var(--color-chart-success)"
                    strokeWidth={2}
                    fill="url(#volume-completed)"
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
                <AreaChart data={aiActivity.data} margin={{ left: 0, right: 8 }}>
                  <ChartAreaGradient id="activity-ai" colorVar="var(--color-chart-info)" />
                  <ChartAreaGradient id="activity-human" colorVar="var(--color-chart-warning)" />
                  <CartesianGrid stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} width={40} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aiProcessed"
                    name="AI Processed"
                    stroke="var(--color-chart-info)"
                    strokeWidth={2}
                    fill="url(#activity-ai)"
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-info)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="humanReview"
                    name="Human Review"
                    stroke="var(--color-chart-warning)"
                    strokeWidth={2}
                    fill="url(#activity-human)"
                    dot={{
                      r: 4,
                      fill: 'var(--color-chart-warning)',
                      stroke: 'var(--color-surface)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
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
