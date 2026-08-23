import { useState } from 'react'
import { AccessibilitySettings } from '@platform/theme'
import { useAuth } from '@platform/auth'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDocumentTitle,
} from '@platform/ui'

import { DemoPanel } from '../shell/demo-panel'

type SettingsTab = 'general' | 'accessibility' | 'demo'

export function SettingsPage() {
  useDocumentTitle('Settings — Enterprise AI Platform')
  const [tab, setTab] = useState<SettingsTab>('general')
  const { user } = useAuth()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Application preferences, accessibility, and developer tooling.
        </p>
      </div>

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
              <CardDescription>Your account within this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">
                    {user.role}
                  </Badge>
                </div>
              )}
            </CardContent>
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
