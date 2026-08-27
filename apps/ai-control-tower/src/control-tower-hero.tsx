import {
  useAgents,
  useControlTowerMetrics,
  useSystemHealth,
} from '@platform/api-client'
import { LiveIndicator, PageHeader, Skeleton } from '@platform/ui'

import { ControlTowerNav } from './control-tower-nav'

interface HeroStat {
  label: string
  value: string
}

// The Control Tower's identity moment — deliberately more technical/dense
// than the Main App dashboard's hero: a monospace stat strip instead of
// cards, read left-to-right as a system status line. This is the primary
// place the two apps' visual language is meant to diverge.
//
// The section tabs now live inside this header rather than as a third
// stacked band beneath it, so "where am I in the Control Tower" is one
// visual unit — status, numbers, and sections — instead of three separate
// horizontal rules the eye has to reassemble.
export function ControlTowerHero() {
  const metrics = useControlTowerMetrics()
  const agents = useAgents()
  const health = useSystemHealth()

  const isDegraded =
    health.data?.some((item) => item.status !== 'healthy') ?? false
  const isLoading = metrics.isLoading || agents.isLoading || health.isLoading

  const stats: HeroStat[] = [
    { label: 'Agents', value: `${agents.data?.length ?? 0}` },
    {
      label: 'Executions',
      value: metrics.data?.totalRequests.toLocaleString('en-US') ?? '—',
    },
    {
      label: 'Success rate',
      value: metrics.data ? `${metrics.data.successRate}%` : '—',
    },
    {
      label: 'P95 latency',
      value: metrics.data
        ? `${(metrics.data.p95LatencyMs / 1000).toFixed(2)}s`
        : '—',
    },
  ]

  return (
    <PageHeader
      ambient
      eyebrow="AI Operations"
      title={
        <span className="flex items-center gap-2.5">
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-50 ${
                isDegraded ? 'bg-warning' : 'bg-success'
              }`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${
                isDegraded ? 'bg-warning' : 'bg-success'
              }`}
            />
          </span>
          {isDegraded ? 'Degraded performance' : 'System operational'}
        </span>
      }
      description="Every agent, execution, guardrail, and token this platform spends — live."
      meta={<LiveIndicator tone="info" label="Streaming" />}
      toolbar={<ControlTowerNav />}
    >
      {isLoading ? (
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="flex flex-wrap gap-x-10 gap-y-3 font-mono">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                {stat.label}
              </dt>
              <dd className="text-xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </PageHeader>
  )
}
