<template>
  <div v-if="list" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/lists" class="text-sm hover:underline mb-4 inline-flex items-center gap-1" style="color: #99aabb;">
        <ChevronLeft :size="14" />
        Toutes les listes
      </NuxtLink>
      <h1 class="text-3xl font-bold text-white mt-2 mb-2">{{ list.title }}</h1>
      <p class="mb-3" style="color: #99aabb;">{{ list.description }}</p>
      <div class="flex items-center gap-4 text-sm" style="color: #6c7a89;">
        <span>Par <span style="color: #99aabb;">{{ list.creator }}</span></span>
        <span>{{ list.films.length }} films</span>
        <div class="flex items-center gap-1">
          <Heart :size="13" />
          <span>{{ list.likes }}</span>
        </div>
      </div>
    </div>

    <!-- Films grid -->
    <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
      <PosterCard v-for="film in list.films" :key="film.id" :film="film" />
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-2xl font-bold text-white mb-2">Liste introuvable</p>
      <NuxtLink to="/lists" style="color: #00e054;" class="hover:underline">Voir toutes les listes</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Heart } from 'lucide-vue-next'
import { mockLists } from '~/data/mockData'

const route = useRoute()
const list = computed(() => mockLists.find(l => l.id === route.params.id))
</script>
