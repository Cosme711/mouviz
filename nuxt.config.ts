import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    preset: 'vercel',
    vercel: {
      config: {
        maxDuration: 30,
      },
    },
  },

  css: ['~/assets/css/tailwind.css'],

  modules: ['shadcn-nuxt', 'nuxt-auth-utils'],

  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    tmdbApiToken: process.env.TMDB_API_TOKEN ?? '',
    public: {},
  },
})
