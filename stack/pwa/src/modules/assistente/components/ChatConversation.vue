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
    title: 'Quero me compreender melhor',
    caption: 'Autoconhecimento para entender o que estou vivendo agora.',
    prompt: 'Quero me compreender melhor. Pode me conduzir com perguntas?',
  },
  {
    title: 'Falar sobre o que eu sinto',
    caption: 'Abra espa\u00e7o para acolher emo\u00e7\u00f5es, conflitos e buscas internas.',
    prompt: 'Quero falar sobre o que estou sentindo agora.',
  },
  {
    title: 'Explorar Eu, Ser e Ter',
    caption: 'Olhe para os pilares da metodologia Cicluz dentro da minha fase atual.',
    prompt: 'Quero explorar os pilares Eu, Ser e Ter na minha vida neste momento.',
  },
  {
    title: 'Transformar reflex\u00e3o em passo',
    caption: 'Leve a conversa para uma a\u00e7\u00e3o poss\u00edvel, com consci\u00eancia e dire\u00e7\u00e3o.',
    prompt: 'Me ajude a transformar essa reflex\u00e3o em um pr\u00f3ximo passo consciente.',
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
      class="flex flex-1 items-center px-4 pt-10 sm:px-6 md:px-8 lg:px-10"
    >
      <div class="mx-auto flex w-full max-w-[980px] flex-1 flex-col items-center justify-center pb-10 text-center sm:pb-12">
        <div class="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/84 shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]">
          <img
            alt="Cicluz"
            :src="logoSymbolUrl"
            class="h-8 w-8 object-contain"
          />
        </div>

        <h2 class="font-display mt-8 max-w-[820px] text-[clamp(2.45rem,9vw,4.9rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-[var(--cicluz-ink)] sm:text-[clamp(2.9rem,6vw,4.9rem)]">
          Clareza para olhar para si com mais presen&ccedil;a.
        </h2>

        <p class="mt-5 max-w-[760px] text-[15px] leading-7 text-[var(--cicluz-muted-strong)] sm:text-[17px] sm:leading-8">
          A LUMI &eacute; a sua assistente virtual e parceira. Ela conversa com voc&ecirc; sobre autoconhecimento, clareza emocional e dire&ccedil;&atilde;o de vida com base na metodologia Cicluz e seus tr&ecirc;s pilares: Eu, Ser e Ter.
        </p>

        <div class="mt-10 w-full max-w-[860px]">
          <div class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
            <button
              v-for="(prompt, index) in starterPrompts"
              :key="prompt.prompt"
              class="group flex min-h-[112px] min-w-[280px] snap-start items-start gap-4 rounded-[28px] border border-[var(--cicluz-line-strong)] bg-white/84 px-5 py-4 text-left shadow-[var(--cicluz-shadow-soft)] transition hover:-translate-y-0.5 hover:bg-white md:min-w-0"
              @click="sendMessage(prompt.prompt)"
            >
              <span class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--cicluz-bg-soft)] ring-1 ring-[var(--cicluz-line)]">
                <span class="h-2.5 w-2.5 rounded-full" :class="getPromptDotClass(index)" />
              </span>

              <span class="min-w-0 pt-0.5">
                <span class="block text-[15px] font-semibold leading-6 text-[var(--cicluz-ink)]">{{ prompt.title }}</span>
                <span class="mt-1.5 block text-[13px] leading-6 text-[var(--cicluz-muted)]">{{ prompt.caption }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="showFlowState"
      class="flex flex-1 items-center px-4 pt-10 sm:px-6 md:px-8 lg:px-10"
    >
      <div class="mx-auto flex w-full max-w-[920px] flex-1 flex-col items-center justify-center pb-10 text-center sm:pb-12">
        <LumiFlowAnimation :size="340" />

        <p class="mt-4 max-w-[520px] text-[14px] leading-7 text-[var(--cicluz-muted-strong)] sm:text-[15px]">
          Estou reunindo o seu contexto para responder com escuta, profundidade e clareza.
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
