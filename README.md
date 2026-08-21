# Enterprise AI Platform

A reusable, industrial-grade frontend for AI-assisted business workflows — built for a hackathon Nationals round, designed to be plugged directly into a real AI backend afterward rather than thrown away. Every page runs on deterministic mock data today; flipping one environment variable is meant to be the entire migration to a real API (see [`docs/api-contracts.md`](docs/api-contracts.md)).

## What's here

- **Host** (`apps/host`, port 5173) — the shell everything loads through: sidebar, topbar, auth, theming, routing. This is the URL judges actually open.
- **Main App** (`apps/main-app`, port 5174) — the business-workflow side: Dashboard, Requests, Documents, AI Assistant, Approvals.
- **AI Control Tower** (`apps/ai-control-tower`, port 5175) — the AI-operations side: Overview, Agents, Agent Trace, Guardrails, RAG Monitoring, LLM Usage, Latency, System Health, Audit Logs, Explainability.

Main App and AI Control Tower are independent Vite apps, loaded into Host at runtime via Module Federation (`@module-federation/vite`) — not iframes, not separate deployments a user would notice. They share one router, one auth session, one design system, and one `@platform/api-client` mock data store, which is why numbers match across apps (e.g. "47 requests" reads the same on Main App's dashboard and Control Tower's Overview — same underlying array, not two coincidentally equal mocks).

Shared code lives in `packages/`:
- `packages/types` — the domain contracts every app and package imports.
- `packages/ui` — the design system (Tailwind v4 + hand-built shadcn-pattern components), theme-token-only styling so light/dark/high-contrast all work for free.
- `packages/theme` — `ThemeProvider` + the full accessibility settings system (contrast, text size, motion, focus style, keyboard nav).
- `packages/auth` — demo `AuthProvider`, `ProtectedRoute`, the permission/role model.
- `packages/api-client` — every mock service (and the two real, swappable ones — see below), TanStack Query hooks, the SSE-ready event-stream infrastructure.
- `packages/config` — shared ESLint config.

## Getting started

```bash
pnpm install
pnpm dev          # all three apps in parallel — open http://localhost:5173
```

Other useful scripts (run from the repo root, or `--filter <app-or-package>` for one):

```bash
pnpm typecheck    # tsc --noEmit / tsc -b across every package and app
pnpm lint         # eslint across every package and app
pnpm test         # vitest across packages/ui, packages/api-client, packages/auth
pnpm build        # production build of all three apps
```

Individual dev servers, if you need to run one standalone: `pnpm dev:host`, `pnpm dev:main-app`, `pnpm dev:control-tower`.

## Demo login

Three fixed personas, switchable from the login screen (hackathon demo only — see `packages/auth/src/demo-users.ts`):

| Persona | Email | Password | Role |
|---|---|---|---|
| Priya Nair | `analyst@demo.com` | `analyst123` | Analyst |
| Marcus Webb | `manager@demo.com` | `manager123` | Manager |
| Elena Torres | `admin@demo.com` | `admin123` | Admin |

Each role sees a different slice of the app — see [`docs/rbac.md`](docs/rbac.md) for the full permission matrix. Admin sees everything, including every AI Control Tower section.

## Demo script

A suggested walkthrough, roughly in order of "familiar business app" to "AI operations depth" — the thing that's easy to relate to first, the thing with the most engineering behind it last.

1. **Sign in as Priya Nair (Analyst).** Dashboard shows live-computed metrics over the shared mock request store. Open **AI Assistant**, ask something like *"Review this high-risk wire transfer"* — watch the 6-stage pipeline stream in real time (Understanding → RAG → Agent execution → Guardrail check → Recommendation), citations appear, and a confidence-scored recommendation renders at the end.
2. **Sign in as Marcus Webb (Manager).** Open **Approvals**, pick a pending item, approve or reject it — the request's state updates immediately across the app (Requests list, Dashboard counts).
3. **Sign in as Elena Torres (Admin).** Open **AI Control Tower**:
   - **Overview** — the same "Total Requests" number as Main App's dashboard, proving the federation-shared data store, not a coincidence.
   - **Agents → an agent's detail page** — per-agent performance trend and execution history.
   - Click into any execution's trace (**Agent Trace**) — watch it **stream live**, stage by stage, with a spinner on the currently-running agent (this is real `EventStreamSource` infrastructure, not a canned animation — see `packages/api-client/src/lib/event-stream.ts`).
   - **Guardrails, RAG Monitoring, LLM Usage, Latency, System Health, Audit Logs, Explainability** — each is a real, derived view over the same underlying mock data, not a static mockup (e.g. LLM Usage's token totals match Overview's KPI exactly, down to the number).
   - **Explainability**'s low-confidence decision list links straight into Main App's request detail page — cross-app navigation through the shared router.
4. **The Demo Panel** (bottom-right, every page) — presenter-only tooling. Trigger a live guardrail block, a system incident, or a new pending approval, and watch it appear immediately on whichever page shows it — proof the whole system reacts to live events, not just replays a fixed array on page load.
5. **Settings → Accessibility Center** — toggle high contrast, large text, or reduced motion; every page respects it immediately, everywhere, because every component is styled off semantic theme tokens, never a raw color utility.

## Architecture notes worth knowing before judges ask

- **Everything above is mock data by design** — there's no real backend yet; that's the actual hackathon problem statement, integrated afterward. `docs/api-contracts.md` documents the exact endpoint contract every mock service already models itself on, and `requests-service.ts` / `trace-service.ts` have real, swappable implementations already built as worked examples (REST and SSE respectively).
- **RBAC is frontend visibility only.** `docs/rbac.md` is explicit that a real backend must independently re-check every permission server-side — nothing here is a security boundary.
- **Real-time UI is already SSE-shaped.** Agent Trace streams through the same `EventStreamSource` abstraction a real `EventSource` would use — `createMockEventSource()` today, `createSSESource()` (already implemented) once a backend exists.
