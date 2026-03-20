import { ref } from 'vue'

export const useStreaming = () => {
  const content = ref('')
  const isStreaming = ref(false)

  const start = (initialContent = '') => {
    content.value = initialContent
    isStreaming.value = true
  }

  const append = (chunk: string) => {
    content.value += chunk
  }

  const finish = () => {
    isStreaming.value = false
  }

  const reset = () => {
    content.value = ''
    isStreaming.value = false
  }

  return {
    content,
    isStreaming,
    start,
    append,
    finish,
    reset,
  }
}
