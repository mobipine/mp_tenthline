// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Automatically apply tenth-line referencing to legal PDFs.',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
    colors: {
      primary: 'brand',
      success: 'brand',
      secondary: 'sand',
      neutral: 'slate',
    },
    theme: {
      colors: {
        brand: {
          50: '#f2f3f8',
          100: '#e3e7f1',
          200: '#c8d0e2',
          300: '#adb8d3',
          400: '#5f6f9d',
          500: '#202848',
          600: '#1b223f',
          700: '#161d36',
          800: '#11172c',
          900: '#0d1222',
          950: '#070a14',
        },
        sand: {
          50: '#fcf9ef',
          100: '#f5edd7',
          200: '#ebdcb0',
          300: '#e0cb88',
          400: '#d5ba61',
          500: '#cab03f',
          600: '#a58d2f',
          700: '#7f6c24',
          800: '#594b18',
          900: '#342d0f',
          950: '#1d1808',
        },
      },
    },
  },
})
