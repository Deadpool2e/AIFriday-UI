import { Link } from 'react-router'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { GaugeIcon, ListChecksIcon, TrendingDownIcon, UserCheckIcon } from 'lucide-react'
import {
  useConfidenceBands,
  useDecisionFactors,
  useExplainabilitySummary,
  useLowConfidenceDecisions,
} from '@platform/api-client'
import type { ExplainabilityDecision } from '@platform/types'
import {
  AIRecommendationCard,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  KPIWidget,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

import { chartTooltipStyle } from '../lib/chart-theme'

const CONFIDENCE_BAND_TONE: Record<string, string> = {
  high: 'bg-success',
  medium: 'bg-warning',
  low: 'bg-danger',
}

const DECISION_LABEL: Record<ExplainabilityDecision, string> = {
  approve: 'Approve',
  review: 'Needs review',
  escalate: 'Escalate',
  reject: 'Reject',
}
const DECISION_TONE: Record<ExplainabilityDecision, string> = {
  approve: 'bg-success',
  review: 'bg-warning',
  escalate: 'bg-danger',
  reject: 'bg-danger',
}
const DECISION_COLOR_VAR: Record<ExplainabilityDecision, string> = {
  approve: 'var(--color-chart-success)',
  review: 'var(--color-chart-warning)',
  escalate: 'var(--color-danger)',
  reject: 'var(--color-danger)',
}

// Small local primitive — a labeled proportional bar, reused three times
// on this page (confidence bands, decision breakdown, factor weights)
// with different data and tone maps. Not promoted to packages/ui: it's
// three near-identical blocks, not a design-system-worthy abstraction.
function ProportionBar({
  label,
  value,
  max,
  toneClassName,
  valueLabel,
}: {
  label: string
  value: number
  max: number
  toneClassName: string
  valueLabel: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{valueLabel}</span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${toneClassName}`}
          style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

// Every number on this page is derived from the same MOCK_REQUESTS store
// Main App's dashboard and requests list already read (see
// explainability-service.ts) — this is a second view over one dataset,
// not a parallel one.
export function ExplainabilityPage() {
  useDocumentTitle('Explainability — AI Control Tower')
  const summary = useExplainabilitySummary()
  const bands = useConfidenceBands()
  const factors = useDecisionFactors()
  const lowConfidence = useLowConfidenceDecisions()

  const maxBandCount = bands.data ? Math.max(1, ...bands.data.map((b) => b.count)) : 1
  const maxDecisionCount = summary.data
    ? Math.max(1, ...Object.values(summary.data.decisionCounts))
    : 1
  const maxFactorWeight = factors.data ? Math.max(1, ...factors.data.map((f) => f.weightPercent)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explainability</h1>
        <p className="text-muted-foreground text-sm">
          Why the AI decides what it decides, in aggregate — and which specific decisions need a second look.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.isLoading || !summary.data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <KPIWidget label="Avg Confidence" value={`${summary.data.avgConfidence}%`} icon={<GaugeIcon />} />
            <KPIWidget
              label="Human Review Rate"
              value={`${summary.data.humanReviewRate}%`}
              icon={<UserCheckIcon />}
            />
            <KPIWidget
              label="Low-Confidence Decisions"
              value={summary.data.lowConfidenceCount}
              icon={<TrendingDownIcon />}
            />
            <KPIWidget
              label="Most Common Decision"
              value={
                DECISION_LABEL[
                  (Object.entries(summary.data.decisionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
                    'approve') as ExplainabilityDecision
                ]
              }
              icon={<ListChecksIcon />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence distribution</CardTitle>
            <CardDescription>Every AI-recommended decision, bucketed by confidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bands.isLoading || !bands.data ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              bands.data.map((band) => (
                <ProportionBar
                  key={band.band}
                  label={band.label}
                  value={band.count}
                  max={maxBandCount}
                  toneClassName={CONFIDENCE_BAND_TONE[band.band]}
                  valueLabel={String(band.count)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decision breakdown</CardTitle>
            <CardDescription>What the AI ultimately recommended, across every request.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading || !summary.data ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <PieChart width={128} height={128} className="shrink-0">
                  <Tooltip {...chartTooltipStyle} />
                  <Pie
                    data={(Object.entries(summary.data.decisionCounts) as [ExplainabilityDecision, number][]).map(
                      ([decision, count]) => ({ name: DECISION_LABEL[decision], value: count, decision }),
                    )}
                    dataKey="value"
                    nameKey="name"
                    cx={64}
                    cy={64}
                    innerRadius={34}
                    outerRadius={54}
                    paddingAngle={2}
                    strokeWidth={0}
                    isAnimationActive
                    animationDuration={600}
                  >
                    {(Object.keys(summary.data.decisionCounts) as ExplainabilityDecision[]).map((decision) => (
                      <Cell key={decision} fill={DECISION_COLOR_VAR[decision]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="w-full space-y-3">
                  {(Object.entries(summary.data.decisionCounts) as [ExplainabilityDecision, number][]).map(
                    ([decision, count]) => (
                      <ProportionBar
                        key={decision}
                        label={DECISION_LABEL[decision]}
                        value={count}
                        max={maxDecisionCount}
                        toneClassName={DECISION_TONE[decision]}
                        valueLabel={String(count)}
                      />
                    ),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What drives a decision</CardTitle>
          <CardDescription>
            Aggregate factor weighting across the decision pipeline — not specific to any one request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {factors.isLoading || !factors.data ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            factors.data.map((factor) => (
              <div key={factor.name} className="space-y-1">
                <ProportionBar
                  label={factor.name}
                  value={factor.weightPercent}
                  max={maxFactorWeight}
                  toneClassName="bg-info"
                  valueLabel={`${factor.weightPercent}%`}
                />
                <p className="text-muted-foreground text-xs">{factor.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisions needing a second look</CardTitle>
          <CardDescription>The lowest-confidence AI recommendations, most concerning first.</CardDescription>
        </CardHeader>
        <CardContent>
          {lowConfidence.isLoading || !lowConfidence.data ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : lowConfidence.data.length === 0 ? (
            <EmptyState
              title="No low-confidence decisions"
              description="Every AI recommendation currently meets the confidence bar."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {lowConfidence.data.map((decision) => (
                <li key={decision.requestId} className="space-y-2">
                  <Link
                    to={`/requests/${decision.requestId}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    {decision.title} <span className="font-mono text-xs">({decision.requestId})</span>
                  </Link>
                  <AIRecommendationCard
                    decision={decision.decision}
                    confidence={decision.confidence}
                    risk={decision.risk}
                    summary={decision.summary}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
