import * as React from 'react'
import { ArchiveIcon, FileTextIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import {
  useArchiveVizorionFile,
  useDeleteVizorionFile,
  usePublishVizorionFile,
  useUnpublishVizorionFile,
  useUploadVizorionFile,
  useVizorionFiles,
} from '@platform/api-client'
import { Badge, Button, EmptyState } from '@platform/ui'

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
}

export function FilePanel() {
  const { data: documents = [] } = useVizorionFiles()
  const upload = useUploadVizorionFile()
  const publish = usePublishVizorionFile()
  const unpublish = useUnpublishVizorionFile()
  const archive = useArchiveVizorionFile()
  const deleteFile = useDeleteVizorionFile()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) upload.mutate(file)
    event.target.value = ''
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Documents (RAG)</h2>
          <p className="text-muted-foreground text-sm">
            Upload documents for Vizorion to cite in its answers. Only published documents are retrievable.
          </p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <UploadIcon className="size-4" />
            Upload
          </Button>
        </div>
      </div>

      {documents.length === 0 && (
        <EmptyState
          icon={<FileTextIcon />}
          title="No documents uploaded this session"
          description="Uploaded documents appear here — publish one to make it retrievable."
        />
      )}

      <ul className="space-y-2">
        {documents.map((document) => (
          <li key={document.id} className="bg-surface flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-medium">{document.source ?? document.id}</p>
              <Badge variant={statusVariant[document.status] ?? 'outline'} className="capitalize">
                {document.status}
              </Badge>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {document.status !== 'published' && (
                <Button variant="outline" size="sm" onClick={() => publish.mutate(document.id)}>
                  Publish
                </Button>
              )}
              {document.status === 'published' && (
                <Button variant="outline" size="sm" onClick={() => unpublish.mutate(document.id)}>
                  Unpublish
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Archive document"
                onClick={() => archive.mutate(document.id)}
              >
                <ArchiveIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Delete document"
                onClick={() => deleteFile.mutate(document.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
