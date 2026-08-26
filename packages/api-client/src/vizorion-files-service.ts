import type { VizorionDocument } from '@platform/types'

import { resolveVizorionService } from './vizorion/env'
import { vizorionClient } from './vizorion/client'

export interface VizorionFilesService {
  list(): Promise<VizorionDocument[]>
  upload(file: File): Promise<VizorionDocument>
  publish(documentId: string): Promise<VizorionDocument>
  unpublish(documentId: string): Promise<VizorionDocument>
  archive(documentId: string): Promise<VizorionDocument>
  delete(documentId: string): Promise<void>
}

let mockDocuments: VizorionDocument[] = []

export const mockVizorionFilesService: VizorionFilesService = {
  async list() {
    return mockDocuments
  },
  async upload(file) {
    const document: VizorionDocument = { id: `mock-doc-${Date.now()}`, status: 'draft', source: file.name }
    mockDocuments = [document, ...mockDocuments]
    return document
  },
  async publish(documentId) {
    mockDocuments = mockDocuments.map((d) => (d.id === documentId ? { ...d, status: 'published' } : d))
    return mockDocuments.find((d) => d.id === documentId)!
  },
  async unpublish(documentId) {
    mockDocuments = mockDocuments.map((d) => (d.id === documentId ? { ...d, status: 'draft' } : d))
    return mockDocuments.find((d) => d.id === documentId)!
  },
  async archive(documentId) {
    mockDocuments = mockDocuments.map((d) => (d.id === documentId ? { ...d, status: 'archived' } : d))
    return mockDocuments.find((d) => d.id === documentId)!
  },
  async delete(documentId) {
    mockDocuments = mockDocuments.filter((d) => d.id !== documentId)
  },
}

// Vizorion has no GET /v1/files (list) endpoint — only per-document GET —
// so the real implementation can't offer a server-backed `list()`. Files
// this session has uploaded/touched are tracked client-side instead (see
// use-vizorion-files.ts), and `list()` here only exists to satisfy the
// shared interface for the mock; callers should rely on the hook's local
// tracking, not this method, in real mode.
export const realVizorionFilesService: VizorionFilesService = {
  async list() {
    return []
  },
  upload: (file) => vizorionClient.uploadFile(file),
  publish: (documentId) => vizorionClient.publishFile(documentId),
  unpublish: (documentId) => vizorionClient.unpublishFile(documentId),
  archive: (documentId) => vizorionClient.archiveFile(documentId),
  delete: (documentId) => vizorionClient.deleteFile(documentId),
}

export const vizorionFilesService = resolveVizorionService(mockVizorionFilesService, realVizorionFilesService)
