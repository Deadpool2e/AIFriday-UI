import type {
  VizorionApprovalResolution,
  VizorionChatResponse,
  VizorionMessage,
  VizorionRegenerateResult,
  VizorionRegenerateStyle,
  VizorionStreamEvent,
} from '@platform/types'

import { resolveVizorionService } from './vizorion/env'
import { vizorionClient } from './vizorion/client'
import { streamVizorionChat } from './vizorion/sse'

export interface VizorionChatService {
  listMessages(conversationId: string): Promise<VizorionMessage[]>
  streamMessage(
    conversationId: string,
    message: string,
    onEvent: (event: VizorionStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>
  respondToApproval(
    approvalId: string,
    resolution: VizorionApprovalResolution,
    data?: Record<string, unknown>,
  ): Promise<VizorionChatResponse>
  submitFeedback(
    messageId: string,
    input: { conversationId: string; rating: 'up' | 'down'; reason?: string; comment?: string; runId?: string },
  ): Promise<void>
  regenerate(messageId: string, style?: VizorionRegenerateStyle): Promise<VizorionRegenerateResult>
  improve(messageId: string, feedbackText?: string): Promise<VizorionRegenerateResult>
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Offline/demo stand-in — good enough to exercise the UI without a
// running Vizorion instance, not a faithful simulation of persistence
// (listMessages always returns empty; the hook keeps its own local
// transcript in mock mode instead of reconciling against the server).
export const mockVizorionChatService: VizorionChatService = {
  async listMessages() {
    return []
  },

  async streamMessage(_conversationId, message, onEvent, signal) {
    const reply = `(mock) You said: "${message}". Set VITE_VIZORION_USE_MOCK=false with a real VITE_VIZORION_API_URL / VITE_VIZORION_API_KEY to talk to Vizorion.`
    const words = reply.split(' ')

    onEvent({ event: 'run_started', data: { conversation_id: _conversationId } })
    await delay(150)
    onEvent({ event: 'message_started', data: {} })

    for (const word of words) {
      if (signal?.aborted) return
      await delay(35)
      onEvent({ event: 'message_delta', data: { delta: `${word} ` } })
    }

    onEvent({ event: 'message_completed', data: {} })
    onEvent({
      event: 'run_completed',
      data: { message_id: `mock-msg-${Date.now()}`, run_id: `mock-run-${Date.now()}`, usage: {} },
    })
  },

  async respondToApproval(approvalId, resolution) {
    return {
      conversation_id: 'mock',
      message_id: `mock-msg-${Date.now()}`,
      run_id: `mock-run-${Date.now()}`,
      content: `(mock) Approval ${approvalId} ${resolution}.`,
      citations: [],
      tool_calls: [],
      suggestions: [],
      approval: null,
      usage: {},
      metadata: {},
    }
  },

  async submitFeedback() {},

  async regenerate(messageId, style) {
    return { message_id: messageId, version_id: `mock-version-${Date.now()}`, content: `(mock, ${style ?? 'default'} style)` }
  },

  async improve(messageId) {
    return { message_id: messageId, version_id: `mock-version-${Date.now()}`, content: '(mock, improved)' }
  },
}

export const realVizorionChatService: VizorionChatService = {
  listMessages: (conversationId) => vizorionClient.listMessages(conversationId),
  streamMessage: (conversationId, message, onEvent, signal) =>
    streamVizorionChat({ conversationId, message }, { onEvent, signal }),
  respondToApproval: (approvalId, resolution, data) => vizorionClient.respondToApproval(approvalId, resolution, data),
  submitFeedback: (messageId, input) => vizorionClient.submitFeedback(messageId, input),
  regenerate: (messageId, style) => vizorionClient.regenerate(messageId, style),
  improve: (messageId, feedbackText) => vizorionClient.improve(messageId, feedbackText),
}

export const vizorionChatService = resolveVizorionService(mockVizorionChatService, realVizorionChatService)
