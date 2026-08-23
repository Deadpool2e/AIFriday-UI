import * as React from 'react'
import { ArrowRightIcon } from 'lucide-react'

import { cn } from '../lib/cn'

export interface AgentCommunicationMessage {
  id: string
  sender: string
  receiver: string
  summary: string
  timestamp: string
}

interface AgentCommunicationProps extends React.ComponentProps<'ol'> {
  messages: AgentCommunicationMessage[]
}

// Agent-to-agent handoffs as their own feed, distinct from AgentTrace's
// per-agent input/output — this is the message one agent explicitly
// passed to the next at a handoff point, not either agent's own summary
// of its own work.
function AgentCommunication({ messages, className, ...props }: AgentCommunicationProps) {
  const ordered = [...messages].reverse()

  return (
    <ol
      data-slot="agent-communication"
      className={cn('max-h-96 space-y-3 overflow-y-auto', className)}
      {...props}
    >
      {ordered.map((message) => (
        <li key={message.id} className="text-sm">
          <div className="flex items-center gap-1.5 font-medium">
            <span>{message.sender}</span>
            <ArrowRightIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
            <span>{message.receiver}</span>
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
          <p className="text-muted-foreground">{message.summary}</p>
        </li>
      ))}
    </ol>
  )
}

export { AgentCommunication }
