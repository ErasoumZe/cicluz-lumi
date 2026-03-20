export type ChatRole = 'user' | 'assistant'
export type CicluzPillar = 'EU' | 'SER' | 'TER' | 'MISTO'
export type ConversationMode = 'therapeutic' | 'planning' | 'hybrid'
export type SafetyRiskLevel = 'none' | 'attention' | 'crisis'
export type ChatServiceMode = 'api' | 'fallback'

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
  profileId?: string
  messages: ChatMessage[]
  summary?: ConversationSummary
}

export interface ProfileMemoryEntry {
  id: string
  pillar: Exclude<CicluzPillar, 'MISTO'>
  summary: string
  tags: string[]
  emotionalTone: string
  createdAt: string
  occurrences: number
}

export interface ProfileMemory {
  profileId: string
  updatedAt: string
  pillars: Record<'EU' | 'SER' | 'TER', ProfileMemoryEntry[]>
}

export interface ChatBootstrapResponse {
  profileId: string
  activeConversationId: string | null
  conversations: ChatConversation[]
  profileMemory: ProfileMemory
  serviceMode: ChatServiceMode
}

export interface CreateConversationPayload {
  profileId?: string
}

export interface SendMessagePayload {
  conversationId: string
  content: string
  profileId?: string
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
