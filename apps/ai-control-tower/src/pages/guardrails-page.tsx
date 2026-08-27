import * as React from 'react'
import { Link } from 'react-router'
import {
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldOffIcon,
} from 'lucide-react'
import {
  useGuardrailEvents,
  useGuardrailRules,
  useGuardrailSummary,
} from '@platform/api-client'
import type { GuardrailRule, GuardrailSeverity } from '@platform/types'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  EmptyState,
  KPIWidget,
  ShieldClearIllustration,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

const SEVERITY_RANK: Record<GuardrailSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// Same tone system as RiskIndicator (packages/ui), reapplied here with
// severity-specific labels instead of "risk" wording — a guardrail rule's
// severity describes the violation, not the request's risk level, so the
// two shouldn't share a label even though they share a color vocabulary.
const SEVERITY_TONE: Record<GuardrailSeverity, string> = {
  low: 'bg-info/10 text-info border-info/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-danger/10 text-danger border-danger/20',
  critical: 'bg-danger/20 text-danger border-danger/40 font-semibold',
}

function SeverityBadge({ severity }: { severity: GuardrailSeverity }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${SEVERITY_TONE[severity]}`}
    >
      {severity}
    </Badge>
  )
}

const PAGE_SIZE = 10

const columns: DataTableColumn<GuardrailRule>[] = [
  {
    id: 'name',
    header: 'Rule',
    sortable: true,
    sortValue: (r) => r.name,
    cell: (r) => (
      <div>
        <p className="font-medium">{r.name}</p>
        <p className="text-muted-foreground text-xs">{r.description}</p>
      </div>
    ),
  },
  {
    id: 'severity',
    header: 'Severity',
    sortable: true,
    sortValue: (r) => SEVERITY_RANK[r.severity],
    cell: (r) => <SeverityBadge severity={r.severity} />,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    sortValue: (r) => (r.enabled ? 0 : 1),
    cell: (r) =>
      r.enabled ? (
        <Badge variant="secondary" className="text-success">
          Enabled
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Disabled
        </Badge>
      ),
  },
  {
    id: 'blocks',
    header: 'Blocks',
    sortable: true,
    sortValue: (r) => r.blockCount,
    cellClassName: 'tabular-nums',
    cell: (r) => r.blockCount.toLocaleString('en-US'),
  },
  {
    id: 'passes',
    header: 'Passes',
    sortable: true,
    sortValue: (r) => r.passCount,
    cellClassName: 'tabular-nums',
    cell: (r) => r.passCount.toLocaleString('en-US'),
  },
]

// Generic by construction, same as AgentsPage — this table and event list
// have zero knowledge of specific rule names; they render whatever the
// service returns.
export function GuardrailsPage() {
  useDocumentTitle('Guardrails — AI Control Tower')
  const summary = useGuardrailSummary()
  const rules = useGuardrailRules()
  const events = useGuardrailEvents()
  const [page, setPage] = React.useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Guardrails</h2>
        <p className="text-muted-foreground text-sm">
          Policy and safety rules screening every agent execution, and what
          they've caught.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : summary.data ? (
          <>
            <KPIWidget
              label="Active Rules"
              value={`${summary.data.activeRules}/${summary.data.totalRules}`}
              icon={<ShieldIcon />}
            />
            <KPIWidget
              label="Blocks (recent)"
              value={summary.data.blocksLast24h}
              icon={<ShieldAlertIcon />}
            />
            <KPIWidget
              label="Overall Block Rate"
              value={`${summary.data.blockRate}%`}
              icon={<ShieldOffIcon />}
            />
            <KPIWidget
              label="Most Triggered"
              value={summary.data.topRule ? summary.data.topRule.name : 'None'}
              icon={<ShieldCheckIcon />}
            />
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>
            Every guardrail currently configured, enabled or not.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rules.data ?? []}
            getRowId={(r) => r.id}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isLoading={rules.isLoading}
            emptyState={
              <EmptyState
                title="No rules configured"
                description="Guardrail rules will show up here."
              />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent guardrail events</CardTitle>
          <CardDescription>
            Every block or flag, with a link back to the execution it happened
            in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.isLoading || !events.data ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : events.data.length === 0 ? (
            <EmptyState
              icon={<ShieldClearIllustration />}
              title="No guardrail activity yet"
              description="Every execution has passed cleanly so far — blocks and flags will show up here."
            />
          ) : (
            <ul className="space-y-3">
              {events.data.map((event) => (
                <li key={event.id} className="text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <SeverityBadge severity={event.severity} />
                      <Link
                        to={`/control-tower/executions/${event.executionId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {event.ruleName}
                      </Link>
                      <span className="text-muted-foreground">
                        {event.action === 'blocked' ? 'blocked' : 'flagged'} by{' '}
                        {event.agent}
                      </span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {event.requestId} · {event.timestamp}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
