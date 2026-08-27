// Streaming transport for POST /v1/chat/stream. This cannot reuse
// ../lib/event-stream.ts's createSSESource(): that wraps the browser's
// native EventSource, which is GET-only and can't carry a request body —
// Vizorion's stream endpoint is a POST whose response happens to be
// text/event-stream. Ported from the same manual fetch + ReadableStream +
// `event:`/`data:` line-splitting approach already proven in
// Vizorion/sdk/typescript/src/index.ts's streamMessage().
import type { VizorionStreamEvent } from '@platform/types'

import { VIZORION_API_BASE_URL, VIZORION_API_KEY } from './env'

interface StreamVizorionChatOptions {
  onEvent: (event: VizorionStreamEvent) => void
  signal?: AbortSignal
}

export async function streamVizorionChat(
  request: {
    conversationId: string
    message: string
    responseLanguage?: string
  },
  { onEvent, signal }: StreamVizorionChatOptions,
): Promise<void> {
  const response = await fetch(`${VIZORION_API_BASE_URL}/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'X-API-Key': VIZORION_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: request.conversationId,
      message: request.message,
      response_language: request.responseLanguage,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    let message = `Stream failed (${response.status})`
    try {
      const errorBody = (await response.json()) as { error?: string }
      message = errorBody.error ?? message
    } catch {
      // Non-JSON error body — fall back to the generic message.
    }
    throw new Error(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  function processChunk(chunk: string) {
    let eventName = 'message'
    let data = ''
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      else if (line.startsWith('data:')) data = line.slice(5).trim()
    }
    if (!data) return
    onEvent({ event: eventName, data: JSON.parse(data) } as VizorionStreamEvent)
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    // sse_starlette frames events with CRLF ("\r\n\r\n" between events,
    // "\r\n" between lines) — normalize to LF so the "\n\n"/"\n" splits
    // below actually find the boundaries instead of silently never
    // matching and leaving the whole stream stuck unparsed in `buffer`.
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) processChunk(chunk)
  }
  // Flush a final event that arrived without a trailing blank line before
  // the connection closed.
  if (buffer.trim()) processChunk(buffer)
}
