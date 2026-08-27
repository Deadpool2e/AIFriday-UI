import * as React from 'react'
import type {
  VizorionApprovalResolution,
  VizorionCitation,
  VizorionConversation,
  VizorionMessage,
  VizorionPendingApproval,
  VizorionRegenerateStyle,
  VizorionStreamEvent,
  VizorionToolCall,
} from '@platform/types'

import { VIZORION_USE_MOCK } from '../vizorion/env'
import { vizorionChatService } from '../vizorion-chat-service'
import { vizorionConversationsService } from '../vizorion-conversations-service'

export interface VizorionChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  reasoning?: string
  citations?: VizorionCitation[]
  toolCalls?: VizorionToolCall[]
  usage?: {
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
  }
}

export interface VizorionLiveToolCall {
  id: string
  tool: string
  status: 'running' | 'completed'
}

let counter = 0
function nextId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

function messageFromServer(message: VizorionMessage): VizorionChatMessage {
  const latest = message.versions[message.versions.length - 1]
  return {
    id: message.id,
    role: message.role,
    content: latest?.content ?? '',
    createdAt: message.created_at,
    citations: latest?.citations,
    toolCalls: latest?.tool_calls,
  }
}

interface UseVizorionChatOptions {
  // null means "no conversation selected yet" — sendMessage lazily
  // creates one on first use (matching Vizorion's own reference UI),
  // reporting it back via onConversationCreated so a conversation list
  // can pick it up.
  conversationId: string | null
  onConversationCreated?: (conversation: VizorionConversation) => void
}

export function useVizorionChat({
  conversationId,
  onConversationCreated,
}: UseVizorionChatOptions) {
  const [messages, setMessages] = React.useState<VizorionChatMessage[]>([])
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [liveToolCalls, setLiveToolCalls] = React.useState<
    VizorionLiveToolCall[]
  >([])
  const [pendingApproval, setPendingApproval] = React.useState<{
    approval: VizorionPendingApproval
    assistantMessageId: string
  } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const conversationIdRef = React.useRef<string | null>(conversationId)
  const loadedConversationRef = React.useRef<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  // No manual reset-on-change logic here: callers key the component that
  // calls this hook by conversationId (see ChatSurface's usage in
  // apps/main-app/src/pages/vizorion/vizorion-page.tsx), so switching to
  // a different conversation — including back to `null` for "new chat" —
  // remounts fresh state instead of needing an effect to clear it (an
  // effect synchronously clearing state to mirror a prop change is
  // exactly what the react-hooks/set-state-in-effect and
  // react-hooks/refs lint rules steer away from).
  //
  // Load history whenever the externally-selected conversation changes to
  // a real id. Skipped if this conversation's messages were already
  // reconciled by a send() in this session (see the loadedConversationRef
  // assignment in sendMessage) — that avoids clobbering a just-streamed
  // reply with a redundant, possibly-stale refetch.
  React.useEffect(() => {
    if (!conversationId) return
    if (loadedConversationRef.current === conversationId) return
    let cancelled = false
    vizorionChatService.listMessages(conversationId).then((history) => {
      if (cancelled) return
      loadedConversationRef.current = conversationId
      setMessages(history.map(messageFromServer))
    })
    return () => {
      cancelled = true
    }
  }, [conversationId])

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const reconcile = React.useCallback(
    async (
      id: string,
      // Vizorion doesn't persist reasoning or per-turn token usage on the
      // message itself (they're transient stream-only data — see
      // Vizorion/app/api/schemas/messages.py), so the server-fetched
      // history reconcile normally replaces local state with can never
      // carry them. Re-attach whatever was captured locally during this
      // turn's streaming to the newest assistant message after reconciling,
      // so the reasoning panel and token/cost pill don't vanish once the
      // server-confirmed content/citations/tool-calls come back.
      latestAssistantExtras?: {
        reasoning?: string
        usage?: VizorionChatMessage['usage']
      },
    ) => {
      // Mock mode has no server-persisted history to reconcile against —
      // the locally-built transcript from streamMessage's events is all
      // there is.
      if (VIZORION_USE_MOCK) return
      const history = await vizorionChatService.listMessages(id)
      const reconciled = history.map(messageFromServer)
      if (latestAssistantExtras) {
        for (let i = reconciled.length - 1; i >= 0; i -= 1) {
          if (reconciled[i].role === 'assistant') {
            reconciled[i] = { ...reconciled[i], ...latestAssistantExtras }
            break
          }
        }
      }
      setMessages(reconciled)
    },
    [],
  )

  const sendMessage = React.useCallback(
    async (text: string) => {
      // The user's message is shown immediately, before the conversation
      // even exists server-side — if lazy-creating it (or the stream
      // itself) fails below, the catch block surfaces the error without
      // ever having silently swallowed what the user typed.
      const userMessage: VizorionChatMessage = {
        id: nextId('user'),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      }
      const assistantId = nextId('assistant')
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        },
      ])
      setIsStreaming(true)
      setLiveToolCalls([])
      setError(null)

      const controller = new AbortController()
      abortRef.current = controller
      let accumulated = ''
      let accumulatedReasoning = ''
      let approvalReceived: VizorionPendingApproval | null = null
      let capturedUsage: VizorionChatMessage['usage'] | undefined

      try {
        let cid = conversationIdRef.current
        if (!cid) {
          const conversation = await vizorionConversationsService.create()
          cid = conversation.id
          conversationIdRef.current = cid
          loadedConversationRef.current = cid
          onConversationCreated?.(conversation)
        }

        await vizorionChatService.streamMessage(
          cid,
          text,
          (event: VizorionStreamEvent) => {
            switch (event.event) {
              case 'reasoning_delta':
                accumulatedReasoning += event.data.delta
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, reasoning: accumulatedReasoning }
                      : m,
                  ),
                )
                break
              case 'message_delta':
                accumulated += event.data.delta
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m,
                  ),
                )
                break
              case 'tool_started': {
                const tool = event.data.tool ?? 'a tool'
                setLiveToolCalls((prev) => [
                  ...prev,
                  { id: nextId('tool'), tool, status: 'running' },
                ])
                break
              }
              case 'tool_completed':
                setLiveToolCalls((prev) => {
                  const lastRunningIndex = [...prev]
                    .reverse()
                    .findIndex((t) => t.status === 'running')
                  if (lastRunningIndex === -1) return prev
                  const index = prev.length - 1 - lastRunningIndex
                  const next = [...prev]
                  next[index] = { ...next[index], status: 'completed' }
                  return next
                })
                break
              case 'run_completed': {
                const usage = event.data.usage ?? {}
                const inputTokens = Number(usage.input_tokens) || 0
                const outputTokens = Number(usage.output_tokens) || 0
                const estimatedCostUsd = Number(usage.estimated_cost_usd) || 0
                if (inputTokens || outputTokens) {
                  capturedUsage = {
                    inputTokens,
                    outputTokens,
                    estimatedCostUsd,
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, usage: capturedUsage } : m,
                    ),
                  )
                }
                break
              }
              case 'approval_required':
                approvalReceived = event.data
                setPendingApproval({
                  approval: event.data,
                  assistantMessageId: assistantId,
                })
                break
              case 'error':
                setError(event.data.message)
                break
              default:
                break
            }
          },
          controller.signal,
        )

        if (!approvalReceived) {
          await reconcile(cid, {
            reasoning: accumulatedReasoning || undefined,
            usage: capturedUsage,
          })
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.'
        setError(message)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && !m.content
              ? { ...m, content: `Sorry — ${message}` }
              : m,
          ),
        )
      } finally {
        setIsStreaming(false)
        setLiveToolCalls([])
      }
    },
    [onConversationCreated, reconcile],
  )

  const respondToApproval = React.useCallback(
    async (
      resolution: VizorionApprovalResolution,
      data?: Record<string, unknown>,
    ) => {
      if (!pendingApproval) return
      const { approval, assistantMessageId } = pendingApproval
      setIsStreaming(true)
      setError(null)
      try {
        const response = await vizorionChatService.respondToApproval(
          approval.id,
          resolution,
          data,
        )
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: response.content,
                  citations: response.citations,
                  toolCalls: response.tool_calls,
                }
              : m,
          ),
        )
        setPendingApproval(null)
        if (conversationIdRef.current)
          await reconcile(conversationIdRef.current)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setIsStreaming(false)
      }
    },
    [pendingApproval, reconcile],
  )

  const regenerate = React.useCallback(
    async (messageId: string, style?: VizorionRegenerateStyle) => {
      const result = await vizorionChatService.regenerate(messageId, style)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: result.content } : m,
        ),
      )
    },
    [],
  )

  const improve = React.useCallback(
    async (messageId: string, feedbackText?: string) => {
      const result = await vizorionChatService.improve(messageId, feedbackText)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: result.content } : m,
        ),
      )
    },
    [],
  )

  const submitFeedback = React.useCallback(
    async (
      messageId: string,
      rating: 'up' | 'down',
      reason?: string,
      comment?: string,
    ) => {
      const cid = conversationIdRef.current
      if (!cid) return
      await vizorionChatService.submitFeedback(messageId, {
        conversationId: cid,
        rating,
        reason,
        comment,
      })
    },
    [],
  )

  return {
    messages,
    isStreaming,
    liveToolCalls,
    pendingApproval: pendingApproval?.approval ?? null,
    error,
    sendMessage,
    respondToApproval,
    regenerate,
    improve,
    submitFeedback,
  }
}
