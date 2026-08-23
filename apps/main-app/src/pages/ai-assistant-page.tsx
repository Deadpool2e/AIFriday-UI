import { Loader2Icon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAIAssistant } from '@platform/api-client'
import type { ChatMessage } from '@platform/types'
import {
  AIRecommendationCard,
  AssistantEmptyIllustration,
  Button,
  ChatPanel,
  type ChatPanelMessage,
  EmptyState,
  SourceCitation,
  useDocumentTitle,
  WorkflowStepper,
} from '@platform/ui'

const SUGGESTED_PROMPTS = [
  'Review this high-risk transaction for compliance',
  'Check the refund policy for this customer',
  'Summarize AI activity from the last 24 hours',
  'Find requests with low confidence scores',
]

function AssistantMessageExtra({ message }: { message: ChatMessage }) {
  if (!message.execution) return null
  const { steps, citations, recommendation, requiresApproval } = message.execution

  return (
    <div className="bg-surface w-full max-w-md space-y-3 rounded-lg border p-3">
      <WorkflowStepper steps={steps} />

      {citations.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sources
          </p>
          {citations.map((citation) => (
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
        <div className="bg-warning/10 border-warning/30 flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
          <span>Requires human approval.</span>
          <Button size="sm" variant="outline" asChild>
            <Link to="/approvals">Review in Approvals</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export function AiAssistantPage() {
  useDocumentTitle('AI Assistant — Enterprise AI Platform')
  const { messages, sendMessage, isStreaming, liveSteps } = useAIAssistant()

  const chatMessages: ChatPanelMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }))

  const hasConversation = messages.length > 0

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <SparklesIcon className="text-ai-accent size-5" aria-hidden="true" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask about a request, policy, or risk decision. Every response shows its
            reasoning — sources, confidence, and risk — not just an answer.
          </p>
        </div>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs font-medium">
          <span
            className={`size-1.5 rounded-full ${isStreaming ? 'bg-info' : 'bg-success'}`}
            aria-hidden="true"
          />
          {isStreaming ? 'Working' : 'Ready'}
        </span>
      </div>

      {!hasConversation && !isStreaming && (
        <div className="mb-3 flex flex-wrap gap-2">
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

      <div className="min-h-0 flex-1 rounded-lg border">
        <ChatPanel
          messages={chatMessages}
          onSend={sendMessage}
          isSending={isStreaming}
          disabled={isStreaming}
          placeholder="Ask about a request, policy, or risk..."
          emptyState={
            <EmptyState
              icon={<AssistantEmptyIllustration />}
              title="Ask the AI Assistant anything"
              description="Try one of the suggestions above, or type your own question below."
            />
          }
          renderAfterMessage={(message) => {
            const original = messages.find((m) => m.id === message.id)
            return original ? <AssistantMessageExtra message={original} /> : null
          }}
          streamingIndicator={
            isStreaming ? (
              <div className="bg-surface-muted w-full max-w-md space-y-2 rounded-lg p-3">
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
  )
}
