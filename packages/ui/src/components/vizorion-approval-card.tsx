import * as React from 'react'
import { ShieldAlertIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Badge } from './badge'
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
import { riskLevelClassName, type RiskLevel } from './risk-indicator'
import { Textarea } from './textarea'

// Vizorion's risk_level is a free-form string from its classifier; only
// RiskLevel's four values get a tuned color (reusing RiskIndicator's map so
// the two components never drift), anything else falls back to neutral.
type KnownRiskLevel = RiskLevel

export type VizorionApprovalResolution = 'approved' | 'edited' | 'rejected'

interface VizorionApprovalCardProps extends Omit<
  React.ComponentProps<'div'>,
  'onSubmit'
> {
  toolName: string
  toolArguments: Record<string, unknown>
  riskLevel: string
  onRespond: (
    resolution: VizorionApprovalResolution,
    data?: Record<string, unknown>,
  ) => void
  isSubmitting?: boolean
}

// A run paused mid-flight for human review of a specific tool call —
// Vizorion's HITL contract (PendingApproval: tool name, arguments, risk
// level, resolved as approved/edited/rejected). Distinct from
// packages/ui's existing ApprovalCard/HumanApprovalPanel, which model a
// request-level risk/confidence/decision review instead of a single tool
// invocation.
function VizorionApprovalCard({
  toolName,
  toolArguments,
  riskLevel,
  onRespond,
  isSubmitting = false,
  className,
  ...props
}: VizorionApprovalCardProps) {
  const [editing, setEditing] = React.useState(false)
  const [confirmRejectOpen, setConfirmRejectOpen] = React.useState(false)
  const [editedJson, setEditedJson] = React.useState(() =>
    JSON.stringify(toolArguments, null, 2),
  )
  const [editError, setEditError] = React.useState<string | null>(null)

  const normalizedRisk = riskLevel.toLowerCase() as KnownRiskLevel
  const riskClassName =
    riskLevelClassName[normalizedRisk] ??
    'bg-muted text-muted-foreground border-transparent'

  function submitEdited() {
    try {
      const data = JSON.parse(editedJson) as Record<string, unknown>
      setEditError(null)
      onRespond('edited', data)
    } catch {
      setEditError('Arguments must be valid JSON.')
    }
  }

  return (
    <div
      data-slot="vizorion-approval-card"
      className={cn(
        'bg-surface w-full space-y-3 rounded-lg border p-3',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <ShieldAlertIcon className="text-warning size-4" aria-hidden="true" />
          Approval needed to run <span className="font-mono">{toolName}</span>
        </p>
        <Badge
          className={cn('shrink-0 border capitalize', riskClassName)}
          variant="outline"
        >
          {riskLevel} risk
        </Badge>
      </div>

      <pre className="bg-surface-muted max-h-40 overflow-auto rounded-md p-2 text-xs">
        {JSON.stringify(toolArguments, null, 2)}
      </pre>

      {editing && (
        <div className="space-y-1.5">
          <Textarea
            value={editedJson}
            onChange={(e) => setEditedJson(e.target.value)}
            rows={5}
            className="font-mono text-xs"
            disabled={isSubmitting}
          />
          {editError && <p className="text-danger text-xs">{editError}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {editing ? (
          <>
            <Button size="sm" onClick={submitEdited} disabled={isSubmitting}>
              Submit edited arguments
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => onRespond('approved')}
              disabled={isSubmitting}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={isSubmitting}
            >
              Edit arguments
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmRejectOpen(true)}
              disabled={isSubmitting}
            >
              Reject
            </Button>
          </>
        )}
      </div>

      <Dialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this tool call?</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{toolName}</span> will not run.
              This cannot be undone from here.
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
                onRespond('rejected')
              }}
              disabled={isSubmitting}
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { VizorionApprovalCard }
