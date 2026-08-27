import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@platform/ui'

import { navItems, settingsNavItem } from './nav-items'

const allNavItems = [...navItems, settingsNavItem]

// Control Tower's own section labels (RAG Monitoring, LLM Usage, ...) live
// in apps/ai-control-tower/src/control-tower-nav.tsx — a separate remote,
// not something Host's nav-items.ts can import across the Module
// Federation boundary. Title-casing alone would render "Rag" / "Llm
// Usage", so known acronyms get a small explicit override instead.
const ACRONYM_WORDS: Record<string, string> = {
  rag: 'RAG',
  llm: 'LLM',
  ai: 'AI',
}

function prettify(segment: string): string {
  // A segment like "REQ-92831" should stay as-is; a route param that
  // happens to look like a slug ("some-thing") gets title-cased.
  if (/^[A-Z]/.test(segment)) return segment
  return segment
    .replace(/-/g, ' ')
    .replace(
      /\b\w+\b/g,
      (word) =>
        ACRONYM_WORDS[word.toLowerCase()] ??
        word[0].toUpperCase() + word.slice(1),
    )
}

interface Crumb {
  path: string
  label: string
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean)
  let cumulative = ''
  return segments.map((segment) => {
    cumulative += `/${segment}`
    const match = allNavItems.find((item) => item.to === cumulative)
    return { path: cumulative, label: match ? match.label : prettify(segment) }
  })
}

// Builds the full trail (Home > Requests > REQ-92831), not just a single
// extra level — every route segment becomes its own crumb, so this scales
// to however deep routes get without further changes here.
export function Breadcrumbs() {
  const location = useLocation()
  const crumbs = buildCrumbs(location.pathname)
  const isHome = crumbs.length === 0

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          {isHome ? (
            <BreadcrumbPage>Overview</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/">Overview</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <Fragment key={crumb.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
