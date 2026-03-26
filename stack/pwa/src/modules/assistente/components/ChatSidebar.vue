<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'
import type { ChatConversation } from '../types/chat.types'

const {
  conversations,
  activeConversation,
  createConversation,
  selectConversation,
  loading,
  error,
  sidebarCollapsed,
  activeView,
  setActiveView,
  toggleSidebar,
} = useChat()
const { logoSymbolUrl } = useBranding()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const hasUserMessages = (conversation: ChatConversation) => {
  return conversation.messages.some((message) => message.role === 'user')
}

const getPreview = (conversation: ChatConversation) => {
  const message = [...conversation.messages].reverse().find((item) => {
    return item.id !== 'message-initial' && !item.streaming
  })

  if (!message) {
    return 'Pronta para comecar.'
  }

  if (message.content.trim()) {
    return message.content
  }

  const audioAttachment = message.attachments?.find((attachment) => attachment.kind === 'audio')

  if (audioAttachment) {
    return audioAttachment.transcript?.trim() || 'Audio enviado.'
  }

  const imageAttachment = message.attachments?.find((attachment) => attachment.kind === 'image')

  if (imageAttachment) {
    return 'Imagem enviada.'
  }

  if ((message.attachments?.length ?? 0) > 0) {
    return 'Arquivo enviado.'
  }

  return 'Pronta para comecar.'
}

const history = computed(() => {
  return conversations.value.filter((conversation) => hasUserMessages(conversation))
})

const filteredHistory = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return history.value
  }

  return history.value.filter((conversation) => {
    return [conversation.title, getPreview(conversation)]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

const isActiveConversation = (conversationId: string) => {
  return activeConversation.value?.id === conversationId
}

const openSearch = async () => {
  if (sidebarCollapsed.value) {
    toggleSidebar()
    await nextTick()
  }

  searchInput.value?.focus()
}

const openChatView = () => {
  setActiveView('chat')
}

const openGalleryView = () => {
  setActiveView('gallery')
}
</script>

<template>
  <aside
    class="relative border-b border-[var(--cicluz-line)] bg-[var(--cicluz-sidebar)] backdrop-blur-xl transition-[width] duration-300 lg:min-h-screen lg:border-b-0 lg:border-r"
    :class="sidebarCollapsed ? 'lg:w-[92px]' : 'lg:w-[320px]'"
  >
    <div class="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[var(--cicluz-line-strong)] to-transparent lg:block" />

    <div
      class="flex h-full flex-col"
      :class="sidebarCollapsed ? 'px-3 pb-4 pt-5 lg:px-3.5 lg:pb-5 lg:pt-5' : 'px-4 pb-4 pt-5 sm:px-5 lg:pb-6 lg:pt-6'"
    >
      <div :class="sidebarCollapsed ? 'flex flex-col items-center gap-3' : 'flex flex-col gap-5'">
        <div :class="sidebarCollapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-4'">
          <button
            class="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)] transition hover:bg-[var(--cicluz-bg-soft)] sm:h-14 sm:w-14 sm:rounded-[22px]"
            :title="sidebarCollapsed ? 'Abrir barra lateral' : 'Fechar barra lateral'"
            :aria-label="sidebarCollapsed ? 'Abrir barra lateral' : 'Fechar barra lateral'"
            @click="toggleSidebar"
          >
            <img
              alt="Cicluz"
              :src="logoSymbolUrl"
              class="h-8 w-8 object-contain transition duration-200 group-hover:scale-90 group-hover:opacity-0 sm:h-10 sm:w-10"
            />

            <span class="absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
              <svg aria-hidden="true" class="h-5 w-5 text-[var(--cicluz-ink)]" fill="none" viewBox="0 0 24 24">
                <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.8" />
                <path
                  :d="sidebarCollapsed ? 'M14 5.9v12.2' : 'M10 5.9v12.2'"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                />
              </svg>
            </span>
          </button>

          <div v-if="false && !sidebarCollapsed" class="min-w-0">
              <p class="cicluz-wordmark truncate text-[1.7rem] leading-none tracking-[-0.055em] text-[var(--cicluz-ink)] sm:text-[2rem]" aria-label="Lumi">
                <span class="cicluz-wordmark__lu">Lu</span><span class="cicluz-wordmark__mi">m</span><span class="cicluz-wordmark__i">ı</span>
              </p>
              <p class="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--cicluz-muted-strong)] sm:text-[11px]">
                Metodologia Cicluz
              </p>
          </div>

          <div v-if="!sidebarCollapsed" class="min-w-0">
            <p
              class="cicluz-wordmark truncate text-[1.7rem] leading-none tracking-[-0.04em] text-[var(--cicluz-ink)] sm:text-[2rem]"
              aria-label="Lumi"
            >
              <span class="cicluz-wordmark__lu">Lu</span><span class="cicluz-wordmark__mi">mi</span>
            </p>
            <p class="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--cicluz-muted-strong)] sm:text-[11px]">
              Metodologia Cicluz
            </p>
          </div>
        </div>

        <button
          v-if="!sidebarCollapsed"
          class="cicluz-button-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white sm:h-12"
          @click="createConversation"
        >
          <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
          </svg>
          <span>Nova conversa</span>
        </button>

        <button
          v-else
          class="cicluz-icon-button h-12 w-12"
          title="Nova conversa"
          aria-label="Nova conversa"
          @click="createConversation"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
          </svg>
        </button>
      </div>

      <div class="mt-5 h-px w-full cicluz-divider-subtle lg:mt-6" />

      <div v-if="!sidebarCollapsed" class="mt-5 space-y-3 lg:mt-6">
        <button
          class="cicluz-nav-button"
          :class="activeView === 'chat' ? 'cicluz-nav-button--active' : ''"
          @click="openChatView"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4V6.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
          <span>Chat</span>
        </button>

        <button
          class="cicluz-nav-button"
          :class="activeView === 'gallery' ? 'cicluz-nav-button--active' : ''"
          @click="openGalleryView"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.8" />
            <path d="m8 14 2.5-2.5a1.5 1.5 0 0 1 2.1 0L16 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          </svg>
          <span>Galeria</span>
        </button>

        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cicluz-muted)]">
            <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.8" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
            </svg>
          </span>

          <input
            ref="searchInput"
            v-model="searchQuery"
            type="search"
            placeholder="Buscar em chats"
            class="h-11 w-full rounded-full border border-[var(--cicluz-line-strong)] bg-white/84 pl-10 pr-4 text-sm text-[var(--cicluz-ink)] outline-none transition placeholder:text-[var(--cicluz-muted)] focus:border-[rgba(109,61,242,0.35)] focus:bg-white"
          />
        </label>
      </div>

      <div v-else class="mt-5 flex flex-col items-center gap-2 lg:mt-6">
        <button
          class="cicluz-icon-button h-11 w-11"
          title="Chat"
          aria-label="Abrir chat"
          :class="activeView === 'chat' ? 'cicluz-icon-button--active' : ''"
          @click="openChatView"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4V6.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </button>

        <button
          class="cicluz-icon-button h-11 w-11"
          title="Buscar em chats"
          aria-label="Buscar em chats"
          @click="openSearch"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.8" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
          </svg>
        </button>

        <button
          class="cicluz-icon-button h-11 w-11"
          title="Galeria"
          aria-label="Abrir galeria"
          :class="activeView === 'gallery' ? 'cicluz-icon-button--active' : ''"
          @click="openGalleryView"
        >
          <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" stroke-width="1.8" />
            <path d="m8 14 2.5-2.5a1.5 1.5 0 0 1 2.1 0L16 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div class="mt-5 flex items-center justify-between px-1 lg:mt-6" :class="sidebarCollapsed ? 'justify-center' : ''">
        <template v-if="!sidebarCollapsed">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cicluz-muted)]">Historico</p>
          <span class="text-xs text-[var(--cicluz-muted)]">{{ filteredHistory.length }}</span>
        </template>
      </div>

      <p v-if="error && !sidebarCollapsed" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-600">
        {{ error }}
      </p>

      <div
        class="mt-4 overflow-y-auto pr-1"
        :class="
          sidebarCollapsed
            ? 'flex flex-col items-center gap-2 lg:flex-1'
            : 'max-h-44 space-y-1.5 sm:max-h-52 lg:max-h-none lg:flex-1'
        "
      >
        <p v-if="loading && filteredHistory.length === 0 && !sidebarCollapsed" class="px-2 py-3 text-sm text-[var(--cicluz-muted)]">
          Carregando a Lumi...
        </p>

        <p v-else-if="filteredHistory.length === 0 && !sidebarCollapsed" class="px-2 py-3 text-sm leading-6 text-[var(--cicluz-muted)]">
          {{ searchQuery ? 'Nenhum chat encontrado para esta busca.' : 'As conversas aparecem aqui quando voce enviar a primeira mensagem.' }}
        </p>

        <template v-else>
          <button
            v-for="conversation in filteredHistory"
            :key="conversation.id"
            class="transition"
            :class="
              sidebarCollapsed
                ? [
                    'cicluz-icon-button h-11 w-11 rounded-2xl text-xs font-semibold',
                    isActiveConversation(conversation.id) ? 'cicluz-icon-button--active' : '',
                  ]
                : [
                    'w-full rounded-[22px] px-3 py-3 text-left',
                    isActiveConversation(conversation.id)
                      ? 'bg-white/92 shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]'
                      : 'hover:bg-white/58',
                  ]
            "
            :title="sidebarCollapsed ? conversation.title : undefined"
            @click="selectConversation(conversation.id)"
          >
            <template v-if="sidebarCollapsed">
              {{ conversation.title.charAt(0).toUpperCase() }}
            </template>

            <template v-else>
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
            </template>
          </button>
        </template>
      </div>

      <div v-if="!sidebarCollapsed" class="mt-5 hidden border-t border-[var(--cicluz-line)] pt-4 lg:block lg:mt-6">
        <p class="text-xs leading-5 text-[var(--cicluz-muted)]">
          Lumi conversa com voce a partir da metodologia Cicluz e ajuda a transformar reflexoes em direcao consciente.
        </p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.cicluz-wordmark,
.cicluz-wordmark__lu,
.cicluz-wordmark__mi {
  font-family: 'Montserrat', 'Segoe UI', sans-serif;
  font-kerning: normal;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

.cicluz-wordmark {
  display: inline-flex;
  align-items: baseline;
}

.cicluz-wordmark__lu {
  font-weight: 500;
}

.cicluz-wordmark__mi {
  font-weight: 300;
}
</style>
