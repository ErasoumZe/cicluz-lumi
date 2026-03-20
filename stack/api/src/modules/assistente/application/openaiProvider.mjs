import { buildTherapeuticSystemPrompt } from './prompt.mjs'

const readErrorBody = async (response) => {
  try {
    const payload = await response.text()
    return payload || response.statusText
  } catch {
    return response.statusText
  }
}

const moderateInput = async ({ env, content }) => {
  if (!env.openAiEnableModeration || !env.openAiApiKey) {
    return { flagged: false }
  }

  const response = await fetch(`${env.openAiBaseUrl.replace(/\/$/, '')}/moderations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: 'omni-moderation-latest',
      input: content,
    }),
  })

  if (!response.ok) {
    return { flagged: false }
  }

  const payload = await response.json()
  return {
    flagged: Boolean(payload?.results?.[0]?.flagged),
    categories: payload?.results?.[0]?.categories || {},
  }
}

export const createOpenAiProvider = (env) => {
  return {
    name: 'openai',
    async streamReply({ content, conversation, analysis, conversationSummary, memoryDigest, safety, onChunk, signal }) {
      await moderateInput({ env, content })

      const response = await fetch(`${env.openAiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: env.openAiModel,
          stream: true,
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content: buildTherapeuticSystemPrompt({
                analysis,
                conversationSummary,
                memoryDigest,
                safety,
              }),
            },
            ...conversation.messages
              .filter((message) => message.role === 'user' || message.role === 'assistant')
              .map((message) => ({
                role: message.role,
                content: message.content,
              })),
          ],
        }),
        signal,
      })

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${await readErrorBody(response)}`)
      }

      if (!response.body) {
        throw new Error('OpenAI streaming body unavailable.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        if (signal?.aborted) {
          throw new Error('Streaming aborted')
        }

        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() || ''

        for (const frame of frames) {
          const lines = frame.split('\n').map((line) => line.trim()).filter(Boolean)

          for (const line of lines) {
            if (!line.startsWith('data:')) {
              continue
            }

            const payload = line.slice(5).trim()

            if (payload === '[DONE]') {
              return {
                content: fullContent.trim(),
                createdAt: new Date().toISOString(),
              }
            }

            const json = JSON.parse(payload)
            const delta = json.choices?.[0]?.delta?.content

            if (typeof delta === 'string' && delta.length > 0) {
              fullContent += delta
              onChunk?.(delta)
            }
          }
        }
      }

      return {
        content: fullContent.trim(),
        createdAt: new Date().toISOString(),
      }
    },
  }
}
