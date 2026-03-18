import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStreaming } from '../composables/useStreaming'
import { chatService } from '../services/chatService'
import type { ChatConversation, ChatMessage } from '../types/chat.types'

const DEFAULT_TITLE = 'Nova conversa'

const buildConversationTitle = (content: string) => {
  const normalized = content.replace(/\s+/g, ' ').trim()
  return normalized.slice(0, 44) || DEFAULT_TITLE
}

const createUserMessage = (content: string): ChatMessage => ({
  id: `user-${Date.now()}`,
  role: 'user',
  content,
  createdAt: new Date().toISOString(),
  streaming: false,
})

const createAssistantPlaceholder = (): ChatMessage => ({
  id: `assistant-stream-${Date.now()}`,
  role: 'assistant',
  content: '',
  createdAt: new Date().toISOString(),
  streaming: true,
})

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ChatConversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const introAnimationPrimed = ref(false)
  const streamingState = useStreaming()

  const activeConversation = computed(() => {
    return conversations.value.find((conversation) => conversation.id === activeConversationId.value) ?? null
  })

  const streaming = computed(() => streamingState.isStreaming.value)

  const ensureConversation = () => {
    if (activeConversation.value) {
      return activeConversation.value
    }

    return createConversation()
  }

  const initialize = async () => {
    if (initialized.value && conversations.value.length > 0) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const initialConversation = await chatService.fetchInitialConversation()
      conversations.value = [initialConversation]
      activeConversationId.value = initialConversation.id
      initialized.value = true
    } catch {
      error.value = 'N\u00e3o foi poss\u00edvel iniciar a Lumi.'
    } finally {
      loading.value = false
    }
  }

  const createConversation = () => {
    const now = new Date().toISOString()
    const conversation: ChatConversation = {
      id: `conversation-${Date.now()}`,
      title: DEFAULT_TITLE,
      createdAt: now,
      messages: [],
    }

    conversations.value = [conversation, ...conversations.value]
    activeConversationId.value = conversation.id
    error.value = null
    introAnimationPrimed.value = false

    return conversation
  }

  const selectConversation = (conversationId: string) => {
    activeConversationId.value = conversationId
    error.value = null
    introAnimationPrimed.value = false
  }

  const primeIntroAnimation = () => {
    introAnimationPrimed.value = true
  }

  const resetIntroAnimation = () => {
    introAnimationPrimed.value = false
  }

  const sendMessage = async (rawContent: string) => {
    const content = rawContent.trim()

    if (!content || loading.value || streaming.value) {
      return
    }

    const conversation = ensureConversation()
    const userMessage = createUserMessage(content)
    const assistantPlaceholder = createAssistantPlaceholder()
    const shouldUpdateTitle =
      conversation.title === DEFAULT_TITLE ||
      conversation.messages.every((message) => message.role === 'assistant')

    if (shouldUpdateTitle) {
      conversation.title = buildConversationTitle(content)
    }

    conversation.messages.push(userMessage, assistantPlaceholder)
    loading.value = true
    error.value = null
    streamingState.start()

    try {
      const response = await chatService.streamMessage({
        conversationId: conversation.id,
        content,
        onChunk: (chunk) => {
          streamingState.append(chunk)
          assistantPlaceholder.content = streamingState.content.value
        },
      })

      assistantPlaceholder.id = response.message.id
      assistantPlaceholder.createdAt = response.message.createdAt
      assistantPlaceholder.content = response.message.content
      assistantPlaceholder.streaming = false
      initialized.value = true
    } catch {
      assistantPlaceholder.content = 'N\u00e3o consegui concluir a resposta. Tente novamente.'
      assistantPlaceholder.streaming = false
      error.value = 'Erro ao gerar resposta da Lumi.'
    } finally {
      loading.value = false
      introAnimationPrimed.value = false
      streamingState.finish()
      streamingState.reset()
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    loading,
    streaming,
    error,
    introAnimationPrimed,
    initialize,
    createConversation,
    selectConversation,
    primeIntroAnimation,
    resetIntroAnimation,
    sendMessage,
  }
})
