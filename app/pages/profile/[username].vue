<template>
  <div v-if="user">
    <!-- Banner -->
    <div class="h-40 relative" style="background: linear-gradient(135deg, #1a1e24 0%, #2c3440 100%);">
      <div class="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end gap-4 pb-0 translate-y-12">
          <!-- Avatar -->
          <div
            class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 flex-shrink-0"
            style="background-color: #2c3440; border-color: #14181c; color: #00e054;"
          >
            {{ user.displayName.charAt(0).toUpperCase() }}
          </div>

          <div class="pb-1">
            <h1 class="text-2xl font-bold text-white">{{ user.displayName }}</h1>
            <p class="text-sm" style="color: #99aabb;">@{{ user.username }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 py-8 space-y-10">
      <!-- Bio -->
      <p v-if="user.bio" class="text-sm max-w-xl" style="color: #99aabb;">{{ user.bio }}</p>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 max-w-sm">
        <div class="text-center rounded-lg p-3" style="background-color: #2c3440;">
          <p class="text-2xl font-bold" style="color: #00e054;">{{ user.filmsWatched }}</p>
          <p class="text-xs mt-0.5" style="color: #6c7a89;">Films vus</p>
        </div>
        <div class="text-center rounded-lg p-3" style="background-color: #2c3440;">
          <p class="text-2xl font-bold text-white">{{ user.following }}</p>
          <p class="text-xs mt-0.5" style="color: #6c7a89;">Abonnements</p>
        </div>
        <div class="text-center rounded-lg p-3" style="background-color: #2c3440;">
          <p class="text-2xl font-bold text-white">{{ user.followers }}</p>
          <p class="text-xs mt-0.5" style="color: #6c7a89;">Abonnés</p>
        </div>
      </div>

      <!-- Favorite Films -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-4">Films favoris</h2>
        <div class="grid grid-cols-4 gap-3 max-w-xs">
          <PosterCard v-for="film in user.favoriteFilms" :key="film.id" :film="film" />
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Recent Activity -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Activité récente</h2>
          <div class="rounded-lg divide-y" style="background-color: #2c3440; border-color: #445566;">
            <div v-for="activity in user.recentActivity" :key="activity.id" class="px-4">
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

        <!-- Public Lists -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Mes listes</h2>
          <div class="space-y-3">
            <NuxtLink
              v-for="list in user.lists"
              :key="list.id"
              :to="`/lists/${list.id}`"
              class="block rounded-lg p-3 transition-colors hover:bg-[#333d4c]"
              style="background-color: #2c3440;"
            >
              <div class="flex items-center gap-3">
                <div class="flex gap-0.5">
                  <img
                    v-for="film in list.films.slice(0, 3)"
                    :key="film.id"
                    :src="film.poster"
                    class="w-8 h-11 object-cover rounded"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ list.title }}</p>
                  <p class="text-xs" style="color: #6c7a89;">{{ list.films.length }} films · {{ list.likes }} ♥</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-2xl font-bold text-white mb-2">Utilisateur introuvable</p>
      <NuxtLink to="/" style="color: #00e054;" class="hover:underline">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mockUsers } from '~/data/mockData'

const route = useRoute()
const user = computed(() => mockUsers.find(u => u.username === route.params.username))
</script>
