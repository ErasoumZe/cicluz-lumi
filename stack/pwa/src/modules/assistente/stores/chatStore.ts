import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStreaming } from '../composables/useStreaming'
import { chatService } from '../services/chatService'
import type { ChatConversation, ChatMessage, ProfileMemory } from '../types/chat.types'

const DEFAULT_TITLE = 'Nova conversa'
const DEFAULT_PROFILE_ID = 'default'

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
  const profileId = ref(DEFAULT_PROFILE_ID)
  const profileMemory = ref<ProfileMemory>({
    profileId: DEFAULT_PROFILE_ID,
    updatedAt: new Date().toISOString(),
    pillars: {
      EU: [],
      SER: [],
      TER: [],
    },
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const introAnimationPrimed = ref(false)
  const streamingState = useStreaming()

  const activeConversation = computed(() => {
    return conversations.value.find((conversation) => conversation.id === activeConversationId.value) ?? null
  })

  const streaming = computed(() => streamingState.isStreaming.value)
  const sortConversations = (items: ChatConversation[]) => {
    return [...items].sort((left, right) => {
      const leftDate = Date.parse(left.updatedAt || left.createdAt)
      const rightDate = Date.parse(right.updatedAt || right.createdAt)
      return rightDate - leftDate
    })
  }

  const upsertConversation = (conversation: ChatConversation) => {
    const next = conversations.value.filter((item) => item.id !== conversation.id)
    conversations.value = sortConversations([conversation, ...next])
  }

  const initialize = async () => {
    if (initialized.value && conversations.value.length > 0) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const bootstrap = await chatService.fetchBootstrap(profileId.value)
      profileId.value = bootstrap.profileId
      profileMemory.value = bootstrap.profileMemory
      conversations.value = sortConversations(bootstrap.conversations)
      activeConversationId.value =
        bootstrap.activeConversationId || bootstrap.conversations[0]?.id || null
      error.value =
        bootstrap.serviceMode === 'fallback'
          ? 'A API da Lumi nao esta conectada. Inicie stack/api para respostas terapeuticas, memoria e classificacao por pilar.'
          : null
      initialized.value = true
    } catch {
      error.value = 'N\u00e3o foi poss\u00edvel iniciar a Lumi.'
    } finally {
      loading.value = false
    }
  }

  const createConversation = async () => {
    try {
      const conversation = await chatService.createConversation({
        profileId: profileId.value,
      })

      upsertConversation(conversation)
      activeConversationId.value = conversation.id
      error.value = null
      introAnimationPrimed.value = false

      return conversation
    } catch {
      const now = new Date().toISOString()
      const conversation: ChatConversation = {
        id: `conversation-${Date.now()}`,
        title: DEFAULT_TITLE,
        createdAt: now,
        updatedAt: now,
        messages: [],
      }

      upsertConversation(conversation)
      activeConversationId.value = conversation.id
      error.value = null
      introAnimationPrimed.value = false

      return conversation
    }
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

    const conversation = activeConversation.value ?? await createConversation()
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
        profileId: profileId.value,
        onChunk: (chunk) => {
          streamingState.append(chunk)
          assistantPlaceholder.content = streamingState.content.value
        },
      })

      if (response.conversation) {
        upsertConversation(response.conversation)
        activeConversationId.value = response.conversation.id
      } else {
        assistantPlaceholder.id = response.message.id
        assistantPlaceholder.createdAt = response.message.createdAt
        assistantPlaceholder.content = response.message.content
        assistantPlaceholder.streaming = false
        upsertConversation(conversation)
      }

      const bootstrap = await chatService.fetchBootstrap(profileId.value)
      profileMemory.value = bootstrap.profileMemory
      initialized.value = true
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : 'Nao consegui concluir a resposta da Lumi.'

      assistantPlaceholder.content = message
      assistantPlaceholder.streaming = false
      error.value = message
      upsertConversation(conversation)
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
    profileId,
    profileMemory,
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
