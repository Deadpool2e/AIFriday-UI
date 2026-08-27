import * as React from 'react'
import { HistoryIcon, ShieldAlertIcon, SparklesIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
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
  DistributionBar,
  type DistributionSegment,
  LiveIndicator,
  MetricStrip,
  type MetricStripItem,
  PageHeader,
  RankedList,
  type RankedListItem,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

import {
  AnalyticsPanel,
  type TrendPoint,
  type TrendSeries,
} from '../lib/analytics-panel'

// The four things this workspace measures per day. Each maps to a real
// 14-day series in the mock metrics service — nothing here is a metric we
// can name but not chart.
const TREND_SERIES: TrendSeries[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    color: 'var(--color-chart-info)',
    aggregate: 'sum',
    toneForIncrease: 'neutral',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'var(--color-chart-success)',
    aggregate: 'sum',
    toneForIncrease: 'positive',
  },
  {
    id: 'aiProcessed',
    label: 'AI Processed',
    color: 'var(--color-ai-accent)',
    aggregate: 'sum',
    toneForIncrease: 'positive',
  },
  {
    id: 'humanReview',
    label: 'Human Review',
    color: 'var(--color-chart-warning)',
    aggregate: 'sum',
    // More work bounced to a human is the AI pipeline doing less of its
    // job, so a rise here reads as bad news even though the number itself
    // is neutral.
    toneForIncrease: 'negative',
  },
]

const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical']
// The segment's own colour already carries risk, so the legend label is
// plain text rather than a <RiskIndicator> pill — a bordered, tinted badge
// beside a tinted dot states the same fact twice and reads as decoration.
// The wording still names the level, so meaning never rests on colour
// alone.
const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical risk',
}

const RISK_TONE: Record<RiskLevel, DistributionSegment['tone']> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

const DECISION_TONE: Record<string, RankedListItem['tone']> = {
  approve: 'success',
  review: 'info',
  escalate: 'warning',
  reject: 'danger',
}

const DECISION_LABEL: Record<string, string> = {
  approve: 'Approve',
  review: 'Review',
  escalate: 'Escalate',
  reject: 'Reject',
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
  const highRiskCount =
    (riskCounts.find((r) => r.level === 'high')?.count ?? 0) +
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
      href: '/requests',
      label: `${highRiskCount} high or critical-risk request${highRiskCount === 1 ? '' : 's'} in the queue`,
      severity: 'medium',
    })
  }

  const volumeSum = volume.data?.reduce((a, d) => a + d.submitted, 0) ?? 0

  // The two 14-day series are generated over the same date range, so they
  // zip into one dataset the panel can switch between without the x-axis
  // shifting under the reader when they change metric.
  const trendData: TrendPoint[] | undefined = React.useMemo(() => {
    if (!volume.data || !aiActivity.data) return undefined
    const aiByDate = new Map(
      aiActivity.data.map((point) => [point.date, point]),
    )
    return volume.data.map((point) => ({
      date: point.date,
      submitted: point.submitted,
      completed: point.completed,
      aiProcessed: aiByDate.get(point.date)?.aiProcessed ?? 0,
      humanReview: aiByDate.get(point.date)?.humanReview ?? 0,
    }))
  }, [volume.data, aiActivity.data])

  // Four bands of one queue — a composition, not a ranking. Drawn as a
  // single divided bar so "how risky is the backlog" is one glance rather
  // than four numbers to add up.
  const riskSegments: DistributionSegment[] = riskCounts.map(
    ({ level, count }) => ({
      id: level,
      label: RISK_LABEL[level],
      value: count,
      tone: RISK_TONE[level],
      // Critical shares Danger's red on purpose; the hatch is what keeps
      // it from merging into the High slice beside it.
      pattern: level === 'critical',
    }),
  )
  const openRequestCount = riskCounts.reduce((sum, r) => sum + r.count, 0)

  const decisionItems: RankedListItem[] = decisionCounts
    .map(([decision, count]) => ({
      id: decision,
      label: DECISION_LABEL[decision] ?? decision,
      value: count,
      tone: DECISION_TONE[decision] ?? 'neutral',
    }))
    .sort((a, b) => b.value - a.value)

  const stateItems: MetricStripItem[] = metrics.data
    ? [
        {
          id: 'total',
          href: '/requests',
          label: 'Total Requests',
          value: metrics.data.totalRequests,
        },
        {
          id: 'pending',
          href: '/requests',
          label: 'Pending',
          value: metrics.data.pending,
        },
        {
          id: 'high-risk',
          href: '/requests',
          label: 'High Risk',
          value: metrics.data.highRisk,
        },
        {
          id: 'human-review',
          href: '/approvals',
          label: 'Awaiting Review',
          value: metrics.data.humanReviewRequired,
        },
      ]
    : []

  // Supplied by the page so @platform/ui and the analytics panel stay
  // router-free. The four trend metrics above deliberately carry no
  // href — every one of them would land on /requests, and four arrows
  // pointing at one page teaches nobody anything.
  const renderMetricLink = (href: string, children: React.ReactNode) => (
    <Link to={href} className="block">
      {children}
    </Link>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        ambient
        eyebrow="Workspace"
        title="Overview"
        description="Request volume, AI processing, and what needs your attention right now."
        meta={<LiveIndicator isDemo={USE_MOCK_API} label="Live" tone="info" />}
      />

      {/* The analytics story: pick a metric, see it over time. Replaces a
          six-card KPI grid plus two fixed side-by-side charts — which
          together showed four series in three different visual languages
          and let the reader compare none of them. */}
      <AnalyticsPanel
        title="Request activity"
        series={TREND_SERIES}
        data={trendData}
        isLoading={volume.isLoading || aiActivity.isLoading}
      />

      {/* Point-in-time state. Deliberately separate from the panel above:
          these are counts of what is true right now, not rates over a
          window, and merging the two kinds of number into one row is what
          made the old KPI grid hard to read. */}
      <MetricStrip
        label="Current queue state"
        items={stateItems}
        isLoading={metrics.isLoading}
        renderLink={renderMetricLink}
      />

      {/* What needs attention + AI insight */}
      <div className="grid gap-5 lg:grid-cols-3">
        <AttentionRequired
          className="lg:col-span-2"
          items={attentionItems}
          lastCheckedLabel="just now"
          onItemClick={(item) =>
            navigate(
              item.id === 'pending-approvals' ? '/approvals' : '/requests',
            )
          }
        />
        {volumeSum > 0 && topDecision ? (
          <AIInsight
            observation={`${volumeSum} requests were submitted over the last 14 days, averaging ${Math.round(volumeSum / 14)} a day.`}
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

      {/* Activity, risk, recommendations.
          The feed is the tall one, so the two breakdowns stack beside it
          in a rail rather than sitting alongside as equal thirds — as
          three columns of one row they were stretched to the feed's
          height and left with a card's worth of empty space under four
          rows of content. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle icon={<HistoryIcon />} tone="neutral">
              Recent activity
            </CardTitle>
            <CardDescription>
              The latest movement across your requests
            </CardDescription>
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

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle icon={<ShieldAlertIcon />} tone="warning">
                Risk summary
              </CardTitle>
              <CardDescription>Open requests by assessed risk</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionBar
                segments={riskSegments}
                totalLabel={`${openRequestCount} open request${openRequestCount === 1 ? '' : 's'}`}
                isLoading={requests.isLoading}
                emptyLabel="No open requests."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle icon={<SparklesIcon />} tone="ai">
                AI recommendations
              </CardTitle>
              <CardDescription>
                Decisions made by the AI pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Ranked bars rather than a second divided bar: the risk
                  card above already splits the same queue, and printing
                  that shape twice on one page teaches nothing the second
                  time. Here the share rides beside each figure instead. */}
              <RankedList
                items={decisionItems}
                scale="total"
                showShare
                isLoading={requests.isLoading}
                loadingRows={3}
                emptyLabel="No AI decisions yet."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
