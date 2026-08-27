import { useState } from 'react'
import { AccessibilitySettings } from '@platform/theme'
import { PERMISSIONS, useAuth, type Permission } from '@platform/auth'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDocumentTitle,
  useToast,
} from '@platform/ui'
import { CheckIcon, LogOutIcon, MinusIcon } from 'lucide-react'

import { DemoPanel } from '../shell/demo-panel'

type SettingsTab = 'general' | 'accessibility' | 'demo'

// Permission constants are how the code talks about access; they are not
// how a person does. Spelling each one out here means the profile card can
// state plainly what this role can and cannot do, rather than showing
// SCREAMING_SNAKE_CASE at the user.
const PERMISSION_LABEL: Record<Permission, string> = {
  REQUEST_VIEW: 'View requests',
  REQUEST_CREATE: 'Create requests',
  REQUEST_APPROVE: 'Approve requests',
  DOCUMENT_VIEW: 'View documents',
  AI_TRACE_VIEW: 'View AI execution traces',
  GUARDRAIL_VIEW: 'View guardrails',
  AUDIT_VIEW: 'View audit logs',
  AGENT_VIEW: 'View agents',
  SYSTEM_SETTINGS: 'Manage system settings',
  VIZORION_ASSISTANT: 'Use the Vizorion assistant',
}

export function SettingsPage() {
  useDocumentTitle('Settings — Enterprise AI Platform')
  const [tab, setTab] = useState<SettingsTab>('general')
  const { user, permissions, logout } = useAuth()
  const { toast } = useToast()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logout()
      // ProtectedRoute sends the user to /login on its own once status
      // flips, so there's no navigation to do here.
    } catch (error) {
      setSigningOut(false)
      toast({
        title: 'Could not sign out',
        description: error instanceof Error ? error.message : 'Try again.',
        tone: 'danger',
      })
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        bleed={false}
        eyebrow="Platform"
        title="Settings"
        description="Application preferences, accessibility, and developer tooling."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="demo">Demo Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your account within this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {user && (
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">
                    {user.role}
                  </Badge>
                </div>
              )}

              {/* The card previously held one row and a large void beneath
                  it. This is the thing that row implies but never said:
                  what the role actually grants. Showing the denied
                  permissions too — greyed, not hidden — is what makes the
                  difference between personas legible at a glance. */}
              <div className="space-y-2 border-t pt-5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">Access</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {permissions.length} of {PERMISSIONS.length} permissions
                  </p>
                </div>
                <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {PERMISSIONS.map((permission) => {
                    const granted = permissions.includes(permission)
                    return (
                      <li
                        key={permission}
                        className={`flex items-center gap-2 text-sm ${
                          granted ? '' : 'text-muted-foreground/60'
                        }`}
                      >
                        {granted ? (
                          <CheckIcon
                            className="text-success size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <MinusIcon
                            className="size-3.5 shrink-0 opacity-50"
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">
                          {PERMISSION_LABEL[permission]}
                        </span>
                        <span className="sr-only">
                          {granted ? '— granted' : '— not granted'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <p className="text-muted-foreground pt-1 text-xs text-pretty">
                  Permissions come from your role and control what this
                  interface shows. The backend re-checks every one of them on
                  every request.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                pending={signingOut}
                pendingLabel="Signing out…"
              >
                <LogOutIcon />
                Sign out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <AccessibilitySettings />
        </TabsContent>

        <TabsContent value="demo">
          <DemoPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
