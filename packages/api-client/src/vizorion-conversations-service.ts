import type { VizorionConversation } from '@platform/types'

import { resolveVizorionService } from './vizorion/env'
import { vizorionClient } from './vizorion/client'

export interface VizorionConversationsService {
  list(): Promise<VizorionConversation[]>
  create(): Promise<VizorionConversation>
  delete(conversationId: string): Promise<void>
}

function nowIso() {
  return new Date().toISOString()
}

let mockConversations: VizorionConversation[] = []

export const mockVizorionConversationsService: VizorionConversationsService = {
  async list() {
    return mockConversations
  },
  async create() {
    const conversation: VizorionConversation = {
      id: `mock-conv-${Date.now()}`,
      title: null,
      summary: null,
      branched_from_id: null,
      branched_from_message_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    mockConversations = [conversation, ...mockConversations]
    return conversation
  },
  async delete(conversationId) {
    mockConversations = mockConversations.filter((c) => c.id !== conversationId)
  },
}

export const realVizorionConversationsService: VizorionConversationsService = {
  list: () => vizorionClient.listConversations(),
  create: () => vizorionClient.createConversation(),
  delete: (conversationId) => vizorionClient.deleteConversation(conversationId),
}

export const vizorionConversationsService = resolveVizorionService(
  mockVizorionConversationsService,
  realVizorionConversationsService,
)
