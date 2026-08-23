import * as React from 'react'
import { SendIcon, SparklesIcon, UserIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'
import { Input } from './input'

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export interface ChatPanelMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ChatPanelProps {
  messages: ChatPanelMessage[]
  onSend: (value: string) => void
  isSending?: boolean
  disabled?: boolean
  placeholder?: string
  // Slot for AI-specific content (execution stepper, citations,
  // recommendation card) attached below a specific message. ChatPanel
  // itself stays domain-agnostic — a chat UI is genuinely reusable outside
  // AI contexts, so it never bakes in citations/confidence/risk directly.
  renderAfterMessage?: (message: ChatPanelMessage) => React.ReactNode
  // Slot for the "currently generating" indicator, shown below the last
  // message while a response is in flight.
  streamingIndicator?: React.ReactNode
  // Shown in place of the (empty) message list before the first message —
  // the input stays usable underneath, unlike swapping the whole panel out
  // for a separate empty-state screen.
  emptyState?: React.ReactNode
  className?: string
}

function ChatPanel({
  messages,
  onSend,
  isSending = false,
  disabled = false,
  placeholder = 'Type a message...',
  renderAfterMessage,
  streamingIndicator,
  emptyState,
  className,
}: ChatPanelProps) {
  const [value, setValue] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamingIndicator])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div data-slot="chat-panel" className={cn('flex h-full flex-col', className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && emptyState && !streamingIndicator ? (
          <div className="flex h-full items-center justify-center">{emptyState}</div>
        ) : null}
        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <div key={message.id} className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
              <div
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                  isUser ? 'bg-muted text-muted-foreground' : 'bg-ai-accent/10 text-ai-accent',
                )}
                aria-hidden="true"
              >
                {isUser ? <UserIcon className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
              </div>
              <div className={cn('max-w-[85%] space-y-1.5', isUser && 'flex flex-col items-end')}>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-muted text-surface-muted-foreground',
                  )}
                >
                  {message.content}
                </div>
                <span className="text-muted-foreground/70 px-0.5 text-[11px] tabular-nums">
                  {formatTime(message.createdAt)}
                </span>
                {renderAfterMessage?.(message)}
              </div>
            </div>
          )
        })}
        {streamingIndicator && <div className="flex justify-start">{streamingIndicator}</div>}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isSending || !value.trim()}
          aria-label="Send message"
        >
          <SendIcon />
        </Button>
      </form>
    </div>
  )
}

export { ChatPanel }
