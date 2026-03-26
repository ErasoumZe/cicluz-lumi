import type {
  ChatAttachment,
  ChatBootstrapResponse,
  ChatConversation,
  ChatMessage,
  ChatServiceResponse,
  CicluzPillar,
  StreamMessageOptions,
} from '../types/chat.types'

const STREAM_DELAY_MS = 28

const wait = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const createFallbackConversation = (): ChatConversation => {
  const now = new Date().toISOString()

  return {
    id: createId('conversation'),
    title: 'Nova conversa',
    createdAt: now,
    updatedAt: now,
    messages: [],
    summary: {
      dominantPillar: 'MISTO',
      lastUserPillar: 'MISTO',
      therapeutic: false,
      lastMessageAt: null,
    },
  }
}

const createFallbackBootstrap = (): ChatBootstrapResponse => {
  const conversation = createFallbackConversation()

  return {
    activeConversationId: conversation.id,
    conversations: [conversation],
  }
}

const normalizeText = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

const inferPillar = (content: string): CicluzPillar => {
  const text = normalizeText(content)

  const euKeywords = [
    'eu',
    'sinto',
    'sentindo',
    'emocao',
    'ansiedade',
    'medo',
    'inseguranca',
    'autoconhecimento',
    'culpa',
    'cansado',
    'cansada',
  ]
  const serKeywords = [
    'rotina',
    'trabalho',
    'relacao',
    'relacionamento',
    'habito',
    'escolha',
    'identidade',
    'carreira',
    'direcao',
    'presenca',
  ]
  const terKeywords = [
    'dinheiro',
    'recursos',
    'meta',
    'metas',
    'resultado',
    'organizar',
    'planejar',
    'tempo',
    'projeto',
    'casa',
    'material',
  ]

  const score = (keywords: string[]) => {
    return keywords.reduce((total, keyword) => {
      return total + (text.includes(keyword) ? 1 : 0)
    }, 0)
  }

  const eu = score(euKeywords)
  const ser = score(serKeywords)
  const ter = score(terKeywords)
  const max = Math.max(eu, ser, ter)

  if (max === 0) {
    return 'MISTO'
  }

  const winners = [
    eu === max ? 'EU' : null,
    ser === max ? 'SER' : null,
    ter === max ? 'TER' : null,
  ].filter(Boolean)

  if (winners.length !== 1) {
    return 'MISTO'
  }

  return winners[0] as CicluzPillar
}

const inferMode = (content: string) => {
  const text = normalizeText(content)

  if (/(organizar|planejar|passo|acao|plano|decisao|prioridade|rotina|agenda|meta)/.test(text)) {
    return 'planning' as const
  }

  if (/(sinto|emocao|medo|ansiedade|triste|culpa|confuso|confusa|vulneravel)/.test(text)) {
    return 'reflection' as const
  }

  return 'hybrid' as const
}

const detectImageIntent = (content: string) => {
  return /(imagem|arte|visual|moodboard|poster|capa|ilustr|cri[ae]r? uma imagem|gerar? imagem|logo)/i.test(content)
}

const extractAttachmentTranscript = (attachments: ChatAttachment[] = []) => {
  return attachments
    .map((attachment) => attachment.transcript?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .trim()
}

const resolveEffectiveContent = (content: string, attachments: ChatAttachment[] = []) => {
  const normalized = content.trim()

  if (attachments.length > 0 && normalized.length === 1) {
    return extractAttachmentTranscript(attachments)
  }

  return normalized || extractAttachmentTranscript(attachments)
}

const escapeXml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const encodeBase64 = (value: string) => {
  const scopedGlobal = globalThis as typeof globalThis & {
    Buffer?: {
      from: (input: string, encoding: string) => {
        toString: (encoding: string) => string
      }
    }
  }

  if (scopedGlobal.Buffer) {
    return scopedGlobal.Buffer.from(value, 'utf-8').toString('base64')
  }

  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(value)))
  }

  throw new Error('Base64 encoding unavailable.')
}

const buildVisualAttachment = (prompt: string): ChatAttachment => {
  const trimmedPrompt = prompt.replace(/\s+/g, ' ').trim() || 'Estudo visual Lumi'
  const title = escapeXml(trimmedPrompt.slice(0, 72))
  const subtitle = escapeXml(trimmedPrompt.slice(0, 120))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" fill="none">
      <defs>
        <linearGradient id="bg" x1="120" y1="110" x2="1080" y2="790" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FCFCFE"/>
          <stop offset="1" stop-color="#EEEFF7"/>
        </linearGradient>
        <linearGradient id="ink" x1="166" y1="170" x2="1035" y2="650" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF4336"/>
          <stop offset="0.18" stop-color="#FF8A1D"/>
          <stop offset="0.36" stop-color="#F4C726"/>
          <stop offset="0.56" stop-color="#68CF49"/>
          <stop offset="0.76" stop-color="#22C2CA"/>
          <stop offset="1" stop-color="#7754FF"/>
        </linearGradient>
        <filter id="blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="42"/>
        </filter>
      </defs>
      <rect width="1200" height="900" rx="52" fill="url(#bg)"/>
      <circle cx="208" cy="204" r="136" fill="#FF6948" fill-opacity="0.18" filter="url(#blur)"/>
      <circle cx="968" cy="236" r="148" fill="#33C4D5" fill-opacity="0.18" filter="url(#blur)"/>
      <circle cx="844" cy="724" r="188" fill="#7853FF" fill-opacity="0.16" filter="url(#blur)"/>
      <path d="M248 546C303 437 387 348 507 308C611 273 719 278 820 338C919 397 973 486 976 583" stroke="url(#ink)" stroke-width="36" stroke-linecap="round"/>
      <path d="M334 682C414 742 517 780 639 780C755 780 851 744 928 674" stroke="url(#ink)" stroke-width="26" stroke-linecap="round" opacity="0.85"/>
      <rect x="96" y="92" width="1008" height="716" rx="38" fill="white" fill-opacity="0.56" stroke="rgba(35,35,43,0.08)"/>
      <text x="144" y="198" fill="#7B7B87" font-family="Aptos, Segoe UI, sans-serif" font-size="26" letter-spacing="6">LUMI VISUAL</text>
      <text x="144" y="294" fill="#23232B" font-family="Aptos Display, Aptos, Segoe UI, sans-serif" font-size="68" font-weight="700">${title}</text>
      <text x="144" y="360" fill="#595967" font-family="Aptos, Segoe UI, sans-serif" font-size="28">${subtitle}</text>
      <text x="144" y="690" fill="#595967" font-family="Aptos, Segoe UI, sans-serif" font-size="24">Estudo visual local da Lumi com a paleta Cicluz.</text>
      <rect x="144" y="726" width="312" height="12" rx="6" fill="url(#ink)"/>
    </svg>
  `.trim()

  return {
    id: createId('attachment'),
    kind: 'image',
    source: 'generated',
    name: `visual-lumi-${Date.now()}.svg`,
    mimeType: 'image/svg+xml',
    size: svg.length,
    url: `data:image/svg+xml;base64,${encodeBase64(svg)}`,
    createdAt: new Date().toISOString(),
    description: trimmedPrompt,
  }
}

const buildOpening = (content: string, attachments: ChatAttachment[]) => {
  if (attachments.length > 0 && !content.trim()) {
    return 'Recebi o que voce compartilhou comigo e vou partir disso para te responder com mais contexto.'
  }

  if (/(nao sei|estou perdido|estou perdida|confuso|confusa)/i.test(content)) {
    return 'Voce nao precisa chegar aqui com tudo organizado. Ja da para comecar pelo que esta mais vivo em voce agora.'
  }

  if (/(quero|preciso|me ajuda|me ajude)/i.test(content)) {
    return 'Entendi o ponto que voce quer olhar. Vamos transformar isso em clareza, sem atropelar o que voce esta vivendo.'
  }

  return 'Estou com voce nisso. Vou responder de um jeito que una escuta, clareza e direcao.'
}

const buildPillarLens = (pillar: CicluzPillar) => {
  if (pillar === 'EU') {
    return 'Pela lente da Cicluz, vejo um peso maior no pilar Eu: como voce se sente, se percebe e se escuta nesse momento.'
  }

  if (pillar === 'SER') {
    return 'Pela lente da Cicluz, o pilar Ser aparece mais forte: identidade, escolhas, rotina, relacoes e coerencia com quem voce quer ser.'
  }

  if (pillar === 'TER') {
    return 'Pela lente da Cicluz, o pilar Ter esta mais ativado: estrutura, recursos, tempo, entregas e o jeito como isso toca a sua vida concreta.'
  }

  return 'Pela lente da Cicluz, isso me parece um ponto misto entre Eu, Ser e Ter. Vale olhar para o interno, para a direcao e para o concreto ao mesmo tempo.'
}

const buildNextStep = (content: string, mode: 'planning' | 'reflection' | 'hybrid', pillar: CicluzPillar) => {
  if (mode === 'planning') {
    return 'Se fizer sentido, o proximo passo pode ser separar isso em tres partes: o que esta acontecendo, o que realmente importa aqui e qual acao minima voce quer assumir hoje.'
  }

  if (pillar === 'EU') {
    return 'Quero te propor uma proxima pergunta: qual parte de voce esta mais pedindo acolhimento, nome ou compreensao dentro disso?'
  }

  if (pillar === 'SER') {
    return 'Quero te propor uma proxima pergunta: o que essa situacao esta te mostrando sobre a forma como voce tem se relacionado consigo e com o mundo?'
  }

  if (pillar === 'TER') {
    return 'Quero te propor uma proxima pergunta: o que precisa ganhar forma pratica para voce sentir mais seguranca e direcao nisso?'
  }

  if (/(sinto|medo|ansiedade|culpa|triste)/i.test(content)) {
    return 'Podemos seguir por dois caminhos, voce escolhe: aprofundar o que voce esta sentindo agora ou transformar isso em um passo consciente para as proximas horas.'
  }

  return 'Se quiser, eu posso conduzir essa conversa por perguntas ou organizar isso com voce em um mapa simples de clareza: Eu, Ser e Ter.'
}

const buildAttachmentNote = (attachments: ChatAttachment[]) => {
  if (attachments.length === 0) {
    return ''
  }

  const imageCount = attachments.filter((attachment) => attachment.kind === 'image').length
  const audioCount = attachments.filter((attachment) => attachment.kind === 'audio').length
  const fileCount = attachments.filter((attachment) => attachment.kind === 'file').length

  const pieces = [
    imageCount > 0 ? `${imageCount} imagem${imageCount > 1 ? 's' : ''}` : '',
    audioCount > 0 ? `${audioCount} audio${audioCount > 1 ? 's' : ''}` : '',
    fileCount > 0 ? `${fileCount} arquivo${fileCount > 1 ? 's' : ''}` : '',
  ].filter(Boolean)

  if (pieces.length === 0) {
    return ''
  }

  return `Tambem considerei ${pieces.join(', ')} que voce anexou para responder com mais contexto.`
}

const buildLocalReply = (options: StreamMessageOptions) => {
  const effectiveContent = resolveEffectiveContent(options.content, options.attachments ?? [])
  const normalized = effectiveContent.replace(/\s+/g, ' ').trim()
  const pillar = inferPillar(normalized)
  const mode = inferMode(normalized)
  const attachmentNote = buildAttachmentNote(options.attachments ?? [])

  return [
    buildOpening(normalized, options.attachments ?? []),
    buildPillarLens(pillar),
    attachmentNote,
    buildNextStep(normalized, mode, pillar),
  ].filter(Boolean).join('\n\n')
}

const buildResponsePayload = (options: StreamMessageOptions): ChatMessage => {
  const effectiveContent = resolveEffectiveContent(options.content, options.attachments ?? [])
  const wantsVisual = detectImageIntent(effectiveContent)
  const attachments = wantsVisual ? [buildVisualAttachment(effectiveContent)] : []
  const baseContent = wantsVisual
    ? [
        'MonteI um estudo visual local inspirado no que voce pediu, mantendo a linguagem da Lumi e da Cicluz.',
        'Use a imagem como ponto de partida visual. Se quiser, eu tambem posso refinar o conceito, o clima, a composicao ou transformar isso em um direcionamento mais claro.',
      ].join('\n\n')
    : buildLocalReply(options)

  return {
    id: createId('assistant'),
    role: 'assistant',
    content: baseContent,
    createdAt: new Date().toISOString(),
    streaming: false,
    attachments,
    metadata: {
      analysis: {
        dominantPillar: inferPillar(effectiveContent),
        pillarScores: {
          EU: inferPillar(effectiveContent) === 'EU' ? 0.8 : 0.35,
          SER: inferPillar(effectiveContent) === 'SER' ? 0.8 : 0.35,
          TER: inferPillar(effectiveContent) === 'TER' ? 0.8 : 0.35,
        },
        confidence: 0.72,
        mode: inferMode(effectiveContent) === 'planning' ? 'planning' : 'hybrid',
        emotionalTone: inferMode(effectiveContent) === 'reflection' ? 'sensivel' : 'construtivo',
        tags: wantsVisual ? ['visual', 'criacao'] : ['clareza', 'cicluz'],
        methodologyLens: 'Eu, Ser e Ter',
        riskLevel: 'none',
      },
    },
  }
}

const streamText = async (content: string, options: StreamMessageOptions) => {
  const chunks = content.match(/\S+\s*/g) ?? [content]

  for (const chunk of chunks) {
    if (options.signal?.aborted) {
      throw new Error('Streaming aborted')
    }

    options.onChunk?.(chunk)
    await wait(STREAM_DELAY_MS)
  }
}

export const chatService = {
  async fetchBootstrap(): Promise<ChatBootstrapResponse> {
    return createFallbackBootstrap()
  },

  async createConversation(): Promise<ChatConversation> {
    return createFallbackConversation()
  },

  async streamMessage(options: StreamMessageOptions): Promise<ChatServiceResponse> {
    const message = buildResponsePayload(options)

    await streamText(message.content, options)

    return {
      conversationId: options.conversationId,
      message,
    }
  },
}
