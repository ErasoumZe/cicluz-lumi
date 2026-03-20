const CRISIS_KEYWORDS = [
  'quero morrer',
  'vou me matar',
  'suicidio',
  'suicidar',
  'me matar',
  'acabar com tudo',
  'nao quero mais viver',
  'nao aguento mais viver',
  'machucar a mim',
  'me ferir',
  'autoagress',
]

const ATTENTION_KEYWORDS = [
  'nao aguento mais',
  'sem sentido',
  'desespero',
  'panico',
  'crise',
  'colapso',
]

const normalizeText = (text) => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export const assessSafety = (content) => {
  const normalized = normalizeText(content)
  const crisisMatches = CRISIS_KEYWORDS.filter((keyword) => normalized.includes(keyword))
  const attentionMatches = ATTENTION_KEYWORDS.filter((keyword) => normalized.includes(keyword))

  if (crisisMatches.length > 0) {
    return { riskLevel: 'crisis', flags: crisisMatches, shouldShortCircuit: true }
  }

  if (attentionMatches.length > 0) {
    return { riskLevel: 'attention', flags: attentionMatches, shouldShortCircuit: false }
  }

  return { riskLevel: 'none', flags: [], shouldShortCircuit: false }
}

export const buildCrisisSupportMessage = () => {
  return [
    'Eu sinto muito que isso esteja pesando desse jeito agora. Voce nao precisa lidar com isso sozinho neste momento.',
    '',
    'Neste caso, o mais importante e buscar apoio humano imediato agora:',
    '- ligue para o CVV no 188 para apoio emocional 24h no Brasil',
    '- se houver risco imediato, ligue para o SAMU no 192 ou procure um pronto atendimento',
    '- se puder, avise agora uma pessoa de confianca para ficar com voce',
    '',
    'Se quiser, eu posso continuar aqui com voce em passos bem curtos enquanto voce aciona esse apoio.',
  ].join('\n')
}
