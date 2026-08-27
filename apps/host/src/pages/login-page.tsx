import { Navigate, useLocation, type Location } from 'react-router'
import { LoginForm, useAuth } from '@platform/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useDocumentTitle,
} from '@platform/ui'
import { GitBranchIcon, RadarIcon, UserCheckIcon } from 'lucide-react'

// The three things this platform actually is, in the order they happen to
// a request. This is the whole product argument, and it's the first thing
// a first-time user reads — so it has to be true of the app they're about
// to see, not marketing copy. Each line maps to a real destination:
// Control Tower's agent graph, Approvals, and the execution trace viewer.
const PILLARS = [
  {
    icon: GitBranchIcon,
    title: 'Requests run through an agent pipeline',
    body: 'Retrieval, risk scoring, compliance, and decision agents hand off in sequence — every stage recorded.',
  },
  {
    icon: UserCheckIcon,
    title: 'A human makes the call',
    body: 'The AI recommends with a confidence score, its sources, and its guardrail results. A person approves.',
  },
  {
    icon: RadarIcon,
    title: 'Nothing happens off the record',
    body: 'The Control Tower streams every execution live: agents, tool calls, tokens, latency, and blocks.',
  },
]

export function LoginPage() {
  useDocumentTitle('Sign In — Enterprise AI Platform')
  const { status } = useAuth()
  const location = useLocation()
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  // Already signed in (e.g. session restored from localStorage) — send
  // straight back to wherever ProtectedRoute redirected from, declaratively,
  // no effect needed.
  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      {/* Story panel. Present at every breakpoint, but it collapses to a
          single compact band on small screens rather than pushing the form
          below the fold — the form is what someone came here to use. */}
      <section
        className="relative flex flex-col justify-between gap-10 border-b px-6 py-8 lg:w-[54%] lg:border-r lg:border-b-0 lg:px-14 lg:py-14"
        style={{ backgroundImage: 'var(--gradient-primary-radial)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
            E
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Enterprise AI Platform
          </span>
        </div>

        <div className="max-w-xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
              AI that runs your workflow — and shows its work.
            </h1>
            <p className="text-muted-foreground text-base text-pretty">
              A multi-agent pipeline processes every request, a human approves
              what matters, and every decision stays traceable end to end.
            </p>
          </div>

          <ul className="space-y-5">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="flex gap-3.5">
                <span
                  className="bg-surface text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border"
                  aria-hidden="true"
                >
                  <pillar.icon className="size-4" />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {pillar.title}
                  </span>
                  <span className="text-muted-foreground block text-sm text-pretty">
                    {pillar.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground hidden text-xs lg:block">
          Every screen runs on deterministic demo data. Vizorion, the assistant,
          talks to a real backend.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>
              Pick a persona to see the platform through their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
