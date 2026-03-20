import { randomUUID } from 'node:crypto'
import {
  analyzeNarrative,
  buildProfileMemoryDigest,
  createMemoryRecord,
  summarizeConversation,
} from '../domain/methodology.mjs'
import { assessSafety, buildCrisisSupportMessage } from '../domain/safety.mjs'

const DEFAULT_TITLE = 'Nova conversa'

const buildConversationTitle = (content) => {
  const normalized = String(content || '').replace(/\s+/g, ' ').trim()
  return normalized.slice(0, 48) || DEFAULT_TITLE
}

const createAssistantMetadata = ({ analysis, safety }) => ({
  analysis: {
    ...analysis,
    riskLevel: safety.riskLevel,
  },
})

const streamText = async ({ text, onChunk, signal }) => {
  const words = text.split(/(\s+)/).filter(Boolean)

  for (let index = 0; index < words.length; index += 3) {
    if (signal?.aborted) {
      throw new Error('Streaming aborted')
    }

    onChunk?.(words.slice(index, index + 3).join(''))
    await new Promise((resolve) => setTimeout(resolve, 45))
  }
}

export const createAssistenteService = ({
  conversationRepository,
  profileMemoryRepository,
  provider,
  defaultProfileId,
}) => {
  const resolveProfileId = (profileId) => profileId || defaultProfileId

  const loadConversationOrCreate = async (profileId, conversationId) => {
    if (conversationId) {
      const existing = await conversationRepository.get(profileId, conversationId)

      if (existing) {
        return existing
      }
    }

    return conversationRepository.create(profileId)
  }

  return {
    async getBootstrap(profileId) {
      const resolvedProfileId = resolveProfileId(profileId)
      const conversations = await conversationRepository.list(resolvedProfileId)
      const profileMemory = await profileMemoryRepository.get(resolvedProfileId)

      if (conversations.length === 0) {
        const created = await conversationRepository.create(resolvedProfileId)

        return {
          profileId: resolvedProfileId,
          activeConversationId: created.id,
          conversations: [created],
          profileMemory,
          serviceMode: 'api',
        }
      }

      return {
        profileId: resolvedProfileId,
        activeConversationId: conversations[0].id,
        conversations,
        profileMemory,
        serviceMode: 'api',
      }
    },

    async listConversations(profileId) {
      return conversationRepository.list(resolveProfileId(profileId))
    },

    async getConversation(profileId, conversationId) {
      return conversationRepository.get(resolveProfileId(profileId), conversationId)
    },

    async createConversation(profileId) {
      return conversationRepository.create(resolveProfileId(profileId))
    },

    async streamMessage({ profileId, conversationId, content, onChunk, signal }) {
      const resolvedProfileId = resolveProfileId(profileId)
      const conversation = await loadConversationOrCreate(resolvedProfileId, conversationId)
      const createdAt = new Date().toISOString()
      const analysis = analyzeNarrative(content)
      const safety = assessSafety(content)

      const userMessage = {
        id: `user-${randomUUID()}`,
        role: 'user',
        content,
        createdAt,
        streaming: false,
        metadata: {
          analysis: {
            ...analysis,
            riskLevel: safety.riskLevel,
          },
        },
      }

      if (conversation.title === DEFAULT_TITLE || !conversation.title) {
        conversation.title = buildConversationTitle(content)
      }

      conversation.messages.push(userMessage)
      conversation.updatedAt = createdAt
      conversation.summary = summarizeConversation(conversation.messages)
      await conversationRepository.save(resolvedProfileId, conversation)

      if (analysis.memoryCandidate) {
        const memoryRecord = createMemoryRecord({
          profileId: resolvedProfileId,
          conversationId: conversation.id,
          messageId: userMessage.id,
          content,
          analysis,
          createdAt,
        })

        if (memoryRecord.pillar !== 'MISTO') {
          await profileMemoryRepository.append(resolvedProfileId, memoryRecord)
        }
      }

      const profileMemory = await profileMemoryRepository.get(resolvedProfileId)
      const memoryDigest = buildProfileMemoryDigest(profileMemory)
      let assistantContent = ''

      if (safety.shouldShortCircuit) {
        assistantContent = buildCrisisSupportMessage()
        await streamText({ text: assistantContent, onChunk, signal })
      } else {
        const reply = await provider.streamReply({
          content,
          analysis,
          safety,
          conversation,
          conversationSummary: conversation.summary,
          memoryDigest,
          onChunk,
          signal,
        })

        assistantContent = reply.content
      }

      const assistantMessage = {
        id: `assistant-${randomUUID()}`,
        role: 'assistant',
        content: assistantContent,
        createdAt: new Date().toISOString(),
        streaming: false,
        metadata: createAssistantMetadata({ analysis, safety }),
      }

      conversation.messages.push(assistantMessage)
      conversation.updatedAt = assistantMessage.createdAt
      conversation.summary = summarizeConversation(conversation.messages)

      const persistedConversation = await conversationRepository.save(resolvedProfileId, conversation)

      return {
        conversationId: persistedConversation.id,
        conversation: persistedConversation,
        message: assistantMessage,
      }
    },
  }
}
