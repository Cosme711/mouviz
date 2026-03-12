<template>
  <div v-if="film">
    <!-- Hero -->
    <section class="relative h-[600px] overflow-hidden">
      <img
        :src="film.backdrop || film.poster"
        :alt="film.title"
        class="absolute inset-0 w-full h-full object-cover"
        style="filter: blur(2px);"
      />
      <div class="absolute inset-0" style="background: linear-gradient(to right, #14181c 30%, rgba(20,24,28,0.7) 100%);"></div>
      <div class="absolute inset-0" style="background: linear-gradient(to top, #14181c 0%, transparent 50%);"></div>

      <div class="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div class="flex gap-8 items-end pb-8">
          <!-- Large poster -->
          <img
            :src="film.poster"
            :alt="film.title"
            class="hidden md:block w-52 rounded-lg shadow-2xl flex-shrink-0"
          />

          <!-- Info -->
          <div>
            <div class="flex flex-wrap gap-2 mb-3">
              <GenrePill v-for="genre in film.genres" :key="genre" :genre="genre" />
            </div>
            <h1 class="text-4xl font-bold text-white mb-1">{{ film.title }}</h1>
            <p class="text-lg mb-4" style="color: #99aabb;">
              {{ film.year }} · {{ film.director }} · {{ film.duration }} min{{ film.country ? ' · ' + countryName(film.country) : '' }}
            </p>
            <StarRating :rating="film.rating" size="lg" :show-value="true" />
            <p class="text-sm mt-1 mb-5" style="color: #6c7a89;">{{ film.reviewCount }} critiques</p>

            <!-- Action buttons -->
            <div class="flex items-center gap-3 flex-wrap">
              <button
                class="flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-colors"
                :style="localInteraction.watched
                  ? 'background-color: #00e054; color: #14181c;'
                  : 'background-color: #2c3440; color: #e8eaf0; border: 1px solid #445566;'"
                @click="toggle('watched')"
              >
                <Eye :size="16" />
                {{ localInteraction.watched ? 'Vu' : 'Marquer comme vu' }}
              </button>
              <button
                class="flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm border transition-colors hover:bg-white/10"
                :style="localInteraction.inWatchlist ? 'border-color: #40bcf4; color: #40bcf4;' : 'border-color: #445566; color: #99aabb;'"
                @click="toggle('inWatchlist')"
              >
                <Bookmark :size="16" />
                {{ localInteraction.inWatchlist ? 'En watchlist' : 'Watchlist' }}
              </button>
              <button
                class="flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm border transition-colors hover:bg-white/10"
                :style="localInteraction.liked ? 'border-color: #e05400; color: #e05400;' : 'border-color: #445566; color: #99aabb;'"
                @click="toggle('liked')"
              >
                <Heart :size="16" />
                {{ localInteraction.liked ? 'Aimé' : "J'aime" }}
              </button>
              <button
                class="flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm border transition-colors hover:bg-white/10"
                style="border-color: #445566; color: #99aabb;"
              >
                <Share2 :size="16" />
                Partager
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <!-- Synopsis -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-3">Synopsis</h2>
        <p class="leading-relaxed max-w-3xl" style="color: #99aabb;">{{ film.synopsis }}</p>
      </section>

      <!-- Cast -->
      <section v-if="film.cast.length > 0">
        <h2 class="text-xl font-semibold text-white mb-4">Distribution</h2>
        <div class="flex gap-4 overflow-x-auto pb-2">
          <NuxtLink
            v-for="person in film.cast"
            :key="person.id"
            :to="`/person/${person.id}`"
            class="flex-shrink-0 w-28 group"
          >
            <img
              :src="person.photo"
              :alt="person.name"
              class="w-28 h-40 object-cover rounded-lg mb-2 transition-opacity group-hover:opacity-80"
            />
            <p class="text-sm font-medium text-white text-center leading-tight">{{ person.name }}</p>
            <p class="text-xs text-center mt-0.5" style="color: #99aabb;">{{ person.role }}</p>
          </NuxtLink>
        </div>
      </section>

      <!-- Reviews -->
      <section v-if="reviews.length > 0">
        <h2 class="text-xl font-semibold text-white mb-4">Critiques</h2>
        <div class="space-y-4">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="p-4 rounded-lg"
            style="background-color: #2c3440;"
          >
            <div class="flex items-center gap-3 mb-3">
              <img :src="review.avatar" :alt="review.user" class="w-9 h-9 rounded-full object-cover" />
              <div>
                <p class="text-sm font-medium text-white">{{ review.user }}</p>
                <StarRating :rating="review.rating" size="sm" />
              </div>
              <span class="ml-auto text-xs" style="color: #6c7a89;">
                {{ new Date(review.date).toLocaleDateString('fr-FR') }}
              </span>
            </div>
            <p class="text-sm leading-relaxed" style="color: #99aabb;">{{ review.text }}</p>
            <div class="flex items-center gap-1 mt-3">
              <Heart :size="12" style="color: #6c7a89;" />
              <span class="text-xs" style="color: #6c7a89;">{{ review.likes }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Similar Films -->
      <section v-if="similarFilms.length > 0">
        <h2 class="text-xl font-semibold text-white mb-4">Films similaires</h2>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <PosterCard v-for="similar in similarFilms" :key="similar.id" :film="similar" />
        </div>
      </section>
    </div>
  </div>

  <!-- Not found -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-2xl font-bold text-white mb-2">Film introuvable</p>
      <NuxtLink to="/" style="color: #00e054;" class="hover:underline">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, Bookmark, Heart, Share2 } from 'lucide-vue-next'
import type { FilmDetail, Review, FilmCard } from '~/types'

const route = useRoute()
const filmId = computed(() => Number(route.params.id))

const { data: film, error } = await useFetch<FilmDetail>(
  () => `/api/films/${filmId.value}`,
  { watch: [filmId] },
)

const { data: reviewsData } = await useFetch(
  () => `/api/films/${filmId.value}/reviews`,
  {
    watch: [filmId],
    default: () => ({ reviews: [] as Review[] }),
  },
)

const { data: similarData } = await useFetch(
  () => `/api/films/${filmId.value}/similar`,
  {
    watch: [filmId],
    default: () => ({ films: [] as FilmCard[] }),
  },
)

const reviews = computed(() => reviewsData.value?.reviews ?? [])
const similarFilms = computed(() => similarData.value?.films ?? [])

// Local interaction state (optimistic UI)
const localInteraction = reactive({
  watched: film.value?.watched ?? false,
  liked: film.value?.liked ?? false,
  inWatchlist: film.value?.inWatchlist ?? false,
})

watch(film, (newFilm) => {
  if (newFilm) {
    localInteraction.watched = newFilm.watched
    localInteraction.liked = newFilm.liked
    localInteraction.inWatchlist = newFilm.inWatchlist
  }
}, { immediate: true })

async function toggle(field: 'watched' | 'liked' | 'inWatchlist') {
  localInteraction[field] = !localInteraction[field]
  await $fetch('/api/user/interactions', {
    method: 'POST',
    body: { filmId: filmId.value, field },
  }).catch(() => {
    localInteraction[field] = !localInteraction[field] // revert on error
  })
}
</script>
