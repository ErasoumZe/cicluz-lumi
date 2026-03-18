import { spawn } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const rogueRoot = join(projectRoot, '127.0.0.1')
const rawArgs = process.argv.slice(2)

const hasExplicitHost = rawArgs.some((arg) => arg === '--host' || arg === '-H')
const isHostLike = (value) => /^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-z0-9.-]+\.[a-z]{2,})$/i.test(value)

const forwardArgs = []
let injectedHost = false

for (const arg of rawArgs) {
  if (!hasExplicitHost && !injectedHost && !arg.startsWith('-') && isHostLike(arg)) {
    forwardArgs.push('--host', arg)
    injectedHost = true
    continue
  }

  forwardArgs.push(arg)
}

if (existsSync(rogueRoot)) {
  const entries = readdirSync(rogueRoot, { withFileTypes: true })
  const removableEntries = new Set(['.nuxt', 'node_modules'])
  const onlyGeneratedContent = entries.every((entry) => removableEntries.has(entry.name))

  if (onlyGeneratedContent) {
    rmSync(rogueRoot, { recursive: true, force: true })
  }
}

const nuxtBin = resolve(projectRoot, 'node_modules', 'nuxt', 'bin', 'nuxt.mjs')
const child = spawn(process.execPath, [nuxtBin, 'dev', ...forwardArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
