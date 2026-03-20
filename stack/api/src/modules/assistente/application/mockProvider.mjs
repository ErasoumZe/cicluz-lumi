const wait = (time) => new Promise((resolve) => setTimeout(resolve, time))

const splitIntoChunks = (text) => {
  const words = text.split(/(\s+)/).filter(Boolean)
  const chunks = []

  for (let index = 0; index < words.length; index += 3) {
    chunks.push(words.slice(index, index + 3).join(''))
  }

  return chunks
}

const pillarDescriptions = {
  EU: 'isso toca bastante a sua relacao com voce mesmo',
  SER: 'isso parece atravessar muito a sua relacao com outras pessoas e com o ambiente ao redor',
  TER: 'isso conversa bastante com aquilo que voce quer construir, organizar ou conquistar',
  MISTO: 'isso mistura mundo interno, relacoes e objetivos ao mesmo tempo',
}

const therapeuticReflection = (analysis) => {
  if (analysis.emotionalTone === 'ansiedade') {
    return 'Da para sentir um nivel de tensao e antecipacao nisso que voce trouxe.'
  }

  if (analysis.emotionalTone === 'tristeza') {
    return 'O que voce descreve carrega um peso emocional real, e faz sentido que isso esteja doendo.'
  }

  if (analysis.emotionalTone === 'culpa') {
    return 'Parece que voce esta se cobrando muito nesse ponto.'
  }

  if (analysis.emotionalTone === 'conflito') {
    return 'Tem um atrito importante aqui, como se algo dentro ou fora de voce estivesse em choque.'
  }

  return 'Estou com voce nisso, e quero organizar esse contexto com cuidado.'
}

const buildTherapeuticReply = ({ content, analysis, memoryDigest }) => {
  const previousPattern = memoryDigest.length > 0
    ? `Eu tambem noto um padrao que volta em conversas anteriores: ${memoryDigest[0]}.`
    : null

  return [
    therapeuticReflection(analysis),
    '',
    `Pela metodologia da Cicluz, ${pillarDescriptions[analysis.dominantPillar]}.`,
    previousPattern,
    `Antes de tentar resolver tudo, eu quero nomear o centro disso: ${analysis.methodologyLens}.`,
    '',
    'Se voce topar, podemos seguir de um destes jeitos:',
    '- aprofundar o que exatamente esta doendo agora',
    '- separar o que e sentimento, o que e relacao e o que e objetivo concreto',
    '- pensar no proximo passo mais gentil e realista para hoje',
    '',
    `Quero te ouvir um pouco mais: quando voce diz "${content.trim().slice(0, 110)}", o que mais pesa ai dentro?`,
  ].filter(Boolean).join('\n')
}

const buildPlanningReply = ({ analysis, content }) => {
  return [
    'Vamos organizar isso sem perder a parte humana do que voce esta vivendo.',
    '',
    `Pela leitura da metodologia, o foco principal aqui esta em ${analysis.dominantPillar}.`,
    `Minha leitura e: ${analysis.methodologyLens}.`,
    '',
    'Eu sugiro quebrar em tres camadas:',
    '- o que voce sente ou precisa preservar',
    '- o que depende de pessoas, contexto ou combinados',
    '- o que vira acao concreta a partir de agora',
    '',
    `Se quiser, eu posso pegar isso que voce trouxe e transformar em um plano simples a partir de: "${content.trim().slice(0, 120)}".`,
  ].join('\n')
}

const buildHybridReply = ({ analysis, content }) => {
  return [
    therapeuticReflection(analysis),
    '',
    `Isso parece tocar o pilar ${analysis.dominantPillar}, mas com impacto nos outros campos da sua vida tambem.`,
    'Entao eu nao trataria isso so como emocao, nem so como tarefa.',
    '',
    'Minha proposta e organizar assim:',
    '- primeiro entender o que essa situacao mexe em voce',
    '- depois olhar a relacao com o outro ou com o contexto',
    '- por fim decidir o que precisa ser construido na pratica',
    '',
    `Se eu resumir o seu ponto central agora, seria algo como: "${content.trim().slice(0, 120)}". Faz sentido?`,
  ].join('\n')
}

export const createMockProvider = () => {
  return {
    name: 'mock',
    async streamReply({ content, analysis, memoryDigest, onChunk, signal }) {
      const fullContent =
        analysis.mode === 'therapeutic'
          ? buildTherapeuticReply({ content, analysis, memoryDigest })
          : analysis.mode === 'planning'
            ? buildPlanningReply({ analysis, content })
            : buildHybridReply({ analysis, content })

      for (const chunk of splitIntoChunks(fullContent)) {
        if (signal?.aborted) {
          throw new Error('Streaming aborted')
        }

        await wait(55)
        onChunk?.(chunk)
      }

      return {
        content: fullContent,
        createdAt: new Date().toISOString(),
      }
    },
  }
}
