<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'
import LumiFlowAnimation from './LumiFlowAnimation.vue'
import ChatMessage from './ChatMessage.vue'

const { activeConversation, streaming, sendMessage, introFlowActive } = useChat()
const { logoSymbolUrl } = useBranding()
const scrollContainer = ref<HTMLElement | null>(null)

const starterPrompts = [
  {
    title: 'Planejar o meu dia',
    caption: 'Blocos de foco, agenda e prioridades.',
    prompt: 'Planeje meu dia em blocos simples.',
  },
  {
    title: 'Virar ideia em tarefa',
    caption: 'Transforme contexto em a\u00e7\u00f5es claras.',
    prompt: 'Transforme esta ideia em tarefas claras.',
  },
  {
    title: 'Ler a minha agenda',
    caption: 'Resuma compromissos e pr\u00f3ximos passos.',
    prompt: 'Resuma o que preciso fazer hoje.',
  },
  {
    title: 'Montar um plano r\u00e1pido',
    caption: 'Estruture uma lista objetiva para executar.',
    prompt: 'Monte um plano simples com os pr\u00f3ximos passos.',
  },
]

const visibleMessages = computed(() => {
  const messages = activeConversation.value?.messages ?? []
  return messages.filter((message) => message.id !== 'message-initial')
})

const hasAssistantContent = computed(() => {
  return visibleMessages.value.some((message) => {
    return message.role === 'assistant' && message.content.trim().length > 0
  })
})

const showFlowState = computed(() => {
  return activeConversation.value !== null && introFlowActive.value && !hasAssistantContent.value
})

const showWelcomeState = computed(() => {
  return activeConversation.value !== null && visibleMessages.value.length === 0 && !showFlowState.value
})

const getPromptDotClass = (index: number) => {
  const classes = [
    'bg-[var(--cicluz-ink)]',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-sky-500',
  ]

  return classes[index] ?? classes[0]
}

const scrollToBottom = async () => {
  await nextTick()

  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

watch(
  [() => activeConversation.value?.id, () => visibleMessages.value.length, () => streaming.value],
  () => {
    void scrollToBottom()
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      v-if="showWelcomeState"
      class="flex flex-1 items-center px-4 pt-12 sm:px-6 lg:px-10"
    >
      <div class="mx-auto flex w-full max-w-[920px] flex-1 flex-col items-center justify-center pb-8 text-center">
        <div class="inline-flex items-center gap-3 rounded-full border border-[var(--cicluz-line)] bg-white/76 px-4 py-2 shadow-[var(--cicluz-shadow-soft)] backdrop-blur">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cicluz-bg-soft)] ring-1 ring-[var(--cicluz-line)]">
            <img
              alt="Cicluz"
              :src="logoSymbolUrl"
              class="h-6 w-6 object-contain"
            />
          </div>

          <div class="text-left">
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--cicluz-muted)]">Lumi</p>
            <p class="text-sm font-semibold text-[var(--cicluz-ink)]">Assistente da Cicluz</p>
          </div>
        </div>

        <h2 class="font-display mt-8 max-w-[760px] text-[clamp(3rem,7vw,5.2rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--cicluz-ink)]">
          O que vamos organizar hoje?
        </h2>

        <p class="mt-5 max-w-[620px] text-[17px] leading-8 text-[var(--cicluz-muted-strong)]">
          Converse com a Lumi para estruturar o dia, transformar ideias em tarefas e navegar com clareza pela Agenda Inteligente.
        </p>

        <div class="mt-10 flex max-w-[820px] flex-wrap justify-center gap-3">
          <button
            v-for="(prompt, index) in starterPrompts"
            :key="prompt.prompt"
            class="group inline-flex max-w-full items-center gap-3 rounded-full border border-[var(--cicluz-line-strong)] bg-white/82 px-4 py-3 text-left shadow-[var(--cicluz-shadow-soft)] transition hover:-translate-y-0.5 hover:bg-white"
            @click="sendMessage(prompt.prompt)"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cicluz-bg-soft)] ring-1 ring-[var(--cicluz-line)]">
              <span class="h-2.5 w-2.5 rounded-full" :class="getPromptDotClass(index)" />
            </span>

            <span class="min-w-0">
              <span class="block text-sm font-semibold text-[var(--cicluz-ink)]">{{ prompt.title }}</span>
              <span class="mt-0.5 block text-xs leading-5 text-[var(--cicluz-muted)]">{{ prompt.caption }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="showFlowState"
      class="flex flex-1 items-center px-4 pt-12 sm:px-6 lg:px-10"
    >
      <div class="mx-auto flex w-full max-w-[920px] flex-1 flex-col items-center justify-center pb-8 text-center">
        <LumiFlowAnimation />

        <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--cicluz-muted)]">
          Lumi
        </p>

        <p class="mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--cicluz-muted-strong)]">
          Estou organizando o contexto e deixando o caminho pronto para responder com clareza.
        </p>
      </div>
    </div>

    <div
      v-else
      ref="scrollContainer"
      class="flex-1 overflow-y-auto"
    >
      <div class="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-4 pb-12 pt-10 sm:px-6 lg:px-10">
        <ChatMessage
          v-for="message in visibleMessages"
          :key="message.id"
          :message="message"
        />
      </div>
    </div>
  </div>
</template>
