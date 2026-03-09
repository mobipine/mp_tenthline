// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'LegalLine — Add line numbers to legal PDFs',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
        },
      ],
      style: [{ children: "body { font-family: 'Outfit', sans-serif; }" }],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      pusherKey: process.env.NUXT_PUBLIC_PUSHER_APP_KEY || '',
      pusherCluster: process.env.NUXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
      pusherHost: process.env.NUXT_PUBLIC_PUSHER_HOST || '',
      pusherPort: Number(process.env.NUXT_PUBLIC_PUSHER_PORT || 443),
      pusherScheme: process.env.NUXT_PUBLIC_PUSHER_SCHEME || 'https',
    },
  },
  colorMode: {
    preference: 'light',
  },
  ui: {
    theme: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
})
