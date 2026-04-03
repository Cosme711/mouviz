<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-6">Rechercher des films</h1>

      <!-- Search input -->
      <div class="relative max-w-2xl">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2" :size="18" style="color: #6c7a89;" />
        <input
          v-model="query"
          type="text"
          placeholder="Titre, réalisateur, acteur..."
          class="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#00e054]/50 transition-all"
          style="background-color: #2c3440; color: #e8eaf0; border: 1px solid #445566;"
        />
      </div>
    </div>

    <!-- Genre chips -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        :style="!selectedGenre ? 'background-color: #00e054; color: #14181c;' : 'background-color: #2c3440; color: #99aabb;'"
        @click="selectedGenre = null"
      >
        Tous
      </button>
      <button
        v-for="genre in availableGenres"
        :key="genre"
        class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        :style="selectedGenre === genre ? 'background-color: #00e054; color: #14181c;' : 'background-color: #2c3440; color: #99aabb;'"
        @click="selectedGenre = selectedGenre === genre ? null : genre"
      >
        {{ genre }}
      </button>
    </div>

    <!-- Sort + filter toggle -->
    <div class="flex items-center gap-4 mb-6">
      <div class="flex items-center gap-2">
        <span class="text-sm" style="color: #99aabb;">Trier par :</span>
        <select
          v-model="sortBy"
          class="text-sm px-3 py-1.5 rounded outline-none"
          style="background-color: #2c3440; color: #e8eaf0; border: 1px solid #445566;"
        >
          <option value="popularity">Popularité</option>
          <option value="rating">Note</option>
          <option value="year">Année</option>
          <option value="title">Titre</option>
        </select>
      </div>
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors border"
        :style="showFilters ? 'border-color: #00e054; color: #00e054;' : 'border-color: #445566; color: #99aabb;'"
        @click="showFilters = !showFilters"
      >
        <SlidersHorizontal :size="14" />
        Filtres
      </button>
      <span class="text-sm ml-auto" style="color: #6c7a89;">{{ filmsData?.total ?? 0 }} résultats</span>
    </div>

    <div class="flex gap-6">
      <!-- Sidebar filters -->
      <aside v-if="showFilters" class="w-56 flex-shrink-0">
        <div class="rounded-lg p-4 space-y-5" style="background-color: #2c3440;">
          <div>
            <h3 class="text-sm font-semibold text-white mb-3">Statut</h3>
            <div class="space-y-2">
              <label v-for="opt in statusOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :value="opt.value"
                  v-model="selectedStatus"
                  class="rounded"
                  style="accent-color: #00e054;"
                />
                <span class="text-sm" style="color: #99aabb;">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-white mb-3">Note minimale</h3>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              v-model.number="minRating"
              class="w-full"
              style="accent-color: #00e054;"
            />
            <div class="flex justify-between text-xs mt-1" style="color: #6c7a89;">
              <span>0</span>
              <span>{{ minRating }} ★</span>
              <span>5</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Results grid -->
      <div class="flex-1">
        <div
          v-if="films.length > 0"
          class="grid gap-3"
          :class="showFilters ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'"
        >
          <PosterCard v-for="film in films" :key="film.id" :film="film" />
        </div>
        <div v-else class="text-center py-20">
          <p class="text-lg font-medium" style="color: #6c7a89;">Aucun film trouvé</p>
          <p class="text-sm mt-1" style="color: #445566;">Essayez d'autres termes de recherche</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { Search, SlidersHorizontal } from 'lucide-vue-next'
import type { FilmCard } from '~/types'

const query = ref('')
const debouncedQuery = refDebounced(query, 300)
const selectedGenre = ref<string | null>(null)
const showFilters = ref(false)
const sortBy = ref<'popularity' | 'rating' | 'year' | 'title'>('popularity')
const selectedStatus = ref<string[]>([])
const minRating = ref(0)

const statusOptions = [
  { value: 'watched', label: 'Vus' },
  { value: 'not_watched', label: 'Non vus' },
  { value: 'liked', label: 'Aimés' },
  { value: 'watchlist', label: 'Watchlist' },
]

const apiQuery = computed(() => ({
  limit: 200,
  sortBy: sortBy.value,
  q: debouncedQuery.value || undefined,
  genre: selectedGenre.value || undefined,
  minRating: minRating.value > 0 ? minRating.value : undefined,
  watched: selectedStatus.value.includes('watched') ? '1' : undefined,
  notWatched: selectedStatus.value.includes('not_watched') ? '1' : undefined,
  liked: selectedStatus.value.includes('liked') ? '1' : undefined,
  watchlist: selectedStatus.value.includes('watchlist') ? '1' : undefined,
}))

const { data: filmsData } = useFetch('/api/films', {
  query: apiQuery,
  default: () => ({ films: [] as FilmCard[], total: 0, genres: [] as string[] }),
})

const films = computed(() => filmsData.value?.films ?? [])
const availableGenres = computed(() => filmsData.value?.genres ?? [])
</script>
