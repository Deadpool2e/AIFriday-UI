import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  FileIcon,
  XCircleIcon,
} from 'lucide-react'
import { useParams } from 'react-router'
import { useRequest } from '@platform/api-client'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
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

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, isError, refetch } = useRequest(id)
  useDocumentTitle(`${id ?? 'Request'} — Enterprise AI Platform`)

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
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
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{request.id}</h1>
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

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      {request.aiRecommendation && (
        <Card>
          <CardHeader>
            <CardTitle>AI recommendation</CardTitle>
            <CardDescription className="capitalize">
              {request.aiRecommendation.decision}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{request.aiRecommendation.summary}</p>
            <p className="text-muted-foreground mt-3 text-xs">
              A full explainability breakdown (supporting/negative factors, sources,
              guardrail results) arrives in Phase 19.
            </p>
          </CardContent>
        </Card>
      )}

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

      <div className="grid gap-4 md:grid-cols-2">
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
                  <span className="text-muted-foreground tabular-nums">
                    {execution.status === 'skipped' ? '—' : `${execution.durationMs}ms`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              Full agent traces (per-step input/output, token usage) arrive in Phase 12.
            </p>
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
    </div>
  )
}
