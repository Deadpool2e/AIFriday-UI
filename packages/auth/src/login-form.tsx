import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@platform/ui'

import { useAuth } from './auth-provider'
import { DEMO_USERS } from './demo-users'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const [authError, setAuthError] = React.useState<string | null>(null)
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
    }
  }

  function fillDemoUser(email: string) {
    const demoUser = DEMO_USERS.find((candidate) => candidate.email === email)
    if (!demoUser) return
    form.setValue('email', demoUser.email)
    form.setValue('password', demoUser.password)
    void form.handleSubmit(onSubmit)()
  }

  return (
    <div className="space-y-6">
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
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p role="alert" className="text-danger text-xs">
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
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p role="alert" className="text-danger text-xs">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        {authError && (
          <p role="alert" className="text-danger text-sm">
            {authError}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Demo personas
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_USERS.map((demoUser) => (
            <Button
              key={demoUser.id}
              type="button"
              variant="outline"
              size="sm"
              className="capitalize"
              onClick={() => fillDemoUser(demoUser.email)}
            >
              {demoUser.role}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
