import { useNavigate, useParams } from 'react-router'
import { useRequest, useSubmitApproval } from '@platform/api-client'
import {
  Badge,
  EmptyState,
  ErrorState,
  HumanApprovalPanel,
  Skeleton,
  useDocumentTitle,
  type ApprovalActionType,
} from '@platform/ui'

export function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, isError, refetch } = useRequest(id)
  const submitApproval = useSubmitApproval()
  const navigate = useNavigate()
  useDocumentTitle(`Approval ${id ?? ''} — Enterprise AI Platform`)

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
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

  if (!request.aiRecommendation) {
    return (
      <EmptyState
        title="No AI recommendation yet"
        description="This request hasn't been AI-processed, so there's nothing to review yet."
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  function handleSubmit(action: ApprovalActionType, comment: string) {
    if (!id) return
    submitApproval.mutate(
      { requestId: id, action, comment },
      { onSuccess: () => navigate('/approvals') },
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{request.id}</h1>
          <Badge variant="outline" className="capitalize">
            {request.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">{request.title}</p>
        <p className="text-muted-foreground text-sm">Owner: {request.owner}</p>
      </div>

      <HumanApprovalPanel
        decision={request.aiRecommendation.decision}
        confidence={request.aiRecommendation.confidence}
        risk={request.risk}
        summary={request.aiRecommendation.summary}
        agentsInvolved={request.agentExecutions.map((a) => ({
          agent: a.agent,
          status: a.status,
        }))}
        guardrailChecks={request.guardrailChecks}
        sources={request.documents.map((d) => ({ id: d.id, name: d.name }))}
        onSubmit={handleSubmit}
        isSubmitting={submitApproval.isPending}
      />
    </div>
  )
}
