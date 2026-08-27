export interface EventStreamHandle {
  close(): void
}

export interface EventStreamSource<TEvent> {
  connect(
    onEvent: (event: TEvent) => void,
    onComplete: () => void,
  ): EventStreamHandle
}

// Drives a pre-generated, deterministic event schedule through setTimeout —
// stands in for a real backend pushing events as they happen. Any consumer
// only ever calls .connect() on an EventStreamSource, so swapping this for
// createSSESource(url) below (once a real GET /.../stream endpoint exists,
// Phase 21/22) requires no change anywhere else.
export function createMockEventSource<TEvent>(
  schedule: { event: TEvent; delayMs: number }[],
): EventStreamSource<TEvent> {
  return {
    connect(onEvent, onComplete) {
      let cancelled = false
      let timer: ReturnType<typeof setTimeout> | undefined

      function emit(index: number) {
        if (cancelled) return
        if (index >= schedule.length) {
          onComplete()
          return
        }
        const { event, delayMs } = schedule[index]
        timer = setTimeout(() => {
          if (cancelled) return
          onEvent(event)
          emit(index + 1)
        }, delayMs)
      }

      emit(0)

      return {
        close() {
          cancelled = true
          if (timer) clearTimeout(timer)
        },
      }
    },
  }
}

// The real transport. Expects the server to send one JSON-encoded TEvent
// per `message`, and a `done` named event when the stream ends — a
// conventional SSE shape. Untested against a live backend (none exists
// yet); the seam is what matters for now.
export function createSSESource<TEvent>(
  url: string,
): EventStreamSource<TEvent> {
  return {
    connect(onEvent, onComplete) {
      const source = new EventSource(url)
      source.onmessage = (message) => {
        onEvent(JSON.parse(message.data) as TEvent)
      }
      source.addEventListener('done', () => {
        onComplete()
        source.close()
      })
      source.onerror = () => {
        source.close()
      }
      return {
        close() {
          source.close()
        },
      }
    },
  }
}
