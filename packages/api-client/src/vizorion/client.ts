// Thin fetch wrapper over the full Vizorion REST surface (chat, streaming
// excluded — see ./sse.ts — conversations, messages, HITL approvals,
// feedback/regenerate/improve, memory, files, voice). Adapted from
// Vizorion/sdk/typescript/src/index.ts (an unpublished, local-only
// package in a sibling repo, so vendored rather than depended on) plus
// the file-upload and voice-transcribe methods that SDK is missing but
// Vizorion/examples/web/src/api.ts implements.
import type {
  VizorionApprovalListItem,
  VizorionApprovalResolution,
  VizorionChatResponse,
  VizorionConversation,
  VizorionDocument,
  VizorionMemory,
  VizorionMessage,
  VizorionRegenerateResult,
  VizorionRegenerateStyle,
} from '@platform/types'

import { ApiError } from '../lib/http-client'
import { VIZORION_API_BASE_URL, VIZORION_API_KEY } from './env'

interface VizorionRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function vizorionFetch<T>(path: string, options: VizorionRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const isFormData = body instanceof FormData

  const response = await fetch(`${VIZORION_API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'X-API-Key': VIZORION_API_KEY,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const errorBody = (await response.json()) as { error?: string }
      message = errorBody.error ?? message
    } catch {
      // Non-JSON error body — fall back to statusText.
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const vizorionClient = {
  health(): Promise<{ status: string }> {
    return vizorionFetch('/v1/health')
  },

  // --- conversations ---

  createConversation(): Promise<VizorionConversation> {
    return vizorionFetch('/v1/conversations', { method: 'POST' })
  },

  listConversations(): Promise<VizorionConversation[]> {
    return vizorionFetch('/v1/conversations')
  },

  getConversation(conversationId: string): Promise<VizorionConversation> {
    return vizorionFetch(`/v1/conversations/${conversationId}`)
  },

  branchConversation(conversationId: string, fromMessageId?: string): Promise<VizorionConversation> {
    return vizorionFetch(`/v1/conversations/${conversationId}/branch`, {
      method: 'POST',
      body: { from_message_id: fromMessageId },
    })
  },

  deleteConversation(conversationId: string): Promise<void> {
    return vizorionFetch(`/v1/conversations/${conversationId}`, { method: 'DELETE' })
  },

  listMessages(conversationId: string): Promise<VizorionMessage[]> {
    return vizorionFetch(`/v1/conversations/${conversationId}/messages`)
  },

  // --- chat (non-streaming) ---

  sendMessage(conversationId: string, message: string, responseLanguage?: string): Promise<VizorionChatResponse> {
    return vizorionFetch('/v1/chat', {
      method: 'POST',
      body: { conversation_id: conversationId, message, response_language: responseLanguage },
    })
  },

  // --- HITL approvals ---

  listApprovals(conversationId?: string): Promise<VizorionApprovalListItem[]> {
    const query = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : ''
    return vizorionFetch(`/v1/approvals${query}`)
  },

  respondToApproval(
    approvalId: string,
    resolution: VizorionApprovalResolution,
    data?: Record<string, unknown>,
  ): Promise<VizorionChatResponse> {
    return vizorionFetch(`/v1/approvals/${approvalId}/respond`, {
      method: 'POST',
      body: { resolution, data },
    })
  },

  // --- feedback / regenerate / improve ---

  submitFeedback(
    messageId: string,
    input: { conversationId: string; rating: 'up' | 'down'; reason?: string; comment?: string; runId?: string },
  ): Promise<void> {
    return vizorionFetch(`/v1/messages/${messageId}/feedback`, {
      method: 'POST',
      body: {
        conversation_id: input.conversationId,
        rating: input.rating,
        reason: input.reason,
        comment: input.comment,
        run_id: input.runId,
      },
    })
  },

  regenerate(messageId: string, style?: VizorionRegenerateStyle): Promise<VizorionRegenerateResult> {
    return vizorionFetch(`/v1/messages/${messageId}/regenerate`, { method: 'POST', body: { style } })
  },

  improve(messageId: string, feedbackText?: string): Promise<VizorionRegenerateResult> {
    return vizorionFetch(`/v1/messages/${messageId}/improve`, {
      method: 'POST',
      body: { feedback_text: feedbackText },
    })
  },

  // --- memory ---

  listMemory(): Promise<VizorionMemory[]> {
    return vizorionFetch('/v1/memory')
  },

  createMemory(content: string, key?: string): Promise<VizorionMemory> {
    return vizorionFetch('/v1/memory', { method: 'POST', body: { content, key } })
  },

  updateMemory(memoryId: string, content: string): Promise<VizorionMemory> {
    return vizorionFetch(`/v1/memory/${memoryId}`, { method: 'PATCH', body: { content } })
  },

  deleteMemory(memoryId: string): Promise<void> {
    return vizorionFetch(`/v1/memory/${memoryId}`, { method: 'DELETE' })
  },

  deleteAllMemory(): Promise<void> {
    return vizorionFetch('/v1/memory/all', { method: 'DELETE' })
  },

  // --- files (RAG documents) ---

  uploadFile(file: File): Promise<VizorionDocument> {
    const form = new FormData()
    form.append('file', file)
    return vizorionFetch('/v1/files', { method: 'POST', body: form })
  },

  getFile(documentId: string): Promise<VizorionDocument> {
    return vizorionFetch(`/v1/files/${documentId}`)
  },

  publishFile(documentId: string): Promise<VizorionDocument> {
    return vizorionFetch(`/v1/files/${documentId}/publish`, { method: 'POST' })
  },

  unpublishFile(documentId: string): Promise<VizorionDocument> {
    return vizorionFetch(`/v1/files/${documentId}/unpublish`, { method: 'POST' })
  },

  archiveFile(documentId: string): Promise<VizorionDocument> {
    return vizorionFetch(`/v1/files/${documentId}/archive`, { method: 'POST' })
  },

  deleteFile(documentId: string): Promise<void> {
    return vizorionFetch(`/v1/files/${documentId}`, { method: 'DELETE' })
  },

  // --- voice ---

  transcribeVoice(audio: Blob, filename: string, language?: string): Promise<{ text: string }> {
    const form = new FormData()
    form.append('file', audio, filename)
    const query = language ? `?language=${encodeURIComponent(language)}` : ''
    return vizorionFetch(`/v1/voice/transcribe${query}`, { method: 'POST', body: form })
  },

  // --- speaker verification (Autowake) ---

  enrollSpeaker(clips: Blob[]): Promise<{ enrolled: boolean }> {
    const form = new FormData()
    clips.forEach((clip, index) => form.append('files', clip, `sample-${index}.wav`))
    return vizorionFetch('/v1/voice/speaker/enroll', { method: 'POST', body: form })
  },

  verifySpeaker(clip: Blob): Promise<{ score: number; verified: boolean }> {
    const form = new FormData()
    form.append('file', clip, 'clip.wav')
    return vizorionFetch('/v1/voice/speaker/verify', { method: 'POST', body: form })
  },
}
