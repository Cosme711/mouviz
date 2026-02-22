<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Listes de films</h1>
      <p style="color: #99aabb;">Découvrez les listes de films de la communauté</p>
    </div>

    <!-- Lists -->
    <div class="space-y-5">
      <NuxtLink
        v-for="list in mockLists"
        :key="list.id"
        :to="`/lists/${list.id}`"
        class="block rounded-xl p-5 transition-colors hover:bg-[#333d4c] group"
        style="background-color: #2c3440;"
      >
        <div class="flex gap-5">
          <!-- Film poster stack -->
          <div class="hidden sm:flex flex-shrink-0 gap-1">
            <img
              v-for="(film, idx) in list.films.slice(0, 4)"
              :key="film.id"
              :src="film.poster"
              :alt="film.title"
              class="w-16 h-24 object-cover rounded"
              :style="{ marginLeft: idx > 0 ? '-20px' : '0', zIndex: 4 - idx }"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-white group-hover:text-[#00e054] transition-colors">
                  {{ list.title }}
                </h3>
                <p class="text-sm mt-1 line-clamp-2" style="color: #99aabb;">{{ list.description }}</p>
              </div>
              <div
                v-if="list.isPublic"
                class="flex-shrink-0 px-2 py-0.5 rounded text-xs"
                style="background-color: #1a1e24; color: #6c7a89;"
              >
                Public
              </div>
            </div>

            <div class="flex items-center gap-4 mt-3">
              <span class="text-sm" style="color: #6c7a89;">
                Par <span style="color: #99aabb;">{{ list.creator }}</span>
              </span>
              <span class="text-sm" style="color: #6c7a89;">
                {{ list.films.length }} films
              </span>
              <div class="flex items-center gap-1">
                <Heart :size="13" style="color: #6c7a89;" />
                <span class="text-sm" style="color: #6c7a89;">{{ list.likes }}</span>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
import { mockLists } from '~/data/mockData'
</script>
