<template>
  <div>
    <!-- Hero Section -->
    <section class="relative h-[500px] overflow-hidden">
      <img
        :src="heroFilm.backdrop"
        :alt="heroFilm.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <!-- Gradients -->
      <div class="absolute inset-0" style="background: linear-gradient(to right, #14181c 40%, transparent 100%);"></div>
      <div class="absolute inset-0" style="background: linear-gradient(to top, #14181c 0%, transparent 60%);"></div>

      <div class="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div class="flex items-end gap-8">
          <!-- Poster -->
          <img
            :src="heroFilm.poster"
            :alt="heroFilm.title"
            class="hidden md:block w-48 rounded-lg shadow-2xl flex-shrink-0"
          />

          <!-- Info -->
          <div class="pb-6">
            <div class="flex items-center gap-2 mb-3">
              <GenrePill v-for="genre in heroFilm.genres.slice(0, 3)" :key="genre" :genre="genre" />
            </div>
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-2">{{ heroFilm.title }}</h1>
            <p class="text-lg mb-4" style="color: #99aabb;">
              {{ heroFilm.year }} · {{ heroFilm.director }} · {{ heroFilm.duration }} min
            </p>
            <p class="text-base max-w-xl mb-5 leading-relaxed" style="color: #99aabb;">
              {{ heroFilm.synopsis }}
            </p>
            <div class="flex items-center gap-4">
              <StarRating :rating="heroFilm.rating" size="md" :show-value="true" />
              <NuxtLink
                :to="`/film/${heroFilm.id}`"
                class="px-5 py-2.5 rounded font-semibold text-sm transition-colors"
                style="background-color: #00e054; color: #14181c;"
              >
                Voir le film
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <!-- Popular Films -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-semibold text-white">Films populaires</h2>
          <NuxtLink to="/search" class="text-sm hover:underline" style="color: #00e054;">Voir tout</NuxtLink>
        </div>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          <PosterCard v-for="film in popularFilms" :key="film.id" :film="film" />
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Friends Activity -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-5">Activité des amis</h2>
          <div class="rounded-lg divide-y" style="background-color: #2c3440; border-color: #445566; divide-color: #445566;">
            <div v-for="activity in mockActivities" :key="activity.id" class="px-4">
              <ActivityItem
                :type="activity.type"
                :user="activity.user"
                :avatar="activity.avatar"
                :film="activity.film"
                :rating="activity.rating"
                :review="activity.review"
                :date="activity.date"
              />
            </div>
          </div>
        </section>

        <!-- Watchlist -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-5">Ma Watchlist</h2>
          <div class="grid grid-cols-3 gap-3">
            <PosterCard v-for="film in watchlistFilms" :key="film.id" :film="film" />
          </div>
          <NuxtLink
            to="/profile/currentuser"
            class="mt-4 block text-center py-2 rounded text-sm font-medium border transition-colors hover:bg-white/5"
            style="border-color: #445566; color: #99aabb;"
          >
            Voir toute la watchlist
          </NuxtLink>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mockFilms, mockActivities } from '~/data/mockData'

const heroFilm = mockFilms[3]!
const popularFilms = mockFilms.slice(0, 16)
const watchlistFilms = mockFilms.filter(f => f.inWatchlist).slice(0, 6)
</script>
