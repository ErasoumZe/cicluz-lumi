<script setup lang="ts">
import { computed } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'

const { activeConversation, streaming } = useChat()
const { logoSymbolUrl } = useBranding()

const conversationLabel = computed(() => {
  const hasUserMessages = activeConversation.value?.messages.some((message) => message.role === 'user')
  return hasUserMessages ? activeConversation.value?.title ?? 'Nova conversa' : 'Nova conversa'
})

const statusLabel = computed(() => {
  return streaming.value ? 'Lumi respondendo' : 'Pronta para ajudar'
})
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-[var(--cicluz-line)] bg-[rgba(247,247,250,0.82)] backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
      <div class="flex min-w-0 items-center gap-4">
        <div class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)] sm:flex">
          <img
            alt="Cicluz"
            :src="logoSymbolUrl"
            class="h-8 w-8 object-contain"
          />
        </div>

        <div class="min-w-0">
          <p class="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--cicluz-muted)]">
            Lumi &mdash; Assistente da Cicluz
          </p>
          <p class="truncate text-sm text-[var(--cicluz-muted-strong)]">
            {{ conversationLabel }}
          </p>
        </div>
      </div>

      <div class="hidden items-center gap-2 rounded-full border border-[var(--cicluz-line)] bg-white/70 px-3 py-2 text-xs text-[var(--cicluz-muted-strong)] shadow-[var(--cicluz-shadow-soft)] md:flex">
        <span class="h-2 w-2 rounded-full" :class="streaming ? 'bg-amber-400' : 'bg-emerald-500'" />
        <span>{{ statusLabel }}</span>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] cicluz-spectrum-divider" />
  </header>
</template>
