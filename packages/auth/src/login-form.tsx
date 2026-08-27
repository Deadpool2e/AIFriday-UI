import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, cn } from '@platform/ui'

import { useAuth } from './auth-provider'
import { DEMO_USERS } from './demo-users'

// Inlined rather than pulled from lucide-react: @platform/auth has no
// icon dependency, and adding one to the whole package for two 16px
// glyphs is not a trade worth making.
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// What each persona actually unlocks. A judge picking "Admin" with no idea
// what changes learns nothing from the click; naming the difference up
// front is the fastest way to explain that this app is genuinely
// role-aware rather than showing everyone the same screens.
const PERSONA_SCOPE: Record<string, string> = {
  analyst: 'Requests, documents, and the AI assistant',
  manager: 'Everything an analyst sees, plus approvals',
  admin: 'Full access, including the AI Control Tower',
}

export function LoginForm() {
  const { login } = useAuth()
  const [authError, setAuthError] = React.useState<string | null>(null)
  // Which persona button is mid-sign-in, so only that card shows a
  // spinner rather than all three going busy at once.
  const [activePersona, setActivePersona] = React.useState<string | null>(null)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null)
    try {
      await login(values.email, values.password)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed.')
      setActivePersona(null)
    }
  }

  function fillDemoUser(email: string) {
    const demoUser = DEMO_USERS.find((candidate) => candidate.email === email)
    if (!demoUser) return
    setActivePersona(demoUser.id)
    form.setValue('email', demoUser.email)
    form.setValue('password', demoUser.password)
    void form.handleSubmit(onSubmit)()
  }

  const isBusy = form.formState.isSubmitting

  return (
    <div className="space-y-6">
      {/* Personas come first now. The credential form is the fallback for
          anyone who wants to type them; one click is the intended path,
          and the intended path should be the one you see first. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            Continue as
          </p>
          <p className="text-muted-foreground text-xs">Demo personas</p>
        </div>
        <div className="grid gap-2">
          {DEMO_USERS.map((demoUser) => {
            const pending = activePersona === demoUser.id && isBusy
            return (
              <button
                key={demoUser.id}
                type="button"
                disabled={isBusy}
                onClick={() => fillDemoUser(demoUser.email)}
                aria-busy={pending || undefined}
                className={cn(
                  'group border-border hover:border-border-strong hover:bg-accent/40 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left',
                  'transition-[background-color,border-color,transform] duration-(--duration-fast) ease-out active:scale-[0.995]',
                  'focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60',
                  pending && 'border-border-strong bg-accent/40',
                )}
              >
                <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {demoUser.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {demoUser.name}
                    </span>
                    <span className="text-muted-foreground bg-muted rounded px-1.5 py-px text-[10px] font-medium tracking-wide capitalize">
                      {demoUser.role}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                    {pending ? 'Signing in…' : PERSONA_SCOPE[demoUser.role]}
                  </span>
                </span>
                <ArrowRightIcon
                  className={cn(
                    'text-muted-foreground size-4 shrink-0 transition-transform duration-(--duration-fast)',
                    'group-hover:translate-x-0.5',
                    pending && 'animate-ambient-pulse',
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative">
        <span
          className="bg-border absolute inset-x-0 top-1/2 h-px"
          aria-hidden="true"
        />
        <span className="bg-card text-muted-foreground relative mx-auto block w-fit px-2 text-[11px] tracking-wide uppercase">
          or sign in
        </span>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={
              form.formState.errors.email ? 'email-error' : undefined
            }
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p id="email-error" role="alert" className="text-danger text-xs">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!form.formState.errors.password}
            aria-describedby={
              form.formState.errors.password ? 'password-error' : undefined
            }
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p id="password-error" role="alert" className="text-danger text-xs">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        {authError && (
          <p
            role="alert"
            className="border-danger/30 bg-danger/5 text-danger flex items-start gap-2 rounded-md border p-2.5 text-xs"
          >
            <AlertCircleIcon className="mt-px size-3.5 shrink-0" />
            {authError}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          pending={isBusy && !activePersona}
          pendingLabel="Signing in…"
        >
          Sign in
        </Button>
      </form>
    </div>
  )
}
