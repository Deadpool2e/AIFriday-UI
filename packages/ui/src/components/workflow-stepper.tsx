import * as React from 'react'
import { CheckCircle2Icon, CircleIcon, Loader2Icon, XCircleIcon } from 'lucide-react'

import { cn } from '../lib/cn'

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface WorkflowStep {
  id: string
  label: string
  status: WorkflowStepStatus
  detail?: string
}

interface WorkflowStepperProps extends React.ComponentProps<'ol'> {
  steps: WorkflowStep[]
}

const statusIcon: Record<WorkflowStepStatus, React.ReactNode> = {
  pending: <CircleIcon className="text-muted-foreground size-4" aria-hidden="true" />,
  running: <Loader2Icon className="text-info size-4 animate-spin" aria-hidden="true" />,
  completed: <CheckCircle2Icon className="text-success size-4" aria-hidden="true" />,
  failed: <XCircleIcon className="text-danger size-4" aria-hidden="true" />,
}

const statusLabel: Record<WorkflowStepStatus, string> = {
  pending: 'Pending',
  running: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
}

// Generic staged-progress display — used by the AI Assistant's execution
// flow (Phase 7) today, and reusable for any other multi-step process
// (approval workflows, onboarding, multi-stage pipelines) without change.
function WorkflowStepper({ steps, className, ...props }: WorkflowStepperProps) {
  return (
    <ol data-slot="workflow-stepper" className={cn('space-y-3', className)} {...props}>
      {steps.map((step) => (
        <li key={step.id} className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">{statusIcon[step.status]}</span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-sm',
                step.status === 'pending' && 'text-muted-foreground',
              )}
            >
              {step.label}
              <span className="sr-only"> — {statusLabel[step.status]}</span>
            </p>
            {step.detail && (
              <p className="text-muted-foreground text-xs">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

export { WorkflowStepper }
