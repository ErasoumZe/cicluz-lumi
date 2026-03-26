export type ChatRole = 'user' | 'assistant'
export type CicluzPillar = 'EU' | 'SER' | 'TER' | 'MISTO'
export type ConversationMode = 'therapeutic' | 'planning' | 'hybrid'
export type SafetyRiskLevel = 'none' | 'attention' | 'crisis'
export type ChatAttachmentKind = 'image' | 'file' | 'audio'
export type ChatAttachmentSource = 'upload' | 'recording' | 'generated'
export type AssistenteView = 'chat' | 'gallery'

export interface ChatAttachment {
  id: string
  kind: ChatAttachmentKind
  source: ChatAttachmentSource
  name: string
  mimeType: string
  size: number
  url: string
  createdAt: string
  description?: string
  durationMs?: number | null
  transcript?: string
}

export interface GalleryItem {
  id: string
  name: string
  url: string
  createdAt: string
  prompt?: string
  sourceConversationId?: string | null
  sourceMessageId?: string | null
}

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
  attachments?: ChatAttachment[]
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

export interface AssistentePersistenceState {
  conversations: ChatConversation[]
  activeConversationId: string | null
  galleryItems: GalleryItem[]
  recentFiles: ChatAttachment[]
  sidebarCollapsed: boolean
  activeView: AssistenteView
}

export interface CreateConversationPayload {}

export interface SendMessagePayload {
  conversationId: string
  content: string
}

export interface StreamMessageOptions extends SendMessagePayload {
  messages?: ChatMessage[]
  attachments?: ChatAttachment[]
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
}

export interface ChatServiceResponse {
  conversationId: string
  conversation?: ChatConversation
  message: ChatMessage
}
