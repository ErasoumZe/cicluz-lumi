<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useChat } from '../composables/useChat'

const {
  activeConversation,
  sendMessage,
  loading,
  streaming,
  error,
  activateIntroFlow,
  deactivateIntroFlow,
} = useChat()
const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const visibleMessages = computed(() => {
  const messages = activeConversation.value?.messages ?? []
  return messages.filter((message) => message.id !== 'message-initial')
})

const isBusy = computed(() => loading.value || streaming.value)
const isWelcomeState = computed(() => {
  return activeConversation.value !== null && visibleMessages.value.length === 0
})

const isInitialStage = computed(() => {
  return isWelcomeState.value
})

const helperText = computed(() => {
  return isInitialStage.value
    ? 'Pe\u00e7a para planejar o dia, criar tarefas ou resumir compromissos.'
    : 'Shift + Enter para nova linha'
})

const resizeTextarea = () => {
  if (!textareaRef.value) {
    return
  }

  textareaRef.value.style.height = '0px'
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 180)}px`
}

const submit = async () => {
  const content = draft.value.trim()
  if (!content || isBusy.value) {
    return
  }

  draft.value = ''
  await nextTick()
  resizeTextarea()
  textareaRef.value?.focus()
  void sendMessage(content)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void submit()
  }
}

const onFocus = () => {
  if (isWelcomeState.value) {
    activateIntroFlow()
  }
}

const onBlur = () => {
  if (isWelcomeState.value && !isBusy.value) {
    deactivateIntroFlow()
  }
}

onMounted(() => {
  resizeTextarea()
})
</script>

<template>
  <div
    :class="
      isInitialStage
        ? 'px-4 pb-12 sm:px-6 lg:px-10'
        : 'sticky bottom-0 z-10 bg-gradient-to-t from-[var(--cicluz-bg)] via-[rgba(247,247,250,0.94)] to-transparent px-4 pb-6 pt-4 sm:px-6 lg:px-10'
    "
  >
    <div class="mx-auto w-full" :class="isInitialStage ? 'max-w-[780px]' : 'max-w-[880px]'">
      <p v-if="error" class="mb-3 text-sm text-rose-600">
        {{ error }}
      </p>

      <div class="overflow-hidden rounded-[32px] border border-[var(--cicluz-line-strong)] bg-[rgba(255,255,255,0.82)] shadow-[var(--cicluz-shadow)] backdrop-blur-xl">
        <div class="px-5 pt-5">
          <textarea
            ref="textareaRef"
            v-model="draft"
            rows="1"
            placeholder="Converse com a Lumi..."
            class="min-h-[60px] w-full resize-none bg-transparent text-[15px] leading-7 text-[var(--cicluz-ink)] outline-none placeholder:text-[var(--cicluz-muted)]"
            @input="resizeTextarea"
            @keydown="onKeydown"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-[var(--cicluz-line)] px-5 py-4">
          <p class="text-xs leading-5 text-[var(--cicluz-muted)]">
            {{ helperText }}
          </p>

          <button
            class="cicluz-button-primary inline-flex h-11 items-center gap-2 rounded-full pl-4 pr-3 text-sm font-semibold text-white"
            :disabled="isBusy || !draft.trim()"
            @click="submit"
          >
            <span class="hidden sm:inline">Enviar</span>
            <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
