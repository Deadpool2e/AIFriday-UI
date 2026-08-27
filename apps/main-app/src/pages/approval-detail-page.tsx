import { Link, useNavigate, useParams } from 'react-router'
import { useRequest, useSubmitApproval } from '@platform/api-client'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  HumanApprovalPanel,
  Skeleton,
  useDocumentTitle,
  useToast,
  type ApprovalActionType,
} from '@platform/ui'
import { ArrowLeftIcon } from 'lucide-react'

// Each action gets its own wording and tone: "Request rejected" is not
// the same news as "Sent back for changes", and a single generic "Done"
// toast would flatten that distinction.
const ACTION_RESULT: Record<
  ApprovalActionType,
  {
    title: string
    description: string
    tone: 'success' | 'danger' | 'warning' | 'info'
  }
> = {
  approve: {
    title: 'Request approved',
    description: 'The decision is recorded and the request has moved on.',
    tone: 'success',
  },
  reject: {
    title: 'Request rejected',
    description: 'Your comment was recorded with the decision.',
    tone: 'danger',
  },
  send_back: {
    title: 'Sent back for changes',
    description: 'The owner has been notified with your comment.',
    tone: 'warning',
  },
  request_info: {
    title: 'More information requested',
    description: 'The request stays open until the owner responds.',
    tone: 'info',
  },
}

export function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: request, isLoading, isError, refetch } = useRequest(id)
  const submitApproval = useSubmitApproval()
  const navigate = useNavigate()
  const { toast } = useToast()
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
      {
        // Navigating away used to be the *only* signal that a decision
        // landed — you pressed Approve, the page changed, and you took it
        // on faith. The toast is the receipt: it names what you did, to
        // what, and offers the way back.
        onSuccess: () => {
          const result = ACTION_RESULT[action]
          toast({
            title: `${result.title} — ${id}`,
            description: result.description,
            tone: result.tone,
            action: {
              label: 'View request',
              onClick: () => navigate(`/requests/${id}`),
            },
          })
          navigate('/approvals')
        },
        onError: (error) => {
          toast({
            title: 'Decision not recorded',
            description:
              error instanceof Error
                ? error.message
                : 'The approvals service did not respond.',
            tone: 'danger',
          })
        },
      },
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        {/* An explicit way back. A detail page reached from a queue needs
            one that doesn't rely on the browser's back button, since the
            approval flow redirects on submit and back would return here
            to a request that's already been decided. */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-7 gap-1.5 px-2"
          asChild
        >
          <Link to="/approvals">
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            All approvals
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-xl font-semibold tracking-tight">
            {request.id}
          </h1>
          <Badge variant="outline" className="capitalize">
            {request.status}
          </Badge>
        </div>
        <p className="text-pretty">{request.title}</p>
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
