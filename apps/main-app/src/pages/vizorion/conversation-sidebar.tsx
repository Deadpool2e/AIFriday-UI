import * as React from 'react'
import { MessageSquarePlusIcon, Trash2Icon } from 'lucide-react'
import {
  useCreateVizorionConversation,
  useDeleteVizorionConversation,
  useVizorionConversations,
} from '@platform/api-client'
import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@platform/ui'

interface ConversationSidebarProps {
  activeConversationId: string | null
  onSelect: (conversationId: string | null) => void
}

export function ConversationSidebar({
  activeConversationId,
  onSelect,
}: ConversationSidebarProps) {
  const { data: conversations = [], isLoading } = useVizorionConversations()
  const createConversation = useCreateVizorionConversation()
  const deleteConversation = useDeleteVizorionConversation()
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  )

  async function handleNewConversation() {
    const conversation = await createConversation.mutateAsync()
    onSelect(conversation.id)
  }

  function handleDelete(conversationId: string) {
    deleteConversation.mutate(conversationId, {
      onSuccess: () => {
        if (activeConversationId === conversationId) onSelect(null)
      },
    })
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-r">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <p className="text-sm font-medium">Conversations</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleNewConversation}
          disabled={createConversation.isPending}
        >
          <MessageSquarePlusIcon className="size-4" />
          New
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="space-y-2 p-1">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <p className="text-muted-foreground p-2 text-xs">
            No conversations yet — send a message to start one.
          </p>
        )}

        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group flex items-center gap-1 rounded-md',
              activeConversationId === conversation.id && 'bg-accent',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              title={conversation.title ?? 'Untitled conversation'}
              className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm"
            >
              {conversation.title ?? 'Untitled conversation'}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
              aria-label="Delete conversation"
              onClick={() => setConfirmDeleteId(conversation.id)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this conversation?</DialogTitle>
            <DialogDescription>
              This permanently removes the conversation and its messages. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId)
                setConfirmDeleteId(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
