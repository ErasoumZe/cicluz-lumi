<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useChat } from '../composables/useChat'
import type { ChatAttachment } from '../types/chat.types'

type BrowserSpeechRecognition = {
  start: () => void
  stop: () => void
  abort?: () => void
  onresult: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

type RecordingMode = 'attachment' | 'voice-chat'

const {
  activeConversation,
  sendMessage,
  loading,
  streaming,
  error,
  recentFiles,
  rememberRecentFile,
  activateIntroFlow,
  deactivateIntroFlow,
} = useChat()

const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const composerRef = ref<HTMLElement | null>(null)
const addMenuOpen = ref(false)
const pendingAttachments = ref<ChatAttachment[]>([])
const recordingMode = ref<RecordingMode | null>(null)
const recordingTranscript = ref('')
const voiceError = ref<string | null>(null)
const voiceReplyActive = ref(false)
const recordingElapsedMs = ref(0)

let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let recordingStartedAt = 0
let recordingChunks: BlobPart[] = []
let speechRecognition: BrowserSpeechRecognition | null = null
let recordingIntervalId: ReturnType<typeof setInterval> | null = null
let voiceChatShouldSubmit = false

const visibleMessages = computed(() => {
  const messages = activeConversation.value?.messages ?? []
  return messages.filter((message) => message.id !== 'message-initial')
})

const isBusy = computed(() => loading.value || streaming.value)
const isWelcomeState = computed(() => {
  return activeConversation.value !== null && visibleMessages.value.length === 0
})
const isInitialStage = computed(() => isWelcomeState.value)
const isRecording = computed(() => recordingMode.value !== null)
const isAttachmentRecording = computed(() => recordingMode.value === 'attachment')
const isVoiceChatRecording = computed(() => recordingMode.value === 'voice-chat')

const supportsAudioRecording = computed(() => {
  return import.meta.client && typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
})

const supportsVoiceChat = computed(() => {
  return import.meta.client && Boolean(getRecognitionConstructor())
})

const canSubmit = computed(() => {
  return !isBusy.value && (draft.value.trim().length > 0 || pendingAttachments.value.length > 0)
})

const placeholder = computed(() => {
  return isInitialStage.value ? 'Converse com a Lumi...' : 'Pergunte alguma coisa'
})

const statusText = computed(() => {
  if (voiceError.value) {
    return voiceError.value
  }

  if (voiceReplyActive.value) {
    return 'A Lumi esta respondendo por voz...'
  }

  if (isVoiceChatRecording.value) {
    return `Ouvindo... ${formatElapsed(recordingElapsedMs.value)}`
  }

  if (isAttachmentRecording.value) {
    return `Gravando audio... ${formatElapsed(recordingElapsedMs.value)}`
  }

  return ''
})

const resizeTextarea = () => {
  if (!textareaRef.value) {
    return
  }

  textareaRef.value.style.height = '0px'
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 128)}px`
}

const formatElapsed = (value: number) => {
  const totalSeconds = Math.max(Math.round(value / 1000), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const updateRecordingElapsed = () => {
  recordingElapsedMs.value = Math.max(Date.now() - recordingStartedAt, 0)
}

const startRecordingClock = () => {
  recordingElapsedMs.value = 0

  if (recordingIntervalId) {
    clearInterval(recordingIntervalId)
  }

  recordingIntervalId = setInterval(() => {
    updateRecordingElapsed()
  }, 250)
}

const stopRecordingClock = () => {
  if (recordingIntervalId) {
    clearInterval(recordingIntervalId)
    recordingIntervalId = null
  }

  recordingElapsedMs.value = 0
}

const blobToDataUrl = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo.'))
    reader.readAsDataURL(blob)
  })
}

const buildAttachmentFromBlob = async (
  blob: Blob,
  name: string,
  source: ChatAttachment['source'],
  transcript?: string,
  durationMs?: number,
) => {
  const url = await blobToDataUrl(blob)
  const mimeType = blob.type || 'application/octet-stream'
  const kind = mimeType.startsWith('image/')
    ? 'image'
    : mimeType.startsWith('audio/')
      ? 'audio'
      : 'file'

  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    source,
    name,
    mimeType,
    size: blob.size,
    url,
    createdAt: new Date().toISOString(),
    transcript,
    durationMs: durationMs ?? null,
    description: kind === 'image' ? 'Arquivo anexado ao chat.' : undefined,
  } satisfies ChatAttachment
}

const pushAttachments = (attachments: ChatAttachment[]) => {
  pendingAttachments.value = [...pendingAttachments.value, ...attachments]

  for (const attachment of attachments) {
    rememberRecentFile(attachment)
  }
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []

  if (files.length === 0) {
    return
  }

  const attachments = await Promise.all(files.map((file) => buildAttachmentFromBlob(file, file.name, 'upload')))
  pushAttachments(attachments)
  addMenuOpen.value = false
  input.value = ''
}

const removeAttachment = (attachmentId: string) => {
  pendingAttachments.value = pendingAttachments.value.filter((attachment) => attachment.id !== attachmentId)
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const attachRecent = (attachment: ChatAttachment) => {
  pendingAttachments.value = [
    ...pendingAttachments.value,
    {
      ...attachment,
      id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    },
  ]
  addMenuOpen.value = false
}

const getRecognitionConstructor = () => {
  if (!import.meta.client) {
    return null
  }

  const scopedWindow = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }

  return scopedWindow.SpeechRecognition || scopedWindow.webkitSpeechRecognition || null
}

const getPreferredAudioMimeType = () => {
  if (!import.meta.client || typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }

  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
  ]

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ''
}

const stopSpeechRecognition = () => {
  if (!speechRecognition) {
    return
  }

  try {
    speechRecognition.stop()
  } catch {
    // Ignore duplicate stop errors from browser implementations.
  }
}

const stopVoiceReply = () => {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    voiceReplyActive.value = false
    return
  }

  window.speechSynthesis.cancel()
  voiceReplyActive.value = false
}

const speakAssistantReply = async () => {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    return
  }

  await nextTick()

  const messages = activeConversation.value?.messages ?? []
  const assistantMessage = [...messages].reverse().find((message) => {
    return message.role === 'assistant' && !message.streaming && message.content.trim().length > 0
  })

  if (!assistantMessage) {
    return
  }

  stopVoiceReply()

  const utterance = new SpeechSynthesisUtterance(assistantMessage.content)
  utterance.lang = 'pt-BR'
  utterance.rate = 1
  utterance.onend = () => {
    voiceReplyActive.value = false
  }
  utterance.onerror = () => {
    voiceReplyActive.value = false
    voiceError.value = 'Nao consegui reproduzir a resposta em voz.'
  }

  voiceReplyActive.value = true
  window.speechSynthesis.speak(utterance)
}

const stopMediaTracks = () => {
  mediaStream?.getTracks().forEach((track) => track.stop())
  mediaStream = null
}

const clearRecordingState = () => {
  mediaRecorder = null
  recordingChunks = []
  speechRecognition = null
  recordingMode.value = null
  voiceChatShouldSubmit = false
  stopRecordingClock()
}

const discardRecordingSession = () => {
  if (mediaRecorder) {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onerror = null
    mediaRecorder.onstop = null

    if (mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop()
      } catch {
        // Ignore recorder teardown errors during component cleanup.
      }
    }
  }

  if (speechRecognition) {
    speechRecognition.onresult = null
    speechRecognition.onerror = null
    speechRecognition.onend = null

    try {
      speechRecognition.abort?.()
    } catch {
      stopSpeechRecognition()
    }
  }

  stopMediaTracks()
  clearRecordingState()
}

const finalizeVoiceChat = async (transcript: string) => {
  const messageText = transcript.trim()

  clearRecordingState()
  recordingTranscript.value = ''

  if (!messageText) {
    voiceError.value = 'Nao consegui transcrever sua fala.'
    return
  }

  await sendMessage(messageText, [])
  await speakAssistantReply()
}

const finalizeRecording = async () => {
  const durationMs = Date.now() - recordingStartedAt
  const mimeType = mediaRecorder?.mimeType || 'audio/webm'
  const blob = new Blob(recordingChunks, { type: mimeType })
  const transcript = recordingTranscript.value.trim()

  stopMediaTracks()
  clearRecordingState()
  recordingTranscript.value = ''

  if (blob.size === 0 && !transcript) {
    return
  }

  let attachment: ChatAttachment | null = null

  if (blob.size > 0) {
    const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm'
    attachment = await buildAttachmentFromBlob(
      blob,
      `gravacao-lumi-${Date.now()}.${extension}`,
      'recording',
      transcript || undefined,
      durationMs,
    )
    rememberRecentFile(attachment)
  }

  if (attachment) {
    pendingAttachments.value = [...pendingAttachments.value, attachment]
  }

  if (transcript) {
    draft.value = draft.value.trim()
      ? `${draft.value.trim()}\n\n${transcript}`
      : transcript

    await nextTick()
    resizeTextarea()
  }
}

const stopRecording = () => {
  const mode = recordingMode.value

  if (!mode) {
    return
  }

  if (mode === 'voice-chat') {
    voiceChatShouldSubmit = true
    if (speechRecognition) {
      stopSpeechRecognition()
    } else {
      clearRecordingState()
      recordingTranscript.value = ''
    }
    return
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.requestData?.()
    mediaRecorder.stop()
    return
  }

  stopMediaTracks()
  clearRecordingState()
}

const startRecording = async (mode: RecordingMode) => {
  if ((mode === 'attachment' && !supportsAudioRecording.value) || (mode === 'voice-chat' && !supportsVoiceChat.value) || isBusy.value) {
    voiceError.value = 'Voz indisponivel neste navegador.'
    return
  }

  voiceError.value = null
  recordingTranscript.value = ''
  stopVoiceReply()

  if (mode === 'voice-chat') {
    const RecognitionCtor = getRecognitionConstructor()

    if (!RecognitionCtor) {
      voiceError.value = 'Voz indisponivel neste navegador.'
      return
    }

    const recognition = new RecognitionCtor()
    speechRecognition = recognition
    recordingStartedAt = Date.now()
    recordingMode.value = mode
    voiceChatShouldSubmit = false
    startRecordingClock()

    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: Event) => {
      const scopedEvent = event as Event & {
        results: ArrayLike<ArrayLike<{ transcript: string }>>
      }

      let transcript = ''

      for (const result of Array.from(scopedEvent.results)) {
        transcript += Array.from(result).map((item) => item.transcript).join('')
      }

      recordingTranscript.value = transcript.trim()
    }
    recognition.onerror = (event: Event) => {
      const scopedEvent = event as Event & { error?: string }

      if (scopedEvent.error === 'not-allowed' || scopedEvent.error === 'service-not-allowed') {
        voiceError.value = 'Permita o microfone para usar voz.'
        discardRecordingSession()
        return
      }

      if (scopedEvent.error === 'aborted') {
        return
      }

      if (scopedEvent.error === 'no-speech') {
        voiceError.value = 'Nao ouvi nada. Tente falar novamente.'
        return
      }

      voiceError.value = 'Transcricao indisponivel.'
    }
    recognition.onend = () => {
      const transcript = recordingTranscript.value.trim()
      const shouldSubmit = voiceChatShouldSubmit

      speechRecognition = null
      recordingMode.value = null
      voiceChatShouldSubmit = false
      stopRecordingClock()

      if (shouldSubmit) {
        void finalizeVoiceChat(transcript)
      }
    }

    try {
      recognition.start()
    } catch {
      voiceError.value = 'Nao consegui iniciar o modo de voz.'
      discardRecordingSession()
    }

    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = getPreferredAudioMimeType()
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)
    recordingChunks = []
    recordingStartedAt = Date.now()
    recordingMode.value = mode
    startRecordingClock()

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingChunks.push(event.data)
      }
    }

    mediaRecorder.onerror = () => {
      voiceError.value = 'Nao consegui concluir a gravacao.'
      discardRecordingSession()
    }

    mediaRecorder.onstop = () => {
      void finalizeRecording()
    }

    mediaRecorder.start(200)
  } catch {
    voiceError.value = 'Microfone indisponivel.'
    discardRecordingSession()
  }
}

const toggleAttachmentRecording = async () => {
  if (isRecording.value) {
    stopRecording()
    return
  }

  await startRecording('attachment')
}

const toggleVoiceChat = async () => {
  if (isRecording.value) {
    stopRecording()
    return
  }

  await startRecording('voice-chat')
}

const submit = async () => {
  const content = draft.value.trim()

  if (!canSubmit.value) {
    return
  }

  const attachments = [...pendingAttachments.value]
  draft.value = ''
  pendingAttachments.value = []
  addMenuOpen.value = false

  await nextTick()
  resizeTextarea()
  textareaRef.value?.focus()
  void sendMessage(content, attachments)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void submit()
  }
}

const onFocus = () => {
  if (isWelcomeState.value) {
    activateIntroFlow()
  }
}

const onBlur = () => {
  if (isWelcomeState.value && !isBusy.value) {
    deactivateIntroFlow()
  }
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!composerRef.value) {
    return
  }

  const target = event.target as Node | null

  if (target && !composerRef.value.contains(target)) {
    addMenuOpen.value = false
  }
}

onMounted(() => {
  resizeTextarea()

  if (import.meta.client) {
    document.addEventListener('mousedown', handleDocumentClick)
  }
})

onUnmounted(() => {
  stopVoiceReply()
  discardRecordingSession()

  if (import.meta.client) {
    document.removeEventListener('mousedown', handleDocumentClick)
  }
})
</script>

<template>
  <div
    :class="
      isInitialStage
        ? 'px-4 pb-10 sm:px-6 sm:pb-12 md:px-8 lg:px-10'
        : 'sticky bottom-0 z-10 bg-gradient-to-t from-[var(--cicluz-bg)] via-[rgba(247,247,250,0.98)] to-transparent px-4 pb-5 pt-4 sm:px-6 lg:px-10'
    "
  >
    <div class="mx-auto w-full" :class="isInitialStage ? 'max-w-[720px]' : 'max-w-[820px]'">
      <p v-if="error" class="mb-3 text-sm text-rose-600">
        {{ error }}
      </p>

      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        multiple
        @change="onFileChange"
      />

      <div
        ref="composerRef"
        class="overflow-visible rounded-[28px] border border-[var(--cicluz-line-strong)] bg-[rgba(255,255,255,0.9)] shadow-[0_24px_52px_-42px_rgba(26,29,45,0.18)] backdrop-blur-xl"
      >
        <div v-if="pendingAttachments.length > 0" class="px-4 pt-3 sm:px-5">
          <div class="flex flex-wrap gap-2 pb-1">
            <div
              v-for="attachment in pendingAttachments"
              :key="attachment.id"
              class="flex max-w-full items-center gap-2 rounded-[16px] border border-[var(--cicluz-line)] bg-white/96 px-2.5 py-1.5 text-sm shadow-[0_10px_18px_-16px_rgba(26,29,45,0.16)]"
            >
              <div
                v-if="attachment.kind === 'image'"
                class="h-7 w-7 overflow-hidden rounded-[10px] bg-[var(--cicluz-bg-soft)]"
              >
                <img :src="attachment.url" :alt="attachment.name" class="h-full w-full object-cover" />
              </div>

              <div
                v-else
                class="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[var(--cicluz-bg-soft)] text-[var(--cicluz-ink)]"
              >
                <svg v-if="attachment.kind === 'audio'" aria-hidden="true" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.8" />
                  <path d="M6.5 10.5a5.5 5.5 0 1 0 11 0M12 18v2.5M9 20.5h6" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                </svg>
                <svg v-else aria-hidden="true" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <path d="M7 3.5h7.5L19 8v12.5H7z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
                  <path d="M14.5 3.5V8H19" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
                </svg>
              </div>

              <span class="max-w-[180px] truncate text-[12px] font-medium text-[var(--cicluz-ink)]">{{ attachment.name }}</span>

              <button
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--cicluz-muted)] transition hover:bg-[var(--cicluz-bg-soft)] hover:text-[var(--cicluz-ink)]"
                @click="removeAttachment(attachment.id)"
              >
                <svg aria-hidden="true" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 pb-1 pt-4 sm:px-5">
          <textarea
            ref="textareaRef"
            v-model="draft"
            rows="1"
            :placeholder="placeholder"
            class="min-h-[30px] w-full resize-none bg-transparent text-[15px] leading-7 text-[var(--cicluz-ink)] outline-none placeholder:text-[var(--cicluz-muted)] sm:text-[16px]"
            @input="resizeTextarea"
            @keydown="onKeydown"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>

        <div class="flex items-center justify-between gap-3 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
          <div class="relative flex min-w-0 flex-1 items-center gap-2">
            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--cicluz-line-strong)] bg-white text-[var(--cicluz-muted-strong)] transition hover:bg-[var(--cicluz-bg-soft)] hover:text-[var(--cicluz-ink)]"
              aria-label="Adicionar fotos e arquivos"
              @click="addMenuOpen = !addMenuOpen"
            >
              <svg aria-hidden="true" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
              </svg>
            </button>

            <div
              v-if="addMenuOpen"
              class="absolute bottom-[calc(100%+0.7rem)] left-0 z-20 w-[min(92vw,264px)] overflow-hidden rounded-[22px] border border-[var(--cicluz-line-strong)] bg-[rgba(255,255,255,0.98)] shadow-[0_18px_42px_-30px_rgba(26,29,45,0.2)] backdrop-blur-xl"
            >
              <button
                class="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[13px] font-medium text-[var(--cicluz-ink)] transition hover:bg-[var(--cicluz-bg-soft)]"
                @click="openFilePicker"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cicluz-bg-soft)] text-[var(--cicluz-muted-strong)]">
                  <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path d="M8 7.5A3.5 3.5 0 0 1 11.5 4H17a3 3 0 0 1 3 3v7.5A5.5 5.5 0 0 1 14.5 20H9a5 5 0 0 1-5-5v-3.5A4.5 4.5 0 0 1 8.5 7h6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
                  </svg>
                </span>
                <span>Adicionar fotos e arquivos</span>
              </button>

              <div class="border-t border-[var(--cicluz-line)] px-4 py-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cicluz-muted)]">
                  Arquivos recentes
                </p>

                <div v-if="recentFiles.length === 0" class="pt-2.5 text-[13px] leading-6 text-[var(--cicluz-muted)]">
                  Nada recente ainda.
                </div>

                <div v-else class="mt-2 space-y-1">
                  <button
                    v-for="attachment in recentFiles.slice(0, 4)"
                    :key="attachment.id"
                    class="flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left transition hover:bg-[var(--cicluz-bg-soft)]"
                    @click="attachRecent(attachment)"
                  >
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[var(--cicluz-bg-soft)] text-[var(--cicluz-muted-strong)]">
                      <img v-if="attachment.kind === 'image'" :src="attachment.url" :alt="attachment.name" class="h-full w-full object-cover" />
                      <svg v-else-if="attachment.kind === 'audio'" aria-hidden="true" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.8" />
                        <path d="M6.5 10.5a5.5 5.5 0 1 0 11 0M12 18v2.5M9 20.5h6" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                      </svg>
                      <svg v-else aria-hidden="true" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <path d="M7 3.5h7.5L19 8v12.5H7z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
                        <path d="M14.5 3.5V8H19" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
                      </svg>
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-[13px] font-medium text-[var(--cicluz-ink)]">{{ attachment.name }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <button
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                isAttachmentRecording
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-[var(--cicluz-line-strong)] bg-white text-[var(--cicluz-muted-strong)] hover:bg-[var(--cicluz-bg-soft)] hover:text-[var(--cicluz-ink)]'
              "
              :disabled="!supportsAudioRecording || isBusy"
              aria-label="Gravar audio"
              @click="toggleAttachmentRecording"
            >
              <svg aria-hidden="true" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
                <path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.8" />
                <path d="M6.5 10.5a5.5 5.5 0 1 0 11 0M12 18v2.5M9 20.5h6" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
              </svg>
            </button>

            <p
              v-if="statusText"
              class="hidden min-w-0 truncate pl-1 text-[12px] font-medium sm:block"
              :class="voiceError ? 'text-amber-700' : 'text-[var(--cicluz-muted)]'"
            >
              {{ statusText }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border text-[var(--cicluz-muted-strong)] transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                isVoiceChatRecording
                  ? 'border-[rgba(109,61,242,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,241,255,0.96)_100%)] text-[var(--cicluz-primary)] shadow-[0_0_0_4px_rgba(109,61,242,0.08),0_12px_26px_-20px_rgba(109,61,242,0.28)]'
                  : 'border-[var(--cicluz-line-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,249,252,0.94)_100%)] shadow-[0_10px_22px_-18px_rgba(26,29,45,0.22)] hover:bg-[var(--cicluz-bg-soft)] hover:text-[var(--cicluz-ink)]'
              "
              :disabled="!supportsVoiceChat || isBusy"
              aria-label="Chat por voz"
              @click="toggleVoiceChat"
            >
              <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M6 13v-2" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
                <path d="M10 16V8" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
                <path d="M14 14v-4" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
                <path d="M18 12v-1" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
              </svg>
            </button>

            <button
              class="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:bg-[linear-gradient(180deg,#d2d2db_0%,#bcbcc7_100%)] disabled:text-white disabled:shadow-none"
              :class="
                canSubmit
                  ? 'cicluz-button-primary text-white'
                  : 'bg-[linear-gradient(180deg,#d2d2db_0%,#bcbcc7_100%)] text-white shadow-none'
              "
              :disabled="!canSubmit"
              @click="submit"
            >
              <span>Enviar</span>
              <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p
        v-if="statusText"
        class="mt-2 px-1 text-[11px] leading-5 sm:hidden"
        :class="voiceError ? 'text-amber-700' : 'text-[var(--cicluz-muted)]'"
      >
        {{ statusText }}
      </p>
    </div>
  </div>
</template>
