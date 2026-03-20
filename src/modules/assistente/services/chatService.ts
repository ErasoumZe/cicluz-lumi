import type {
  ChatConversation,
  ChatMessage,
  ChatServiceResponse,
  StreamMessageOptions,
} from '../types/chat.types'

const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

const splitIntoChunks = (text: string) => {
  const words = text.split(/(\s+)/).filter(Boolean)
  const chunks: string[] = []

  for (let index = 0; index < words.length; index += 3) {
    chunks.push(words.slice(index, index + 3).join(''))
  }

  return chunks
}

const buildAssistantReply = (prompt: string) => {
  const normalizedPrompt = prompt.trim()
  const lowerPrompt = normalizedPrompt.toLowerCase()

  if (lowerPrompt.includes('tarefa')) {
    return [
      'Perfeito. Posso transformar isso em uma tarefa dentro da Cicluz.',
      '',
      'Pr\u00f3ximos passos sugeridos:',
      '- definir o t\u00edtulo da tarefa',
      '- escolher prazo ou janela de entrega',
      '- indicar contexto e prioridade',
      '',
      'Se quiser, eu posso estruturar isso em formato de checklist.',
    ].join('\n')
  }

  if (lowerPrompt.includes('agenda') || lowerPrompt.includes('calend')) {
    return [
      'Entendi. Vou te ajudar a navegar na agenda da forma mais objetiva poss\u00edvel.',
      '',
      'Posso seguir por estes caminhos:',
      '- resumir os compromissos do dia',
      '- reorganizar hor\u00e1rios',
      '- separar blocos de foco e reuni\u00f5es',
      '',
      'Me diga o per\u00edodo ou o contexto e eu monto a leitura da agenda.',
    ].join('\n')
  }

  return [
    `Claro. Recebi este contexto: "${normalizedPrompt}".`,
    '',
    'Posso te ajudar agora a:',
    '- organizar tarefas',
    '- planejar compromissos',
    '- estruturar ideias',
    '- navegar na agenda',
    '',
    'Se quiser, eu posso converter isso em um plano do dia ou em uma lista de a\u00e7\u00f5es objetivas.',
  ].join('\n')
}

export const chatService = {
  async fetchInitialConversation(): Promise<ChatConversation> {
    const now = new Date().toISOString()

    return {
      id: 'conversation-initial',
      title: 'Nova conversa',
      createdAt: now,
      messages: [],
    }
  },

  async streamMessage(options: StreamMessageOptions): Promise<ChatServiceResponse> {
    const createdAt = new Date().toISOString()
    const fullContent = buildAssistantReply(options.content)
    const chunks = splitIntoChunks(fullContent)

    for (const chunk of chunks) {
      if (options.signal?.aborted) {
        throw new Error('Streaming aborted')
      }

      await wait(65)
      options.onChunk?.(chunk)
    }

    const message: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: fullContent,
      createdAt,
      streaming: false,
    }

    return {
      conversationId: options.conversationId,
      message,
    }
  },
}
