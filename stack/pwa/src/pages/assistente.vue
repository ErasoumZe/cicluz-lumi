<script setup lang="ts">
import ChatConversation from '~/modules/assistente/components/ChatConversation.vue'
import ChatGallery from '~/modules/assistente/components/ChatGallery.vue'
import ChatInput from '~/modules/assistente/components/ChatInput.vue'
import ChatSidebar from '~/modules/assistente/components/ChatSidebar.vue'
import { useChat } from '~/modules/assistente/composables/useChat'

const { initialize, sidebarCollapsed, activeView } = useChat()

useHead({
  title: 'Lumi | Autoconhecimento Cicluz',
})

await initialize()
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--cicluz-bg)] text-[var(--cicluz-ink)]">
    <div class="cicluz-top-divider absolute inset-x-0 top-0 z-30 h-[3px]" />

    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-[-12%] top-[-10%] h-[26rem] w-[26rem] rounded-full bg-white/80 blur-3xl sm:h-[34rem] sm:w-[34rem]" />
      <div class="absolute right-[-12%] top-[6%] h-[24rem] w-[24rem] rounded-full bg-sky-100/35 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
      <div class="absolute bottom-[-18%] left-[18%] h-[24rem] w-[24rem] rounded-full bg-violet-100/30 blur-3xl sm:h-[30rem] sm:w-[30rem]" />
    </div>

    <div
      class="relative grid min-h-screen transition-[grid-template-columns] duration-300"
      :class="sidebarCollapsed ? 'lg:grid-cols-[92px_minmax(0,1fr)]' : 'lg:grid-cols-[320px_minmax(0,1fr)]'"
    >
      <ChatSidebar />

      <section class="relative flex min-w-0 flex-col">
        <ChatConversation v-if="activeView === 'chat'" />
        <ChatGallery v-else />
        <ChatInput v-if="activeView === 'chat'" />
      </section>
    </div>
  </div>
</template>
