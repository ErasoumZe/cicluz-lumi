import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createProfilePaths, sanitizeIdentifier } from './profilePaths.mjs'
import { listJsonFiles, readJsonFile, writeJsonFile } from './fsJson.mjs'

const DEFAULT_TITLE = 'Nova conversa'

const sortConversations = (conversations) => {
  return conversations.sort((left, right) => {
    const leftDate = Date.parse(left.updatedAt || left.createdAt || 0)
    const rightDate = Date.parse(right.updatedAt || right.createdAt || 0)
    return rightDate - leftDate
  })
}

export const createConversationRepository = ({ dataDir, defaultProfileId }) => {
  const getConversationPath = (profileId, conversationId) => {
    const paths = createProfilePaths(dataDir, profileId || defaultProfileId)
    const safeConversationId = sanitizeIdentifier(conversationId, randomUUID())

    return {
      ...paths,
      safeConversationId,
      filePath: join(paths.conversationsDir, `${safeConversationId}.json`),
    }
  }

  return {
    async list(profileId) {
      const paths = createProfilePaths(dataDir, profileId || defaultProfileId)
      const files = await listJsonFiles(paths.conversationsDir)
      const conversations = []

      for (const file of files) {
        const conversation = await readJsonFile(file, null)

        if (conversation) {
          conversations.push(conversation)
        }
      }

      return sortConversations(conversations)
    },

    async get(profileId, conversationId) {
      const paths = getConversationPath(profileId, conversationId)
      return readJsonFile(paths.filePath, null)
    },

    async save(profileId, conversation) {
      const paths = getConversationPath(profileId, conversation.id || randomUUID())
      const payload = {
        ...conversation,
        id: paths.safeConversationId,
        profileId: paths.safeProfileId,
      }

      await writeJsonFile(paths.filePath, payload)
      return payload
    },

    async create(profileId) {
      const now = new Date().toISOString()

      return this.save(profileId, {
        id: randomUUID(),
        profileId: sanitizeIdentifier(profileId, defaultProfileId),
        title: DEFAULT_TITLE,
        createdAt: now,
        updatedAt: now,
        messages: [],
        summary: {
          dominantPillar: 'MISTO',
          lastUserPillar: 'MISTO',
          therapeutic: false,
          lastMessageAt: null,
        },
      })
    },
  }
}
