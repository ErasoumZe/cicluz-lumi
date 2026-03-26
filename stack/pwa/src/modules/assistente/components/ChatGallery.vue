<script setup lang="ts">
import { computed } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'

const { galleryItems, removeGalleryItem, setActiveView } = useChat()
const { logoSymbolUrl } = useBranding()

const hasItems = computed(() => galleryItems.value.length > 0)

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
    <div class="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-10">
      <div class="flex flex-col gap-4 border-b border-[var(--cicluz-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cicluz-muted)]">Galeria Lumi</p>
          <h2 class="font-display mt-2 text-[clamp(2rem,5vw,3.3rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--cicluz-ink)]">
            Criacoes visuais e imagens salvas
          </h2>
          <p class="mt-3 max-w-[760px] text-[15px] leading-7 text-[var(--cicluz-muted-strong)]">
            Aqui ficam as imagens geradas ou salvas ao longo das conversas com a Lumi.
          </p>
        </div>

        <button
          class="inline-flex h-11 items-center justify-center rounded-full border border-[var(--cicluz-line-strong)] bg-white/80 px-5 text-sm font-semibold text-[var(--cicluz-ink)] shadow-[var(--cicluz-shadow-soft)] transition hover:bg-white"
          @click="setActiveView('chat')"
        >
          Voltar para o chat
        </button>
      </div>

      <div v-if="!hasItems" class="flex flex-1 items-center justify-center py-16">
        <div class="cicluz-soft-panel flex max-w-[560px] flex-col items-center rounded-[34px] px-8 py-10 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]">
            <img :src="logoSymbolUrl" alt="Cicluz" class="h-9 w-9 object-contain" />
          </div>

          <h3 class="font-display mt-6 text-[2rem] font-semibold tracking-[-0.04em] text-[var(--cicluz-ink)]">
            Sua galeria ainda esta vazia
          </h3>

          <p class="mt-3 text-[15px] leading-7 text-[var(--cicluz-muted-strong)]">
            Quando a Lumi criar uma imagem ou quando voce salvar uma visualizacao, ela aparece aqui.
          </p>
        </div>
      </div>

      <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in galleryItems"
          :key="item.id"
          class="overflow-hidden rounded-[30px] border border-[var(--cicluz-line-strong)] bg-white/86 shadow-[var(--cicluz-shadow-soft)]"
        >
          <div class="aspect-[4/3] overflow-hidden bg-[var(--cicluz-bg-soft)]">
            <img :src="item.url" :alt="item.name" class="h-full w-full object-cover" />
          </div>

          <div class="px-5 py-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[var(--cicluz-ink)]">{{ item.name }}</p>
                <p class="mt-1 text-xs text-[var(--cicluz-muted)]">{{ formatDate(item.createdAt) }}</p>
              </div>
            </div>

            <p v-if="item.prompt" class="mt-3 line-clamp-2 text-sm leading-6 text-[var(--cicluz-muted-strong)]">
              {{ item.prompt }}
            </p>

            <div class="mt-4 flex items-center gap-2">
              <a
                :href="item.url"
                :download="item.name"
                class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--cicluz-line-strong)] bg-white px-4 text-sm font-medium text-[var(--cicluz-ink)] transition hover:bg-[var(--cicluz-bg-soft)]"
              >
                Baixar
              </a>

              <button
                class="inline-flex h-10 items-center justify-center rounded-full border border-transparent px-4 text-sm font-medium text-[var(--cicluz-muted-strong)] transition hover:border-[var(--cicluz-line-strong)] hover:bg-white"
                @click="removeGalleryItem(item.id)"
              >
                Remover
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
