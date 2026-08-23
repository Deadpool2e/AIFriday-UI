import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import {
  triggerDemoGuardrailBlock,
  triggerDemoIncident,
  triggerDemoPendingApproval,
} from '@platform/api-client'
import { useAuth } from '@platform/auth'
import { useTheme } from '@platform/theme'
import { useQueryClient } from '@tanstack/react-query'
import {
  MoonIcon,
  RadioIcon,
  SearchIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SunIcon,
  UserPlusIcon,
} from 'lucide-react'

import { navItems, settingsNavItem } from './nav-items'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAssistant: () => void
}

const groupClass =
  '**:[[cmdk-group-heading]]:text-muted-foreground/70 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase'
const itemClass =
  'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm'

export function CommandPalette({ open, onOpenChange, onOpenAssistant }: CommandPaletteProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasAnyPermission } = useAuth()
  const { resolvedColorMode, setColorMode } = useTheme()

  function run(action: () => void) {
    onOpenChange(false)
    action()
  }

  function runDemoTrigger(label: string, action: () => void) {
    run(() => {
      action()
      queryClient.invalidateQueries()
      console.info(`[Demo Mode] ${label}`)
    })
  }

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.permission ||
      hasAnyPermission(Array.isArray(item.permission) ? item.permission : [item.permission]),
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter
      overlayClassName="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-(--z-command-palette) bg-black/50"
      contentClassName="bg-surface-elevated/85 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[18%] left-1/2 z-(--z-command-palette) w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border shadow-xl duration-150"
    >
      <div className="flex items-center gap-2 border-b px-3">
        <SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder="Search or run a command..."
          className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
        />
        <kbd className="text-muted-foreground bg-muted hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          Esc
        </kbd>
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="text-muted-foreground py-8 text-center text-sm">
          No results found.
        </Command.Empty>

        <Command.Group heading="Navigation" className={groupClass}>
          {visibleNavItems.map((item) => (
            <Command.Item key={item.to} onSelect={() => run(() => navigate(item.to))} className={itemClass}>
              <item.icon className="text-muted-foreground size-4" aria-hidden="true" />
              Go to {item.label}
            </Command.Item>
          ))}
          <Command.Item onSelect={() => run(() => navigate(settingsNavItem.to))} className={itemClass}>
            <settingsNavItem.icon className="text-muted-foreground size-4" aria-hidden="true" />
            Open Settings
          </Command.Item>
        </Command.Group>

        {hasAnyPermission(['AI_ASSISTANT']) && (
          <Command.Group heading="AI" className={groupClass}>
            <Command.Item onSelect={() => run(onOpenAssistant)} className={itemClass}>
              <SparklesIcon className="text-ai-accent size-4" aria-hidden="true" />
              Ask the AI Assistant
            </Command.Item>
          </Command.Group>
        )}

        <Command.Group heading="System" className={groupClass}>
          <Command.Item
            onSelect={() => run(() => setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark'))}
            className={itemClass}
          >
            {resolvedColorMode === 'dark' ? (
              <SunIcon className="text-muted-foreground size-4" aria-hidden="true" />
            ) : (
              <MoonIcon className="text-muted-foreground size-4" aria-hidden="true" />
            )}
            Toggle dark mode
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Demo Mode" className={groupClass}>
          <Command.Item
            onSelect={() => runDemoTrigger('Guardrail block triggered', triggerDemoGuardrailBlock)}
            className={itemClass}
          >
            <ShieldAlertIcon className="text-muted-foreground size-4" aria-hidden="true" />
            Simulate guardrail block
          </Command.Item>
          <Command.Item
            onSelect={() => runDemoTrigger('System incident triggered', triggerDemoIncident)}
            className={itemClass}
          >
            <ServerCrashIcon className="text-muted-foreground size-4" aria-hidden="true" />
            Simulate system incident
          </Command.Item>
          <Command.Item
            onSelect={() => runDemoTrigger('Pending approval added', triggerDemoPendingApproval)}
            className={itemClass}
          >
            <UserPlusIcon className="text-muted-foreground size-4" aria-hidden="true" />
            Simulate pending approval
          </Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/settings'))} className={itemClass}>
            <RadioIcon className="text-muted-foreground size-4" aria-hidden="true" />
            Open Demo Mode settings
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
