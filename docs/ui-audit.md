# UI audit — baseline

Established before the third-party design skills were installed, so that
anything they later flag can be separated from what was already true.

**Status: all four findings below fixed as of 2026-08-27.** See
[Fixes applied](#fixes-applied) at the end. `pnpm typecheck && pnpm lint &&
pnpm test && pnpm build` all pass post-fix (73/73 tests, 0 lint errors).

**Method:** mechanical greps for the rules in
[`.claude/skills/platform-design-system/SKILL.md`](../.claude/skills/platform-design-system/SKILL.md),
across `apps/` and `packages/`, excluding `node_modules`.

**Date:** 2026-08-27 · **Tree state:** working tree on top of `7ae45c7`
("UI Enhancements"), which had uncommitted changes at audit time — including
`packages/ui/src/lib/tone.ts` and `distribution-bar.tsx` as new untracked
files, plus edits to `card.tsx`, `kpi-widget.tsx`, `ranked-list.tsx`,
`system-health.tsx`, `overview-page.tsx`, and `dashboard-page.tsx`. Re-run the
greps after committing if you want a baseline pinned to a commit.

---

## Summary

The design system is in genuinely good shape. Of seven rule categories checked,
five are clean and two show drift — both motion, both the same root cause: the
Tailwind stock `animate-ping` / `animate-pulse` utilities are still in use in
places where `tokens.css` explicitly documents that they send the wrong signal.

| Rule | Result |
|---|---|
| Raw Tailwind color utilities | ✅ **0** — the only match is the rule's own comment in `tokens.css:4` |
| Hex / `rgb()` / `hsl()` literals in components | ✅ **0** |
| Hand-rolled `Record<Tone, string>` maps | ✅ **0** — all tinted paint goes through `lib/tone.ts` |
| Per-component `prefers-reduced-motion` guards | ✅ **0** — the one match is `theme-provider.tsx:37`, correctly reading the OS default |
| Raw `duration-<number>` utilities | ⚠️ **5** |
| `animate-ping` (reads as alarm) | ⚠️ **5** |
| `animate-pulse` (reads as disabled) | ⚠️ **4** |

Zero color violations across 63 components and three apps is the headline —
the token discipline held.

---

## Finding 1 — `animate-pulse` on a *running* state (semantic inversion)

**Severity: highest.** Not a style nit; the animation says the opposite of the
state it marks.

[`packages/ui/src/components/agent-graph.tsx:35`](../packages/ui/src/components/agent-graph.tsx#L35)

```
running: 'border-info bg-info/10 text-info animate-pulse',
```

`tokens.css:435` states a pulsing opacity block "reads as *this element is
disabled*". It is here applied to the one status that means *actively
working* — on the Agent Graph, a headline Control Tower surface. The same
reasoning already drove `animate-pulse` → `skeleton-sweep` for skeletons; this
usage was missed.

**Fix:** `animate-ambient-pulse` (the 2.8s breathing halo) or a directional
progress treatment. Not a static style — running genuinely should move.

Also in this file: `statusClassName` is a `Record<AgentGraphNodeStatus, string>`
mapping status → paint. It isn't keyed on `Tone`, so it doesn't literally break
the `lib/tone.ts` rule, but it's the same shape of thing that rule exists to
prevent. Worth checking its colors agree with `toneChipClass`.

Three further `animate-pulse` uses, all lower stakes — verify each isn't also
marking an active state:
- [`packages/auth/src/login-form.tsx:149`](../packages/auth/src/login-form.tsx#L149)
- [`apps/host/src/shell/autowake/autowake-widget.tsx:170`](../apps/host/src/shell/autowake/autowake-widget.tsx#L170)
- [`apps/host/src/shell/vizorion-launcher.tsx:199`](../apps/host/src/shell/vizorion-launcher.tsx#L199)

The Autowake and launcher ones likely indicate *listening* — again an active
state wearing a "disabled" animation.

---

## Finding 2 — `animate-ping` on live-status dots (5 sites, one pattern)

`tokens.css:465` : `animate-ping`'s "hard 1s pulse reads as an alarm", and
names `animate-ambient-pulse` as the intended alternative. All five sites are
the same ping-halo-behind-a-dot idiom marking *live/streaming*, which is
ambient status, not an alarm:

- [`packages/ui/src/components/live-indicator.tsx:71`](../packages/ui/src/components/live-indicator.tsx#L71)
- [`packages/ui/src/components/metric-strip.tsx:145`](../packages/ui/src/components/metric-strip.tsx#L145)
- [`apps/host/src/shell/sidebar.tsx:140`](../apps/host/src/shell/sidebar.tsx#L140)
- [`apps/host/src/shell/sidebar.tsx:159`](../apps/host/src/shell/sidebar.tsx#L159)
- [`apps/ai-control-tower/src/control-tower-hero.tsx:59`](../apps/ai-control-tower/src/control-tower-hero.tsx#L59)

Because it's one repeated idiom, the clean fix is to **fix `LiveIndicator`
once** and have the other four consume it, rather than patching five sites.
`metric-strip.tsx:145` in particular inlines the halo by hand with `bg-info`
hard-coded rather than reusing `LiveIndicator`.

Worth a deliberate decision rather than a blanket swap: an alarm-ish pulse may
be wanted for a genuine incident indicator. Check `control-tower-hero.tsx:59`
against that.

---

## Finding 3 — raw `duration-<number>` utilities (5 sites)

Outside the four-duration vocabulary. Nearest token in brackets:

| Location | Current | Use |
|---|---|---|
| [`apps/host/src/shell/autowake/autowake-widget.tsx:94`](../apps/host/src/shell/autowake/autowake-widget.tsx#L94) | `duration-150` | panel enter → `--duration-fast` (140ms) |
| [`apps/host/src/shell/vizorion-launcher.tsx:146`](../apps/host/src/shell/vizorion-launcher.tsx#L146) | `duration-150` | panel enter → `--duration-fast` (140ms) |
| [`apps/host/src/shell/sidebar.tsx:293`](../apps/host/src/shell/sidebar.tsx#L293) | `duration-200` | `transition-[width]` collapse → `--duration-base` (220ms) |
| [`packages/ui/src/components/dialog.tsx:59`](../packages/ui/src/components/dialog.tsx#L59) | `duration-200` | dialog enter/exit → `--duration-base` (220ms) |
| [`packages/ui/src/components/drawer.tsx:61`](../packages/ui/src/components/drawer.tsx#L61) | `duration-300` | drawer slide → `--duration-base` (220ms) |

`dialog.tsx` and `drawer.tsx` are shadcn-derived defaults that were never
re-pointed at the vocabulary — the highest-leverage two, since every dialog and
drawer in all three apps inherits them. They also currently disagree with each
other (200 vs 300) for what is essentially the same gesture.

Both files additionally use `z-50` directly instead of
`z-[var(--z-dialog)]` — same origin, same fix.

---

## What was clean

- **Color.** Zero raw Tailwind color utilities, zero hex/rgb/hsl literals in
  `.tsx`. Every component resolves through semantic tokens.
- **Tone maps.** No component hand-rolls a `Record<Tone, string>`;
  `lib/tone.ts` is the single source. (See the `agent-graph.tsx` caveat above.)
- **Reduced motion.** No component duplicates the global guard.
- **Focus.** Component-level `focus-visible:ring-*` plus the `tokens.css`
  safety net both intact.

---

## Suggested fix order

1. **`dialog.tsx` + `drawer.tsx`** — two files, inherited by all three apps.
   Duration tokens + `--z-dialog`. Covered by `dialog`/`drawer` render paths in
   the existing test suite.
2. **`agent-graph.tsx` running state** — the semantic inversion, on a
   judge-facing screen.
3. **`LiveIndicator`** — fix once, then collapse the four other ping sites onto
   it (notably `metric-strip.tsx:145`).
4. **Autowake / launcher** — `duration-150` → token, and re-examine whether
   "listening" should be `animate-pulse`.

After each: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, then the
theme matrix in Settings → Accessibility Center.

---

## Still to run

This baseline is mechanical only — it catches rule violations, not craft gaps.
The judgement-based passes are still outstanding:

- `/interfaces:interface-review` over `packages/ui/src/components/`
- `review-animations` over `packages/ui` + `packages/theme`
- `/interfaces:better-accessibility` against the four a11y axes
- `visual-critique` on Control Tower pages and the Vizorion panel

Findings from those go below, tagged **(a)** rule violation, **(b)** craft gap,
or **(c)** rejected — conflicts with `tokens.css`, logged in the skill's
conflict table so it isn't re-raised.

---

## Fixes applied

All four mechanical findings above are fixed. Verification gate
(`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) passes clean: 0
typecheck errors, 0 lint errors (pre-existing `react-refresh` warnings in
untouched files only), 73/73 tests, all three apps build with no Module
Federation shared-singleton breakage.

**Finding 1 — semantic inversion.** `agent-graph.tsx`'s `running` status now
uses `animate-ambient-pulse` instead of `animate-pulse`. The other three
`animate-pulse` sites were checked individually rather than blanket-swapped,
per the audit's own caution — all three turned out to be the same inversion on
a genuinely active state, so all three got the same fix:
`autowake-widget.tsx` (`isPulsing` = `idle-listening` or `recording`),
`vizorion-launcher.tsx` (mic icon during `recording`), and
`login-form.tsx` (arrow icon while `pending`).

**Finding 2 — `animate-ping` halo, consolidated.** Extracted a `LiveDot`
primitive into `live-indicator.tsx` (exported from `packages/ui`) using
`animate-ambient-pulse`, with a `pulse` prop so a genuinely idle status can
render static. `LiveIndicator` itself now composes it. The four other sites —
`metric-strip.tsx`, both `sidebar.tsx` dots, and `control-tower-hero.tsx` —
now call `<LiveDot dotClassName="..." />` instead of each hand-rolling the
absolute-halo-plus-relative-dot markup. `control-tower-hero.tsx`'s
warning/success system-status dot was deliberately kept as a genuine
attention-worthy state rather than treated as "incident = should look like an
alarm" — `animate-ping` was still wrong there per the same tokens.css
reasoning, so it got the same fix as the others, not an exception.

**Finding 3 — raw durations + `z-50`, all six sites.** (The original table
listed five; `sidebar.tsx:293`'s `duration-200` on the collapse transition was
caught in the same pass.)

| Location | Was | Now |
|---|---|---|
| `dialog.tsx` overlay | no duration (implicit) | `duration-(--duration-fast)` |
| `dialog.tsx` content | `duration-200`, `z-50` | `duration-(--duration-base) ease-out`, `z-(--z-dialog)` |
| `drawer.tsx` overlay | no duration (implicit) | `duration-(--duration-fast)` |
| `drawer.tsx` content | `duration-300`, `z-50` | `duration-(--duration-base) ease-out`, `z-(--z-dialog)` |
| `sidebar.tsx` width collapse | `duration-200` | `duration-(--duration-base) ease-out` |
| `autowake-widget.tsx` panel | `duration-150` | `duration-(--duration-fast)` |
| `vizorion-launcher.tsx` panel | `duration-150` | `duration-(--duration-fast)` |

Dialog and drawer overlays previously had no explicit duration at all (they
inherited whatever the `animate-in`/`animate-out` utility plugin defaults to)
— now explicit and on-vocabulary, and dialog/drawer content no longer disagree
with each other (200 vs 300) for the same open/close gesture.

**Not yet done — worth a follow-up pass**, found while fixing the above but
outside this audit's original scope:
- `agent-graph.tsx`'s `statusClassName` is a hand-rolled
  `Record<AgentGraphNodeStatus, string>`. It isn't keyed on `Tone` so it
  doesn't technically violate the `lib/tone.ts` rule, but it's the same shape
  of thing that rule exists to prevent — worth checking its colors agree with
  `toneChipClass` and considering a refactor onto the shared maps.
- `metric-strip.tsx` still hard-codes `bg-info` for its live dot rather than
  taking a `Tone`; harmless today since every call site is the same tone, but
  worth generalizing if a second tone shows up.

---

## Judgment-based audit — 2026-08-27

The four passes below were the "Still to run" items. Two of the four named
skills — `/interfaces:interface-review` and `/interfaces:better-accessibility`
— are plugin skills (`interfaces@interfaces`) installed via `/plugin install`
earlier the same day; `visual-critique` is likewise a plugin
(`visual-critique@designer-skills`). None of the three had loaded into this
session's invocable skill list yet (a fresh session should pick them up), so
each pass was run by reading the plugin's actual `SKILL.md` rubric from
`~/.claude/plugins/cache/...` and applying it directly — same rubric, same
severity ladder, same output format the skill itself specifies, just invoked
by hand instead of by name. `review-animations` is project-scoped and was
invoked normally.

**Method notes per pass**, each stated up front because the source skill
requires it:

- **Component-library pass.** `interface-review`'s own text is explicit that
  it reviews *a change* (a diff, branch, or PR) — for "no change, a
  whole-repository interface audit... hand it to `better-interface`, which is
  not user-invoked". A directory-wide sweep of `packages/ui/src/components/`
  is a repository-scope audit, so this pass applied `better-ui` (UI polish)
  and `better-layout` (structure) — the two domains most relevant to a
  component library — rather than the full `better-interface` orchestration.
  `better-accessibility` is the dedicated pass below instead of being
  re-run here; `better-colors`, `better-typography`, `better-writing` were
  not run (out of the four passes requested, no color/typography/copy pass
  was asked for — noting the boundary per `better-interface`'s own rule:
  "state the boundary and what it excluded").
- **`review-animations`.** Ten Non-Negotiable Standards applied to every
  motion-bearing file in `packages/ui` + `packages/theme`, filtered through
  `platform-design-system`'s four-duration/three-curve contract — see
  [Conflicts logged](#new-conflicts-logged-this-pass) below for the three
  places its own philosophy (springs, `linear` easing) would have
  relitigated a settled decision.
- **`better-accessibility`.** No browser available this session — every
  keyboard/screen-reader claim below is a source-level read of JSX
  (role/aria-*/label/tabIndex/native-element choice), not a live walk.
  Runtime-only checks (actual rendered contrast, 200%/320px reflow, live
  screen-reader announcement behavior) are marked **Not verified** per the
  rubric's own instruction rather than skipped silently.
- **`visual-critique`.** Same constraint — no screenshot tool available, so
  this is a source-level critique reasoning from Tailwind classes and layout
  math (explicit `right-*`/`bottom-*`/`w-*`/`h-*` converted to px and checked
  for overlap), not a rendered-screen critique. Judgments needing real pixels
  are marked **Not verified — requires rendered inspection**. The seventh
  critique dimension, brand consistency, requires `mood.md`/`voice.md`
  reference files this repo doesn't have — skipped per the rubric's own
  fallback rather than invented.

Findings are tagged **(a)** rule violation, **(b)** craft gap, or **(c)**
rejected (conflicts with `tokens.css`, logged in the skill's conflict table).
Overlapping findings from two passes on the same root cause are merged into
one row with both origins noted.

### Finding 5 — hand-rolled tone maps outside `lib/tone.ts` (a)

`lib/tone.ts`'s own docstring calls this "the exact bug this file was created
to kill." It's still happening in ~15 components that predate the file, plus
two Control Tower pages that never adopted it:

**In `packages/ui/src/components/`** (component-library pass): `activity-feed.tsx:22-27`,
`agent-trace.tsx:30-59`, `agent-graph.tsx:33-39`, `risk-indicator.tsx:16-33`,
`vizorion-approval-card.tsx:15-20`, `system-health.tsx:22-41`,
`execution-timeline.tsx:19-25`, `attention-required.tsx:28-32`,
`kpi-widget.tsx:39-43`, `metric-strip.tsx:40-44`, `human-approval-panel.tsx:53-60`,
`live-indicator.tsx:14-28`, `confidence-score.tsx:16-18`,
`staged-progress.tsx:69-73`, `toast.tsx:49-84`.

The same "success" chip renders `bg-success/15` in `tone.ts`,
`bg-success/12` in `system-health.tsx`, and `bg-success/10` in
`risk-indicator.tsx`/`vizorion-approval-card.tsx` — three colors for one
tone. `confidence-score.tsx` and `staged-progress.tsx` additionally paint a
progress-bar *mark* with the badge-tuned `--success/--warning/--danger`
scale instead of the chart-tuned `--chart-*` scale `RankedList`/
`DistributionBar` correctly use via `toneMarkClass`.

**In `apps/ai-control-tower/src/pages/`** (visual-critique pass):
`guardrails-page.tsx:42-47` (`SEVERITY_TONE`) and `explainability-page.tsx:31-48`
(`CONFIDENCE_BAND_TONE`, `DECISION_TONE`). `explainability-page.tsx`'s
`ProportionBar` (line 60-87) renders a **meter fill** — by `tone.ts`'s own
taxonomy that's a `Mark`, so it should draw from `toneMarkClass`
(chart-tuned), not the badge-tuned map it uses today. There's also an
internal inconsistency in the same file: `DECISION_COLOR_VAR` (line 49-54,
feeding a Recharts `<Pie>`) uses `var(--color-chart-success)`/
`var(--color-chart-warning)` correctly for `approve`/`review`, but
`var(--color-danger)` (not `--color-chart-danger`) for `escalate`/`reject` —
two slices of one pie chart drawing from two different scales.

**Fix:** replace every local map with `toneChipClass`/`toneMarkClass`/
`toneDotClass`/`toneTextClass` from `@platform/ui`; where label wording
differs, keep a label-only map and import the color map. Fix
`explainability-page.tsx:52-53`'s two literals to `--color-chart-danger`.

### Finding 6 — untokened `transition-*` utilities (a)

Two passes hit the same root cause from different angles: omitting a
duration class doesn't opt out of animation, it silently falls back to
Tailwind's un-vetted default (150ms, plain `ease`) — the exact per-component
drift the four-value vocabulary replaced, just invisible to a `duration-\d+`
grep because there's no number to match.

Sites (union of both passes): `dialog.tsx:68`, `drawer.tsx:69`, `badge.tsx:8`,
`table.tsx:58`, `tabs.tsx:101`, `agent-graph.tsx:208`, `attention-required.tsx:92,104`,
`breadcrumb.tsx:44`, `confidence-score.tsx:39`, `vizorion-launcher.tsx:226`,
`chat-surface.tsx:166,211,214`, plus `dropdown-menu.tsx:35,223`
(`DropdownMenuContent`/`SubContent` — the one popover family member with
`animate-in`/`fade-in-0`/`zoom-in-95` and *no* duration or ease class at all,
where every sibling — `Dialog`, `Drawer`, `Tooltip` — pins one).

**Fix:** `duration-(--duration-fast)` for hover/state-flip cases (most of
these), `duration-(--duration-instant) ease-snap` for the `agent-graph.tsx`
border-color flip, `duration-(--duration-fast) ease-out` for `dropdown-menu.tsx`
to match its Radix-portal siblings.

### Finding 7 — `toast.tsx`: three separate problems in one file

1. **(a) Not interruptible / wrong easing / off-vocabulary duration.**
   `toast.tsx:220-226` builds enter/exit as `@keyframes`
   (`animate-[toast-in_220ms_var(--ease-out)]` /
   `animate-[toast-out_180ms_ease-in_forwards]`), not a CSS transition —
   `useToast().update()` (pending → success) can retrigger the entrance
   mid-animation, and a keyframe restarts from zero instead of continuing
   from wherever the toast currently is. Exit additionally uses `ease-in`,
   banned outright by the three-curve vocabulary, and `EXIT_DURATION_MS = 180`
   (`toast.tsx:45`) isn't one of the four sanctioned durations. **Fix:**
   drive enter/exit off an interruptible `transition-[transform,opacity]`
   keyed to a mounted/`data-state` attribute; set `EXIT_DURATION_MS = 140`
   (`--duration-fast`) with `ease-snap`, keeping the `setTimeout` that
   unmounts the record in sync.
2. **(a) Escalation-trigger accessibility bug.** `toast()`'s duration logic
   (`toast.tsx:132-134`, mirrored at `142-154`) only special-cases
   `tone === 'pending'` as persistent — a `danger`-toned toast or one
   carrying an `action` still auto-dismisses after `DEFAULT_DURATION_MS`
   (4500ms) unless the caller manually overrides `durationMs`. Confirmed
   live at real call sites: `apps/main-app/src/pages/approval-detail-page.tsx:35,109-127`
   and `apps/host/src/pages/settings-page.tsx:61-66` both fire `tone:'danger'`
   / action-bearing toasts with no override. `better-accessibility`'s
   escalation list names this exact case HIGH on sight: "toasts carrying an
   action or an error stay until dismissed." **Fix:** default `durationMs`
   to `0` whenever `tone === 'danger'` or `options.action` is set, same as
   `pending` already is.
3. **(a) Bare `:focus`.** Already tagged under Finding 9 below
   (`DialogClose`/`DrawerClose` share the same pattern) — `toast.tsx`'s own
   dismiss button at line 264 is correct (`focus-visible:ring-2`), not a
   repeat here.

### Finding 8 — layout-property animation on live-updating meters (a)

`staged-progress.tsx:96`, `ranked-list.tsx:187` (both `transition-[width]`),
and `distribution-bar.tsx:114` (`transition-[flex-grow]`) all animate a
layout property — a named escalation trigger in `review-animations`, and
here not a one-off cost: all three redraw on every live data refresh from
the shared `@platform/api-client` store, not once. **Fix:**
`transform: scaleX(progress)` with `transform-origin: left`, same
`duration-(--duration-slow) ease-out` timing already in place.

Related, smaller: `metric-strip.tsx:221` and `topbar.tsx:88,95` use
`transition-all` where only background-color+opacity (or transform+opacity)
actually change — name the exact properties instead.

### Finding 9 — bare `:focus` instead of `:focus-visible` (a)

`dialog.tsx:68` and `drawer.tsx:69` (`DialogClose`/`DrawerClose`) use
`focus:ring-2 focus:ring-offset-2` — every other interactive primitive in
the system uses `focus-visible:ring-*`, so these two show a ring on mouse
clicks too. `tabs.tsx`'s `TabsTrigger` has no `focus-visible:ring-*` classes
at all (currently covered only by the global safety net in `tokens.css`, so
not a HIGH gap, just an inconsistency with the stated per-component
convention). **Fix:** switch both `Close` buttons to `focus-visible:`; add
the standard `focus-visible:ring-ring/50 focus-visible:ring-2
focus-visible:outline-none` treatment to `TabsTrigger`.

### Finding 10 — `agent-graph.tsx`'s running-node pulse hurts legibility (a)

`agent-graph.tsx:35` applies `animate-ambient-pulse` (the mechanical pass's
own fix for the earlier `animate-pulse` semantic inversion) to the entire
168×56px node box holding the running step's label, not just a status dot.
`ambient-pulse` swings `opacity 0.25→0.55` — applied to text, the one node a
viewer is watching during a live SSE-streamed execution loses more than half
its contrast every 1.4s. **Fix:** keep the node box static; add a small
pulsing dot (reusing `LiveDot`) beside the label instead of animating the
box itself. This refines, not reverts, the earlier fix.

### Finding 11 — Vizorion/Autowake floating panels don't scale from their trigger (a)

`vizorion-launcher.tsx:146` and `autowake-widget.tsx:94` use `zoom-in-95`
with no `transform-origin`, so both panels — anchored `fixed right-* bottom-*`
next to their own FAB — visibly zoom from their own center instead of
growing out of the button just pressed. Standard #5 in `review-animations`
names this exact popover/trigger-anchoring rule (modals are the only
exemption). **Fix:** set `transform-origin` to the bottom-right corner
nearest each FAB.

Same two files, separate issue: `vizorion-launcher.tsx:285` and
`autowake-widget.tsx:168` add `transition-transform hover:scale-105` on the
FAB, untokened and ungated behind `(hover: hover) and (pointer: fine)` — a
named escalation trigger, and it stacks a second, differently-timed
`transform` transition on top of `Button`'s own tokened
`active:scale-[0.99]`, which can fight it on press-while-hovering. **Fix:**
drop the local hover scale and rely on `Button`'s existing tokened
transition, gated correctly.

### Finding 12 — `animated-number.tsx` and `staged-progress.tsx` off-vocabulary durations (a)

`animated-number.tsx:58`'s `requestAnimationFrame` tween uses
`const duration = 500` — not one of the four sanctioned values, and this
drives the KPI/metric-strip headline number that re-tweens on every live
data refresh. **Fix:** `400` (== `--duration-slow`, nearest sanctioned
value). `staged-progress.tsx:135,155,168` uses
`duration-(--duration-base)` for a pending→running→done row state flip —
the vocabulary table assigns state flips to `--duration-instant` (90ms) and
reserves `--duration-base` for panel/dialog/drawer entrances. **Fix:**
`duration-(--duration-instant) ease-snap`.

### Finding 13 — `ai-activity.tsx` hand-rolls a second ambient-pulse cadence (a)

`ai-activity.tsx:33-36` sets `style={{ animation: 'ambient-pulse 1.4s
cubic-bezier(0.4,0,0.2,1) infinite' }}` inline — every other looping ambient
animation is the centralized `.animate-ambient-pulse` class (2.8s) in
`tokens.css`. Two different "ambient-pulse" cadences now exist with no
stated reason. **Fix:** reuse `.animate-ambient-pulse` as-is unless a faster
cadence is a deliberate decision, in which case it belongs as a second named
utility in `tokens.css`, not an inline style.

### Finding 14 — raw color literal in `markdown.tsx` (a)

`markdown.tsx:31-32`: `[&_code]:bg-black/10` / `[&_pre]:bg-black/10` — a raw
literal, banned outright. In dark mode this lays 10% black over an
already-near-black surface, so assistant-rendered code blocks in the chat
panel are barely distinguishable from the bubble around them. **Fix:**
`bg-foreground/10` — an existing semantic token, no new token needed.

### Finding 15 — interactive `Card`/`KPIWidget` have no resting affordance cue (b)

`card.tsx:31-32`'s `interactive` variant and a clickable `KPIWidget`
(`kpi-widget.tsx:118-123`) render pixel-identical to their non-interactive
siblings at rest — the border/shadow only appears on `:hover`, and
`KPIWidget`'s drill-in arrow is `opacity-0` until `group-hover`. Nothing at
rest signals "this is a control," and `metric-strip.tsx:120-125` already has
the correct pattern right next to it (`opacity-45` resting,
`opacity-100` on hover). **Fix:** apply the same resting-opacity pattern to
`Card interactive` and `KPIWidget`.

### Finding 16 — spacing below the ~12px baseline between bordered controls (b)

`pagination.tsx:43` (`gap-1`, two bordered icon buttons),
`human-approval-panel.tsx:224` (`gap-2` across four buttons), and
`vizorion-approval-card.tsx:113` (`gap-2` across two-to-three buttons) sit
4-8px apart — below `better-layout`'s ~12px baseline for adjacent
bordered/filled controls, and this recurs in the three highest-stakes action
rows in the app. **Fix:** `gap-3` (12px).

### Finding 17 — destructive actions with no confirmation (a, HIGH)

`better-accessibility`'s escalation list names this HIGH on sight. Four
destructive actions fire directly on click with no confirm/undo step, while
the app already has the correct pattern next door:
`conversation-sidebar.tsx:27-33,78-86` (delete conversation),
`file-panel.tsx:115-123` (delete document), `memory-panel.tsx:36-45,91-99`
(delete one memory / **Clear all** — an irreversible bulk delete with zero
friction), `vizorion-approval-card.tsx:145-152` (Reject). `approval-card.tsx`'s
sibling `human-approval-panel.tsx:274-302` already confirms before firing
`handleAction('reject')`. **Fix:** route all four through the same
confirm-dialog step `HumanApprovalPanel` already uses.

### Finding 18 — truncated content with no way to reach the full value (a, HIGH)

Also HIGH on sight per the escalation list.
`approval-card.tsx:50` (`title`), `conversation-sidebar.tsx:74-77`
(conversation title button), `file-panel.tsx:77-79` (`document.source`) —
all `className="truncate ..."` on user-authored, unbounded-length strings
with no `title` attribute or tooltip. **Fix:** add a native `title={value}`
(cheapest) or wrap in the existing `Tooltip` component.

### Finding 19 — async errors not announced to assistive tech (a)

`voice-controls.tsx:93`, `autowake-enrollment-dialog.tsx:143`,
`autowake-widget.tsx:119-121`, `chat-surface.tsx:153-157` render error text
as a plain conditional `<span>` with no ARIA wiring — `packages/auth/src/login-form.tsx:187,205,211-217`
one file away already does this correctly with `role="alert"`. **Fix:**
apply the same pattern to all four. Related: `chat-panel.tsx:88-149`'s
message list (consumed by both `vizorion-launcher.tsx` and
`chat-surface.tsx`) has no `role="log"`/`aria-live` at all, so a new
streamed assistant reply is silent to a screen reader. **Fix:** wrap in
`role="log" aria-live="polite" aria-relevant="additions"`, announcing only
new messages rather than the full transcript.

### Finding 20 — hand-rolled `role="dialog"` panels missing trap/restore/Escape (b)

`vizorion-launcher.tsx:143-147` and `autowake-widget.tsx:91-95` declare
`role="dialog"` on a plain `<div>` with no focus trap, no focus moved on
open, no focus restored on close, and no `Escape` handler — every other
overlay in the app (`Dialog`, `Drawer`, `AutowakeEnrollmentDialog`,
`Command.Dialog`) gets all of this for free from Radix/cmdk. Still
Tab-reachable via the visible × button, so MEDIUM not HIGH. **Fix:** these
are non-modal floating panels, not true modals, so drop `role="dialog"` in
favor of a labeled region, and add an `Escape`-to-close handler plus
focus-restore to the trigger — matching APG's non-modal disclosure pattern
rather than pulling in the full `Dialog` primitive.

### Finding 21 — Vizorion and Autowake panels can be open simultaneously with overlapping footprints (b, P1)

Arithmetic, not a guess: `vizorion-launcher.tsx:143-147` is `fixed right-20
bottom-20`, sized `h-128 w-92` (512×368px) — spans 80–448px from the right
edge, 80–592px from the bottom. `autowake-widget.tsx:91-95` is `fixed
right-36 bottom-20`, `w-72` (288px) — spans 144–432px from the right edge,
roughly 80–380px from the bottom. The Autowake panel's entire footprint
sits inside the Vizorion panel's. `app-shell.tsx:36` and
`autowake-widget.tsx:80` confirm `vizorionOpen` and `panelOpen` are fully
independent `useState`s with no mutual exclusion, and both use
`z-(--z-floating-action)`, so which one paints on top falls to DOM order.
**Fix:** lift a shared "which floating panel is open" state to
`app-shell.tsx` so opening one closes the other — no new token needed.

### Finding 22 — Vizorion chat surface craft gaps (b)

- `chat-surface.tsx:271-286`: token-usage row uses emoji (`📊⬅️➡️💵`) where
  every other icon in the app is `lucide-react` — breaks the icon system,
  doesn't respect color/size tokens. **Fix:** swap to `lucide-react`
  equivalents already imported elsewhere (`BarChart3Icon`, `ArrowDownIcon`/
  `ArrowUpIcon`, `DollarSignIcon`), colored `text-muted-foreground`.
- `chat-surface.tsx:301-370`: seven same-weight controls (read-aloud, thumbs
  up/down, "Shorter"/"More detail"/"Add citations"/"Improve") under every
  assistant message with only one divider grouping them. **Fix:** collapse
  the four regenerate variants into the existing `dropdown-menu` component
  behind one "Regenerate ▾" trigger.
- `conversation-sidebar.tsx:78-86`: delete button is
  `opacity-0 group-hover:opacity-100` with no `group-focus-within`
  equivalent — technically Tab-reachable but invisible until hovered
  (flagged independently by both the accessibility and visual-critique
  passes). **Fix:** add `group-focus-within:opacity-100`.

### Finding 23 — Control Tower navigation and chart-text polish (b, LOW)

- `control-tower-nav.tsx:22-39`'s `sections[]` has no entry matching
  `/control-tower/agents/:id` or `/control-tower/executions/:executionId`
  (confirmed against `control-tower-routes.tsx:54-60`), so landing on an
  agent-detail or execution-trace page leaves every nav tab inactive.
  **Fix:** prefix-match the active tab (e.g. any `/control-tower/agents/*`
  keeps "Agents" lit).
- `chart-theme.tsx:11-12` hardcodes `fontSize: 11`/`'12px'` in Recharts
  inline style objects — inherent to Recharts (SVG text can't take Tailwind
  classes), but means chart tick/tooltip text doesn't scale with the
  Accessibility Center's `data-text-size` axis the way rem-based labels do.
  **Fix:** derive the px value from the root font-size once (
  `getComputedStyle(document.documentElement).fontSize`) instead of a bare
  literal.

### Finding 24 — minor hit-area / labeling nits (b, LOW)

`segmented-control.tsx:77` (`size="sm"`) computes to ≈20-21px effective
height, under the 24×24px WCAG 2.5.8 AA baseline — bump vertical padding.
`autowake-enrollment-dialog.tsx:113`'s `CheckIcon` has no
`aria-hidden="true"` where sibling icons in the same file correctly do —
add it.

---

## What was clean (judgment-based passes)

- **Motion vocabulary, mostly.** Once the untokened-transition drift
  (Finding 6) is set aside, the four-duration/three-curve system is applied
  correctly almost everywhere it's referenced explicitly — `card.tsx`,
  `kpi-widget.tsx`, `ranked-list.tsx`, `distribution-bar.tsx`, `disclosure.tsx`,
  `chat-panel.tsx`.
- **Concentric radius.** `SegmentedControl` (`segmented-control.tsx:54,79`)
  is textbook correct: `rounded-lg` outer + 2px padding + `rounded-md`
  inner.
- **Loading states.** `Skeleton`/`DataTable` render real content geometry,
  not generic bars; `AnimatedNumber` skips its tween on mount and under
  reduced motion.
- **Icon system.** Consistently `lucide-react` at one stroke width, no
  competing icon library — except the one emoji lapse in Finding 22.
- **Accessibility baseline.** `button.tsx`, `input.tsx`, `textarea.tsx`,
  `select.tsx`, `dropdown-menu.tsx`, `data-table.tsx`, `pagination.tsx`,
  `skip-link.tsx`, `sidebar.tsx`, `topbar.tsx`, `command-palette.tsx`,
  `notification-center.tsx`, `profile-menu.tsx`, `shortcuts-dialog.tsx` and
  `human-approval-panel.tsx` (correct confirm-before-reject, correct
  comment-required-for-non-approve gating) all passed clean. `login-form.tsx`
  is the reference implementation the other error-announcement sites
  (Finding 19) should copy. No raw Tailwind color literals outside Finding
  14, no positive `tabindex`, no bare `<div onClick>`, no autoplaying media,
  no motion-only state changes.
- **Control Tower information density.** The strongest dimension in the
  visual-critique pass — KPI strip → chart → table disclosure order repeats
  identically across all nine data pages; the density itself is appropriate
  to the genre, not a finding.
- **Global reduced-motion / focus mechanism.** Confirmed intact; no
  component in scope hand-rolls a `prefers-reduced-motion` query.

---

## New conflicts logged this pass

Added to the conflict table in
[`platform-design-system/SKILL.md`](../.claude/skills/platform-design-system/SKILL.md#8-conflict-table--third-party-skill-says-x-do-y):
`review-animations` (emilkowalski) would, on its own philosophy, suggest
`linear` easing for continuous/marquee motion and spring physics for
"alive" ambient elements and interruptible toast motion — all three conflict
with the settled no-`linear`, no-spring vocabulary. The existing code
already resolves correctly (see the skill file for the specific rows); this
is logged so a future pass doesn't "fix" `ai-activity.tsx` or the toast
interruptibility finding above by reaching for a spring.

## Explicitly not actioned (product decision, not a token conflict)

The visual-critique pass flagged that the Vizorion and Autowake FABs sit
close together in the same corner (`vizorion-launcher.tsx:278-294`,
`autowake-widget.tsx:160-177`) — fill vs. outline already does most of the
differentiation, and Finding 21's mutual-exclusion fix addresses the
overlap that made this worse. Repositioning either FAB is a product layout
call, not a design-system fix — left for the user to decide, not applied.

---

## Phase 3 fixes applied — surface 1: `packages/ui` primitives

Verification gate (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`)
passes clean: 0 typecheck errors, 0 lint errors (pre-existing
`react-refresh` warnings plus one new one on `risk-indicator.tsx`, same
class as existing warnings on `button.tsx`/`badge.tsx` — a Fast Refresh dev
nicety, not a build issue), 73/73 tests (`confidence-score.test.tsx`
updated to assert `bg-chart-*` instead of `bg-*`, matching the mark-scale
fix below), all three apps build clean.

**Finding 5 (tone-map consolidation).** Migrated onto `lib/tone.ts`'s four
maps: `activity-feed.tsx` (`toneDotClass`), `system-health.tsx`
(`toneChipClass`), `execution-timeline.tsx` and `attention-required.tsx` and
`human-approval-panel.tsx` (`toneTextClass`, with each file's own non-Tone
keys — `'default'`, severity labels — kept local and only the real tones
routed through the shared map), `live-indicator.tsx` (`toneDotClass` +
`toneTextClass`, with its glow shadow re-pointed at the matching
`--color-chart-*` var), `confidence-score.tsx` and `staged-progress.tsx`
(`toneMarkClass`/`toneDotClass` for their meter fills and status dots —
these were badge-tuned before, now chart-tuned per `tone.ts`'s own Mark/Dot
taxonomy), `toast.tsx` (`toneTextClass`/`toneMarkClass` for the icon and
accent rail; `'default'`/`'pending'` stay local, they're not shared tones),
`kpi-widget.tsx`/`metric-strip.tsx` (`deltaToneClass` now references
`toneTextClass` instead of hand-picking the same three strings twice).
`risk-indicator.tsx` now exports `riskLevelClassName`, and
`vizorion-approval-card.tsx` imports it instead of carrying a
character-for-character duplicate. `agent-trace.tsx`'s solid-fill status
icons and `agent-graph.tsx`'s per-status border/bg classes were left as
local maps deliberately — both are already semantic tokens with no
alpha/scale drift, and their shape (icon + label + color, 5 domain-specific
statuses including `blocked`) doesn't fit any of the four documented Mark/
Chip/Dot/Text roles without inventing a fifth.

**Finding 6 (untokened transitions).** Added the matching
`duration-(--duration-fast)` (or `-instant`/`-slow` where the vocabulary
table calls for it) plus curve to every bare `transition-colors`/`-opacity`/
`-[width]` found in scope: `dialog.tsx`, `drawer.tsx` (also switched their
`Close` buttons from `focus:` to `focus-visible:`, folded into the same
edit — see Finding 9), `badge.tsx`, `table.tsx`, `tabs.tsx`,
`attention-required.tsx`, `breadcrumb.tsx`, `confidence-score.tsx`,
`agent-graph.tsx`. `dropdown-menu.tsx`'s `Content`/`SubContent` got
`duration-(--duration-fast) ease-out` added (previously the only popover
family member with none) and, as a bonus catch made while touching those
lines, their raw `z-50` swapped for `z-(--z-dropdown)` — the same class of
bug Finding 3's mechanical pass fixed in `dialog.tsx`/`drawer.tsx` but
missed here since it wasn't a dialog.

**Finding 7 (`toast.tsx`).** All three parts fixed: enter/exit is now a CSS
`transition-[transform,opacity]` on `ToastItem` (via an `entered` flag
flipped one frame after mount) instead of `@keyframes`, so a toast promoted
mid-entrance by `useToast().update()` retargets instead of restarting;
`EXIT_DURATION_MS` is `140` (`--duration-fast`) with `ease-snap` on exit and
`ease-out` on enter — no more `ease-in`; a `danger`-toned toast or one
carrying an `action` now defaults to persistent (`durationMs: 0`) the same
way `pending` already did, judged off the *merged* record so
`useToast().update()` promoting a toast to `danger` also picks it up. The
now-unused `toast-in`/`toast-out` keyframes were removed from
`tokens.css` (doc line in `platform-design-system/SKILL.md` updated to
match).

**Finding 8 (layout-property animation).** `staged-progress.tsx`'s and
`ranked-list.tsx`'s meter fills now animate `transform: scaleX()` from a
`origin-left w-full` track instead of `width`. `distribution-bar.tsx`'s
stacked segments were deliberately left on `flex-grow` — each segment's
width is relative to its siblings in one shared flex track, so there's no
single element to `scaleX` independently, and segment values change rarely
(an incident count, not a live stream), so the layout-property cost is low
here. `metric-strip.tsx`'s `transition-all` on its selected-tab underline
was narrowed to the two properties that actually change.

**Finding 9 (bare `:focus`).** `dialog.tsx`/`drawer.tsx`'s `Close` buttons
and `tabs.tsx`'s `TabsTrigger` (which had no focus ring classes at all) now
use `focus-visible:ring-*`, consistent with every other interactive
primitive.

**Finding 10 (`agent-graph.tsx` running-node pulse).** The node box no
longer carries `animate-ambient-pulse`; a small `LiveDot` (reused from
`live-indicator.tsx`) sits beside the label instead, so the running step's
text stays fully legible during a live SSE-streamed execution.

**Finding 12 (off-vocabulary durations).** `animated-number.tsx`'s tween is
now `400`ms (`--duration-slow`, nearest sanctioned value, was `500`).
`staged-progress.tsx`'s three state-flip transitions (row background, stage
dot, label color) moved from `duration-(--duration-base)` to
`duration-(--duration-instant) ease-snap`, matching the vocabulary table's
"state flips" row rather than its "panels/dialogs" row.

**Finding 13 (`ai-activity.tsx` duplicate cadence).** `ThinkingDots` now
uses the shared `.animate-ambient-pulse` class instead of an inline
`style={{ animation: ... }}` hand-rolling the same keyframe at a different,
undocumented 1.4s cadence.

**Finding 14 (raw color literal).** `markdown.tsx`'s `bg-black/10` (both
`code` and `pre`) is now `bg-foreground/10` — an existing semantic token, no
new one needed. Fixes the dark-mode contrast complaint where code blocks
were barely distinguishable from the chat bubble around them.

**Finding 15 (no resting affordance cue).** `Card interactive` now carries a
static `border-border-strong/50` at rest (full-strength on hover), and
`KPIWidget`'s drill-in arrow rests at `opacity-45` instead of `opacity-0`,
both matching the pattern `MetricStrip` already had.

**Finding 16 (sub-baseline spacing).** `pagination.tsx`,
`human-approval-panel.tsx`, and `vizorion-approval-card.tsx`'s action rows
moved from `gap-1`/`gap-2` to `gap-3` (12px), the `better-layout` baseline
for adjacent bordered/filled controls.

**Finding 17 (destructive action, packages/ui portion).**
`vizorion-approval-card.tsx`'s Reject button now opens a confirm dialog
(mirroring `HumanApprovalPanel`'s existing Reject flow) instead of firing
`onRespond('rejected')` directly.

**Finding 18 (truncated content, packages/ui portion).**
`approval-card.tsx`'s truncated `title` now carries a native `title=`
attribute so the full string is reachable.

**Finding 19 (packages/ui portion).** `chat-panel.tsx`'s message list is now
`role="log" aria-live="polite" aria-relevant="additions"`, so a newly
streamed assistant reply is announced instead of silent to a screen reader.

**Finding 24 (packages/ui portion).** `segmented-control.tsx`'s `size="sm"`
option button padding increased so its effective hit area clears the 24px
WCAG 2.5.8 AA baseline.

**Deferred to later surfaces:** Findings 6/8/11 (Vizorion launcher/Autowake
widget, `topbar.tsx`), 5/23 (Control Tower's `guardrails-page.tsx`/
`explainability-page.tsx` tone maps, `control-tower-nav.tsx`,
`chart-theme.tsx`), 17/18/19/20/21/22 (the rest of Vizorion/Autowake and its
`conversation-sidebar.tsx`/`file-panel.tsx`/`memory-panel.tsx`), and the
`agent-trace.tsx` design-judgment call noted under Finding 5 above (not
deferred — a deliberate decision not to force-fit it).

---

## Phase 3 fixes applied — surface 2: AI Control Tower

Verification gate passes clean: 0 typecheck errors, 0 lint errors (same
pre-existing warning set as surface 1, nothing new), 73/73 tests, all three
apps build.

**Finding 5 (Control Tower portion).** `guardrails-page.tsx`'s
`SEVERITY_TONE` now imports `toneChipClass` from `@platform/ui` (added to
`packages/ui`'s public exports — previously only the `Tone` type was
exported, not the four maps themselves) instead of hand-picking its own
`/10`/`/20` alphas; the badge switched from `variant="outline"` to the
default variant since `toneChipClass` is a borderless soft-fill chip and
`outline` would have shown a neutral, untinted border around it.
`explainability-page.tsx`'s `CONFIDENCE_BAND_TONE` and `DECISION_TONE`
(both meter-fill "Mark" roles) now use `toneMarkClass`, including the
factor-weights bar that wasn't explicitly named in the finding but shared
the identical badge-vs-chart-scale problem. `DECISION_COLOR_VAR` (the
Recharts `<Cell fill>` map, which needs a raw CSS `var()` string and so
can't route through a Tailwind class) had its `escalate`/`reject` entries
corrected from `--color-danger` to `--color-chart-danger`, fixing the
internal inconsistency where two slices of one pie chart drew red from two
different scales.

**Finding 23.** `control-tower-nav.tsx`: execution-trace pages
(`/control-tower/executions/:id`) now light up the "Agents" tab via an
explicit `isSectionActive` check, since that route lives outside
`/control-tower/agents`'s own prefix and NavLink's built-in matching
couldn't reach it. (Agent detail pages didn't need this fix — NavLink's
default `end: false` prefix match already covers `/control-tower/agents/:id`
correctly.) `chart-theme.tsx`'s `chartAxisTick.fontSize` (`11`) and
`chartTooltipStyle.contentStyle.fontSize` (`'12px'`) are now `'0.6875rem'`/
`'0.75rem'` — rem, not px, so chart tick/tooltip text scales with the
Accessibility Center's text-size axis the same way every Tailwind text-*
utility around the chart already does. (`apps/main-app`'s near-identical
`chart-theme.tsx` copy wasn't touched — no finding named it, and this pass
doesn't scope-creep into files the audit didn't flag.)
