export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
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
