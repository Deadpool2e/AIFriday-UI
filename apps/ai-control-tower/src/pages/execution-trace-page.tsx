import { useParams } from 'react-router'
import { useLiveAgentTrace } from '@platform/api-client'
import {
  AgentTrace,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  useDocumentTitle,
} from '@platform/ui'

// Reusable for any execution — nothing here is specific to a request
// domain or a particular agent lineup. The Section 21 flow (Orchestrator
// -> RAG -> Risk -> Compliance -> Decision -> Guardrails -> Human
// Approval) comes entirely from whatever steps useLiveAgentTrace folds up,
// in order. Streams live (Phase 13's SSE-ready event source) rather than
// loading a pre-resolved snapshot — the "Streaming live" badge and the
// running-agent spinner in AgentTrace are the visible proof of that.
export function ExecutionTracePage() {
  const { executionId } = useParams<{ executionId: string }>()

  if (!executionId) {
    return (
      <EmptyState
        title="No execution selected"
        description="Choose an execution from the Overview or an agent's detail page."
        className="mx-auto mt-16 max-w-md"
      />
    )
  }

  // Keyed by executionId so navigating from one execution's trace straight
  // to another's (e.g. via browser back/forward) fully remounts this view
  // instead of reusing a live subscription that belongs to the old id.
  return <ExecutionTraceView key={executionId} executionId={executionId} />
}

function ExecutionTraceView({ executionId }: { executionId: string }) {
  const { steps, isComplete, requestId } = useLiveAgentTrace(executionId)
  useDocumentTitle(`${executionId} — AI Control Tower`)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{executionId}</h1>
        <p className="text-muted-foreground text-sm">
          Request {requestId} · {steps.length} stage{steps.length === 1 ? '' : 's'}
          {isComplete ? '' : ' so far'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Execution trace
            {!isComplete && (
              <span className="text-info inline-flex items-center gap-1.5 text-xs font-normal">
                <span
                  className="bg-info size-1.5 animate-pulse rounded-full"
                  aria-hidden="true"
                />
                Streaming live
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Every agent this execution touched, in order, with input/output and cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <AgentTrace steps={steps} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
