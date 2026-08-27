# Enterprise AI Platform

A reusable, industrial-grade frontend for AI-assisted business workflows — built for a hackathon Nationals round, designed to be plugged directly into a real AI backend afterward rather than thrown away. Every page runs on deterministic mock data today; flipping one environment variable is meant to be the entire migration to a real API (see [`docs/api-contracts.md`](docs/api-contracts.md)).

## What's here

- **Host** (`apps/host`, port 5173) — the shell everything loads through: sidebar, topbar, auth, theming, routing. This is the URL judges actually open.
- **Main App** (`apps/main-app`, port 5174) — the business-workflow side: Dashboard, Requests, Documents, Approvals.
- **AI Control Tower** (`apps/ai-control-tower`, port 5175) — the AI-operations side: Overview, Agents, Agent Trace, Guardrails, RAG Monitoring, LLM Usage, Latency, System Health, Audit Logs, Explainability.

Main App and AI Control Tower are independent Vite apps, loaded into Host at runtime via Module Federation (`@module-federation/vite`) — not iframes, not separate deployments a user would notice. They share one router, one auth session, one design system, and one `@platform/api-client` mock data store, which is why numbers match across apps (e.g. "47 requests" reads the same on Main App's dashboard and Control Tower's Overview — same underlying array, not two coincidentally equal mocks).

**Vizorion** is the one piece of this platform that isn't mock data — a real, separate FastAPI + LangGraph chatbot backend (in the sibling `Vizorion/` repo) that Host and Main App both talk to for a live AI assistant: a floating quick-chat launcher (bottom-right, every page except Vizorion's own full page), a full-page assistant at `/vizorion` (Main App), voice input/output, and — see below — hands-free "Hey Athena" wake-word activation. See [AI Voice Assistant — Vizorion & Autowake](#ai-voice-assistant--vizorion--autowake).

Shared code lives in `packages/`:
- `packages/types` — the domain contracts every app and package imports.
- `packages/ui` — the design system (Tailwind v4 + hand-built shadcn-pattern components), theme-token-only styling so light/dark/high-contrast all work for free.
- `packages/theme` — `ThemeProvider` + the full accessibility settings system (contrast, text size, motion, focus style, keyboard nav).
- `packages/auth` — demo `AuthProvider`, `ProtectedRoute`, the permission/role model.
- `packages/api-client` — every mock service (and the two real, swappable ones — see below), TanStack Query hooks, the SSE-ready event-stream infrastructure, and the Vizorion HTTP client (chat, conversations, voice, speaker verification).
- `packages/voice` — browser-native wake-word detection, PCM/WAV audio capture, and text-to-speech, shared between Autowake (`apps/host`) and Vizorion's manual voice controls (`apps/main-app`).
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

The three commands above are enough for every page except Vizorion, which is deliberately *not* mocked (`VITE_VIZORION_USE_MOCK` in each app's `.env.local`) — talking to it for real needs its own backend running. See [AI Voice Assistant — Vizorion & Autowake](#ai-voice-assistant--vizorion--autowake) for the full setup.

## Demo login

Three fixed personas, switchable from the login screen (hackathon demo only — see `packages/auth/src/demo-users.ts`):

| Persona | Email | Password | Role |
|---|---|---|---|
| Priya Nair | `analyst@demo.com` | `analyst123` | Analyst |
| Marcus Webb | `manager@demo.com` | `manager123` | Manager |
| Elena Torres | `admin@demo.com` | `admin123` | Admin |

Each role sees a different slice of the app — see [`docs/rbac.md`](docs/rbac.md) for the full permission matrix. Admin sees everything, including every AI Control Tower section. All three personas hold `VIZORION_ASSISTANT` (`packages/auth/src/permissions.ts`), so all three can use the Vizorion launcher and Autowake.

## Demo script

A suggested walkthrough, roughly in order of "familiar business app" to "AI operations depth" — the thing that's easy to relate to first, the thing with the most engineering behind it last.

1. **Sign in as Priya Nair (Analyst).** Dashboard shows live-computed metrics over the shared mock request store.
2. **Sign in as Marcus Webb (Manager).** Open **Approvals**, pick a pending item, approve or reject it — the request's state updates immediately across the app (Requests list, Dashboard counts).
3. **Sign in as Elena Torres (Admin).** Open **AI Control Tower**:
   - **Overview** — the same "Total Requests" number as Main App's dashboard, proving the federation-shared data store, not a coincidence.
   - **Agents → an agent's detail page** — per-agent performance trend and execution history.
   - Click into any execution's trace (**Agent Trace**) — watch it **stream live**, stage by stage, with a spinner on the currently-running agent (this is real `EventStreamSource` infrastructure, not a canned animation — see `packages/api-client/src/lib/event-stream.ts`).
   - **Guardrails, RAG Monitoring, LLM Usage, Latency, System Health, Audit Logs, Explainability** — each is a real, derived view over the same underlying mock data, not a static mockup (e.g. LLM Usage's token totals match Overview's KPI exactly, down to the number).
   - **Explainability**'s low-confidence decision list links straight into Main App's request detail page — cross-app navigation through the shared router.
4. **The Demo Panel** (Settings → Demo Mode, or any of its entries in the command palette) — presenter-only tooling. Trigger a live guardrail block, a system incident, or a new pending approval, and watch it appear immediately on whichever page shows it — proof the whole system reacts to live events, not just replays a fixed array on page load.
5. **Settings → Accessibility Center** — toggle high contrast, large text, or reduced motion; every page respects it immediately, everywhere, because every component is styled off semantic theme tokens, never a raw color utility.
6. **Press `⌘K` / `Ctrl+K` anywhere** — the command palette searches real requests by ID, title, or owner, jumps to any page, and fires the demo triggers. `?` lists every shortcut; `g` then a letter jumps between pages without it.

## Design system

Shared UI lives in `packages/ui`, styled entirely from the semantic tokens in `packages/theme/src/tokens.css` — no component ever reaches for a raw color utility, which is what makes light/dark/high-contrast work everywhere for free. `/design-system` (not in the nav — navigate to it directly) renders every primitive live, including the interactive ones.

Three conventions are worth knowing, because they're what the rest of the UI is built on:

**Motion is a fixed vocabulary, and it means something.** Four durations (`--duration-instant/fast/base/slow`) and three curves, defined once in `tokens.css`; `--ease-out` and `--ease-in-out` deliberately override Tailwind's defaults so there's one set of curves, not ours competing with theirs. Motion is reserved for communicating state and causality — a card that lifts on hover is a card you can click (`<Card interactive>`), and one that doesn't, isn't. Every animation is zeroed automatically under the reduced-motion setting.

**Loading is a designed state, not a spinner.** `AppLoadingView` + `StagedProgress` replace generic fallbacks with a branded mark, the named operation, and its actual stages as they run — see `apps/host/src/remotes/remote-loading-fallback.tsx`, where the stage list is the real sequence of a Module Federation load (fetch remote entry → negotiate shared singletons → pull chunks → restore session). It never claims completion the work hasn't reached: `useStagedProgress` only resolves when its `isActive` flag goes false. Loaders also wait ~180ms before appearing, so a fast operation shows nothing rather than a flash. Below the loader sits a skeleton shaped like the content that's about to land, so the swap reads as the page filling in rather than one screen replacing another — `DataTable`'s loading state renders the real table with skeleton cells for the same reason. Before React has even mounted, an inline boot screen in `apps/host/index.html` paints on the first frame in the user's saved theme.

**Every action confirms itself.** `ToastProvider` / `useToast` (mounted in `apps/host/src/main.tsx`) is the app-wide feedback layer: submitting an approval, firing a demo event, or failing to reach a service all say so. `useToast().update()` promotes a `pending` toast in place rather than stacking a second one. Approvals also update optimistically — the queue drops the item the instant you click and rolls back if the service refuses.

## AI Voice Assistant — Vizorion & Autowake

Vizorion is a real, running assistant (LangGraph agent over FastAPI, in the sibling `Vizorion/` repo) — not mock data like the rest of this platform. It's reachable three ways:

- **Floating launcher** — the chat-bubble button, bottom-right, on every page except Vizorion's own full page (`VizorionLauncher`, mounted in `apps/host/src/shell/app-shell.tsx`).
- **Full page** — `/vizorion` in Main App (`apps/main-app/src/pages/vizorion`), with its own persisted conversation history, citations, tool-call chips, and HITL approval cards.
- **Autowake** — say **"Hey Athena"** and it opens the floating launcher and starts listening for your question automatically, hands-free.

### Autowake: how it works

1. **Wake-word detection** (client-side, zero account/SDK): the browser's native `SpeechRecognition` API listens continuously and watches the live transcript for "Hey Athena" (`packages/voice/src/wake-word.ts`). No Picovoice/Porcupine or similar — this was deliberately kept dependency- and account-free, matching the platform's existing "browser-native where possible" choice for text-to-speech.
2. **Speaker verification** (server-side): the instant the browser detects you've stopped speaking (`onspeechend` — anchored here, not to the slower final transcript, so the audio snapshot doesn't scroll past the actual utterance), the last ~3.5s of raw mic audio is encoded to WAV client-side (`packages/voice/src/pcm-capture.ts`) and sent to Vizorion's `POST /v1/voice/speaker/verify`. There, [Resemblyzer](https://github.com/resemble-ai/Resemblyzer) — an open-source, MIT-licensed speaker-embedding model with weights bundled in the pip package (no account, no API key, no download step, runs on CPU) — scores it against your enrolled voice profile. Below the threshold, it's silently discarded and listening resumes; only a verified match proceeds.
3. **Opens the panel + records your question** — a verified wake opens the same floating launcher panel above (shared `useVizorionChat` instance, lifted to `app-shell.tsx`, so what Autowake hears and what the panel shows are the same conversation) and shows a "Listening for your question…" banner with a Stop button inside the panel itself. Recording auto-stops after ~1.6s of silence, or you can stop it manually.
4. **Transcribes, asks, and speaks the reply** — the recording goes to the existing `POST /v1/voice/transcribe` (Groq Whisper), the transcript is sent as a normal chat message, and once the streamed reply finishes, it's read aloud via the browser's `SpeechSynthesis` API (`packages/voice/src/tts.ts`) — no server-side TTS, by the same "lightweight first" principle Vizorion's own docs state for voice output.

### Setup

**1. Postgres** (Vizorion's database, via Docker):
```bash
cd Vizorion
docker compose up -d postgres
```

**2. Vizorion backend**, from `Vizorion/`:
```bash
.venv\Scripts\python scripts\run_server.py    # Windows
# or, on Linux/macOS:
uvicorn app.main:app
```
`scripts/run_server.py` exists specifically for Windows: uvicorn's default loop hard-codes `ProactorEventLoop` on win32, which psycopg's async mode (used by the LangGraph Postgres checkpointer) can't run under — `uvicorn app.main:app` from the CLI fails immediately on Windows for that reason. The script sets a `SelectorEventLoop` first; no effect on Linux/Docker deployment.

Relevant `Vizorion/.env` flags:
```bash
ENABLE_VOICE=true                      # POST /v1/voice/transcribe (Groq Whisper)
ENABLE_AUTOWAKE=true                   # POST /v1/voice/speaker/{enroll,verify} — separate flag,
                                        # since Resemblyzer is a materially heavier dependency
                                        # (pulls in torch) than the rest of this "lightweight,
                                        # provider-independent" engine
SPEAKER_VERIFICATION_PROVIDER=resemblyzer
SPEAKER_VERIFICATION_THRESHOLD=0.75    # accept threshold; tune from real usage — the verify
                                        # endpoint always returns the raw score too
```

**3. Frontend** — as in [Getting started](#getting-started), `pnpm dev` (or `pnpm dev:host` alone if you only need the shell). No extra `VITE_*` env vars are needed for Autowake specifically — it reuses `VITE_VIZORION_API_URL` / `VITE_VIZORION_API_KEY` already in each app's `.env.local`, and needs `VITE_VIZORION_USE_MOCK=false` there to actually reach the real backend.

### Trying it out

1. Log in as any persona (all three have `VIZORION_ASSISTANT`).
2. Click the second floating button, just left of the Vizorion chat bubble, to open the Autowake panel.
3. **Enroll voice** — record 3 short samples, save.
4. **Turn on** — the button becomes a pulsing mic; the browser is now listening for the wake phrase.
5. Say **"Hey Athena"**. It should verify near-instantly (score reused from the wake-phrase audio itself, no extra recording delay) and pop the chat panel open with a "Listening for your question…" banner.
6. Ask a question. It transcribes, sends it, and reads the reply back automatically once Vizorion finishes streaming.

### Known limitations

- **Browser support**: `SpeechRecognition` works in Chrome/Edge; it's unsupported in Firefox and only partially supported in Safari. The widget shows an explicit "Not supported in this browser" state rather than failing silently.
- **Not enterprise biometric-grade security.** Resemblyzer is a reasonable accept/reject filter for a personal, single-enrolled-speaker use case, not a hardened authentication system — `SPEAKER_VERIFICATION_THRESHOLD` is a tuning knob, not a guarantee.
- **Two concurrent mic pipelines while idle-listening** — continuous `SpeechRecognition` for the wake phrase, plus a separate `AudioContext`-based rolling PCM buffer (`packages/voice/src/pcm-capture.ts`) for the verification snapshot. (The question itself, once verified, is recorded separately via `MediaRecorder`/webm — that part only runs after a verified wake, not during idle-listening.) This dual-pipeline idle state is by design (see "how it works" above) but is worth knowing if you're debugging mic-permission behavior across browsers.

## Architecture notes worth knowing before judges ask

- **Everything above is mock data by design** — there's no real backend yet; that's the actual hackathon problem statement, integrated afterward. `docs/api-contracts.md` documents the exact endpoint contract every mock service already models itself on, and `requests-service.ts` / `trace-service.ts` have real, swappable implementations already built as worked examples (REST and SSE respectively).
- **RBAC is frontend visibility only.** `docs/rbac.md` is explicit that a real backend must independently re-check every permission server-side — nothing here is a security boundary.
- **Real-time UI is already SSE-shaped.** Agent Trace streams through the same `EventStreamSource` abstraction a real `EventSource` would use — `createMockEventSource()` today, `createSSESource()` (already implemented) once a backend exists.
- **Autowake deliberately avoids third-party accounts.** The first design used Picovoice (Porcupine + Eagle) for wake-word + speaker verification, but their console rejects non-company email signups; Azure's Speaker Recognition API turned out to be retired/limited-access. Rather than risk a second account wall, the final design uses only the browser's built-in `SpeechRecognition` and a self-hosted open-source model (Resemblyzer) — zero external accounts anywhere in the feature. See [AI Voice Assistant — Vizorion & Autowake](#ai-voice-assistant--vizorion--autowake) above.
