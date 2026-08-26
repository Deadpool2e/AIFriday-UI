# RBAC contract

This is the authorization contract between the frontend and whatever backend eventually replaces the mock services in `@platform/api-client`. It exists because `packages/auth/src/permissions.ts` and `apps/*/src/**/*-routes.tsx` promise it in code comments — read this alongside those files, not instead of them.

## The one rule that matters

**Everything described in this document is a frontend visibility decision, not an authorization boundary.** `ProtectedRoute`, `Sidebar`'s `canView()`, and every `hasAnyPermission()` check in this repo exist so the UI doesn't show a button a user can't use — they do **not** protect anything. A user who opens devtools and calls `fetch('/api/guardrails/rules')` directly bypasses every one of these checks trivially. **The real backend must independently re-check the equivalent permission on every request, using its own source of truth for who the caller is (a verified session/JWT, not anything the frontend sends about itself).** If the backend ever trusts a `role` or `permissions` field the frontend supplies in a request body, this contract is broken.

## Roles and permissions

Permissions are a flat, frontend-defined vocabulary (`packages/auth/src/permissions.ts`):

| Permission | Meaning | Gates |
|---|---|---|
| `REQUEST_VIEW` | See the Requests list and request detail pages | Main App: Requests |
| `REQUEST_CREATE` | Submit a new request | Main App: Requests (new-request action) |
| `REQUEST_APPROVE` | Act on a pending approval (approve/reject/send back/request info) | Main App: Approvals |
| `DOCUMENT_VIEW` | See the Documents page | Main App: Documents |
| `AI_TRACE_VIEW` | View an execution's full agent trace | Control Tower: Execution Trace (currently ungated beyond the outer Control Tower check — see "Known gaps" below) |
| `GUARDRAIL_VIEW` | View guardrail rules/events | Control Tower: Guardrails |
| `AUDIT_VIEW` | View the audit log | Control Tower: Audit Logs |
| `AGENT_VIEW` | View the agent registry and agent detail pages | Control Tower: Agents |
| `SYSTEM_SETTINGS` | (Reserved — no page currently gates on this) | — |

Roles are a fixed mapping onto that vocabulary (`ROLE_PERMISSIONS` in the same file):

| Role | Permissions |
|---|---|
| `analyst` | `REQUEST_VIEW`, `REQUEST_CREATE`, `DOCUMENT_VIEW` |
| `manager` | everything `analyst` has, plus `REQUEST_APPROVE`, `AI_TRACE_VIEW` |
| `admin` | every permission in the list |

A real backend is not required to reuse this exact role/permission split — it's the frontend's current shape, useful as a starting contract. If the real problem statement needs a different permission model, update `permissions.ts` (the single source of truth this whole frontend reads from — `Sidebar`, every `ProtectedRoute`, `control-tower-nav.tsx`) and this document together.

## What the backend needs to expose

1. **Authentication** — issue a session token (JWT or opaque, backend's choice) on login. `packages/auth/src/auth-service.ts`'s `AuthService.login(email, password)` is the seam; a real implementation posts credentials and stores whatever token the backend returns, in whatever way `useAuth()`'s consumers expect (currently in-memory `AuthProvider` state — swapping to a persisted token belongs to this same real `AuthService` implementation).
2. **Bearer token on every request** — `apiFetch()` (`packages/api-client/src/lib/http-client.ts`) already accepts an optional `token` param and sets `Authorization: Bearer <token>`. Real service implementations (see `docs/api-contracts.md`) need to receive the current token from `useAuth()` and pass it through.
3. **Server-side permission enforcement** — for every endpoint listed in `docs/api-contracts.md`, the backend decides what permission(s) it requires and rejects (401/403) requests from a caller who doesn't have them, independent of anything the frontend UI currently shows or hides.
4. **A `/me` or equivalent endpoint** (not yet in this frontend, since the mock `AuthProvider` doesn't need one) that returns the current user's identity and permission set, so the frontend can replace `DEMO_USERS`/`ROLE_PERMISSIONS` with server-issued data instead of a hardcoded map.

## Known gaps in the current frontend (flagging honestly, not fixing here)

- **Execution Trace has no page-level permission gate.** `AI_TRACE_VIEW` exists and Manager is the persona built around it, but `/control-tower/executions/:executionId` currently only inherits the outer Control Tower gate (any of `AGENT_VIEW`/`AI_TRACE_VIEW`/`GUARDRAIL_VIEW`/`AUDIT_VIEW`), same as Overview and every RAG/LLM Usage/Latency/System Health/Explainability page. Tightening this to require `AI_TRACE_VIEW` specifically is a small, safe follow-up if the real deployment wants it — it weakens nothing today since the backend must enforce this regardless.
- **No page currently requires `SYSTEM_SETTINGS`.** It's declared in the permission vocabulary for a future Settings page that doesn't have granular sections yet.
- **RAG Monitoring, LLM Usage, Latency, System Health, and Explainability have no dedicated permission** — they're visible to anyone who clears the outer Control Tower check. There was no natural permission to reuse for these without inventing new ones speculatively; add one (and gate the corresponding route + `control-tower-nav.tsx` tab) if the real deployment needs finer control here.
