import { join } from 'node:path'

export const sanitizeIdentifier = (value, fallback) => {
  return String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 80) || fallback
}

export const createProfilePaths = (dataDir, profileId) => {
  const safeProfileId = sanitizeIdentifier(profileId, 'default')
  const profileRoot = join(dataDir, 'profiles', safeProfileId)

  return {
    safeProfileId,
    profileRoot,
    memoryFile: join(profileRoot, 'memory.json'),
    conversationsDir: join(profileRoot, 'conversations'),
  }
}
