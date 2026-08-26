import { ArrowUpRightIcon, Loader2Icon, MessageCircleIcon, MicIcon, SquareIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { useVizorionChat, VizorionChatMessage } from '@platform/api-client'
import { useAuth } from '@platform/auth'
import {
  Button,
  ChatPanel,
  type ChatPanelMessage,
  cn,
  Markdown,
  SourceCitation,
  VizorionApprovalCard,
  VizorionToolCallChip,
} from '@platform/ui'

import { AUTOWAKE_PANEL_STATES, AUTOWAKE_STATE_LABEL } from './autowake/autowake-labels'
import type { useAutowake } from './autowake/use-autowake'

const SUGGESTED_PROMPTS = ['What can you help me with?', 'Summarize this conversation so far']

function VizorionMessageExtra({
  message,
  liveToolCalls,
}: {
  message: VizorionChatMessage
  liveToolCalls: { id: string; tool: string; status: 'running' | 'completed' }[]
}) {
  const persistedToolCalls = message.toolCalls ?? []
  const citations = message.citations ?? []
  if (persistedToolCalls.length === 0 && citations.length === 0 && liveToolCalls.length === 0) return null

  return (
    <div className="bg-surface w-full space-y-2 rounded-lg border p-3">
      {liveToolCalls.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {liveToolCalls.map((call) => (
            <VizorionToolCallChip key={call.id} name={call.tool} status={call.status} />
          ))}
        </div>
      )}
      {persistedToolCalls.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {persistedToolCalls.map((call, index) => (
            <VizorionToolCallChip key={`${call.name}-${index}`} name={call.name} status="completed" />
          ))}
        </div>
      )}
      {citations.length > 0 && (
        <div className="space-y-1.5">
          {citations.slice(0, 2).map((citation, index) => (
            <SourceCitation
              key={`${citation.document_id}-${index}`}
              title={citation.page ? `${citation.document_id} (p. ${citation.page})` : citation.document_id}
              snippet={citation.text}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface VizorionLauncherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Lifted to app-shell.tsx and shared with AutowakeWidget — saying "Hey
  // Athena" opens this same panel and streams into this same conversation,
  // rather than Autowake running an invisible parallel one. Still
  // independent from the full-page Vizorion Assistant
  // (apps/main-app/src/pages/vizorion): separate ephemeral conversation,
  // "open full page" is the only bridge to that.
  chat: ReturnType<typeof useVizorionChat>
  // Also lifted/shared, so a "Listening for your question…" banner (with
  // a stop button while recording) can render inside this panel once a
  // wake opens it — not just in the separate status FAB.
  autowake: ReturnType<typeof useAutowake>
}

export function VizorionLauncher({ open, onOpenChange, chat, autowake }: VizorionLauncherProps) {
  const { hasAnyPermission } = useAuth()
  const canUseVizorion = hasAnyPermission(['VIZORION_ASSISTANT'])
  const { messages, sendMessage, isStreaming, liveToolCalls, pendingApproval, respondToApproval } = chat

  if (!canUseVizorion) return null

  const showAutowakeBanner = AUTOWAKE_PANEL_STATES.includes(autowake.state)

  const hasConversation = messages.length > 0

  const chatMessages: ChatPanelMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }))

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Vizorion"
          className="bg-surface-elevated/85 ring-ai-accent/20 animate-in fade-in-0 zoom-in-95 fixed right-20 bottom-20 z-(--z-floating-action) flex h-128 w-92 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border shadow-xl ring-1 backdrop-blur-xl duration-150"
        >
          <div
            className="relative flex items-center justify-between gap-2 border-b px-4 py-3"
            style={{ backgroundImage: 'var(--gradient-ai-radial)' }}
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <MessageCircleIcon className="text-ai-accent size-4" aria-hidden="true" />
                Vizorion
              </p>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span
                  className={cn('size-1.5 rounded-full', isStreaming ? 'bg-info' : 'bg-success')}
                  aria-hidden="true"
                />
                {isStreaming ? 'Working' : 'Ready'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" asChild>
                <Link to="/vizorion" aria-label="Open full Vizorion" onClick={() => onOpenChange(false)}>
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenChange(false)}
                aria-label="Close Vizorion"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {showAutowakeBanner && (
            <div className="bg-ai-accent/5 flex items-center justify-between gap-2 border-b px-3 py-2">
              <p className="text-ai-accent flex items-center gap-1.5 text-xs font-medium">
                <MicIcon className={cn('size-3.5', autowake.state === 'recording' && 'animate-pulse')} />
                {AUTOWAKE_STATE_LABEL[autowake.state]}
              </p>
              {autowake.state === 'recording' && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2 text-xs"
                  onClick={autowake.stopRecordingNow}
                >
                  <SquareIcon className="mr-1 size-3" />
                  Stop
                </Button>
              )}
            </div>
          )}

          {!hasConversation && !isStreaming && (
            <div className="flex flex-wrap gap-1.5 border-b px-3 py-2.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="bg-muted hover:bg-accent rounded-full px-2.5 py-1 text-xs transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1">
            <ChatPanel
              messages={chatMessages}
              onSend={sendMessage}
              isSending={isStreaming}
              disabled={isStreaming}
              placeholder="Ask Vizorion..."
              renderContent={(message) => <Markdown text={message.content} />}
              renderAfterMessage={(message) => {
                const original = messages.find((m) => m.id === message.id)
                if (!original) return null
                const isLastAssistant =
                  original.role === 'assistant' && messages[messages.length - 1]?.id === original.id
                return (
                  <>
                    <VizorionMessageExtra
                      message={original}
                      liveToolCalls={isLastAssistant && isStreaming ? liveToolCalls : []}
                    />
                    {pendingApproval && isLastAssistant && (
                      <VizorionApprovalCard
                        toolName={pendingApproval.tool_name}
                        toolArguments={pendingApproval.arguments}
                        riskLevel={pendingApproval.risk_level}
                        isSubmitting={isStreaming}
                        onRespond={respondToApproval}
                      />
                    )}
                  </>
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
      )}

      <Button
        type="button"
        size="icon"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Close Vizorion' : 'Open Vizorion'}
        title="Vizorion"
        className={cn(
          'fixed right-20 bottom-4 z-(--z-floating-action) size-12 rounded-full shadow-[0_4px_20px_-4px_var(--color-ai-accent)] transition-transform hover:scale-105',
          open && 'ring-ai-accent/50 ring-2 ring-offset-2',
        )}
      >
        {isStreaming ? <Loader2Icon className="size-5 animate-spin" /> : <MessageCircleIcon className="size-5" />}
      </Button>
    </>
  )
}
