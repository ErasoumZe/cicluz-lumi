import { createServer } from 'node:http'
import { resolveEnv } from './config/env.mjs'
import { createConversationRepository } from './modules/assistente/infra/conversationRepository.mjs'
import { createProfileMemoryRepository } from './modules/assistente/infra/profileMemoryRepository.mjs'
import { createAssistenteProvider } from './modules/assistente/application/providerFactory.mjs'
import { createAssistenteService } from './modules/assistente/application/assistenteService.mjs'

const env = resolveEnv()
const conversationRepository = createConversationRepository({
  dataDir: env.dataDir,
  defaultProfileId: env.defaultProfileId,
})
const profileMemoryRepository = createProfileMemoryRepository({
  dataDir: env.dataDir,
  defaultProfileId: env.defaultProfileId,
})
const provider = createAssistenteProvider(env)
const assistenteService = createAssistenteService({
  conversationRepository,
  profileMemoryRepository,
  provider,
  defaultProfileId: env.defaultProfileId,
})

const createCorsHeaders = (origin) => {
  const allowAnyOrigin = env.corsOrigins.includes('*')
  const normalizedOrigin = typeof origin === 'string' ? origin : ''
  const allowedOrigin = allowAnyOrigin
    ? '*'
    : env.corsOrigins.includes(normalizedOrigin)
      ? normalizedOrigin
      : env.corsOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

const sendJson = (response, statusCode, payload, headers = {}) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  })

  response.end(JSON.stringify(payload))
}

const sendSseHeaders = (response, headers = {}) => {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...headers,
  })

  response.flushHeaders?.()
}

const sendSseEvent = (response, event, payload) => {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const getProfileId = (requestUrl, body) => {
  return requestUrl.searchParams.get('profileId') || body?.profileId || env.defaultProfileId
}

const notFound = (response, headers) => {
  sendJson(response, 404, { error: 'Route not found.' }, headers)
}

const matchConversationRoute = (pathname) => {
  const match = pathname.match(/^\/api\/assistente\/conversations\/([^/]+)$/)
  return match ? match[1] : null
}

const server = createServer(async (request, response) => {
  const requestOrigin = request.headers.origin
  const corsHeaders = createCorsHeaders(requestOrigin)
  const url = new URL(request.url || '/', `http://${request.headers.host || `${env.host}:${env.port}`}`)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders)
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(
        response,
        200,
        {
          status: 'ok',
          provider: provider.name,
          timestamp: new Date().toISOString(),
        },
        corsHeaders,
      )
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/assistente/bootstrap') {
      const profileId = getProfileId(url)
      sendJson(response, 200, await assistenteService.getBootstrap(profileId), corsHeaders)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/assistente/conversations') {
      const profileId = getProfileId(url)
      sendJson(response, 200, await assistenteService.listConversations(profileId), corsHeaders)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/assistente/conversations') {
      const body = await readJsonBody(request)
      const profileId = getProfileId(url, body)
      sendJson(response, 201, await assistenteService.createConversation(profileId), corsHeaders)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/assistente/memory') {
      const profileId = getProfileId(url)
      sendJson(response, 200, await profileMemoryRepository.get(profileId), corsHeaders)
      return
    }

    if (request.method === 'GET') {
      const conversationId = matchConversationRoute(url.pathname)

      if (conversationId) {
        const profileId = getProfileId(url)
        const conversation = await assistenteService.getConversation(profileId, conversationId)

        if (!conversation) {
          notFound(response, corsHeaders)
          return
        }

        sendJson(response, 200, conversation, corsHeaders)
        return
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/assistente/messages/stream') {
      const body = await readJsonBody(request)
      const profileId = getProfileId(url, body)
      const controller = new AbortController()
      const abortStreaming = () => {
        if (!response.writableEnded) {
          controller.abort()
        }
      }

      request.on('aborted', abortStreaming)
      response.on('close', abortStreaming)

      sendSseHeaders(response, corsHeaders)
      sendSseEvent(response, 'ready', {
        profileId,
        conversationId: body.conversationId || null,
      })

      const payload = await assistenteService.streamMessage({
        profileId,
        conversationId: body.conversationId,
        content: body.content,
        onChunk: (chunk) => {
          sendSseEvent(response, 'chunk', { chunk })
        },
        signal: controller.signal,
      })

      sendSseEvent(response, 'done', payload)
      response.end()
      return
    }

    notFound(response, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'

    if (response.headersSent) {
      sendSseEvent(response, 'error', { message })
      response.end()
      return
    }

    sendJson(response, 500, { error: message }, corsHeaders)
  }
})

server.listen(env.port, env.host, () => {
  console.log(`[assistente-api] listening on http://${env.host}:${env.port} using provider "${provider.name}"`)
})
