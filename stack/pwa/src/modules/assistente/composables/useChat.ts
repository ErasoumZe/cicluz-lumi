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
    sidebarCollapsed,
    activeView,
    recentFiles,
    galleryItems,
  } = storeToRefs(chatStore)

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
    initialize: chatStore.initialize,
    activateIntroFlow: chatStore.activateIntroFlow,
    deactivateIntroFlow: chatStore.deactivateIntroFlow,
    setActiveView: chatStore.setActiveView,
    toggleSidebar: chatStore.toggleSidebar,
    rememberRecentFile: chatStore.rememberRecentFile,
    saveAttachmentToGallery: chatStore.saveAttachmentToGallery,
    removeGalleryItem: chatStore.removeGalleryItem,
    createConversation: chatStore.createConversation,
    selectConversation: chatStore.selectConversation,
    sendMessage: chatStore.sendMessage,
  }
}
