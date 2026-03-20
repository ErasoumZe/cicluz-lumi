// https://nuxt.com/docs/api/configuration/nuxt-config
const assistantApiBaseUrl =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NUXT_PUBLIC_ASSISTANT_API_BASE_URL || 'http://127.0.0.1:4000'

export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      assistantApiBaseUrl,
    },
  },
  app: {
    head: {
      title: 'Cicluz Assistente',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Assistente conversacional da Cicluz para organizar tarefas, ideias e prioridades.',
        },
      ],
    },
  },
  tailwindcss: {
    cssPath: 'src/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
    viewer: false,
  },
})
