import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  FileIcon,
  SparklesIcon,
  XCircleIcon,
} from 'lucide-react'
import { useParams } from 'react-router'
import { useRequest } from '@platform/api-client'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfidenceScore,
  EmptyState,
  ErrorState,
  RiskIndicator,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

const AGENT_STATUS_ICON = {
  completed: <CheckCircle2Icon className="text-success size-4" />,
  running: <CircleDashedIcon className="text-info size-4 animate-spin" />,
  failed: <XCircleIcon className="text-danger size-4" />,
  skipped: <CircleIcon className="text-muted-foreground size-4" />,
}

const DECISION_LABEL: Record<string, string> = {
  approve: 'compliant',
  review: 'inconclusive',
  escalate: 'high-priority for escalation',
  reject: 'non-compliant',
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, isError, refetch } = useRequest(id)
  useDocumentTitle(`${id ?? 'Request'} — Enterprise AI Platform`)

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load this request"
        description="The request service didn't respond. Try again."
        onRetry={() => refetch()}
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  if (!request) {
    return (
      <EmptyState
        title="Request not found"
        description={`No request matches "${id}".`}
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{request.id}</h1>
          <Badge variant="outline" className="capitalize">
            {request.status}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {request.priority} priority
          </Badge>
        </div>
        <p className="text-muted-foreground">{request.title}</p>
        <p className="text-muted-foreground text-sm">
          Owner: {request.owner} · Created{' '}
          {new Date(request.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {request.aiRecommendation && (
        <div className="border-ai-accent/30 bg-surface relative overflow-hidden rounded-xl border pl-4">
          <span className="bg-ai-accent absolute inset-y-0 left-0 w-0.5" aria-hidden="true" />
          <div className="flex flex-wrap items-start justify-between gap-3 py-3.5 pr-4">
            <div className="space-y-1.5">
              <p className="text-ai-accent flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <SparklesIcon className="size-3.5" aria-hidden="true" />
                AI summary
              </p>
              <p className="text-sm leading-snug">
                This request appears{' '}
                {DECISION_LABEL[request.aiRecommendation.decision] ?? request.aiRecommendation.decision}, with{' '}
                <span className="font-medium">{request.risk}</span> risk at{' '}
                <span className="font-medium">{request.aiRecommendation.confidence}%</span> confidence.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RiskIndicator level={request.risk} />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {request.timeline.map((event) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        event.status === 'completed'
                          ? 'bg-success'
                          : event.status === 'current'
                            ? 'bg-info'
                            : 'bg-muted-foreground/30'
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(event.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent execution summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {request.agentExecutions.map((execution) => (
                  <li
                    key={execution.agent}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {AGENT_STATUS_ICON[execution.status]}
                      {execution.agent}
                    </span>
                    <span className="text-muted-foreground font-mono tabular-nums">
                      {execution.status === 'skipped' ? '—' : `${execution.durationMs}ms`}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supporting documents</CardTitle>
            </CardHeader>
            <CardContent>
              {request.documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No documents attached.</p>
              ) : (
                <ul className="space-y-3">
                  {request.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm">
                      <FileIcon className="text-muted-foreground size-4" />
                      <span className="flex-1">{doc.name}</span>
                      <span className="text-muted-foreground text-xs">{doc.sizeLabel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk & confidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Risk level</span>
                <RiskIndicator level={request.risk} />
              </div>
              {request.aiRecommendation && (
                <ConfidenceScore value={request.aiRecommendation.confidence} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval state</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  request.approvalState === 'approved'
                    ? 'default'
                    : request.approvalState === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                }
                className="capitalize"
              >
                {request.approvalState.replace('_', ' ')}
              </Badge>
              <p className="text-muted-foreground mt-2 text-sm">
                {request.humanReviewRequired
                  ? 'This request required human review before proceeding.'
                  : 'This request did not require human review.'}
              </p>
            </CardContent>
          </Card>

          {request.aiRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle>AI recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="capitalize">
                  {request.aiRecommendation.decision}
                </Badge>
                <p className="text-sm">{request.aiRecommendation.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
