import type { VizorionMemory } from '@platform/types'

import { resolveVizorionService } from './vizorion/env'
import { vizorionClient } from './vizorion/client'

export interface VizorionMemoryService {
  list(): Promise<VizorionMemory[]>
  create(content: string, key?: string): Promise<VizorionMemory>
  update(memoryId: string, content: string): Promise<VizorionMemory>
  delete(memoryId: string): Promise<void>
  deleteAll(): Promise<void>
}

let mockMemory: VizorionMemory[] = []

export const mockVizorionMemoryService: VizorionMemoryService = {
  async list() {
    return mockMemory
  },
  async create(content, key) {
    const memory: VizorionMemory = {
      id: `mock-memory-${Date.now()}`,
      content,
      key: key ?? null,
      source: 'user',
      created_at: new Date().toISOString(),
    }
    mockMemory = [memory, ...mockMemory]
    return memory
  },
  async update(memoryId, content) {
    mockMemory = mockMemory.map((m) =>
      m.id === memoryId ? { ...m, content } : m,
    )
    return mockMemory.find((m) => m.id === memoryId)!
  },
  async delete(memoryId) {
    mockMemory = mockMemory.filter((m) => m.id !== memoryId)
  },
  async deleteAll() {
    mockMemory = []
  },
}

export const realVizorionMemoryService: VizorionMemoryService = {
  list: () => vizorionClient.listMemory(),
  create: (content, key) => vizorionClient.createMemory(content, key),
  update: (memoryId, content) => vizorionClient.updateMemory(memoryId, content),
  delete: (memoryId) => vizorionClient.deleteMemory(memoryId),
  deleteAll: () => vizorionClient.deleteAllMemory(),
}

export const vizorionMemoryService = resolveVizorionService(
  mockVizorionMemoryService,
  realVizorionMemoryService,
)
