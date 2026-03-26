<script setup lang="ts">
import { computed } from 'vue'
import { useChat } from '../composables/useChat'

const { activeConversation, activeView, streaming, sidebarCollapsed, toggleSidebar, setActiveView } = useChat()

const heading = computed(() => {
  if (activeView.value === 'gallery') {
    return 'Galeria'
  }

  const hasUserMessages = activeConversation.value?.messages.some((message) => message.role === 'user')
  return hasUserMessages ? activeConversation.value?.title ?? 'Nova conversa' : 'Nova conversa'
})

const eyebrow = computed(() => {
  return activeView.value === 'gallery' ? 'Lumi visual' : 'Conversa atual'
})

const statusLabel = computed(() => {
  if (activeView.value === 'gallery') {
    return 'Imagens salvas'
  }

  return streaming.value ? 'Lumi respondendo' : 'Pronta para ouvir'
})
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-[var(--cicluz-line)] bg-[rgba(247,247,250,0.78)] backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
      <div class="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--cicluz-line-strong)] bg-white/80 text-[var(--cicluz-ink)] shadow-[var(--cicluz-shadow-soft)] transition hover:bg-white"
          :aria-label="sidebarCollapsed ? 'Abrir barra lateral' : 'Fechar barra lateral'"
          @click="toggleSidebar"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.8" />
            <path d="M10 5.9v12.2" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
          </svg>
        </button>

        <div class="min-w-0">
          <p class="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cicluz-muted)]">
            {{ eyebrow }}
          </p>
          <p class="truncate text-[15px] font-semibold text-[var(--cicluz-ink)]">
            {{ heading }}
          </p>
        </div>
      </div>

      <div class="hidden items-center gap-2 rounded-full border border-[var(--cicluz-line)] bg-white/70 p-1 shadow-[var(--cicluz-shadow-soft)] md:flex">
        <button
          class="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition"
          :class="activeView === 'chat' ? 'bg-[var(--cicluz-ink)] text-white' : 'text-[var(--cicluz-muted-strong)] hover:bg-white'"
          @click="setActiveView('chat')"
        >
          Chat
        </button>
        <button
          class="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition"
          :class="activeView === 'gallery' ? 'bg-[var(--cicluz-ink)] text-white' : 'text-[var(--cicluz-muted-strong)] hover:bg-white'"
          @click="setActiveView('gallery')"
        >
          Galeria
        </button>
      </div>

      <div class="hidden items-center gap-2 rounded-full border border-[var(--cicluz-line)] bg-white/70 px-3 py-2 text-xs text-[var(--cicluz-muted-strong)] shadow-[var(--cicluz-shadow-soft)] lg:flex">
        <span class="h-2 w-2 rounded-full" :class="streaming ? 'bg-amber-400' : 'bg-emerald-500'" />
        <span>{{ statusLabel }}</span>
      </div>
    </div>
  </header>
</template>
