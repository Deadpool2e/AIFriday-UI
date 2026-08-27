---
name: platform-design-system
description: The authoritative design-system contract for this Enterprise AI Platform repo — semantic color tokens, the four-duration/three-curve motion vocabulary, the tone→paint maps, the 63-component inventory, and the loading/toast/a11y patterns. Load this whenever building, restyling, reviewing, or animating any UI in packages/ui, apps/host, apps/main-app, or apps/ai-control-tower — and ALWAYS load it alongside any third-party design, UI, UX, animation, color, or typography skill, because it overrides their generic advice with this project's settled decisions.
---

# Platform design system — the contract

This repo has a real design system with written rationale in
`packages/theme/src/tokens.css`. Third-party design skills do not know that.
This skill is the override.

**Rule of precedence:** when a third-party skill's advice conflicts with
anything here, this wins. Don't relitigate — the rationale is already in the
comments of `tokens.css`, and it was decided deliberately.

---

## 1. Color

Semantic tokens only. Every color a component uses resolves to a token; a raw
Tailwind color utility is a bug.

**Banned in component code:** `bg-red-500`, `text-slate-400`, `border-gray-200`,
`bg-zinc-*`, `#hex`, `rgb()`, `hsl()` — any literal color anywhere.

**Surfaces (a real elevation ladder, not one flat white):**

| Token | Role |
|---|---|
| `background` | the page |
| `surface` | cards |
| `surface-raised` | subtly lifted blocks |
| `surface-elevated` | dropdowns, dialogs, floating panels |
| `surface-muted` | inset/recessed blocks |

**Brand & neutral:** `primary`, `secondary`, `muted`, `accent`, `border`,
`border-strong`, `input`, `focus`.

**Status (tuned for badge/text legibility):** `success`, `warning`, `danger`,
`info` — each with a `-foreground` pair.

**Chart series (tuned for chart-mark lightness band + CVD-validated):**
`chart-info`, `chart-success`, `chart-warning`, `chart-danger`.

> These two scales are **not interchangeable.** `--danger` drawn as a 400px
> trend line reads as an alarm, which is why `--chart-danger` exists. Palette
> changes must be re-validated via `scripts/validate_palette.js` in both modes.

**`--ai-accent` is reserved** for AI-native surfaces only: the Vizorion
launcher, its panel header, AI Insight cards, AI activity indicators. Ordinary
interactive elements use `--primary`. This is the rule that keeps the product
from reading as "purple gradient everywhere."

**Gradients** are `--gradient-primary-radial` / `--gradient-ai-radial` only —
soft radial washes for hero backgrounds and AI-native floating surfaces
(command palette, launcher panel). Never a hard-edged or saturated gradient.

**Adding a color:** add a semantic token to **all four** blocks — `:root`,
`.dark`, `[data-contrast='high']`, `[data-contrast='high'].dark` — then expose
it in `@theme inline`. Never add an alias pointing at a literal; the existing
aliases (`--card`, `--destructive`, `--ring`) only ever reference other tokens.

---

## 2. Tinted paint → `lib/tone.ts`

`packages/ui/src/lib/tone.ts` is the single place a semantic tone becomes paint.
Four maps, split by *what the paint is for*:

- `toneMarkClass` — chart marks (meter fills, stacked segments)
- `toneChipClass` — small icon squares categorising a panel/tile
- `toneDotClass` — legend/status bullets paired with a label
- `toneTextClass` — a figure or label carrying the tone itself

`Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'`

**Never hand-roll another `Record<Tone, string>` in a component.** Before this
file existed, ranked rows, KPI chips and status dots each picked their own
alpha and the same "warning" came out three different colors on one screen.

---

## 3. Motion

**Four durations. Three curves. Nothing else.**

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 90ms | state flips |
| `--duration-fast` | 140ms | hovers, small transitions |
| `--duration-base` | 220ms | panels, dialogs, drawers |
| `--duration-slow` | 400ms | page/entrance transitions |

Written as arbitrary values: `duration-(--duration-fast)`.

| Curve | Value | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | arrival — panels *land*, not drift |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | continuous motion |
| `ease-snap` | `cubic-bezier(0.3, 0, 0.1, 1)` | state flips: pressed, checked, selected |

`ease-out` and `ease-in-out` re-point Tailwind's own theme variables, so plain
`ease-out` in a class already means this curve. One vocabulary, not ours
competing with theirs.

**Hard rules:**
- **No bounce, elastic, spring, or overshoot curves.** Anywhere. They read as
  decorative; this product is meant to read as fast.
- **No `duration-200`, `duration-150`, `duration-[350ms]`.** That per-component
  drift is precisely what the vocabulary replaced.
- Motion communicates **state and causality**, never decoration. A card that
  lifts on hover must be clickable (`<Card interactive>`); one that isn't,
  doesn't.
- No `animate-pulse` for loading — it reads as "disabled". Use the skeleton
  sweep (`skeleton-sweep`), which reads as "being filled in".
- No `animate-ping` for ambient life — its hard 1s pulse reads as an alarm. Use
  `animate-ambient-pulse` (2.8s breathing halo).

**Named keyframes that already exist:** `card-in` (staggered card entrance, via
`.animate-card-in` + per-index `animationDelay`), `skeleton-sweep`,
`progress-indeterminate`, `ambient-pulse`. Toast entrance/exit is a CSS
transition on `ToastItem`, not a keyframe — it has to be interruptible when
`useToast().update()` promotes a toast mid-entrance.

**Reduced motion needs no per-component code.**
`html[data-motion='reduced'] *` in `tokens.css` zeroes every animation and
transition duration app-wide with `!important`. Do **not** add a
`prefers-reduced-motion` media query to a component — use CSS keyframes and
Tailwind transitions and it's handled.

---

## 4. Typography

`--font-sans` = Inter (with `font-optical-sizing: auto` and
`font-feature-settings: 'cv11', 'ss01'`). `--font-mono` = JetBrains Mono.

**Do not** introduce typefaces, font-pairing systems, or a competing type
scale. Text scaling runs through the root font-size
(`html[data-text-size='large'|'xl']` → 18px/20px), so **rem-based Tailwind
utilities scale for free** — never hard-code `px` font sizes.

---

## 5. Other fixed vocabularies

**z-index** — decided once, referenced as `z-[var(--z-dialog)]`:
`--z-sticky` 20, `--z-dropdown` 30, `--z-overlay` 40, `--z-floating-action` 45,
`--z-dialog` 50, `--z-command-palette` 60, `--z-toast` 70.

**Elevation** — `--shadow-xs` … `--shadow-xl`, already re-tuned per mode (dark
shadows go denser because black barely reads on a dark page). Don't invent new
shadow values; pick a rung.

**Radius** — `--radius: 0.625rem`, exposed as `radius-sm/md/lg/xl`.

---

## 6. Component inventory (63) — reuse before creating

`/design-system` renders every primitive live (navigate directly; not in nav).
Merge classes with `cn()` from `packages/ui/src/lib/cn.ts`.

**Primitives:** `button` `input` `textarea` `label` `select` `checkbox-less
segmented-control` `badge` `card` `avatar` `tooltip` `tabs` `dialog` `drawer`
`dropdown-menu` `disclosure` `table` `pagination` `skeleton` `kbd` `toast`

**Layout & nav:** `page-header` `breadcrumb` `skip-link` `empty-state`
`error-state` `error-boundary` `permission-denied`

**Data display:** `data-table` `kpi-widget` `metric-strip` `animated-number`
`sparkline` `distribution-bar` `ranked-list` `activity-feed` `confidence-score`
`risk-indicator` `live-indicator` `illustrations`

**AI / Control Tower:** `agent-trace` `agent-graph` `agent-communication`
`execution-timeline` `ai-activity` `ai-insight` `ai-recommendation-card`
`tool-monitor` `system-health` `source-citation` `markdown`

**Approvals & chat:** `approval-card` `human-approval-panel` `chat-panel`
`vizorion-approval-card` `vizorion-tool-call-chip`

**Loading:** `app-loading-view` `staged-progress`

**Tested** (breakage will be caught): `button` `badge` `data-table`
`agent-trace` `confidence-score`, plus `use-document-title`.

---

## 7. Patterns that are already solved

**Loading is a designed state.** `AppLoadingView` + `StagedProgress` showing
the operation's *real* named stages, over a skeleton shaped like the incoming
content. `useStagedProgress` only resolves when `isActive` goes false — never
claim completion the work hasn't reached. Loaders wait ~180ms before appearing
so a fast operation flashes nothing. Reference implementation:
`apps/host/src/remotes/remote-loading-fallback.tsx`. **Never a bare spinner.**

**Feedback.** `ToastProvider` / `useToast`, mounted in `apps/host/src/main.tsx`.
`useToast().update()` promotes a pending toast in place rather than stacking.
Approvals update optimistically and roll back if the service refuses.
**This app does not use Sonner** — ignore Sonner-specific skill advice.

**Accessibility — four independent axes**, all driven from `packages/theme`:
contrast (`data-contrast`), text size (`data-text-size`), motion
(`data-motion`), focus style (`data-focus-style`, plus `data-keyboard-nav`).
Every change must survive all of them. Components carry `focus-visible:ring-*`;
`tokens.css` holds the app-wide `:focus-visible` safety net. Keep both.

---

## 8. Conflict table — third-party skill says X, do Y

| A skill suggests | Do instead |
|---|---|
| A new color palette / "here are 192 palettes" | Use the existing semantic tokens. A new need = one new semantic token in all four theme blocks. |
| `bg-slate-800`, `text-gray-500`, any literal color | The semantic equivalent: `bg-surface`, `text-muted-foreground`. |
| A font pairing, or a new typeface | `--font-sans` / `--font-mono` are fixed. Decline. |
| A modular type scale in `px` | rem-based Tailwind utilities; scaling is handled at the root. |
| Spring physics, `framer-motion` springs, bounce/elastic easing | One of the three curves. No overshoot anywhere. |
| `duration-300`, `transition-all duration-200` | `duration-(--duration-base)` and an explicit property. |
| Add a `prefers-reduced-motion` guard to this component | Already global in `tokens.css`. Don't duplicate. |
| A spinner for the loading state | `AppLoadingView` + `StagedProgress` + content-shaped skeleton. |
| `animate-pulse` skeletons | The `skeleton-sweep` gradient — pulse reads as "disabled". |
| Sonner / react-hot-toast for notifications | `useToast()` from `packages/ui`. |
| A new tinted-tone `Record<>` inside a component | The four maps in `lib/tone.ts`. |
| Build a new Button/Card/Table/Modal | One of the 63 components already exists. Check `/design-system`. |
| Generate a whole design system for this product | It exists. Use it. Offer critique of the existing one instead. |
| Status colors for chart series | The `chart-*` scale, not `--danger`/`--success`. |
| Purple/AI-accent styling on ordinary buttons | `--primary`. `--ai-accent` is reserved for AI-native surfaces. |
| WebGL / Three.js / GSAP / particles / shaders | Wrong genre. This is a data-dense enterprise operations dashboard. |
| A hard-edged or saturated gradient | The two radial washes, or nothing. |
| Arbitrary `z-50` / `z-[999]` | The `--z-*` scale. |

**Rejected suggestions get logged.** When a third-party skill raises something
that conflicts with the above, add a row here rather than re-deciding it on the
next run.

### Known conflicts in the skills installed alongside this one

These are not hypothetical — each is a stated position of a skill in
`.claude/skills/` or an installed plugin. Resolve them this way every time.

| Skill | Its position | Resolution here |
|---|---|---|
| `apple-design` | Spring physics, rubber-banding, interruptible gesture motion, Motion/Framer Motion springs | **Springs are out.** No bounce or overshoot, per `tokens.css`. Take its *foundations* — feedback, spatial consistency, restraint, optical sizing/tracking — and its reduced-motion discipline. Ignore the spring implementation advice. |
| `animation-systems` | Ships its own easing/duration defaults ("Stripe × Linear × Apple × Vercel") | Our four durations and three curves win. Use it for choreography and stagger *patterns*, not for its numbers. |
| `beautiful-shadows` | "Tailwind arbitrary shadow utilities… without default Tailwind shadow scales" | We already have a tuned, mode-aware ladder (`--shadow-xs…xl`). Use the skill to *critique* whether a surface sits on the right rung; never to introduce an arbitrary shadow value. |
| `operational-enterprise-ai` | Dark cinematic heroes, marketing page structure, demo/waitlist CTAs | It's a **landing-page** skill. Take only its domain framing — showing system boundaries, approvals, auditability, exceptions, rollback — which maps well onto Control Tower. Ignore everything about hero sections and conversion. |
| `ui-ux-pro-max` (plugin) | Auto-generates a full design system: palettes, font pairings, style selection | We have one. Use it read-only for industry rules and chart/dataviz guidance. Reject its palette and typography output wholesale. |
| `interfaces:better-colors` / `better-typography` (plugin) | Build a color system / choose and pair typefaces | Both are settled. Redirect to critique of the existing tokens instead. |
| `review-animations` (emilkowalski) | STANDARDS.md assigns continuous/marquee motion to `linear` easing | No `linear` slot exists here. Continuous motion maps to `--ease-in-out`. `skeleton-sweep` and `progress-indeterminate` already use `ease-in-out` correctly — that's the platform's answer, not a gap to fix toward `linear`. |
| `review-animations` (emilkowalski) | STANDARDS.md's Springs section treats "alive" ambient elements (AI thinking dots, FAB breathing) as textbook spring candidates | Springs are out, no exception for "alive" elements. `.animate-ambient-pulse` (the 2.8s cubic-bezier breathing halo) is the same-vocabulary substitute — reuse it rather than reaching for a spring. |
| `review-animations` (emilkowalski) | STANDARDS.md's interruptibility guidance leans toward a spring for gesture-driven/rapid-fire motion (its toast example) | Use a plain interruptible CSS `transition` keyed to component state instead — interruptibility and springs are separable here; we get the first without the second. |

`review-animations` is marked `disable-model-invocation: true` — it only runs
when invoked explicitly. That's correct; it's a strict grader, not an ambient
advisor.

---

## 9. Before you call a UI change done

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Then, on `pnpm dev` at http://localhost:5173:

1. `/design-system` — after any `packages/ui` change.
2. **Theme matrix** — Settings → Accessibility Center: light / dark /
   high-contrast × reduced motion × large text. Raw-color and hard-coded-px
   regressions surface here immediately.
3. Cross-app: Main App Dashboard "Total Requests" == Control Tower Overview KPI
   (shared `@platform/api-client` store — load-bearing demo beat).
4. Live streaming: Agents → agent detail → an execution's trace. Motion changes
   must survive real `EventStreamSource` streaming, not just a static render.
5. Demo Panel (Settings → Demo Mode) — guardrail block / incident / pending
   approval still land live on the right page.
6. Keyboard: `Ctrl+K` palette, `?` shortcuts, `g`+letter nav.

If `pnpm build` fails after a `packages/ui` change, suspect a Module Federation
shared-singleton problem before suspecting the styling.
