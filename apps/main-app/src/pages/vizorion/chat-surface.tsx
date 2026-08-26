import * as React from 'react'
import {
  ChevronDownIcon,
  Loader2Icon,
  RotateCcwIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react'
import { useVizorionChat, type VizorionChatMessage } from '@platform/api-client'
import type { VizorionConversation, VizorionRegenerateStyle } from '@platform/types'
import {
  Button,
  ChatPanel,
  type ChatPanelMessage,
  EmptyState,
  Markdown,
  SourceCitation,
  Textarea,
  VizorionApprovalCard,
  VizorionToolCallChip,
} from '@platform/ui'

import { speakText, stopSpeaking, VoiceControls } from './voice-controls'

const SUGGESTED_PROMPTS = [
  'What can you help me with?',
  'Summarize what we have discussed so far',
  'What do you remember about me?',
]

interface ChatSurfaceProps {
  conversationId: string | null
  onConversationCreated: (conversation: VizorionConversation) => void
}

interface MessageReasoningState {
  [messageId: string]: boolean
}

export function ChatSurface({ conversationId, onConversationCreated }: ChatSurfaceProps) {
  const {
    messages,
    isStreaming,
    liveToolCalls,
    pendingApproval,
    error,
    sendMessage,
    respondToApproval,
    regenerate,
    improve,
    submitFeedback,
  } = useVizorionChat({ conversationId, onConversationCreated })

  const [improvingMessageId, setImprovingMessageId] = React.useState<string | null>(null)
  const [improveText, setImproveText] = React.useState('')
  const [feedbackGiven, setFeedbackGiven] = React.useState<Record<string, 'up' | 'down'>>({})
  const [expandedReasoning, setExpandedReasoning] = React.useState<MessageReasoningState>({})
  const [autoSpeak, setAutoSpeak] = React.useState(false)

  const hasConversation = messages.length > 0
  const lastMessageId = messages[messages.length - 1]?.id

  // Speaks the newest assistant reply the moment a run finishes, when
  // auto-speak is on — no manual click needed. Keyed off the
  // true->false edge of isStreaming (via the ref below) rather than
  // message identity, since reconcile() swaps the streamed message's
  // temp id for the server-assigned one right after the run completes.
  const wasStreamingRef = React.useRef(isStreaming)
  React.useEffect(() => {
    const wasStreaming = wasStreamingRef.current
    wasStreamingRef.current = isStreaming
    if (!autoSpeak || !wasStreaming || isStreaming) return
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.content) speakText(last.content)
  }, [isStreaming, messages, autoSpeak])

  function toggleAutoSpeak() {
    setAutoSpeak((prev) => {
      if (prev) stopSpeaking()
      return !prev
    })
  }

  const chatMessages: ChatPanelMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }))

  function handleFeedback(message: VizorionChatMessage, rating: 'up' | 'down') {
    setFeedbackGiven((prev) => ({ ...prev, [message.id]: rating }))
    void submitFeedback(message.id, rating)
  }

  function handleRegenerate(message: VizorionChatMessage, style?: VizorionRegenerateStyle) {
    void regenerate(message.id, style)
  }

  function submitImprove(message: VizorionChatMessage) {
    if (!improveText.trim()) return
    void improve(message.id, improveText.trim())
    setImprovingMessageId(null)
    setImproveText('')
  }

  function toggleReasoning(messageId: string) {
    setExpandedReasoning((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant={autoSpeak ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          aria-pressed={autoSpeak}
          onClick={toggleAutoSpeak}
          title={autoSpeak ? 'Auto-speak replies is on — click to turn off' : 'Turn on auto-speak for replies'}
        >
          {autoSpeak ? <Volume2Icon className="size-3.5" /> : <VolumeXIcon className="size-3.5" />}
          Auto-speak replies
        </Button>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger rounded-md border border-danger/20 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {!hasConversation && !isStreaming && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="bg-surface hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <ChatPanel
          messages={chatMessages}
          onSend={sendMessage}
          isSending={isStreaming}
          disabled={isStreaming}
          placeholder="Ask Vizorion..."
          renderContent={(message) => <Markdown text={message.content} />}
          inputAddon={<VoiceControls onTranscribed={sendMessage} disabled={isStreaming} />}
          emptyState={
            <EmptyState
              icon={<SparklesIcon />}
              title="Ask Vizorion anything"
              description="Try one of the suggestions above or type your own question."
            />
          }
          renderAfterMessage={(message) => {
            const original = messages.find((m) => m.id === message.id)
            if (!original) return null
            const isLast = message.id === lastMessageId
            const isAssistant = original.role === 'assistant'
            const citations = original.citations ?? []
            const toolCalls = original.toolCalls ?? []
            const showLiveToolCalls = isLast && isStreaming && liveToolCalls.length > 0
            const rating = feedbackGiven[original.id]
            const showReasoning = expandedReasoning[original.id] && original.reasoning

            return (
              <div className="w-full space-y-2">
                {original.reasoning && isAssistant && (
                  <button
                    type="button"
                    onClick={() => toggleReasoning(original.id)}
                    className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-colors"
                  >
                    <ChevronDownIcon
                      className="size-3.5 transition-transform"
                      style={{ transform: showReasoning ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                    Reasoning
                  </button>
                )}

                {showReasoning && (
                  <div className="bg-surface-muted rounded-md border p-2.5 text-xs leading-relaxed">
                    <Markdown text={original.reasoning ?? ''} className="text-xs" />
                  </div>
                )}

                {(showLiveToolCalls || toolCalls.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {showLiveToolCalls &&
                      liveToolCalls.map((call) => (
                        <VizorionToolCallChip key={call.id} name={call.tool} status={call.status} />
                      ))}
                    {!showLiveToolCalls &&
                      toolCalls.map((call, index) => (
                        <VizorionToolCallChip key={`${call.name}-${index}`} name={call.name} status="completed" />
                      ))}
                  </div>
                )}

                {citations.length > 0 && (
                  <div className="space-y-1.5">
                    {citations.map((citation, index) => (
                      <SourceCitation
                        key={`${citation.document_id}-${index}`}
                        title={citation.page ? `${citation.document_id} (p. ${citation.page})` : citation.document_id}
                        snippet={citation.text}
                      />
                    ))}
                  </div>
                )}

                {original.usage && isAssistant && (
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs font-medium">
                    <span>📊 Tokens:</span>
                    <span>⬅️ {original.usage.inputTokens.toLocaleString()}</span>
                    <span>➡️ {original.usage.outputTokens.toLocaleString()}</span>
                    {original.usage.estimatedCostUsd > 0 && (
                      <span>💵 ${original.usage.estimatedCostUsd.toFixed(4)}</span>
                    )}
                  </div>
                )}

                {isLast && pendingApproval && (
                  <VizorionApprovalCard
                    toolName={pendingApproval.tool_name}
                    toolArguments={pendingApproval.arguments}
                    riskLevel={pendingApproval.risk_level}
                    isSubmitting={isStreaming}
                    onRespond={respondToApproval}
                  />
                )}

                {isAssistant && original.content && !(isLast && isStreaming) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Read reply aloud"
                      title="Read aloud"
                      onClick={() => speakText(original.content)}
                    >
                      <Volume2Icon className="size-3.5" />
                    </Button>
                    <Button
                      variant={rating === 'up' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="size-7"
                      aria-label="Good response"
                      onClick={() => handleFeedback(original, 'up')}
                    >
                      <ThumbsUpIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant={rating === 'down' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="size-7"
                      aria-label="Bad response"
                      onClick={() => handleFeedback(original, 'down')}
                    >
                      <ThumbsDownIcon className="size-3.5" />
                    </Button>
                    <div className="h-5 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => handleRegenerate(original, 'shorter')}
                    >
                      <RotateCcwIcon className="size-3" />
                      Shorter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRegenerate(original, 'detailed')}
                    >
                      More detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRegenerate(original, 'with_citations')}
                    >
                      Add citations
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setImprovingMessageId((prev) => (prev === original.id ? null : original.id))
                      }
                    >
                      Improve
                    </Button>
                  </div>
                )}

                {improvingMessageId === original.id && (
                  <div className="space-y-1.5">
                    <Textarea
                      value={improveText}
                      onChange={(e) => setImproveText(e.target.value)}
                      rows={2}
                      placeholder="What should be different about this reply?"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submitImprove(original)} disabled={!improveText.trim()}>
                        Submit feedback
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setImprovingMessageId(null)
                          setImproveText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          }}
          streamingIndicator={
            isStreaming ? (
              <div className="bg-surface-muted flex w-full items-center gap-2 rounded-lg p-3 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Thinking…</span>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}
