<template>
  <NuxtLink :to="`/film/${film.id}`" class="group block">
    <div class="relative rounded overflow-hidden aspect-[2/3]" style="background-color: #2c3440;">
      <img
        :src="film.poster"
        :alt="film.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <!-- Hover overlay -->
      <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
        <p class="text-white text-xs font-semibold leading-tight">{{ film.title }}</p>
        <p class="text-xs mt-0.5" style="color: #99aabb;">{{ film.year }}</p>
      </div>

      <!-- Watched indicator -->
      <div
        v-if="film.watched"
        class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
        style="background-color: #00e054;"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14181c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <!-- Liked indicator -->
      <div
        v-if="film.liked"
        class="absolute top-1.5 left-1.5 w-4 h-4 rounded-full flex items-center justify-center"
        style="background-color: #e05400;"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    </div>

    <!-- Star rating below -->
    <div class="mt-1.5 px-0.5">
      <StarRating :rating="film.userRating ?? film.rating" size="sm" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Film } from '~/data/mockData'

defineProps<{
  film: Film
}>()
</script>
