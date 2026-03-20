import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..', '..')

const parseEnvFile = (source) => {
  const entries = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex < 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      entries[key] = value
    }
  }

  return entries
}

export const loadLocalEnv = () => {
  const envPath = resolve(projectRoot, '.env')

  if (!existsSync(envPath)) {
    return
  }

  const parsed = parseEnvFile(readFileSync(envPath, 'utf8'))

  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value
  }
}

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback
  }

  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase())
}

const toList = (value, fallback) => {
  const source = value?.trim() ? value : fallback

  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const resolveEnv = () => {
  loadLocalEnv()

  return {
    host: process.env.HOST || '127.0.0.1',
    port: toNumber(process.env.PORT, 4000),
    corsOrigins: toList(process.env.CORS_ORIGIN, 'http://localhost:3000,http://127.0.0.1:3000'),
    dataDir: resolve(projectRoot, process.env.DATA_DIR || './data'),
    defaultProfileId: process.env.DEFAULT_PROFILE_ID || 'default',
    provider: process.env.ASSISTANT_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'mock'),
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openAiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openAiEnableModeration: toBoolean(process.env.OPENAI_ENABLE_MODERATION, true),
  }
}
