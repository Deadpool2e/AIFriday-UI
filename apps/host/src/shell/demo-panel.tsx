import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RadioIcon, ShieldAlertIcon, ServerCrashIcon, UserPlusIcon, XIcon } from 'lucide-react'
import {
  triggerDemoGuardrailBlock,
  triggerDemoIncident,
  triggerDemoPendingApproval,
} from '@platform/api-client'
import { Button, Card, CardContent, CardHeader, CardTitle, cn } from '@platform/ui'

// Presenter-only tooling for the Nationals demo — NOT a product feature.
// Each trigger mutates the same mock stores every page already reads
// (mock-data.ts / guardrails-service.ts / system-health-service.ts), then
// invalidates every query so the effect shows up live, wherever it's
// visible, without a page reload. Deliberately styled to look like
// scaffolding (dashed border, "Demo Panel" label) so it never reads as
// part of the actual product during a walkthrough.
//
// Lives in Host, not a remote, because it needs to be reachable from any
// page — Host is the only layer that's always mounted regardless of which
// top-level route (Main App vs. Control Tower) is currently showing. That
// requires Host to share the same @platform/api-client singleton instance
// main-app/ai-control-tower already share with each other (see the Phase
// 20 note in vite.config.ts) — without that, triggering an event here
// would mutate a second, disconnected copy of the mock store and nothing
// would visibly change.
export function DemoPanel() {
  const [open, setOpen] = React.useState(false)
  const [lastMessage, setLastMessage] = React.useState<string | null>(null)
  const queryClient = useQueryClient()

  function runTrigger(label: string, action: () => void) {
    action()
    queryClient.invalidateQueries()
    setLastMessage(label)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <Card className="w-80 border-dashed shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <RadioIcon className="text-danger size-4" aria-hidden="true" />
                Demo Panel
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-6 p-0"
                onClick={() => setOpen(false)}
                aria-label="Close demo panel"
              >
                <XIcon className="size-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Presenter tooling — fires a live event into the same mock data every page reads.
              Not part of the product.
            </p>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() =>
                  runTrigger('Guardrail block triggered — see Guardrails or Audit Logs.', () =>
                    triggerDemoGuardrailBlock(),
                  )
                }
              >
                <ShieldAlertIcon className="size-4" aria-hidden="true" />
                Trigger guardrail block
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() =>
                  runTrigger('Incident triggered — see System Health or Overview.', () => {
                    triggerDemoIncident()
                  })
                }
              >
                <ServerCrashIcon className="size-4" aria-hidden="true" />
                Trigger system incident
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() =>
                  runTrigger('Pending approval added — see Approvals or Requests.', () => {
                    triggerDemoPendingApproval()
                  })
                }
              >
                <UserPlusIcon className="size-4" aria-hidden="true" />
                Trigger pending approval
              </Button>
            </div>
            {lastMessage && (
              <p className="text-success text-xs" role="status">
                {lastMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'gap-1.5 border-dashed shadow-lg',
          open ? 'bg-secondary' : 'bg-surface',
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <RadioIcon className="text-danger size-3.5" aria-hidden="true" />
        Demo Panel
      </Button>
    </div>
  )
}
