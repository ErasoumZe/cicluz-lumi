import { storeToRefs } from 'pinia'
import { useChatStore } from '../stores/chatStore'

export const useChat = () => {
  const chatStore = useChatStore()
  const {
    conversations,
    activeConversationId,
    activeConversation,
    loading,
    streaming,
    error,
    introAnimationPrimed,
  } = storeToRefs(chatStore)

  return {
    conversations,
    activeConversationId,
    activeConversation,
    loading,
    streaming,
    error,
    introAnimationPrimed,
    initialize: chatStore.initialize,
    createConversation: chatStore.createConversation,
    selectConversation: chatStore.selectConversation,
    primeIntroAnimation: chatStore.primeIntroAnimation,
    resetIntroAnimation: chatStore.resetIntroAnimation,
    sendMessage: chatStore.sendMessage,
  }
}
