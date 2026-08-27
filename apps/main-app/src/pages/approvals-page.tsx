import { Link } from 'react-router'
import { usePendingApprovals } from '@platform/api-client'
import {
  AllCaughtUpIllustration,
  ApprovalCard,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

export function ApprovalsPage() {
  useDocumentTitle('Approvals — Enterprise AI Platform')
  const pending = usePendingApprovals()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Approvals"
        description={
          pending.data
            ? pending.data.length === 0
              ? 'Nothing is waiting on you right now.'
              : `${pending.data.length} request${pending.data.length === 1 ? '' : 's'} need your review — highest risk first.`
            : 'Loading…'
        }
        meta={
          pending.data && pending.data.length > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {pending.data.length} pending
            </Badge>
          ) : undefined
        }
      />

      {pending.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : pending.isError ? (
        <ErrorState
          title="Couldn't load approvals"
          description="The approvals service didn't respond. Try again."
          onRetry={() => pending.refetch()}
        />
      ) : !pending.data || pending.data.length === 0 ? (
        <EmptyState
          icon={<AllCaughtUpIllustration />}
          title="No pending approvals"
          description="You're all caught up — nothing needs your review right now."
        />
      ) : (
        <div className="space-y-3">
          {pending.data.map((request) => (
            <ApprovalCard
              key={request.id}
              id={request.id}
              title={request.title}
              owner={request.owner}
              risk={request.risk}
              confidence={request.aiRecommendation?.confidence}
              decision={request.aiRecommendation?.decision}
              action={
                <Button asChild size="sm">
                  <Link to={`/approvals/${request.id}`}>Review</Link>
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
