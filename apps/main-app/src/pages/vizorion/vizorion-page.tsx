import * as React from 'react'
import { MessageCircleIcon } from 'lucide-react'
import {
  LiveIndicator,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDocumentTitle,
} from '@platform/ui'

import { ChatSurface } from './chat-surface'
import { ConversationSidebar } from './conversation-sidebar'
import { FilePanel } from './file-panel'
import { MemoryPanel } from './memory-panel'

export function VizorionPage() {
  useDocumentTitle('Vizorion — Enterprise AI Platform')
  const [activeTab, setActiveTab] = React.useState('chat')
  const [conversationId, setConversationId] = React.useState<string | null>(
    null,
  )
  // Bumped only by an explicit sidebar selection (handleSelectConversation
  // below), never by useVizorionChat's own lazy-create-on-first-message —
  // that distinction matters: an explicit switch should reset ChatSurface
  // to a clean slate (remount), but the lazy-create transition happens
  // mid-stream and must NOT remount, or the in-flight reply would be lost.
  const [chatInstanceKey, setChatInstanceKey] = React.useState(0)

  function handleSelectConversation(id: string | null) {
    setConversationId(id)
    setChatInstanceKey((key) => key + 1)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        className="mb-4"
        eyebrow="Intelligence"
        title={
          <span className="flex items-center gap-2">
            <MessageCircleIcon
              className="text-ai-accent size-5"
              aria-hidden="true"
            />
            Vizorion
          </span>
        }
        description="A general-purpose RAG assistant with citations, tool use, long-term memory, and human-in-the-loop approvals."
        // The one page in the platform backed by a real backend rather
        // than mock data — worth saying out loud, since everything else
        // carries a "Demo data" chip.
        meta={<LiveIndicator tone="success" label="Live backend" />}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="files">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="flex h-[calc(100vh-14rem)] gap-4">
            <ConversationSidebar
              activeConversationId={conversationId}
              onSelect={handleSelectConversation}
            />
            <ChatSurface
              key={chatInstanceKey}
              conversationId={conversationId}
              onConversationCreated={(conversation) =>
                setConversationId(conversation.id)
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="memory">
          <MemoryPanel />
        </TabsContent>

        <TabsContent value="files">
          <FilePanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
