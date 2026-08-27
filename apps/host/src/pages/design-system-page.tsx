import * as React from 'react'
import { InboxIcon, SaveIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Disclosure,
  Input,
  Kbd,
  PageHeader,
  Skeleton,
  SkeletonText,
  StagedProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  useDocumentTitle,
  useStagedProgress,
  useToast,
  type ProgressStage,
  type ToastTone,
} from '@platform/ui'

// A short, fake pipeline so the staged loader can be watched running on
// this page without waiting for a real federated load.
const DEMO_STAGES: ProgressStage[] = [
  { id: 'read', label: 'Reading document' },
  {
    id: 'extract',
    label: 'Extracting entities',
    detail: 'Names, amounts, dates',
  },
  { id: 'score', label: 'Scoring risk' },
  { id: 'compose', label: 'Generating insights' },
]

const TOAST_TONES: ToastTone[] = ['success', 'warning', 'danger', 'info', 'ai']

const sampleRequests = [
  { id: 'REQ-92831', owner: 'R. Chandran', status: 'Completed', risk: 'Low' },
  { id: 'REQ-92832', owner: 'S. Okafor', status: 'Running', risk: 'Medium' },
  { id: 'REQ-92833', owner: 'M. Ibarra', status: 'Escalated', risk: 'High' },
]

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  useDocumentTitle('Design System — Enterprise AI Platform')
  const { toast, update } = useToast()
  const [loaderRunning, setLoaderRunning] = React.useState(true)
  const loader = useStagedProgress({
    stages: DEMO_STAGES,
    isActive: loaderRunning,
  })

  // The pending-to-resolved pattern every async action in the app uses:
  // one toast that changes state, not a second toast stacked on the first.
  function demoPendingToast() {
    const id = toast({ title: 'Submitting decision', tone: 'pending' })
    setTimeout(
      () =>
        update(id, {
          title: 'Decision recorded',
          description: 'REQ-92831 approved.',
          tone: 'success',
        }),
      1600,
    )
  }

  return (
    <div className="max-w-4xl space-y-10">
      <PageHeader
        bleed={false}
        eyebrow="Platform"
        title="Design System"
        description="Internal reference for every primitive in @platform/ui. Not part of the main navigation — bookmark this route directly."
      />

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="ai">AI action</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button pending pendingLabel="Saving…">
            <SaveIcon />
            Save
          </Button>
        </div>
      </Section>

      <Section title="Keyboard hints">
        <div className="flex flex-wrap items-center gap-4">
          <Kbd keys="mod k" />
          <Kbd keys="g r" />
          <Kbd keys="shift t" />
          <Kbd keys="escape" size="sm" />
          <Tooltip
            content="Tooltips can carry their control's shortcut"
            shortcut="⌘K"
          >
            <Button variant="outline" size="sm">
              Hover or focus me
            </Button>
          </Tooltip>
        </div>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap items-center gap-2">
          {TOAST_TONES.map((tone) => (
            <Button
              key={tone}
              variant="outline"
              size="sm"
              className="capitalize"
              onClick={() =>
                toast({
                  title: `${tone[0].toUpperCase()}${tone.slice(1)} notification`,
                  description:
                    'Every action in the app confirms itself this way.',
                  tone,
                })
              }
            >
              {tone}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={demoPendingToast}>
            Pending → resolved
          </Button>
        </div>
      </Section>

      <Section title="Staged progress">
        <div className="max-w-md space-y-3 rounded-xl border p-4">
          <StagedProgress
            stages={DEMO_STAGES}
            activeIndex={loader.activeIndex}
            status={loader.status}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLoaderRunning((prev) => !prev)}
          >
            {loaderRunning ? 'Finish' : 'Restart'}
          </Button>
        </div>
      </Section>

      <Section title="Disclosure">
        <div className="max-w-md space-y-2">
          <Disclosure title="Guardrail results" summary="4 passed" defaultOpen>
            <p className="text-muted-foreground text-sm">
              The conclusion stays on the trigger row; only the evidence folds
              away.
            </p>
          </Disclosure>
          <Disclosure title="Sources" summary="No documents" disabled />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-sm gap-3">
          <Input placeholder="Search requests..." />
          <Input placeholder="Disabled" disabled />
          <Input aria-invalid placeholder="Invalid value" />
        </div>
      </Section>

      <Section title="Cards">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>REQ-92831</CardTitle>
            <CardDescription>Submitted by R. Chandran</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A card composes header/content/footer slots — the same shape every
            enterprise AI component (AgentStatusCard, ApprovalCard, KPIWidget)
            will build on in later phases.
          </CardContent>
        </Card>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>
                Radix-based, fully accessible — focus trap, Escape to close, and
                click-outside are already handled.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Confirm</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleRequests.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>{row.owner}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.risk}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="Skeletons">
        <div className="grid max-w-lg gap-4 sm:grid-cols-2">
          <SkeletonText lines={4} />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Section>

      <Section title="Empty state">
        <div className="space-y-3">
          <EmptyState
            icon={<InboxIcon />}
            title="No requests yet"
            description="Requests submitted by your team will show up here."
            action={<Button size="sm">New request</Button>}
          />
          <EmptyState
            size="compact"
            icon={<InboxIcon />}
            title="Nothing here"
            description="The compact size, for empty states nested inside a card."
          />
        </div>
      </Section>

      <Section title="Error state">
        <ErrorState
          title="Couldn't load requests"
          description="The request service didn't respond. Check your connection and try again."
          onRetry={() =>
            toast({ title: 'Retrying…', tone: 'pending', durationMs: 1500 })
          }
          detail={'GET /api/requests\n503 Service Unavailable'}
        />
      </Section>
    </div>
  )
}
