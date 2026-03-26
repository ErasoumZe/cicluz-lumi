<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useBranding } from '../composables/useBranding'
import { useChat } from '../composables/useChat'
import type { ChatAttachment, ChatMessage as ChatMessageType } from '../types/chat.types'

const props = defineProps<{
  message: ChatMessageType
}>()

const { logoSymbolUrl } = useBranding()
const { saveAttachmentToGallery } = useChat()
const isUser = computed(() => props.message.role === 'user')
const isSpeaking = ref(false)

const timestamp = computed(() => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.message.createdAt))
})

const attachments = computed(() => props.message.attachments ?? [])

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const renderInline = (value: string) => {
  return value
    .replace(/`([^`]+)`/g, '<code class="rounded-lg bg-stone-900/90 px-1.5 py-0.5 text-[0.85em] text-stone-100">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  }

const renderMarkdown = (value: string) => {
  const blocks: string[] = []
  const source = escapeHtml(value)
  const fencedBlocks: string[] = []
  const listPattern = /^[-*\u2022]\s+/

  const textWithPlaceholders = source.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_match, language, code) => {
    const rendered = [
      '<div class="mt-4 overflow-hidden rounded-[24px] border border-[var(--cicluz-line)] bg-stone-950 shadow-[var(--cicluz-shadow-soft)]">',
      `<div class="border-b border-stone-800 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-400">${language || 'code'}</div>`,
      `<pre class="overflow-x-auto p-4 text-xs leading-6 text-stone-100"><code>${code.trim()}</code></pre>`,
      '</div>',
    ].join('')

    fencedBlocks.push(rendered)
    return `@@CODE_BLOCK_${fencedBlocks.length - 1}@@`
  })

  for (const rawBlock of textWithPlaceholders.split(/\n{2,}/)) {
    const block = rawBlock.trim()

    if (!block) {
      continue
    }

    if (block.startsWith('@@CODE_BLOCK_')) {
      const match = block.match(/@@CODE_BLOCK_(\d+)@@/)

      if (match) {
        const renderedBlock = fencedBlocks[Number(match[1])]

        if (renderedBlock) {
          blocks.push(renderedBlock)
        }
      }

      continue
    }

    const lines = block.split('\n')

    if (lines.every((line) => listPattern.test(line))) {
      blocks.push(
        `<ul class="mt-2 space-y-2">${lines
          .map((line) => `<li class="flex gap-3"><span class="mt-[0.5rem] h-1.5 w-1.5 rounded-full bg-stone-900/70"></span><span>${renderInline(line.replace(listPattern, ''))}</span></li>`)
          .join('')}</ul>`,
      )
      continue
    }

    blocks.push(
      `<p class="mt-2 whitespace-pre-wrap text-[15px] leading-8">${lines.map((line) => renderInline(line)).join('<br />')}</p>`,
    )
  }

  return blocks.join('')
}

const html = computed(() => renderMarkdown(props.message.content))

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const speakMessage = () => {
  if (!import.meta.client || !props.message.content.trim() || !('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(props.message.content)
  utterance.lang = 'pt-BR'
  utterance.rate = 1
  utterance.onend = () => {
    isSpeaking.value = false
  }
  utterance.onerror = () => {
    isSpeaking.value = false
  }

  isSpeaking.value = true
  window.speechSynthesis.speak(utterance)
}

const stopSpeaking = () => {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()
  isSpeaking.value = false
}

const toggleSpeaking = () => {
  if (isSpeaking.value) {
    stopSpeaking()
    return
  }

  speakMessage()
}

const saveImage = (attachment: ChatAttachment) => {
  saveAttachmentToGallery(attachment, {
    messageId: props.message.id,
    prompt: props.message.content.slice(0, 160),
  })
}

onBeforeUnmount(() => {
  stopSpeaking()
})
</script>

<template>
  <div class="flex w-full items-start" :class="isUser ? 'justify-end' : 'justify-start'">
    <article class="min-w-0" :class="isUser ? 'ml-auto max-w-[82%] text-right' : 'mr-auto w-full max-w-[860px] text-left'">
      <div class="flex items-center gap-3 text-[11px] text-[var(--cicluz-muted)]" :class="isUser ? 'justify-end' : 'justify-start'">
        <template v-if="!isUser">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[var(--cicluz-shadow-soft)] ring-1 ring-[var(--cicluz-line)]">
            <img
              alt="Cicluz"
              :src="logoSymbolUrl"
              class="h-5 w-5 object-contain"
            />
          </div>
        </template>

        <p class="font-semibold uppercase tracking-[0.22em]">
          {{ isUser ? 'Voce' : 'Lumi' }}
        </p>
        <span v-if="message.streaming">Respondendo...</span>
        <span>{{ timestamp }}</span>

        <button
          v-if="!isUser && message.content.trim()"
          class="inline-flex h-8 items-center justify-center rounded-full border border-[var(--cicluz-line)] bg-white/80 px-3 text-[11px] font-medium text-[var(--cicluz-muted-strong)] transition hover:bg-white"
          @click="toggleSpeaking"
        >
          {{ isSpeaking ? 'Parar audio' : 'Ouvir' }}
        </button>
      </div>

      <div
        class="mt-3"
        :class="
          isUser
            ? 'rounded-[26px] border border-[var(--cicluz-line)] bg-white/88 px-5 py-4 shadow-[var(--cicluz-shadow-soft)]'
            : 'ml-11'
        "
      >
        <div v-if="message.content.trim()" class="text-[15px] leading-8 text-[var(--cicluz-ink)]" v-html="html" />

        <div v-if="attachments.length > 0" class="mt-4 space-y-3">
          <template v-for="attachment in attachments" :key="attachment.id">
            <div
              v-if="attachment.kind === 'image'"
              class="overflow-hidden rounded-[24px] border border-[var(--cicluz-line-strong)] bg-white/92 shadow-[var(--cicluz-shadow-soft)]"
            >
              <div class="aspect-[4/3] overflow-hidden bg-[var(--cicluz-bg-soft)]">
                <img :src="attachment.url" :alt="attachment.name" class="h-full w-full object-cover" />
              </div>

              <div class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[var(--cicluz-ink)]">{{ attachment.name }}</p>
                  <p class="mt-1 text-xs text-[var(--cicluz-muted)]">{{ attachment.description || 'Imagem pronta para revisar ou salvar.' }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    :href="attachment.url"
                    :download="attachment.name"
                    class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--cicluz-line-strong)] bg-white px-4 text-sm font-medium text-[var(--cicluz-ink)] transition hover:bg-[var(--cicluz-bg-soft)]"
                  >
                    Baixar
                  </a>

                  <button
                    class="inline-flex h-10 items-center justify-center rounded-full border border-transparent px-4 text-sm font-medium text-[var(--cicluz-muted-strong)] transition hover:border-[var(--cicluz-line-strong)] hover:bg-white"
                    @click="saveImage(attachment)"
                  >
                    Salvar na galeria
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else-if="attachment.kind === 'audio'"
              class="rounded-[22px] border border-[var(--cicluz-line-strong)] bg-white/92 px-4 py-4 shadow-[var(--cicluz-shadow-soft)]"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[var(--cicluz-ink)]">{{ attachment.name }}</p>
                  <p class="mt-1 text-xs text-[var(--cicluz-muted)]">
                    {{ formatFileSize(attachment.size) }}
                    <span v-if="attachment.durationMs"> • {{ Math.round(attachment.durationMs / 1000) }}s</span>
                  </p>
                </div>
              </div>

              <audio class="mt-3 w-full" controls :src="attachment.url" />

              <p v-if="attachment.transcript" class="mt-3 text-sm leading-6 text-[var(--cicluz-muted-strong)]">
                Transcricao: {{ attachment.transcript }}
              </p>
            </div>

            <div
              v-else
              class="rounded-[22px] border border-[var(--cicluz-line-strong)] bg-white/92 px-4 py-4 shadow-[var(--cicluz-shadow-soft)]"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[var(--cicluz-ink)]">{{ attachment.name }}</p>
                  <p class="mt-1 text-xs text-[var(--cicluz-muted)]">
                    {{ formatFileSize(attachment.size) }}
                  </p>
                </div>

                <a
                  :href="attachment.url"
                  :download="attachment.name"
                  class="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[var(--cicluz-line-strong)] bg-white px-4 text-sm font-medium text-[var(--cicluz-ink)] transition hover:bg-[var(--cicluz-bg-soft)]"
                >
                  Baixar
                </a>
              </div>
            </div>
          </template>
        </div>
      </div>
    </article>
  </div>
</template>
