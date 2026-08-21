import * as React from 'react'

import { cn } from '../lib/cn'
import { AIRecommendationCard, type AIDecision } from './ai-recommendation-card'
import { Button } from './button'
import { Label } from './label'
import type { RiskLevel } from './risk-indicator'
import { Textarea } from './textarea'

export type ApprovalActionType = 'approve' | 'reject' | 'send_back' | 'request_info'

interface HumanApprovalPanelAgentExecution {
  agent: string
  status: 'completed' | 'running' | 'failed' | 'skipped'
}

interface HumanApprovalPanelGuardrailCheck {
  id: string
  rule: string
  status: 'passed' | 'flagged' | 'blocked'
  detail?: string
}

interface HumanApprovalPanelSource {
  id: string
  name: string
}

interface HumanApprovalPanelProps {
  decision: AIDecision
  confidence: number
  risk: RiskLevel
  summary: string
  agentsInvolved: HumanApprovalPanelAgentExecution[]
  guardrailChecks: HumanApprovalPanelGuardrailCheck[]
  sources: HumanApprovalPanelSource[]
  onSubmit: (action: ApprovalActionType, comment: string) => void
  isSubmitting?: boolean
  className?: string
}

const guardrailStatusClassName: Record<HumanApprovalPanelGuardrailCheck['status'], string> = {
  passed: 'text-success',
  flagged: 'text-warning',
  blocked: 'text-danger',
}

// The centerpiece of Phase 8 — everything a human reviewer needs to make a
// decision, and nothing they'd need a second screen for: the AI's
// reasoning, who touched it (agents), whether it passed guardrails, what
// it's based on (sources), and the four actions themselves.
function HumanApprovalPanel({
  decision,
  confidence,
  risk,
  summary,
  agentsInvolved,
  guardrailChecks,
  sources,
  onSubmit,
  isSubmitting = false,
  className,
}: HumanApprovalPanelProps) {
  const [comment, setComment] = React.useState('')

  // Approve is the only action that doesn't need a paper trail — reject,
  // send-back, and request-info all leave someone else needing to know
  // *why*, so a comment is required for those three.
  const commentRequired = comment.trim().length === 0

  function handleAction(action: ApprovalActionType) {
    onSubmit(action, comment.trim())
  }

  return (
    <div data-slot="human-approval-panel" className={cn('space-y-6', className)}>
      <AIRecommendationCard
        decision={decision}
        confidence={confidence}
        risk={risk}
        summary={summary}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Agents involved</p>
        <ul className="space-y-1.5">
          {agentsInvolved.map((agent) => (
            <li key={agent.agent} className="flex items-center justify-between text-sm">
              <span>{agent.agent}</span>
              <span className="text-muted-foreground text-xs capitalize">{agent.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Guardrail results</p>
        <ul className="space-y-1.5">
          {guardrailChecks.map((check) => (
            <li key={check.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span>{check.rule}</span>
                <span className={cn('text-xs font-medium capitalize', guardrailStatusClassName[check.status])}>
                  {check.status}
                </span>
              </div>
              {check.detail && <p className="text-muted-foreground text-xs">{check.detail}</p>}
            </li>
          ))}
        </ul>
      </div>

      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Sources</p>
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.id} className="text-muted-foreground text-sm">
                {source.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="approval-comment">
          Comment{' '}
          <span className="text-muted-foreground font-normal">
            (required for reject / send back / request info)
          </span>
        </Label>
        <Textarea
          id="approval-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Add context for your decision..."
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleAction('approve')} disabled={isSubmitting}>
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction('send_back')}
          disabled={isSubmitting || commentRequired}
        >
          Send Back
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction('request_info')}
          disabled={isSubmitting || commentRequired}
        >
          Request More Info
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleAction('reject')}
          disabled={isSubmitting || commentRequired}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}

export { HumanApprovalPanel }
