import {
  CheckSquareIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  RadarIcon,
  SettingsIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@platform/auth'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  // A single required permission, several (any one is sufficient), or
  // omitted — meaning visible to anyone logged in.
  permission?: Permission | Permission[]
}

// The real business/AI nav — everything below "Settings" is a candidate
// for federation in Phase 9. This array is the single source of truth for
// Sidebar, MobileSidebar, Breadcrumbs, AND route-level permission gates in
// router.tsx, so nav visibility and route access can never drift apart.
export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboardIcon },
  {
    label: 'Requests',
    to: '/requests',
    icon: FileTextIcon,
    permission: 'REQUEST_VIEW',
  },
  {
    label: 'Documents',
    to: '/documents',
    icon: FolderIcon,
    permission: 'DOCUMENT_VIEW',
  },
  {
    label: 'AI Assistant',
    to: '/ai-assistant',
    icon: SparklesIcon,
    permission: 'AI_ASSISTANT',
  },
  {
    label: 'Approvals',
    to: '/approvals',
    icon: CheckSquareIcon,
    permission: 'REQUEST_APPROVE',
  },
  {
    label: 'AI Control Tower',
    to: '/control-tower',
    icon: RadarIcon,
    // Any AI-operations permission is enough to at least enter the
    // Control Tower — its individual sections (Agents, Guardrails, Audit)
    // gate more specifically once they exist (Phase 10+).
    permission: ['AGENT_VIEW', 'AI_TRACE_VIEW', 'GUARDRAIL_VIEW', 'AUDIT_VIEW'],
  },
]

export const settingsNavItem: NavItem = {
  label: 'Settings',
  to: '/settings',
  icon: SettingsIcon,
}
