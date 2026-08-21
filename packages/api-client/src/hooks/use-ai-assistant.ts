import * as React from 'react'
import type { AIExecutionStep, ChatMessage } from '@platform/types'

import { mockAIAssistantService, STEP_LABELS } from '../ai-assistant-service'

let messageCounter = 0
function nextId(prefix: string) {
  messageCounter += 1
  return `${prefix}-${Date.now()}-${messageCounter}`
}

export function useAIAssistant() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [liveSteps, setLiveSteps] = React.useState<AIExecutionStep[]>([])
  const [isStreaming, setIsStreaming] = React.useState(false)
  const cancelRef = React.useRef<(() => void) | null>(null)

  const sendMessage = React.useCallback((prompt: string) => {
    const userMessage: ChatMessage = {
      id: nextId('msg'),
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setLiveSteps([])
    setIsStreaming(true)

    const stepsAcc: AIExecutionStep[] = []

    const { cancel } = mockAIAssistantService.sendMessage(prompt, (event) => {
      switch (event.type) {
        case 'step.started': {
          stepsAcc.push({ id: event.step, label: STEP_LABELS[event.step], status: 'running' })
          setLiveSteps([...stepsAcc])
          break
        }
        case 'step.completed': {
          const index = stepsAcc.findIndex((step) => step.id === event.step)
          if (index !== -1) {
            stepsAcc[index] = {
              ...stepsAcc[index],
              status: 'completed',
              detail: event.detail,
              durationMs: event.durationMs,
            }
          }
          setLiveSteps([...stepsAcc])
          break
        }
        case 'citations.found': {
          // Citations are attached to the final message via the 'result'
          // event — this event exists so a live UI could show "Sources
          // found" the moment retrieval completes, ahead of the full
          // result. Not surfaced separately in Phase 7's UI, but the
          // event is real and available for that later.
          break
        }
        case 'result': {
          const assistantMessage: ChatMessage = {
            id: nextId('msg'),
            role: 'assistant',
            content: event.message,
            createdAt: new Date().toISOString(),
            execution: event.result,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setIsStreaming(false)
          setLiveSteps([])
          break
        }
        case 'error': {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId('msg'),
              role: 'assistant',
              content: `Sorry — ${event.message}`,
              createdAt: new Date().toISOString(),
            },
          ])
          setIsStreaming(false)
          setLiveSteps([])
          break
        }
      }
    })

    cancelRef.current = cancel
  }, [])

  // Cancel any in-flight mock stream on unmount — a real SSE connection
  // would need this exact cleanup shape too.
  React.useEffect(() => {
    return () => cancelRef.current?.()
  }, [])

  return { messages, sendMessage, isStreaming, liveSteps }
}
