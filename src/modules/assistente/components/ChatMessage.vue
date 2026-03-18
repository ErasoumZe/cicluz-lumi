<script setup lang="ts">
import { computed } from 'vue'
import { useBranding } from '../composables/useBranding'
import type { ChatMessage as ChatMessageType } from '../types/chat.types'

const props = defineProps<{
  message: ChatMessageType
}>()

const { logoSymbolUrl } = useBranding()
const isUser = computed(() => props.message.role === 'user')

const timestamp = computed(() => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.message.createdAt))
})

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
</script>

<template>
  <div class="flex w-full" :class="isUser ? 'justify-end' : 'justify-start'">
    <article class="min-w-0" :class="isUser ? 'max-w-[78%]' : 'max-w-[820px] flex-1'">
      <div class="flex items-center gap-3 text-[11px] text-[var(--cicluz-muted)]" :class="isUser ? 'justify-end' : ''">
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
          {{ isUser ? 'Voc\u00ea' : 'Lumi' }}
        </p>
        <span v-if="message.streaming">Respondendo...</span>
        <span>{{ timestamp }}</span>
      </div>

      <div
        class="mt-3"
        :class="
          isUser
            ? 'rounded-[26px] border border-[var(--cicluz-line)] bg-white/88 px-5 py-4 shadow-[var(--cicluz-shadow-soft)]'
            : 'pl-11'
        "
      >
        <div class="text-[15px] leading-8 text-[var(--cicluz-ink)]" v-html="html" />
      </div>
    </article>
  </div>
</template>
