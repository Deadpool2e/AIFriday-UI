import { ArrowUpRightIcon, Loader2Icon, SparklesIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAIAssistant, usePendingApprovals } from '@platform/api-client'
import { useAuth } from '@platform/auth'
import type { ChatMessage } from '@platform/types'
import {
  AIRecommendationCard,
  Button,
  ChatPanel,
  type ChatPanelMessage,
  cn,
  SourceCitation,
  WorkflowStepper,
} from '@platform/ui'

const SUGGESTED_PROMPTS = [
  'Summarize today’s AI activity',
  'Find high-risk requests',
  'Explain the last decision',
]

function LauncherMessageExtra({ message }: { message: ChatMessage }) {
  if (!message.execution) return null
  const { steps, citations, recommendation, requiresApproval } = message.execution

  return (
    <div className="bg-surface w-full space-y-2.5 rounded-lg border p-3">
      <WorkflowStepper steps={steps} />
      {citations.length > 0 && (
        <div className="space-y-1.5">
          {citations.slice(0, 2).map((citation) => (
            <SourceCitation
              key={citation.id}
              title={citation.title}
              snippet={citation.snippet}
              relevance={citation.relevance}
            />
          ))}
        </div>
      )}
      <AIRecommendationCard
        decision={recommendation.decision}
        confidence={recommendation.confidence}
        risk={recommendation.risk}
        summary={recommendation.summary}
      />
      {requiresApproval && (
        <Button size="sm" variant="outline" asChild className="w-full">
          <Link to="/approvals">Review in Approvals</Link>
        </Button>
      )}
    </div>
  )
}

interface AILauncherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The single persistent floating action in the product (Section 19/67) —
// Demo Panel used to occupy this corner; it now lives in Settings +
// Command Palette so this is the only thing competing for that visual
// space. Built directly on @platform/api-client's useAIAssistant, the same
// hook the full /ai-assistant page uses — Host can call it because
// api-client is a shared package, not something owned by the Main App
// remote, so this stays a real, working assistant rather than a decorative
// shortcut that just deep-links out.
export function AILauncher({ open, onOpenChange }: AILauncherProps) {
  const { hasAnyPermission } = useAuth()
  const canUseAssistant = hasAnyPermission(['AI_ASSISTANT'])
  const { messages, sendMessage, isStreaming, liveSteps } = useAIAssistant()
  const pending = usePendingApprovals()

  if (!canUseAssistant) return null

  const attentionCount = pending.data?.length ?? 0
  const hasConversation = messages.length > 0

  let statusLabel = 'Ready'
  let statusDotClass = 'bg-success'
  if (isStreaming) {
    statusLabel = 'Working'
    statusDotClass = 'bg-info'
  } else if (attentionCount > 0 && !hasConversation) {
    statusLabel = `${attentionCount} pending`
    statusDotClass = 'bg-warning'
  }

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
          aria-label="AI Assistant"
          className="bg-surface-elevated/85 ring-ai-accent/20 animate-in fade-in-0 zoom-in-95 fixed right-4 bottom-20 z-(--z-floating-action) flex h-128 w-92 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border shadow-xl ring-1 backdrop-blur-xl duration-150"
        >
          <div
            className="relative flex items-center justify-between gap-2 border-b px-4 py-3"
            style={{ backgroundImage: 'var(--gradient-ai-radial)' }}
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <SparklesIcon className="text-ai-accent size-4" aria-hidden="true" />
                AI Assistant
              </p>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span className={cn('size-1.5 rounded-full', statusDotClass)} aria-hidden="true" />
                {statusLabel}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" asChild>
                <Link to="/ai-assistant" aria-label="Open full AI Assistant" onClick={() => onOpenChange(false)}>
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenChange(false)}
                aria-label="Close AI Assistant"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

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
              placeholder="Ask anything..."
              renderAfterMessage={(message) => {
                const original = messages.find((m) => m.id === message.id)
                return original ? <LauncherMessageExtra message={original} /> : null
              }}
              streamingIndicator={
                isStreaming ? (
                  <div className="bg-surface-muted w-full space-y-2 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2Icon className="size-4 animate-spin" />
                      <span>Thinking…</span>
                    </div>
                    {liveSteps.length > 0 && <WorkflowStepper steps={liveSteps} />}
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
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        title="AI Assistant (Ctrl/Cmd+K also works)"
        className={cn(
          'fixed right-4 bottom-4 z-(--z-floating-action) size-12 rounded-full shadow-[0_4px_20px_-4px_var(--color-ai-accent)] transition-transform hover:scale-105',
          open && 'ring-ai-accent/50 ring-2 ring-offset-2',
        )}
      >
        {isStreaming ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : (
          <SparklesIcon className="size-5" />
        )}
        {!open && attentionCount > 0 && !isStreaming && (
          <span
            className="bg-warning border-background absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-2"
            aria-hidden="true"
          />
        )}
      </Button>
    </>
  )
}
