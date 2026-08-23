import { AlertCircleIcon, CheckCircle2Icon, EyeIcon, ServerIcon } from 'lucide-react'
import { useSystemComponentMetrics, useSystemIncidents } from '@platform/api-client'
import type { SystemComponentMetric, SystemIncident } from '@platform/types'
import {
  Badge,
  Card,
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

const INCIDENT_STATUS_VARIANT: Record<SystemIncident['status'], 'default' | 'secondary' | 'outline'> = {
  investigating: 'default',
  monitoring: 'secondary',
  resolved: 'outline',
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function summarize(components: SystemComponentMetric[]) {
  const healthy = components.filter((c) => c.status === 'healthy').length
  const degraded = components.filter((c) => c.status === 'degraded').length
  const down = components.filter((c) => c.status === 'down').length
  const avgUptime =
    components.length === 0
      ? 0
      : Math.round((components.reduce((sum, c) => sum + c.uptimePercent, 0) / components.length) * 100) / 100

  return { healthy, degraded, down, avgUptime }
}

// Overview's compact <SystemHealth> card reads the same underlying
// components (via useSystemHealth -> MOCK_SYSTEM_HEALTH) that this page's
// metrics table enriches with uptime/response time — one list, two views.
export function SystemHealthPage() {
  useDocumentTitle('System Health — AI Control Tower')
  const components = useSystemComponentMetrics()
  const incidents = useSystemIncidents()
  const stats = components.data ? summarize(components.data) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-muted-foreground text-sm">
            Every infrastructure component the platform depends on, and its recent incident history.
          </p>
        </div>
        <LiveIndicator tone="info" label="Monitoring live" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {components.isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <KPIWidget label="Healthy" value={stats.healthy} icon={<CheckCircle2Icon />} />
            <KPIWidget label="Degraded" value={stats.degraded} icon={<AlertCircleIcon />} />
            <KPIWidget label="Down" value={stats.down} icon={<ServerIcon />} />
            <KPIWidget label="Avg Uptime" value={`${stats.avgUptime}%`} icon={<EyeIcon />} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Current status of every backend service the platform depends on.</CardDescription>
          </CardHeader>
          <CardContent>
            {components.isLoading || !components.data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <SystemHealth items={components.data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uptime &amp; response time</CardTitle>
            <CardDescription>Rolling uptime and average response time per component.</CardDescription>
          </CardHeader>
          <CardContent>
            {components.isLoading || !components.data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {components.data.map((component) => (
                  <li key={component.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{component.name}</span>
                    <span className="text-muted-foreground flex items-center gap-3 text-xs tabular-nums">
                      <span>{component.uptimePercent.toFixed(2)}% uptime</span>
                      <span>{component.avgResponseMs}ms avg</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent incidents</CardTitle>
          <CardDescription>Every incident logged against a platform component, resolved or not.</CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.isLoading || !incidents.data ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : incidents.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No incidents logged.</p>
          ) : (
            <ul className="space-y-4">
              {incidents.data.map((incident) => (
                <li key={incident.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]} className="capitalize">
                      {incident.status}
                    </Badge>
                    <span className="font-medium">{incident.component}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{incident.summary}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    Started {formatTimestamp(incident.startedAt)}
                    {incident.resolvedAt && <> · Resolved {formatTimestamp(incident.resolvedAt)}</>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
