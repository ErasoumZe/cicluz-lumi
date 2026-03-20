# Cicluz Assistente

Frontend conversacional da Cicluz construído em Nuxt 3 com arquitetura modular.

## Estrutura

```text
stack/pwa
  src
    modules
      assistente
        components
        composables
        services
        stores
        types
    pages
      assistente.vue
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Exemplo de uso

```ts
const { activeConversation, sendMessage } = useChat()

await sendMessage('Crie um plano para minhas tarefas de hoje')
console.log(activeConversation.value?.messages)
```

## Observacao

O service atual usa streaming simulado no frontend. A integracao real com API, agenda e tarefas pode ser conectada em `src/modules/assistente/services/chatService.ts`.
