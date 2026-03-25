export type ChatRole = 'user' | 'assistant'
export type CicluzPillar = 'EU' | 'SER' | 'TER' | 'MISTO'
export type ConversationMode = 'therapeutic' | 'planning' | 'hybrid'
export type SafetyRiskLevel = 'none' | 'attention' | 'crisis'

export interface ChatAnalysis {
  dominantPillar: CicluzPillar
  pillarScores: Record<'EU' | 'SER' | 'TER', number>
  confidence: number
  mode: ConversationMode
  emotionalTone: string
  tags: string[]
  methodologyLens: string
  riskLevel: SafetyRiskLevel
}

export interface ChatMessageMetadata {
  analysis?: ChatAnalysis
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  streaming: boolean
  metadata?: ChatMessageMetadata
}

export interface ConversationSummary {
  dominantPillar: CicluzPillar
  lastUserPillar: CicluzPillar
  therapeutic: boolean
  lastMessageAt: string | null
}

export interface ChatConversation {
  id: string
  title: string
  createdAt: string
  updatedAt?: string
  messages: ChatMessage[]
  summary?: ConversationSummary
}

export interface ChatBootstrapResponse {
  activeConversationId: string | null
  conversations: ChatConversation[]
}

export interface CreateConversationPayload {}

export interface SendMessagePayload {
  conversationId: string
  content: string
}

export interface StreamMessageOptions extends SendMessagePayload {
  messages?: ChatMessage[]
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
}

export interface ChatServiceResponse {
  conversationId: string
  conversation?: ChatConversation
  message: ChatMessage
}
