import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const ensureDir = async (path) => {
  await mkdir(path, { recursive: true })
}

export const readJsonFile = async (path, fallback) => {
  try {
    const source = await readFile(path, 'utf8')
    return JSON.parse(source)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return fallback
    }

    throw error
  }
}

export const writeJsonFile = async (path, payload) => {
  await ensureDir(dirname(path))
  const tempPath = `${path}.tmp`
  await writeFile(tempPath, JSON.stringify(payload, null, 2))
  await rename(tempPath, path)
}

export const listJsonFiles = async (path) => {
  try {
    const entries = await readdir(path, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => join(path, entry.name))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}
