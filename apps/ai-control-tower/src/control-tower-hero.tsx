import { useAgents, useControlTowerMetrics, useSystemHealth } from '@platform/api-client'
import { LiveIndicator, Skeleton } from '@platform/ui'

// The Control Tower's identity moment (Section 24) — deliberately more
// technical/dense than the Main App dashboard's hero: a monospace stat
// strip instead of cards, read top-to-bottom as a system status line. This
// is the primary place the two apps' visual language is meant to diverge.
export function ControlTowerHero() {
  const metrics = useControlTowerMetrics()
  const agents = useAgents()
  const health = useSystemHealth()

  const isDegraded = health.data?.some((item) => item.status !== 'healthy') ?? false
  const isLoading = metrics.isLoading || agents.isLoading || health.isLoading

  return (
    <div
      className="relative -mx-6 -mt-6 overflow-hidden border-b px-6 pt-6 pb-5"
      style={{ backgroundImage: 'var(--gradient-primary-radial)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            AI Control Tower
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${isDegraded ? 'bg-warning' : 'bg-success'}`}
              aria-hidden="true"
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              {isDegraded ? 'Degraded performance' : 'System operational'}
            </h1>
          </div>
        </div>
        <LiveIndicator tone="info" label="Streaming live" />
      </div>

      {isLoading ? (
        <div className="mt-4 flex gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
      ) : (
        <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-3 font-mono">
          <div>
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Agents</dt>
            <dd className="text-2xl font-semibold tracking-tighter tabular-nums">{agents.data?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Executions</dt>
            <dd className="text-2xl font-semibold tracking-tighter tabular-nums">
              {metrics.data?.totalRequests.toLocaleString('en-US') ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">Success rate</dt>
            <dd className="text-2xl font-semibold tracking-tighter tabular-nums">{metrics.data?.successRate ?? '—'}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">P95 latency</dt>
            <dd className="text-2xl font-semibold tracking-tighter tabular-nums">
              {metrics.data ? `${(metrics.data.p95LatencyMs / 1000).toFixed(2)}s` : '—'}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
