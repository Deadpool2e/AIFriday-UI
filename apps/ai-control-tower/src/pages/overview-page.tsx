import {
  ActivityIcon,
  BotIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  HistoryIcon,
  LayersIcon,
  XCircleIcon,
} from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import {
  useAgents,
  useControlTowerMetrics,
  useControlTowerMetricsTrend,
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
  DistributionBar,
  type DistributionSegment,
  LiveIndicator,
  MetricStrip,
  type MetricStripItem,
  RankedList,
  type RankedListItem,
  Skeleton,
  SystemHealth,
  type Tone,
  useDocumentTitle,
} from '@platform/ui'

import {
  AnalyticsPanel,
  type TrendPoint,
  type TrendSeries,
} from '../lib/analytics-panel'

// The four operational metrics with real history behind them. Every series
// ends on the value the KPI strip and the page hero already report, so the
// chart and the numbers above it can never tell different stories.
const TREND_SERIES: TrendSeries[] = [
  {
    id: 'successRate',
    href: '/control-tower/agents',
    label: 'Success Rate',
    color: 'var(--color-chart-success)',
    aggregate: 'last',
    toneForIncrease: 'positive',
    format: (value) => `${Math.round(value)}%`,
  },
  {
    id: 'avgLatencyMs',
    href: '/control-tower/latency',
    label: 'Avg Latency',
    color: 'var(--color-chart-info)',
    aggregate: 'last',
    // Slower is worse, so a rise here is bad news even though the arrow
    // points the same way as a rise in success rate.
    toneForIncrease: 'negative',
    format: (value) => `${Math.round(value)}ms`,
  },
  {
    id: 'tokensUsed',
    href: '/control-tower/llm-usage',
    label: 'Tokens Used',
    color: 'var(--color-ai-accent)',
    aggregate: 'last',
    toneForIncrease: 'neutral',
    format: (value) => Math.round(value).toLocaleString('en-US'),
  },
  {
    id: 'guardrailBlocks',
    href: '/control-tower/guardrails',
    label: 'Guardrail Blocks',
    color: 'var(--color-chart-warning)',
    aggregate: 'last',
    // Deliberately neutral: a block is the guardrail working, so more of
    // them is not straightforwardly worse — it's worth looking at.
    toneForIncrease: 'neutral',
    format: (value) => Math.round(value).toLocaleString('en-US'),
  },
]

const AGENT_STATUS_ORDER: AgentStatus[] = [
  'running',
  'idle',
  'degraded',
  'failed',
]
const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  degraded: 'Degraded',
  failed: 'Failed',
}
// Semantic tones rather than raw colour classes — the component owns how a
// tone is painted, so status colour is declared once here and stays
// consistent with every other breakdown in the product.
const AGENT_STATUS_TONE: Record<AgentStatus, Tone> = {
  running: 'success',
  idle: 'neutral',
  degraded: 'warning',
  failed: 'danger',
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
  const trend = useControlTowerMetricsTrend()
  const executions = useRecentExecutions()

  const statusCounts = AGENT_STATUS_ORDER.map((status) => ({
    status,
    count: agents.data?.filter((a) => a.status === status).length ?? 0,
  }))

  // The service already returns one row per day with every metric on it,
  // so it drops straight into the panel — no zipping of separate series.
  const trendData: TrendPoint[] | undefined = trend.data?.map((point) => ({
    date: point.date,
    successRate: point.successRate,
    avgLatencyMs: point.avgLatencyMs,
    tokensUsed: point.tokensUsed,
    guardrailBlocks: point.guardrailBlocks,
  }))

  const stateItems: MetricStripItem[] = metrics.data
    ? [
        {
          id: 'agents',
          href: '/control-tower/agents',
          label: 'Active Agents',
          value: metrics.data.activeAgents,
        },
        // No arrow: there is no execution index page to send anyone
        // to, and a link landing somewhere only loosely related is worse
        // than no link at all.
        {
          id: 'requests',
          label: 'Executions',
          value: metrics.data.totalRequests,
        },
        {
          id: 'p95',
          href: '/control-tower/latency',
          label: 'P95 Latency',
          value: `${metrics.data.p95LatencyMs.toLocaleString('en-US')}`,
          unit: 'ms',
        },
        {
          id: 'cost',
          href: '/control-tower/llm-usage',
          label: 'Estimated Cost',
          value: `$${metrics.data.estimatedCostUsd.toFixed(2)}`,
        },
        {
          id: 'escalations',
          href: '/approvals',
          label: 'Human Escalations',
          value: metrics.data.humanEscalations,
        },
      ]
    : []

  // Busiest agents first — on an operations overview the question is
  // "where is the load", and insertion order answers nothing.
  const agentLoadItems: RankedListItem[] = [...(agents.data ?? [])]
    .sort((a, b) => b.requestsHandled - a.requestsHandled)
    .map((agent) => ({
      id: agent.id,
      label: agent.name,
      value: agent.requestsHandled,
      // Two related figures, two columns — not one string welded together
      // with a middot. The throughput is what the row is ranked by, so it
      // owns the value column; the success rate rides beside it, muted.
      meta: `${agent.successRate}% success`,
      // A failed or degraded agent colours its own row, so the exception
      // is visible while scanning rather than only on the status page.
      tone:
        agent.status === 'failed'
          ? 'danger'
          : agent.status === 'degraded'
            ? 'warning'
            : agent.status === 'running'
              ? 'info'
              : 'neutral',
    }))

  // Four states of one fleet, so this is a composition, not a ranking:
  // the reader wants "how is the fleet split", and four bars each scaled
  // against the biggest one makes them do that arithmetic themselves.
  const agentStatusSegments: DistributionSegment[] = statusCounts.map(
    ({ status, count }) => ({
      id: status,
      label: AGENT_STATUS_LABEL[status],
      value: count,
      tone: AGENT_STATUS_TONE[status],
    }),
  )
  const agentCount = agents.data?.length ?? 0

  // MetricStrip and AnalyticsPanel deliberately import no router, so the
  // page supplies the Link and navigation stays the app's concern.
  const renderMetricLink = (href: string, children: React.ReactNode) => (
    <Link to={href} className="block">
      {children}
    </Link>
  )

  return (
    <div className="space-y-6">
      {/* Pick an operational metric, see its 14-day shape. Replaces a
          nine-tile KPI grid sitting above a single fixed chart — eight of
          those tiles had no history to show, and the one chart was locked
          to the ninth. */}
      <AnalyticsPanel
        title="Platform operations"
        series={TREND_SERIES}
        data={trendData}
        isLoading={trend.isLoading}
        renderLink={renderMetricLink}
      />

      {/* Point-in-time counts. Separated from the panel above because
          these are levels, not rates over a window. */}
      <MetricStrip
        label="Current platform state"
        items={stateItems}
        isLoading={metrics.isLoading}
        renderLink={renderMetricLink}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle icon={<BotIcon />} tone="info">
              Agents by throughput
            </CardTitle>
            <CardDescription>
              Executions handled, across {agentCount} registered agents
            </CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link to="/control-tower/agents">View all agents</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {/* Numbered, because the order *is* the finding here — and
                each row stays a link to that agent's detail page. */}
            <RankedList
              items={agentLoadItems}
              numbered
              isLoading={agents.isLoading}
              loadingRows={5}
              emptyLabel="No agents registered."
              renderLink={(item, children) => (
                <Link to={`/control-tower/agents/${item.id}`} className="block">
                  {children}
                </Link>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={<ActivityIcon />} tone="success">
              System health
            </CardTitle>
            <CardDescription>Platform services, right now</CardDescription>
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle icon={<LayersIcon />} tone="ai">
              Agent status
            </CardTitle>
            <CardDescription>
              How the fleet is currently distributed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionBar
              segments={agentStatusSegments}
              totalLabel={`${agentCount} registered agent${agentCount === 1 ? '' : 's'}`}
              isLoading={agents.isLoading}
              emptyLabel="No agents registered."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle icon={<HistoryIcon />} tone="neutral">
              Recent executions
            </CardTitle>
            <CardDescription>Latest runs across the fleet</CardDescription>
          </CardHeader>
          <CardContent>
            {executions.isLoading || !executions.data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              // Ruled rows, matching the service list opposite: an
              // execution is looked up one line at a time, and the rule
              // ties an id on the left to its duration on the right.
              <ul className="divide-border/60 -my-2 divide-y">
                {executions.data.map((execution) => (
                  <li key={execution.id} className="py-2 text-sm">
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
                      <p className="text-danger mt-0.5 pl-6 text-xs">
                        {execution.error}
                      </p>
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
