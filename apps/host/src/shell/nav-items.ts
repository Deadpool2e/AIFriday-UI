import {
  CheckSquareIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  RadarIcon,
  SettingsIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@platform/auth'

export type NavGroup = 'Workspace' | 'Intelligence' | 'AI Operations'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  group: NavGroup
  // A single required permission, several (any one is sufficient), or
  // omitted — meaning visible to anyone logged in.
  permission?: Permission | Permission[]
}

// The real business/AI nav — everything below "Settings" is a candidate
// for federation in Phase 9. This array is the single source of truth for
// Sidebar, MobileSidebar, Breadcrumbs, AND route-level permission gates in
// router.tsx, so nav visibility and route access can never drift apart.
// `group` is presentation-only (grouped section headings in the sidebar) —
// it carries no routing/permission meaning, so it's safe to reassign
// without touching router.tsx.
export const navItems: NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutDashboardIcon, group: 'Workspace' },
  {
    label: 'Requests',
    to: '/requests',
    icon: FileTextIcon,
    group: 'Workspace',
    permission: 'REQUEST_VIEW',
  },
  {
    label: 'Documents',
    to: '/documents',
    icon: FolderIcon,
    group: 'Workspace',
    permission: 'DOCUMENT_VIEW',
  },
  {
    label: 'Vizorion',
    to: '/vizorion',
    icon: MessageCircleIcon,
    group: 'Intelligence',
    permission: 'VIZORION_ASSISTANT',
  },
  {
    label: 'Approvals',
    to: '/approvals',
    icon: CheckSquareIcon,
    group: 'Intelligence',
    permission: 'REQUEST_APPROVE',
  },
  {
    label: 'Control Tower',
    to: '/control-tower',
    icon: RadarIcon,
    group: 'AI Operations',
    // Any AI-operations permission is enough to at least enter the
    // Control Tower — its individual sections (Agents, Guardrails, Audit)
    // gate more specifically once they exist (Phase 10+).
    permission: ['AGENT_VIEW', 'AI_TRACE_VIEW', 'GUARDRAIL_VIEW', 'AUDIT_VIEW'],
  },
]

export const navGroupOrder: NavGroup[] = [
  'Workspace',
  'Intelligence',
  'AI Operations',
]

// Not part of navGroupOrder's grouped rendering — Settings is pinned
// separately below the group list in Sidebar, so `group` here is unused
// but still required by the shared NavItem shape (also consumed flat by
// Breadcrumbs and CommandPalette).
export const settingsNavItem: NavItem = {
  label: 'Settings',
  to: '/settings',
  icon: SettingsIcon,
  group: 'Workspace',
}
