import { createMockProvider } from './mockProvider.mjs'
import { createOpenAiProvider } from './openaiProvider.mjs'

export const createAssistenteProvider = (env) => {
  if (env.provider === 'openai' && env.openAiApiKey) {
    return createOpenAiProvider(env)
  }

  if (env.provider === 'openai') {
    console.warn('[assistente] OPENAI_API_KEY ausente. Provider mock sera usado.')
  }

  return createMockProvider()
}
