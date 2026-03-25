import type {
  ChatBootstrapResponse,
  ChatConversation,
  ChatServiceResponse,
  StreamMessageOptions,
} from '../types/chat.types'

const STREAM_DELAY_MS = 18

const wait = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
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
    activeConversationId: conversation.id,
    conversations: [conversation],
  }
}

const buildLocalReply = (content: string) => {
  const normalized = content.replace(/\s+/g, ' ').trim()
  const preview = normalized.slice(0, 140)

  return [
    'Ambiente local pronto para retomarmos a montagem da Lumi.',
    'O backend e o historico persistente foram removidos por enquanto.',
    preview ? `Entrada recebida: "${preview}".` : '',
    'Quando voltarmos a implementar, a resposta real, a memoria e as integracoes entram neste ponto.',
  ].filter(Boolean).join('\n\n')
}

const streamText = async (content: string, options: StreamMessageOptions) => {
  for (const character of content) {
    if (options.signal?.aborted) {
      throw new Error('Streaming aborted')
    }

    options.onChunk?.(character)
    await wait(STREAM_DELAY_MS)
  }
}

export const chatService = {
  async fetchBootstrap(): Promise<ChatBootstrapResponse> {
    return createFallbackBootstrap()
  },

  async createConversation(): Promise<ChatConversation> {
    return createFallbackConversation()
  },

  async streamMessage(options: StreamMessageOptions): Promise<ChatServiceResponse> {
    const message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: buildLocalReply(options.content),
      createdAt: new Date().toISOString(),
      streaming: false,
    }

    await streamText(message.content, options)

    return {
      conversationId: options.conversationId,
      message,
    }
  },
}
