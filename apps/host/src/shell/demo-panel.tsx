import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  RadioIcon,
  ShieldAlertIcon,
  ServerCrashIcon,
  UserPlusIcon,
} from 'lucide-react'
import {
  triggerDemoGuardrailBlock,
  triggerDemoIncident,
  triggerDemoPendingApproval,
  USE_MOCK_API,
} from '@platform/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useToast,
} from '@platform/ui'

// Presenter-only tooling for the Nationals demo — NOT a product feature.
// Previously a floating panel that competed visually with the floating
// chat launcher for the same bottom-right corner; it now lives inline in
// Settings > Demo Mode (and mirrored as quick actions in the Command
// Palette), so the only persistent floating action left is the chat.
// Each trigger mutates the same mock stores every page already reads
// (mock-data.ts / guardrails-service.ts / system-health-service.ts), then
// invalidates every query so the effect shows up live, wherever it's
// visible, without a page reload.
export function DemoPanel() {
  const [lastMessage, setLastMessage] = React.useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Toast *and* the inline line: the toast is what the room sees when the
  // presenter fires an event from anywhere, the inline line is the
  // persistent record on this panel for whoever is driving it.
  function runTrigger(title: string, label: string, action: () => void) {
    action()
    queryClient.invalidateQueries()
    setLastMessage(label)
    toast({ title, description: label, tone: 'warning' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <RadioIcon className="text-danger size-4" aria-hidden="true" />
          Demo Mode
          <Badge
            variant={USE_MOCK_API ? 'secondary' : 'outline'}
            className="ml-auto"
          >
            {USE_MOCK_API ? 'Mock data' : 'Live backend'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Fires a live event into the same mock data every page reads — useful
          for walking through a scenario without waiting for it to occur
          naturally. Not part of the product for end users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() =>
              runTrigger(
                'Guardrail block triggered',
                'See Guardrails or Audit Logs.',
                triggerDemoGuardrailBlock,
              )
            }
          >
            <ShieldAlertIcon className="size-4" aria-hidden="true" />
            Guardrail block
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() =>
              runTrigger(
                'System incident triggered',
                'See System Health or Overview.',
                triggerDemoIncident,
              )
            }
          >
            <ServerCrashIcon className="size-4" aria-hidden="true" />
            System incident
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            onClick={() =>
              runTrigger(
                'Pending approval added',
                'See Approvals or Requests.',
                triggerDemoPendingApproval,
              )
            }
          >
            <UserPlusIcon className="size-4" aria-hidden="true" />
            Pending approval
          </Button>
        </div>
        {lastMessage && (
          <p className="text-success text-xs" role="status">
            {lastMessage}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
