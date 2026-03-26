import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useStreaming } from '../composables/useStreaming'
import { chatService } from '../services/chatService'
import type {
  AssistentePersistenceState,
  AssistenteView,
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  GalleryItem,
} from '../types/chat.types'

const DEFAULT_TITLE = 'Nova conversa'
const STORAGE_KEY = 'cicluz-assistente-state-v3'
const MAX_RECENT_FILES = 8
const MAX_GALLERY_ITEMS = 28
const MAX_PERSISTABLE_ATTACHMENT_SIZE = 850_000

const buildConversationTitle = (content: string, attachments: ChatAttachment[] = []) => {
  const normalized = content.replace(/\s+/g, ' ').trim()

  if (normalized) {
    return normalized.slice(0, 44) || DEFAULT_TITLE
  }

  return attachments[0]?.name?.slice(0, 44) || DEFAULT_TITLE
}

const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const createUserMessage = (content: string, attachments: ChatAttachment[] = []): ChatMessage => ({
  id: createId('user'),
  role: 'user',
  content,
  createdAt: new Date().toISOString(),
  streaming: false,
  attachments,
})

const createAssistantPlaceholder = (): ChatMessage => ({
  id: createId('assistant-stream'),
  role: 'assistant',
  content: '',
  createdAt: new Date().toISOString(),
  streaming: true,
  attachments: [],
})

const sortConversations = (items: ChatConversation[]) => {
  return [...items].sort((left, right) => {
    const leftDate = Date.parse(left.updatedAt || left.createdAt)
    const rightDate = Date.parse(right.updatedAt || right.createdAt)
    return rightDate - leftDate
  })
}

const cloneAttachment = (attachment: ChatAttachment): ChatAttachment => ({
  ...attachment,
  id: createId('attachment'),
  createdAt: new Date().toISOString(),
})

const canPersistAttachment = (attachment: ChatAttachment) => {
  return attachment.url.startsWith('data:') && attachment.size <= MAX_PERSISTABLE_ATTACHMENT_SIZE
}

const sanitizeMessageForPersistence = (message: ChatMessage): ChatMessage => ({
  ...message,
  attachments: (message.attachments ?? []).filter(canPersistAttachment),
})

const sanitizeConversationForPersistence = (conversation: ChatConversation): ChatConversation => ({
  ...conversation,
  messages: conversation.messages
    .filter((message) => !message.streaming)
    .map(sanitizeMessageForPersistence),
})

const sanitizeRecentFileForPersistence = (attachment: ChatAttachment) => {
  return canPersistAttachment(attachment)
}

const sanitizeGalleryItemForPersistence = (item: GalleryItem) => {
  return item.url.startsWith('data:')
}

const parsePersistedState = (): AssistentePersistenceState | null => {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<AssistentePersistenceState>

    return {
      conversations: sortConversations(parsed.conversations ?? []),
      activeConversationId: parsed.activeConversationId ?? null,
      galleryItems: (parsed.galleryItems ?? []).filter(sanitizeGalleryItemForPersistence),
      recentFiles: (parsed.recentFiles ?? []).filter(sanitizeRecentFileForPersistence),
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
      activeView: parsed.activeView === 'gallery' ? 'gallery' : 'chat',
    }
  } catch {
    return null
  }
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ChatConversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const introFlowActive = ref(false)
  const sidebarCollapsed = ref(false)
  const activeView = ref<AssistenteView>('chat')
  const recentFiles = ref<ChatAttachment[]>([])
  const galleryItems = ref<GalleryItem[]>([])
  const streamingState = useStreaming()
  const readyToPersist = ref(false)
  const initialized = ref(false)

  const activeConversation = computed(() => {
    return conversations.value.find((conversation) => conversation.id === activeConversationId.value) ?? null
  })

  const streaming = computed(() => streamingState.isStreaming.value)

  const upsertConversation = (conversation: ChatConversation) => {
    const next = conversations.value.filter((item) => item.id !== conversation.id)
    conversations.value = sortConversations([conversation, ...next])
  }

  const persistState = () => {
    if (!import.meta.client || !readyToPersist.value) {
      return
    }

    if (loading.value || streamingState.isStreaming.value) {
      return
    }

    const payload: AssistentePersistenceState = {
      conversations: conversations.value.map(sanitizeConversationForPersistence),
      activeConversationId: activeConversationId.value,
      galleryItems: galleryItems.value.filter(sanitizeGalleryItemForPersistence).slice(0, MAX_GALLERY_ITEMS),
      recentFiles: recentFiles.value.filter(sanitizeRecentFileForPersistence).slice(0, MAX_RECENT_FILES),
      sidebarCollapsed: sidebarCollapsed.value,
      activeView: activeView.value,
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage quota failures and keep the in-memory experience alive.
    }
  }

  if (import.meta.client) {
    watch(
      [conversations, activeConversationId, galleryItems, recentFiles, sidebarCollapsed, activeView],
      () => {
        persistState()
      },
      { deep: true },
    )
  }

  const ensureConversation = async () => {
    if (conversations.value.length > 0) {
      const hasActive = conversations.value.some((conversation) => conversation.id === activeConversationId.value)
      activeConversationId.value = hasActive ? activeConversationId.value : conversations.value[0]?.id || null
      return
    }

    const conversation = await chatService.createConversation()
    conversations.value = [conversation]
    activeConversationId.value = conversation.id
  }

  const initialize = async () => {
    if (initialized.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const persisted = parsePersistedState()

      if (persisted) {
        conversations.value = sortConversations(persisted.conversations)
        activeConversationId.value = persisted.activeConversationId
        galleryItems.value = persisted.galleryItems
        recentFiles.value = persisted.recentFiles
        sidebarCollapsed.value = persisted.sidebarCollapsed
        activeView.value = persisted.activeView
      } else {
        const bootstrap = await chatService.fetchBootstrap()
        conversations.value = sortConversations(bootstrap.conversations)
        activeConversationId.value =
          bootstrap.activeConversationId || bootstrap.conversations[0]?.id || null
      }

      await ensureConversation()
      error.value = null
      introFlowActive.value = false
      initialized.value = true
    } catch {
      error.value = 'Não foi possível iniciar a Lumi.'
      await ensureConversation()
    } finally {
      loading.value = false
      readyToPersist.value = true
      persistState()
    }
  }

  const activateIntroFlow = () => {
    introFlowActive.value = true
  }

  const deactivateIntroFlow = () => {
    introFlowActive.value = false
  }

  const setActiveView = (view: AssistenteView) => {
    activeView.value = view
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const rememberRecentFile = (attachment: ChatAttachment) => {
    const next = recentFiles.value.filter((item) => item.url !== attachment.url)
    recentFiles.value = [attachment, ...next].slice(0, MAX_RECENT_FILES)
  }

  const saveAttachmentToGallery = (attachment: ChatAttachment, options?: {
    conversationId?: string | null
    messageId?: string | null
    prompt?: string
  }) => {
    if (attachment.kind !== 'image') {
      return
    }

    if (galleryItems.value.some((item) => item.url === attachment.url)) {
      return
    }

    galleryItems.value = [
      {
        id: createId('gallery'),
        name: attachment.name,
        url: attachment.url,
        createdAt: new Date().toISOString(),
        prompt: options?.prompt,
        sourceConversationId: options?.conversationId ?? null,
        sourceMessageId: options?.messageId ?? null,
      },
      ...galleryItems.value,
    ].slice(0, MAX_GALLERY_ITEMS)
  }

  const removeGalleryItem = (galleryItemId: string) => {
    galleryItems.value = galleryItems.value.filter((item) => item.id !== galleryItemId)
  }

  const createConversation = async () => {
    const conversation = await chatService.createConversation()

    upsertConversation(conversation)
    activeConversationId.value = conversation.id
    activeView.value = 'chat'
    error.value = null
    introFlowActive.value = false

    return conversation
  }

  const selectConversation = (conversationId: string) => {
    activeConversationId.value = conversationId
    activeView.value = 'chat'
    error.value = null
    introFlowActive.value = false
  }

  const sendMessage = async (rawContent: string, incomingAttachments: ChatAttachment[] = []) => {
    const content = rawContent.trim()
    const attachments = incomingAttachments.map(cloneAttachment)

    if ((!content && attachments.length === 0) || loading.value || streaming.value) {
      return
    }

    const conversation = activeConversation.value ?? await createConversation()
    const userMessage = createUserMessage(content, attachments)
    const assistantPlaceholder = createAssistantPlaceholder()
    const isFirstExchange = conversation.messages.every((message) => message.id === 'message-initial')
    const shouldUpdateTitle =
      conversation.title === DEFAULT_TITLE ||
      conversation.messages.every((message) => message.role === 'assistant')

    if (isFirstExchange) {
      introFlowActive.value = true
    }

    if (shouldUpdateTitle) {
      conversation.title = buildConversationTitle(content, attachments)
    }

    for (const attachment of attachments) {
      rememberRecentFile(attachment)
    }

      conversation.messages.push(userMessage, assistantPlaceholder)
      const assistantMessage = conversation.messages[conversation.messages.length - 1]

      if (!assistantMessage) {
        return
      }
    conversation.updatedAt = userMessage.createdAt
    loading.value = true
    error.value = null
    activeView.value = 'chat'
    streamingState.start()

    try {
      let introFlowReleased = false
      const response = await chatService.streamMessage({
        conversationId: conversation.id,
        content,
        attachments,
        messages: conversation.messages.filter((message) => message.id !== assistantPlaceholder.id),
        onChunk: (chunk) => {
          if (isFirstExchange && !introFlowReleased && chunk.trim()) {
            introFlowReleased = true
            introFlowActive.value = false
          }

            streamingState.append(chunk)
            assistantMessage.content += chunk
          },
        })

        assistantMessage.id = response.message.id
        assistantMessage.createdAt = response.message.createdAt
        assistantMessage.content = response.message.content
        assistantMessage.streaming = false
        assistantMessage.attachments = response.message.attachments ?? []
        assistantMessage.metadata = response.message.metadata
        conversation.updatedAt = response.message.createdAt

        for (const attachment of assistantMessage.attachments) {
          if (attachment.kind === 'image' && attachment.source === 'generated') {
            saveAttachmentToGallery(attachment, {
              conversationId: conversation.id,
              messageId: assistantMessage.id,
              prompt: userMessage.content,
            })
          }
        }

      upsertConversation(conversation)
      activeConversationId.value = conversation.id

      if (isFirstExchange) {
        introFlowActive.value = false
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : 'Não consegui concluir a resposta da Lumi.'

        assistantMessage.content = message
        assistantMessage.streaming = false
        assistantMessage.attachments = []
      conversation.updatedAt = new Date().toISOString()
      error.value = message
      introFlowActive.value = false
      upsertConversation(conversation)
    } finally {
      loading.value = false
      streamingState.finish()
      streamingState.reset()
      persistState()
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    loading,
    streaming,
    error,
    introFlowActive,
    sidebarCollapsed,
    activeView,
    recentFiles,
    galleryItems,
    initialize,
    activateIntroFlow,
    deactivateIntroFlow,
    setActiveView,
    toggleSidebar,
    rememberRecentFile,
    saveAttachmentToGallery,
    removeGalleryItem,
    createConversation,
    selectConversation,
    sendMessage,
  }
})
