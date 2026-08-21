import { InboxIcon } from 'lucide-react'
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
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useDocumentTitle,
} from '@platform/ui'

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
  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Design System Showcase
        </h1>
        <p className="text-muted-foreground text-sm">
          Internal reference for every primitive in{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            @platform/ui
          </code>
          . Not part of the main navigation — bookmark this route directly.
        </p>
      </div>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
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
            A card composes header/content/footer slots — the same shape
            every enterprise AI component (AgentStatusCard, ApprovalCard,
            KPIWidget) will build on in later phases.
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
                Radix-based, fully accessible — focus trap, Escape to close,
                and click-outside are already handled.
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

      <Section title="Loading state">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<InboxIcon />}
          title="No requests yet"
          description="Requests submitted by your team will show up here."
          action={<Button size="sm">New request</Button>}
        />
      </Section>

      <Section title="Error state">
        <ErrorState
          title="Couldn't load requests"
          description="The request service didn't respond. Check your connection and try again."
          onRetry={() => alert('retry clicked')}
        />
      </Section>
    </div>
  )
}
