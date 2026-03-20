import { useRuntimeConfig } from '#imports'
import type {
  ChatBootstrapResponse,
  ChatConversation,
  ChatServiceResponse,
  CreateConversationPayload,
  StreamMessageOptions,
} from '../types/chat.types'

type StreamEventPayload =
  | { chunk: string }
  | { message: string }
  | ChatServiceResponse

const getApiBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.assistantApiBaseUrl.replace(/\/$/, '')
}

const buildApiUnavailableError = (cause?: unknown) => {
  const detail =
    cause instanceof Error && cause.message
      ? ` Detalhe: ${cause.message}`
      : ''

  return new Error(
    `A API metodologica da Lumi nao respondeu em ${getApiBaseUrl()}. Inicie stack/api e recarregue o assistente.${detail}`,
  )
}

const createFallbackConversation = (): ChatConversation => {
  const now = new Date().toISOString()

  return {
    id: `conversation-${Date.now()}`,
    title: 'Nova conversa',
    createdAt: now,
    updatedAt: now,
    messages: [],
    summary: {
      dominantPillar: 'MISTO',
      lastUserPillar: 'MISTO',
      therapeutic: false,
      lastMessageAt: null,
    },
  }
}

const createFallbackBootstrap = (): ChatBootstrapResponse => {
  const conversation = createFallbackConversation()

  return {
    profileId: 'default',
    activeConversationId: conversation.id,
    conversations: [conversation],
    profileMemory: {
      profileId: 'default',
      updatedAt: new Date().toISOString(),
      pillars: {
        EU: [],
        SER: [],
        TER: [],
      },
    },
    serviceMode: 'fallback',
  }
}

const readResponseError = async (response: Response) => {
  try {
    const payload = await response.json()

    if (typeof payload?.error === 'string') {
      return payload.error
    }
  } catch {
    // noop
  }

  return response.statusText || 'Unexpected API error'
}

const isStreamErrorPayload = (payload: StreamEventPayload): payload is { message: string } => {
  return typeof (payload as { message?: unknown }).message === 'string'
}

const isStreamDonePayload = (payload: StreamEventPayload): payload is ChatServiceResponse => {
  return (
    typeof (payload as { conversationId?: unknown }).conversationId === 'string' &&
    typeof (payload as { message?: { id?: unknown } }).message?.id === 'string'
  )
}

const consumeStreamResponse = async (
  response: Response,
  options: StreamMessageOptions,
): Promise<ChatServiceResponse> => {
  if (!response.body) {
    throw new Error('Resposta de streaming indisponivel.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let donePayload: ChatServiceResponse | null = null

  while (true) {
    if (options.signal?.aborted) {
      await reader.cancel()
      throw new Error('Streaming aborted')
    }

    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      let event = 'message'
      const dataLines: string[] = []

      for (const line of frame.split('\n')) {
        const normalizedLine = line.trim()

        if (!normalizedLine) {
          continue
        }

        if (normalizedLine.startsWith('event:')) {
          event = normalizedLine.slice(6).trim()
          continue
        }

        if (normalizedLine.startsWith('data:')) {
          dataLines.push(normalizedLine.slice(5).trim())
        }
      }

      if (dataLines.length === 0) {
        continue
      }

      const payload = JSON.parse(dataLines.join('\n')) as StreamEventPayload

      if (event === 'chunk' && 'chunk' in payload) {
        options.onChunk?.(payload.chunk)
        continue
      }

      if (event === 'error' && isStreamErrorPayload(payload)) {
        throw new Error(payload.message || 'Erro ao gerar resposta da Lumi.')
      }

      if (event === 'done' && isStreamDonePayload(payload)) {
        donePayload = payload
      }
    }
  }

  if (!donePayload) {
    throw new Error('Streaming finalizado sem payload final.')
  }

  return donePayload
}

export const chatService = {
  async fetchBootstrap(profileId = 'default'): Promise<ChatBootstrapResponse> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/assistente/bootstrap?profileId=${encodeURIComponent(profileId)}`)

      if (!response.ok) {
        throw new Error(await readResponseError(response))
      }

      return (await response.json()) as ChatBootstrapResponse
    } catch (error) {
      console.warn('[assistente] bootstrap local fallback ativado.', error)
      return createFallbackBootstrap()
    }
  },

  async createConversation(payload: CreateConversationPayload = {}): Promise<ChatConversation> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/assistente/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: payload.profileId || 'default',
        }),
      })

      if (!response.ok) {
        throw new Error(await readResponseError(response))
      }

      return (await response.json()) as ChatConversation
    } catch (error) {
      console.warn('[assistente] createConversation local fallback ativado.', error)
      return createFallbackConversation()
    }
  },

  async streamMessage(options: StreamMessageOptions): Promise<ChatServiceResponse> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/assistente/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: options.profileId || 'default',
          conversationId: options.conversationId,
          content: options.content,
        }),
        signal: options.signal,
      })

      if (!response.ok) {
        throw new Error(await readResponseError(response))
      }

      return await consumeStreamResponse(response, options)
    } catch (error) {
      if (options.signal?.aborted) {
        throw error
      }

      console.warn('[assistente] streaming abortado por indisponibilidade da API.', error)
      throw buildApiUnavailableError(error)
    }
  },
}
