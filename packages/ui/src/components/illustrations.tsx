// Small hand-authored inline SVGs for the highest-visibility empty states —
// abstract geometric line-art built only from token colors (currentColor +
// the semantic status/AI-accent hues), not stock icon-in-a-circle clipart.
// Passed through EmptyState's existing `icon` slot, so no API change was
// needed to use these — just swap which node gets passed in.

function AllCaughtUpIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className="size-16">
      <circle cx="48" cy="48" r="44" className="fill-success/[0.06]" />
      <circle
        cx="48"
        cy="48"
        r="30"
        className="stroke-success/25"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      <circle
        cx="48"
        cy="48"
        r="18"
        className="fill-surface stroke-success/40"
        strokeWidth="1.5"
      />
      <path
        d="M40 48.5 45.5 54 57 41"
        className="stroke-success"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NotBuiltIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className="size-16">
      <rect
        x="20"
        y="24"
        width="56"
        height="48"
        rx="6"
        className="stroke-muted-foreground/30"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <path
        d="M32 62 42 48l8 8 8-12 6 8"
        className="stroke-muted-foreground/40"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="48" r="3" className="fill-ai-accent/70" />
    </svg>
  )
}

function ShieldClearIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" className="size-16">
      <circle cx="48" cy="48" r="44" className="fill-success/[0.06]" />
      <path
        d="M48 22 70 30v18c0 16-9.5 25.5-22 30-12.5-4.5-22-14-22-30V30z"
        className="fill-surface stroke-success/40"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M40 48 46 54 58 40"
        className="stroke-success"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export {
  AllCaughtUpIllustration,
  NotBuiltIllustration,
  ShieldClearIllustration,
}
