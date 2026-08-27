# Enterprise AI Platform — working rules

pnpm monorepo. Three Vite apps (`apps/host` 5173, `apps/main-app` 5174,
`apps/ai-control-tower` 5175) composed at runtime via Module Federation, over
seven shared packages. Read `README.md` for what the product is; this file is
what you must not break while changing it.

```bash
pnpm dev          # all three apps — open http://localhost:5173
pnpm typecheck    # tsc -b across every package and app
pnpm lint
pnpm test         # vitest: packages/ui, packages/api-client, packages/auth
pnpm build        # also catches Module Federation shared-singleton breakage
```

## Design system rules

These are settled decisions with written rationale in
`packages/theme/src/tokens.css`. They are not open questions. If a design tool,
skill, or plugin suggests otherwise, **this file wins** — see
`.claude/skills/platform-design-system/SKILL.md` for the full conflict table.

**Color — semantic tokens only.** Never a raw Tailwind color utility
(`bg-red-500`, `text-slate-400`, `border-gray-200`, `#hex`, `rgb()`). Use the
semantic utilities generated in the `@theme inline` block: `bg-surface`,
`text-muted-foreground`, `border-border`, `bg-success`, `text-danger`,
`bg-ai-accent`, `bg-chart-info`, etc. This is what makes one theme switch
repaint the whole app and what makes high-contrast mode work without touching
component code. Need a color that doesn't exist? Add a **semantic token**, and
add it to every theme block: `:root`, `.dark`, `[data-contrast='high']`, and
`[data-contrast='high'].dark`. Never add an alias set to a literal color.

**`--ai-accent` is reserved.** AI-native surfaces only — the Vizorion launcher
and its panel header, AI Insight cards, AI activity indicators. Ordinary
interactive elements use `--primary`. This is why the product doesn't read as
"purple gradient everywhere".

**Chart colors are a separate scale.** `--chart-info/success/warning/danger`
are lightness-tuned to the dataviz chart-mark band and validated for CVD; the
`--info/--success/--warning/--danger` tokens are tuned for badge and text
legibility. Don't substitute one for the other. Chart palette changes must be
re-run through `scripts/validate_palette.js` for both modes.

**Tinted paint goes through `packages/ui/src/lib/tone.ts`.** `toneMarkClass`,
`toneChipClass`, `toneDotClass`, `toneTextClass` are the only maps allowed to
turn a semantic tone into paint. Do not hand-roll another
`Record<Tone, string>` in a component — that's the exact bug this file was
created to kill.

**Motion — four durations, three curves, nothing else.**

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 90ms | state flips |
| `--duration-fast` | 140ms | hovers, small transitions |
| `--duration-base` | 220ms | panels, dialogs, drawers |
| `--duration-slow` | 400ms | page/entrance transitions |

Referenced as arbitrary values: `duration-(--duration-fast)`. Curves are
`ease-out` (arrival), `ease-in-out` (continuous), `ease-snap` (state flips) —
the first two re-point Tailwind's own utilities, so just write `ease-out`.

- **No bounce, elastic, or spring curves.** They read as decorative; this
  product is meant to read as fast.
- **No `duration-200` / `duration-150` / raw `duration-[Nms]`.** Those are what
  the vocabulary replaced.
- Motion communicates state and causality, never decoration. A card that lifts
  on hover must be clickable (`<Card interactive>`); one that isn't, doesn't.

**Reduced motion is already handled globally.** `html[data-motion='reduced'] *`
in `tokens.css` zeroes every animation and transition app-wide. Do not
hand-roll a `prefers-reduced-motion` media query in a component — use CSS
keyframes and Tailwind transitions and you get it for free.

**Typography is fixed.** `--font-sans` (Inter, with optical sizing) and
`--font-mono` (JetBrains Mono). Do not introduce typefaces, font-pairing
systems, or a competing type scale. Text scaling works through the root
`font-size` (`html[data-text-size]`), so use rem-based Tailwind utilities and
it scales for free.

**Fixed vocabularies for z-index and elevation.** `--z-sticky` through
`--z-toast`, referenced as `z-[var(--z-dialog)]`. Shadows are
`--shadow-xs…--shadow-xl`, already re-tuned per mode. Don't invent either.

## Component rules

**Reuse before creating.** `packages/ui/src/components/` has 63 components.
Check there first. `/design-system` (navigate directly — it's not in the nav)
renders every primitive live. Class merging goes through `cn()`
(`packages/ui/src/lib/cn.ts`).

**Loading is a designed state, not a spinner.** Use `AppLoadingView` +
`StagedProgress` with the operation's real stages, over a content-shaped
skeleton. `useStagedProgress` must not claim completion before `isActive` goes
false. Loaders wait ~180ms before appearing so fast operations flash nothing.
Reference: `apps/host/src/remotes/remote-loading-fallback.tsx`.

**Every action confirms itself.** `ToastProvider` / `useToast`, mounted in
`apps/host/src/main.tsx`. Prefer `useToast().update()` to promote a pending
toast in place over stacking a second one. This app does **not** use Sonner.

**Accessibility is not optional.** The Accessibility Center (`packages/theme`)
drives four independent axes — contrast, text size, motion, focus style. Any
change must survive all of them. Focus styling: components carry
`focus-visible:ring-*`; `tokens.css` has the app-wide `:focus-visible` safety
net. Don't remove either.

**RBAC is frontend visibility only.** `docs/rbac.md` — never treat a permission
check here as a security boundary; a real backend must re-check server-side.

## Data and architecture

- **Everything except Vizorion is mock data by design.** That's the hackathon
  problem statement, not an oversight. `docs/api-contracts.md` is the endpoint
  contract every mock service already models itself on.
- **The shared store is a demo beat.** Main App and Control Tower read the same
  `@platform/api-client` arrays — "Total Requests" matching across apps is
  load-bearing, not a coincidence. Don't fork the data.
- **Real-time is SSE-shaped already.** `EventStreamSource`
  (`packages/api-client/src/lib/event-stream.ts`) —`createMockEventSource()`
  today, `createSSESource()` when a backend exists. Agent Trace streams through
  it for real, so motion changes there must survive live streaming, not just a
  static render.
- **Vizorion is a real backend** in the sibling `Vizorion/` repo, not mocked.
  Needs Postgres + the FastAPI server running, and
  `VITE_VIZORION_USE_MOCK=false`. On Windows use
  `.venv\Scripts\python scripts\run_server.py` — plain `uvicorn app.main:app`
  fails on win32 (ProactorEventLoop vs psycopg async).

## Verifying a UI change

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
2. `/design-system` — every primitive, after any `packages/ui` change.
3. **Theme matrix**: Settings → Accessibility Center. light / dark /
   high-contrast × reduced motion × large text. Raw-color regressions surface
   here immediately.
4. Cross-app: Main App Dashboard "Total Requests" == Control Tower Overview KPI.
5. Live streaming: Agents → agent detail → an execution's trace.
6. Demo Panel (Settings → Demo Mode) — guardrail block, incident, pending
   approval each still land live on the right page.
7. Keyboard: `Ctrl+K` palette, `?` shortcuts, `g`+letter nav.

Demo logins: `analyst@demo.com`/`analyst123`, `manager@demo.com`/`manager123`,
`admin@demo.com`/`admin123` (admin sees everything).
