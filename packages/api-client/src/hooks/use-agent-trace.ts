import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TraceEvent } from '@platform/types'

import { deriveRequestId, foldTraceEvents, traceService } from '../trace-service'

// REST-style snapshot — mirrors GET /api/ai/executions/{id}. Not currently
// called by any page (the trace page below streams instead, for the demo
// payoff), but it's a real, separate transport a future consumer can reach
// for — e.g. Audit Logs deep-linking into an execution that finished hours
// ago, where replaying the whole stream would be pointless.
export function useAgentTrace(executionId: string | undefined) {
  return useQuery({
    queryKey: ['control-tower', 'trace', executionId],
    queryFn: () => traceService.getTrace(executionId!),
    enabled: !!executionId,
  })
}

// Live version — mirrors GET /api/ai/executions/{id}/stream (SSE). Opens an
// EventStreamSource on mount, folds each TraceEvent into TraceStep[] as it
// arrives via the same foldTraceEvents() reducer the snapshot uses, and
// closes the source on unmount.
//
// Assumes executionId is stable for the component's lifetime — if the
// caller navigates between executions, it should key the consuming
// component by executionId so it remounts (see ExecutionTracePage) rather
// than expecting this hook to reset its own accumulated state mid-life.
export function useLiveAgentTrace(executionId: string | undefined) {
  const [events, setEvents] = useState<TraceEvent[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!executionId) return

    const source = traceService.streamTrace(executionId)
    const handle = source.connect(
      (event) => setEvents((prev) => [...prev, event]),
      () => setIsComplete(true),
    )
    return () => handle.close()
  }, [executionId])

  const steps = useMemo(
    () => (executionId ? foldTraceEvents(executionId, events) : []),
    [executionId, events],
  )

  return {
    steps,
    isComplete,
    requestId: executionId ? deriveRequestId(executionId) : undefined,
  }
}
