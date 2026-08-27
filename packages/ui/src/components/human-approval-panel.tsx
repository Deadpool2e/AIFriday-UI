import * as React from 'react'

import { cn } from '../lib/cn'
import { AIRecommendationCard, type AIDecision } from './ai-recommendation-card'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Label } from './label'
import type { RiskLevel } from './risk-indicator'
import { Textarea } from './textarea'
import { Disclosure } from './disclosure'

export type ApprovalActionType =
  'approve' | 'reject' | 'send_back' | 'request_info'

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

const guardrailStatusClassName: Record<
  HumanApprovalPanelGuardrailCheck['status'],
  string
> = {
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
  const [confirmRejectOpen, setConfirmRejectOpen] = React.useState(false)
  // Which of the four actions is in flight, so only the button that was
  // pressed shows a spinner. `isSubmitting` alone can't say that, and a
  // row of four simultaneously-busy buttons reads as a stuck UI.
  const [submittedAction, setSubmittedAction] =
    React.useState<ApprovalActionType | null>(null)

  // Approve is the only action that doesn't need a paper trail — reject,
  // send-back, and request-info all leave someone else needing to know
  // *why*, so a comment is required for those three.
  const commentRequired = comment.trim().length === 0

  function handleAction(action: ApprovalActionType) {
    setSubmittedAction(action)
    onSubmit(action, comment.trim())
  }

  const pendingFor = (action: ApprovalActionType) =>
    isSubmitting && submittedAction === action

  const guardrailIssues = guardrailChecks.filter(
    (check) => check.status !== 'passed',
  ).length

  return (
    <div
      data-slot="human-approval-panel"
      className={cn('space-y-6', className)}
    >
      <AIRecommendationCard
        decision={decision}
        confidence={confidence}
        risk={risk}
        summary={summary}
      />

      {/* Evidence, folded. The reviewer's decision hangs on the
          recommendation card above; who ran, what passed, and what it was
          based on are the backup they open when something looks off. Each
          row keeps its conclusion on the trigger, so nothing meaningful is
          hidden — only the detail is. Guardrails default open when
          anything was flagged or blocked, because that is the one case a
          reviewer must not be able to skip past. */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
          Evidence
        </p>

        <Disclosure
          title="Guardrail results"
          defaultOpen={guardrailIssues > 0}
          summary={
            <span
              className={
                guardrailIssues > 0 ? 'text-warning font-medium' : undefined
              }
            >
              {guardrailIssues > 0
                ? `${guardrailIssues} needs attention`
                : `${guardrailChecks.length} passed`}
            </span>
          }
          disabled={guardrailChecks.length === 0}
        >
          <ul className="space-y-2">
            {guardrailChecks.map((check) => (
              <li key={check.id} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>{check.rule}</span>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize',
                      guardrailStatusClassName[check.status],
                    )}
                  >
                    {check.status}
                  </span>
                </div>
                {check.detail && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {check.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure
          title="Agents involved"
          summary={`${agentsInvolved.length} ${agentsInvolved.length === 1 ? 'agent' : 'agents'}`}
          disabled={agentsInvolved.length === 0}
        >
          <ul className="space-y-1.5">
            {agentsInvolved.map((agent) => (
              <li
                key={agent.agent}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{agent.agent}</span>
                <span className="text-muted-foreground text-xs capitalize">
                  {agent.status}
                </span>
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure
          title="Sources"
          summary={`${sources.length} ${sources.length === 1 ? 'document' : 'documents'}`}
          disabled={sources.length === 0}
        >
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.id} className="text-muted-foreground text-sm">
                {source.name}
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approval-comment">
          Comment{' '}
          <span className="text-muted-foreground font-normal">
            — optional to approve, required for every other action
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

      {/* Four equally-weighted buttons made every option look like the
          expected one. Approve is the primary path and reads as it;
          Reject is the destructive counterweight; send-back and
          request-info are real but secondary, so they sit apart at ghost
          weight instead of competing for the same visual slot. */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          onClick={() => handleAction('approve')}
          disabled={isSubmitting}
          pending={pendingFor('approve')}
          pendingLabel="Approving…"
        >
          Approve
        </Button>
        <Button
          variant="outline"
          className="text-danger hover:text-danger hover:border-danger/50"
          onClick={() => setConfirmRejectOpen(true)}
          disabled={isSubmitting || commentRequired}
          pending={pendingFor('reject')}
          pendingLabel="Rejecting…"
        >
          Reject
        </Button>
        <span
          className="bg-border mx-1 hidden h-5 w-px sm:block"
          aria-hidden="true"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction('send_back')}
          disabled={isSubmitting || commentRequired}
          pending={pendingFor('send_back')}
          pendingLabel="Sending back…"
        >
          Send back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction('request_info')}
          disabled={isSubmitting || commentRequired}
          pending={pendingFor('request_info')}
          pendingLabel="Requesting…"
        >
          Request info
        </Button>
        {commentRequired && (
          <p className="text-muted-foreground w-full text-xs sm:w-auto sm:ml-auto">
            Add a comment to reject, send back, or request info.
          </p>
        )}
      </div>

      <Dialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this request?</DialogTitle>
            <DialogDescription>
              This overrides the AI&apos;s {decisionConfigLabel(decision)}{' '}
              recommendation and cannot be undone from here. Your comment will
              be recorded with the decision.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmRejectOpen(false)
                handleAction('reject')
              }}
              disabled={isSubmitting}
              pending={pendingFor('reject')}
              pendingLabel="Rejecting…"
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function decisionConfigLabel(decision: AIDecision): string {
  return decision === 'approve'
    ? 'Approve'
    : decision === 'escalate'
      ? 'Escalate'
      : decision === 'reject'
        ? 'Reject'
        : 'Needs review'
}

export { HumanApprovalPanel }
