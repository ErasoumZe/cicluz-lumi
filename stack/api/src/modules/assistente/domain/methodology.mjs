const PILLARS = ['EU', 'SER', 'TER']

const PILLAR_KEYWORDS = {
  EU: [
    'eu',
    'me sinto',
    'me sentindo',
    'ansiedade',
    'ansioso',
    'ansiosa',
    'medo',
    'culpa',
    'vazio',
    'triste',
    'tristeza',
    'insegur',
    'autoconf',
    'autoestima',
    'identidade',
    'sozinho',
    'sozinha',
    'cansado',
    'cansada',
    'dor',
    'emoc',
    'trauma',
    'terapia',
    'sentimento',
  ],
  SER: [
    'famil',
    'mae',
    'pai',
    'filho',
    'filha',
    'namoro',
    'casamento',
    'relacionamento',
    'amigo',
    'amiga',
    'social',
    'sociedade',
    'grupo',
    'trabalho',
    'equipe',
    'colega',
    'conflito',
    'briga',
    'rede',
    'conviver',
    'pessoas',
    'outro',
    'outros',
  ],
  TER: [
    'dinheiro',
    'financeiro',
    'conta',
    'comprar',
    'casa',
    'carro',
    'objetivo',
    'meta',
    'resultado',
    'plano',
    'carreira',
    'negocio',
    'empresa',
    'trabalho',
    'entrega',
    'produtividade',
    'ganhar',
    'conquistar',
    'fazer',
    'ter',
    'agenda',
    'tarefa',
    'organizar',
  ],
}

const TONE_KEYWORDS = {
  ansiedade: ['ansiedade', 'ansioso', 'ansiosa', 'preocupado', 'preocupada', 'nervoso', 'nervosa'],
  tristeza: ['triste', 'tristeza', 'chor', 'desanim', 'vazio', 'solid', 'sozinho', 'sozinha'],
  culpa: ['culpa', 'fracasso', 'errei', 'arrepend', 'vergonha'],
  conflito: ['briga', 'conflito', 'discuss', 'afastado', 'afastada', 'raiva'],
  esperanca: ['quero mudar', 'melhorar', 'recome', 'esperan', 'conseguir', 'evoluir'],
  clareza: ['organizar', 'planejar', 'estruturar', 'entender', 'clareza', 'decidir'],
}

const TAG_KEYWORDS = {
  relacionamento: ['relacionamento', 'namoro', 'casamento', 'parceiro', 'parceira'],
  familia: ['famil', 'mae', 'pai', 'filho', 'filha', 'irm', 'casa'],
  trabalho: ['trabalho', 'equipe', 'empresa', 'carreira', 'colega'],
  dinheiro: ['dinheiro', 'conta', 'financeiro', 'renda', 'divida'],
  proposito: ['proposito', 'sentido', 'identidade', 'valor'],
  rotina: ['rotina', 'agenda', 'dia', 'planejar', 'tarefa'],
  autoestima: ['autoestima', 'insegur', 'autoconf', 'valor pessoal'],
}

const normalizeText = (text) => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

const includesKeyword = (source, keyword) => source.includes(normalizeText(keyword))

const scoreKeywordList = (text, keywords) => {
  return keywords.reduce((score, keyword) => score + (includesKeyword(text, keyword) ? 1 : 0), 0)
}

const inferMode = (text, pillarScores) => {
  const therapeuticSignals = ['me sinto', 'emoc', 'dor', 'medo', 'culpa', 'triste', 'ansied', 'sozinho', 'sozinha']
  const planningSignals = ['plano', 'meta', 'agenda', 'tarefa', 'organizar', 'objetivo', 'proximo passo']
  const therapeuticScore = scoreKeywordList(text, therapeuticSignals) + pillarScores.EU
  const planningScore = scoreKeywordList(text, planningSignals) + pillarScores.TER

  if (therapeuticScore >= planningScore + 2) {
    return 'therapeutic'
  }

  if (planningScore >= therapeuticScore + 2) {
    return 'planning'
  }

  return 'hybrid'
}

const inferTone = (text) => {
  let winner = 'acolhimento'
  let bestScore = 0

  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    const score = scoreKeywordList(text, keywords)

    if (score > bestScore) {
      winner = tone
      bestScore = score
    }
  }

  return winner
}

const inferTags = (text) => {
  return Object.entries(TAG_KEYWORDS)
    .filter(([, keywords]) => scoreKeywordList(text, keywords) > 0)
    .map(([tag]) => tag)
    .slice(0, 5)
}

const resolveDominantPillar = (scores) => {
  const ranked = PILLARS.map((pillar) => ({ pillar, score: scores[pillar] }))
    .sort((left, right) => right.score - left.score)

  if (ranked[0].score === ranked[1].score) {
    return 'MISTO'
  }

  return ranked[0].pillar
}

const confidenceFromScores = (scores, dominantPillar) => {
  if (dominantPillar === 'MISTO') {
    return 0.5
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0)

  if (total <= 0) {
    return 0.34
  }

  return Number((scores[dominantPillar] / total).toFixed(2))
}

const buildMethodologyLens = ({ dominantPillar, mode }) => {
  if (dominantPillar === 'EU') {
    return mode === 'therapeutic'
      ? 'aprofundar a relacao da pessoa com ela mesma'
      : 'organizar clareza interna antes da acao'
  }

  if (dominantPillar === 'SER') {
    return 'olhar para a relacao com o outro, com grupos e com o contexto social'
  }

  if (dominantPillar === 'TER') {
    return 'transformar desejo, meta ou necessidade em caminho concreto'
  }

  return 'equilibrar o que a pessoa sente, vive nas relacoes e deseja construir'
}

const buildMemorySummary = (content, dominantPillar) => {
  const compact = content.replace(/\s+/g, ' ').trim().slice(0, 200)
  return compact ? `${dominantPillar}: ${compact}` : ''
}

export const analyzeNarrative = (content) => {
  const normalizedText = normalizeText(content)
  const pillarScores = {
    EU: scoreKeywordList(normalizedText, PILLAR_KEYWORDS.EU),
    SER: scoreKeywordList(normalizedText, PILLAR_KEYWORDS.SER),
    TER: scoreKeywordList(normalizedText, PILLAR_KEYWORDS.TER),
  }

  const dominantPillar = resolveDominantPillar(pillarScores)
  const mode = inferMode(normalizedText, pillarScores)

  return {
    dominantPillar,
    pillarScores,
    confidence: confidenceFromScores(pillarScores, dominantPillar),
    mode,
    emotionalTone: inferTone(normalizedText),
    tags: inferTags(normalizedText),
    methodologyLens: buildMethodologyLens({ dominantPillar, mode }),
    memoryCandidate: content.trim().length >= 24,
    memorySummary: buildMemorySummary(content, dominantPillar),
  }
}

export const summarizeConversation = (messages) => {
  const userMessages = messages.filter((message) => message.role === 'user')

  if (userMessages.length === 0) {
    return {
      dominantPillar: 'MISTO',
      therapeutic: false,
      lastUserPillar: 'MISTO',
      lastMessageAt: null,
    }
  }

  const scores = { EU: 0, SER: 0, TER: 0 }

  for (const message of userMessages) {
    const analysis = message.metadata?.analysis

    if (!analysis) {
      continue
    }

    scores.EU += analysis.pillarScores?.EU || 0
    scores.SER += analysis.pillarScores?.SER || 0
    scores.TER += analysis.pillarScores?.TER || 0
  }

  const lastUserMessage = userMessages.at(-1)

  return {
    dominantPillar: resolveDominantPillar(scores),
    therapeutic: userMessages.some((message) => message.metadata?.analysis?.mode === 'therapeutic'),
    lastUserPillar: lastUserMessage?.metadata?.analysis?.dominantPillar || 'MISTO',
    lastMessageAt: messages.at(-1)?.createdAt || null,
  }
}

export const createMemoryRecord = ({ profileId, conversationId, messageId, content, analysis, createdAt }) => {
  return {
    id: `memory-${messageId}`,
    profileId,
    conversationId,
    messageId,
    pillar: analysis.dominantPillar,
    summary: analysis.memorySummary,
    tags: analysis.tags,
    emotionalTone: analysis.emotionalTone,
    createdAt,
    occurrences: 1,
  }
}

export const buildProfileMemoryDigest = (profileMemory) => {
  const digest = []

  for (const pillar of PILLARS) {
    const entries = profileMemory.pillars[pillar].slice(0, 3)

    if (entries.length > 0) {
      digest.push(`${pillar}: ${entries.map((entry) => entry.summary).join(' | ')}`)
    }
  }

  return digest
}

export const emptyProfileMemory = (profileId) => {
  return {
    profileId,
    updatedAt: new Date().toISOString(),
    pillars: {
      EU: [],
      SER: [],
      TER: [],
    },
  }
}
