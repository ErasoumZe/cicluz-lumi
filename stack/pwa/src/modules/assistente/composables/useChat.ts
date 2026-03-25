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
    introFlowActive,
  } = storeToRefs(chatStore)

  return {
    conversations,
    activeConversationId,
    activeConversation,
    loading,
    streaming,
    error,
    introFlowActive,
    initialize: chatStore.initialize,
    activateIntroFlow: chatStore.activateIntroFlow,
    deactivateIntroFlow: chatStore.deactivateIntroFlow,
    createConversation: chatStore.createConversation,
    selectConversation: chatStore.selectConversation,
    sendMessage: chatStore.sendMessage,
  }
}
