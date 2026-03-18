<script setup lang="ts">
import { computed } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'
import type { ChatConversation } from '../types/chat.types'

const { conversations, activeConversation, createConversation, selectConversation, loading, error } = useChat()
const { logoSymbolUrl } = useBranding()

const hasUserMessages = (conversation: ChatConversation) => {
  return conversation.messages.some((message) => message.role === 'user')
}

const history = computed(() => {
  return conversations.value.filter((conversation) => hasUserMessages(conversation))
})

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

const getPreview = (conversation: ChatConversation) => {
  const message = [...conversation.messages].reverse().find((item) => item.id !== 'message-initial')
  return message?.content ?? 'Pronta para come\u00e7ar.'
}

const isActiveConversation = (conversationId: string) => {
  return activeConversation.value?.id === conversationId
}
</script>

<template>
  <aside class="relative border-b border-[var(--cicluz-line)] bg-[var(--cicluz-sidebar)] backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r">
    <div class="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[var(--cicluz-line-strong)] to-transparent lg:block" />

    <div class="flex h-full flex-col px-5 pb-6 pt-6">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-white shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]">
          <img
            alt="Cicluz"
            :src="logoSymbolUrl"
            class="h-10 w-10 object-contain"
          />
        </div>

        <div class="min-w-0">
          <p class="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--cicluz-muted)]">Lumi</p>
          <p class="truncate text-base font-semibold text-[var(--cicluz-ink)]">Assistente da Cicluz</p>
          <p class="truncate text-sm text-[var(--cicluz-muted)]">Agenda, tarefas e ideias em conversa.</p>
        </div>
      </div>

      <button
        class="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--cicluz-ink)] px-4 text-sm font-semibold text-white shadow-[var(--cicluz-shadow-soft)] transition hover:-translate-y-0.5 hover:bg-stone-800"
        @click="createConversation"
      >
        <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
        </svg>
        <span>Nova conversa</span>
      </button>

      <div class="mt-8 flex items-center justify-between px-1">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cicluz-muted)]">Hist&oacute;rico</p>
        <span class="text-xs text-[var(--cicluz-muted)]">{{ history.length }}</span>
      </div>

      <p v-if="error" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-600">
        {{ error }}
      </p>

      <div class="mt-4 flex-1 space-y-1.5 overflow-y-auto pr-1">
        <p v-if="loading && history.length === 0" class="px-2 py-3 text-sm text-[var(--cicluz-muted)]">
          Carregando a Lumi...
        </p>

        <p v-else-if="history.length === 0" class="px-2 py-3 text-sm leading-6 text-[var(--cicluz-muted)]">
          As conversas aparecem aqui quando voc&ecirc; enviar a primeira mensagem.
        </p>

        <button
          v-for="conversation in history"
          :key="conversation.id"
          class="w-full rounded-[22px] px-3 py-3 text-left transition"
          :class="
            isActiveConversation(conversation.id)
              ? 'bg-white/92 shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]'
              : 'hover:bg-white/58'
          "
          @click="selectConversation(conversation.id)"
        >
          <div class="flex items-start gap-3">
            <span
              class="mt-2 h-2 w-2 rounded-full"
              :class="isActiveConversation(conversation.id) ? 'bg-[var(--cicluz-ink)]' : 'bg-stone-300'"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-3">
                <p class="truncate text-sm font-semibold text-[var(--cicluz-ink)]">{{ conversation.title }}</p>
                <span class="shrink-0 text-[11px] text-[var(--cicluz-muted)]">
                  {{ formatDate(conversation.createdAt) }}
                </span>
              </div>

              <p class="mt-1 truncate text-xs leading-5 text-[var(--cicluz-muted)]">
                {{ getPreview(conversation) }}
              </p>
            </div>
          </div>
        </button>
      </div>

      <div class="mt-6 border-t border-[var(--cicluz-line)] pt-4">
        <p class="text-xs leading-5 text-[var(--cicluz-muted)]">
          Lumi organiza prioridades, transforma ideias em tarefas e ajuda a navegar pela Agenda Inteligente.
        </p>
      </div>
    </div>
  </aside>
</template>
