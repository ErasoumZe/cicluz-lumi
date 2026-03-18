export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  streaming: boolean
}

export interface ChatConversation {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

export interface SendMessagePayload {
  conversationId: string
  content: string
}

export interface StreamMessageOptions extends SendMessagePayload {
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
}

export interface ChatServiceResponse {
  conversationId: string
  message: ChatMessage
}
