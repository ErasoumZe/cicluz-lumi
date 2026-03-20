import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fbf7ee',
          100: '#f4ebd9',
          200: '#e8d8b8',
        },
        forest: {
          700: '#145645',
          800: '#11352c',
        },
        ember: {
          400: '#f0b15a',
          500: '#de8f33',
        },
      },
      boxShadow: {
        shell: '0 24px 80px -32px rgba(17, 53, 44, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config
