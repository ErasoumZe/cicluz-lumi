import { createProfilePaths, sanitizeIdentifier } from './profilePaths.mjs'
import { readJsonFile, writeJsonFile } from './fsJson.mjs'
import { emptyProfileMemory } from '../domain/methodology.mjs'

const mergeMemoryEntry = (entries, newEntry) => {
  const existing = entries.find((entry) => entry.messageId === newEntry.messageId)

  if (existing) {
    return entries
  }

  return [newEntry, ...entries].slice(0, 30)
}

export const createProfileMemoryRepository = ({ dataDir, defaultProfileId }) => {
  const resolveProfile = (profileId) => {
    const paths = createProfilePaths(dataDir, profileId || defaultProfileId)

    return {
      profileId: sanitizeIdentifier(profileId, defaultProfileId),
      ...paths,
    }
  }

  return {
    async get(profileId) {
      const resolved = resolveProfile(profileId)
      return readJsonFile(resolved.memoryFile, emptyProfileMemory(resolved.profileId))
    },

    async append(profileId, memoryRecord) {
      const resolved = resolveProfile(profileId)
      const current = await this.get(profileId)

      if (!['EU', 'SER', 'TER'].includes(memoryRecord.pillar)) {
        return current
      }

      current.pillars[memoryRecord.pillar] = mergeMemoryEntry(current.pillars[memoryRecord.pillar], memoryRecord)
      current.updatedAt = new Date().toISOString()

      await writeJsonFile(resolved.memoryFile, current)
      return current
    },
  }
}
