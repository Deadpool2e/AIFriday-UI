import * as React from 'react'
import { useParams } from 'react-router'
import { buildAgentGraphTopology, describeTraceEvent, useLiveAgentTrace } from '@platform/api-client'
import {
  AgentCommunication,
  AgentGraphDiagram,
  AgentTrace,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ExecutionTimeline,
  LiveIndicator,
  Skeleton,
  ToolMonitor,
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
  const { events, steps, toolCalls, messages, isComplete, requestId } = useLiveAgentTrace(executionId)
  useDocumentTitle(`${executionId} — AI Control Tower`)

  // The pipeline's shape never changes across executions — only which
  // agents have actually been reached (and which conditional branch fired)
  // does, so the topology is a plain constant and only node/edge *state*
  // is derived from this execution's own steps.
  const topology = React.useMemo(() => buildAgentGraphTopology(), [])
  const stepByAgent = React.useMemo(() => new Map(steps.map((step) => [step.agent, step])), [steps])
  const graphNodes = React.useMemo(
    () =>
      topology.nodes.map((node) => ({
        ...node,
        status: stepByAgent.get(node.id)?.status ?? 'pending',
      })),
    [topology, stepByAgent],
  )
  const graphEdges = React.useMemo(
    () => topology.edges.map((edge) => ({ ...edge, active: stepByAgent.has(edge.target) })),
    [topology, stepByAgent],
  )

  const timelineEvents = React.useMemo(
    () =>
      events.map((event, index) => ({
        id: `${executionId}-event-${index}`,
        timestamp: event.timestamp,
        ...describeTraceEvent(event),
      })),
    [executionId, events],
  )

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{executionId}</h1>
          <p className="text-muted-foreground text-sm">
            Request <span className="font-mono">{requestId}</span> · {steps.length} stage
            {steps.length === 1 ? '' : 's'}
            {isComplete ? '' : ' so far'}
          </p>
        </div>
        {!isComplete && <LiveIndicator tone="info" label="Streaming live" />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent graph</CardTitle>
          <CardDescription>
            The pipeline this execution runs through — colored by each agent's live status, with
            the conditional Guardrails branch this run actually took highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentGraphDiagram nodes={graphNodes} edges={graphEdges} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Execution trace</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Execution timeline</CardTitle>
            <CardDescription>Every raw event, as it happened, newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineEvents.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : (
              <ExecutionTimeline events={timelineEvents} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tool monitor</CardTitle>
            <CardDescription>Deterministic tool calls each agent made, before any LLM call.</CardDescription>
          </CardHeader>
          <CardContent>
            {toolCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tool calls yet.</p>
            ) : (
              <ToolMonitor calls={toolCalls} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent communication</CardTitle>
            <CardDescription>Handoff messages passed from one agent to the next.</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No agent-to-agent messages yet.</p>
            ) : (
              <AgentCommunication messages={messages} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
