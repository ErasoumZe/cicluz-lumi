import { spawn } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const stackRoot = resolve(projectRoot, '..')
const apiRoot = resolve(stackRoot, 'api')
const apiEntry = resolve(apiRoot, 'src', 'server.mjs')
const rogueRoot = join(projectRoot, '127.0.0.1')
const rawArgs = process.argv.slice(2)

const hasExplicitHost = rawArgs.some((arg) => arg === '--host' || arg === '-H')
const isHostLike = (value) => /^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-z0-9.-]+\.[a-z]{2,})$/i.test(value)
const readExplicitPort = () => {
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index]

    if ((arg === '--port' || arg === '-p') && rawArgs[index + 1]) {
      return Number(rawArgs[index + 1])
    }

    if (arg.startsWith('--port=')) {
      return Number(arg.slice('--port='.length))
    }
  }

  return null
}

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

const childProcesses = []
const explicitPort = readExplicitPort()

const stopChildren = (signal = 'SIGTERM') => {
  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time))

const canBindToPort = (port, host = 'localhost') => {
  return new Promise((resolve) => {
    const probe = createServer()

    probe.once('error', () => {
      resolve(false)
    })

    probe.once('listening', () => {
      probe.close(() => resolve(true))
    })

    probe.listen(port, host)
  })
}

const waitForApi = async (baseUrl, attempts = 40) => {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`)

      if (response.ok) {
        return true
      }
    } catch {
      // ignore and retry
    }

    await wait(150)
  }

  return false
}

const startApiServer = async () => {
  if (!existsSync(apiEntry)) {
    return null
  }

  const apiBaseUrl = process.env.NUXT_PUBLIC_ASSISTANT_API_BASE_URL || 'http://127.0.0.1:4000'
  const apiChild = spawn(process.execPath, [apiEntry], {
    cwd: apiRoot,
    env: process.env,
    stdio: 'inherit',
  })

  childProcesses.push(apiChild)

  apiChild.on('error', (error) => {
    console.error('[assistente-api]', error)
  })

  const ready = await waitForApi(apiBaseUrl)

  if (!ready) {
    console.warn(`[assistente-api] nao respondeu em tempo util em ${apiBaseUrl}. O frontend pode cair no fallback local.`)
  }

  return apiChild
}

const nuxtBin = resolve(projectRoot, 'node_modules', 'nuxt', 'bin', 'nuxt.mjs')

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    stopChildren(signal)
    process.exit(0)
  })
}

const main = async () => {
  const targetPort = explicitPort || 3000

  if (!explicitPort) {
    const portAvailable = await canBindToPort(targetPort)

    if (!portAvailable) {
      console.error(`[pwa-dev] a porta ${targetPort} ja esta em uso. Pare a instancia antiga antes de iniciar o projeto, para nao abrir uma versao errada em outra porta.`)
      process.exit(1)
    }
  }

  await startApiServer()

  const child = spawn(process.execPath, [nuxtBin, 'dev', ...forwardArgs], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NUXT_PUBLIC_ASSISTANT_API_BASE_URL:
        process.env.NUXT_PUBLIC_ASSISTANT_API_BASE_URL || 'http://127.0.0.1:4000',
    },
    stdio: 'inherit',
  })

  childProcesses.push(child)

  child.on('error', (error) => {
    console.error(error)
    stopChildren()
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    stopChildren()

    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

void main()
