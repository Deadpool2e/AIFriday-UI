import * as React from 'react'
import { BrainIcon, Trash2Icon } from 'lucide-react'
import {
  useCreateVizorionMemory,
  useDeleteAllVizorionMemory,
  useDeleteVizorionMemory,
  useVizorionMemory,
} from '@platform/api-client'
import { Button, EmptyState, Input, Skeleton } from '@platform/ui'

export function MemoryPanel() {
  const { data: memories = [], isLoading } = useVizorionMemory()
  const createMemory = useCreateVizorionMemory()
  const deleteMemory = useDeleteVizorionMemory()
  const deleteAll = useDeleteAllVizorionMemory()
  const [content, setContent] = React.useState('')

  function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    createMemory.mutate({ content: trimmed })
    setContent('')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Long-term memory</h2>
          <p className="text-muted-foreground text-sm">
            Facts Vizorion remembers across conversations. Add one manually, or delete anything it picked up on
            its own.
          </p>
        </div>
        {memories.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => deleteAll.mutate()} disabled={deleteAll.isPending}>
            Clear all
          </Button>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="e.g. Prefers answers in bullet points"
          aria-label="New memory"
        />
        <Button type="submit" disabled={!content.trim() || createMemory.isPending}>
          Add
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && memories.length === 0 && (
        <EmptyState icon={<BrainIcon />} title="No memories yet" description="Nothing has been remembered yet." />
      )}

      <ul className="space-y-2">
        {memories.map((memory) => (
          <li key={memory.id} className="bg-surface flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm">{memory.content}</p>
              <p className="text-muted-foreground text-xs">
                {memory.key ? `${memory.key} · ` : ''}
                {memory.source}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Delete memory"
              onClick={() => deleteMemory.mutate(memory.id)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
