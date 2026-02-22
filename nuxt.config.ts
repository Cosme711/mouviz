import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/tailwind.css'],

  modules: ['shadcn-nuxt'],

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

  nitro: {
    externals: {
      external: ['better-sqlite3'],
    },
  },
})
