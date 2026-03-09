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
          50: '#f8f3ef',
          100: '#f1e6dc',
          200: '#e2ccba',
          300: '#d3b398',
          400: '#c49976',
          500: '#b47f54',
          600: '#8b5e3c',
          700: '#6f4b31',
          800: '#543927',
          900: '#3a271b',
        },
      },
    },
  },
})
