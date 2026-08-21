import { Loader2Icon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'
import { useAIAssistant } from '@platform/api-client'
import type { ChatMessage } from '@platform/types'
import {
  AIRecommendationCard,
  Button,
  ChatPanel,
  type ChatPanelMessage,
  EmptyState,
  SourceCitation,
  useDocumentTitle,
  WorkflowStepper,
} from '@platform/ui'

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

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground text-sm">
          Ask about a request, policy, or risk decision. Every response shows its
          reasoning — sources, confidence, and risk — not just an answer.
        </p>
      </div>

      <div className="min-h-0 flex-1 rounded-lg border">
        <ChatPanel
          messages={chatMessages}
          onSend={sendMessage}
          isSending={isStreaming}
          disabled={isStreaming}
          placeholder="Ask about a request, policy, or risk..."
          emptyState={
            <EmptyState
              icon={<SparklesIcon />}
              title="Ask the AI Assistant anything"
              description='Try: "Review this high-risk transaction for compliance" or "Check the refund policy for this customer."'
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
