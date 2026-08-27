import * as React from 'react'

import { cn } from '../lib/cn'

export interface AIActivityToolCall {
  id: string
  tool: string
  status: 'running' | 'completed'
}

interface AIActivityProps extends React.ComponentProps<'div'> {
  // Live tool calls from the assistant's own event stream. What the
  // assistant is doing is derived from these rather than guessed: if a
  // tool is running, that tool's name *is* the status.
  toolCalls?: AIActivityToolCall[]
  // Shown before any tool has been invoked and after they've all
  // finished — the two moments the model is genuinely just generating.
  idleLabel?: string
  composingLabel?: string
}

// Three animated dots at the AI accent, at slightly offset phases. The
// alternative — a spinner — says "waiting"; this says "producing", which
// is the honest description of a token stream.
function ThinkingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="bg-ai-accent animate-ambient-pulse size-1.5 rounded-full"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </span>
  )
}

// Replaces the "Thinking…" spinner that stood in for every phase of an
// assistant turn. It reports what the assistant is actually doing right
// now — reading a document, running a search, writing the answer — which
// is both more informative and more trustworthy: a system that tells you
// which tool it reached for is one you can audit.
function AIActivity({
  toolCalls = [],
  idleLabel = 'Thinking',
  composingLabel = 'Composing answer',
  className,
  ...props
}: AIActivityProps) {
  const running = toolCalls.find((call) => call.status === 'running')
  const completedCount = toolCalls.filter(
    (call) => call.status === 'completed',
  ).length

  const label = running
    ? `Running ${running.tool}`
    : completedCount > 0
      ? composingLabel
      : idleLabel

  return (
    <div
      data-slot="ai-activity"
      role="status"
      aria-live="polite"
      className={cn(
        'bg-ai-accent/[0.06] border-ai-accent/20 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5',
        className,
      )}
      {...props}
    >
      <ThinkingDots />
      {/* Keyed by label so each phase change crossfades in rather than the
          text swapping in place, which at this size reads as a glitch. */}
      <span
        key={label}
        className="animate-in fade-in-0 text-sm duration-(--duration-base)"
      >
        {label}
        <span className="text-muted-foreground">…</span>
      </span>
      {completedCount > 0 && (
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {completedCount} step{completedCount === 1 ? '' : 's'} done
        </span>
      )}
    </div>
  )
}

export { AIActivity }
