import { NavLink } from 'react-router'
import { useAuth, type Permission } from '@platform/auth'
import { cn } from '@platform/ui'

// Section tabs within Control Tower — Overview was previously the only
// entry point, reachable only via a "View all agents" button. Guardrails
// (Phase 14) is the first of several more sections coming (RAG Monitoring,
// LLM Usage, Latency, Audit Logs, Explainability, System Health), so this
// list grows as each one lands. Route-based, not local tab state — these
// are real URLs, so browser back/forward and deep links work normally.
//
// Each section's permission mirrors the ProtectedRoute guard on its actual
// route in control-tower-routes.tsx — same rule the top-level Sidebar
// follows for navItems.ts, so a tab is never shown for a page the user
// would immediately get bounced from.
const sections: {
  label: string
  to: string
  end?: boolean
  permission?: Permission
}[] = [
  { label: 'Overview', to: '/control-tower', end: true },
  { label: 'Agents', to: '/control-tower/agents', permission: 'AGENT_VIEW' },
  {
    label: 'Guardrails',
    to: '/control-tower/guardrails',
    permission: 'GUARDRAIL_VIEW',
  },
  { label: 'RAG Monitoring', to: '/control-tower/rag' },
  { label: 'LLM Usage', to: '/control-tower/llm-usage' },
  { label: 'Latency', to: '/control-tower/latency' },
  { label: 'System Health', to: '/control-tower/system-health' },
  {
    label: 'Audit Logs',
    to: '/control-tower/audit-logs',
    permission: 'AUDIT_VIEW',
  },
  { label: 'Explainability', to: '/control-tower/explainability' },
]

export function ControlTowerNav() {
  const { hasAnyPermission } = useAuth()
  const visibleSections = sections.filter(
    (section) => !section.permission || hasAnyPermission([section.permission]),
  )

  return (
    // No border of its own: it renders flush against PageHeader's bottom
    // border, so the active tab's indicator sits on the page frame's own
    // edge rather than on a second line 1px above it.
    <nav aria-label="Control Tower sections">
      <ul className="-mb-px flex gap-4 overflow-x-auto">
        {visibleSections.map((section) => (
          <li key={section.to}>
            <NavLink
              to={section.to}
              end={section.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center border-b-2 px-1 py-2.5 text-sm font-medium whitespace-nowrap',
                  'transition-colors duration-(--duration-fast) focus-visible:ring-ring/50 rounded-t-sm focus-visible:ring-2 focus-visible:outline-none',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
                )
              }
            >
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
