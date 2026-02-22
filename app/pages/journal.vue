<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Journal de films</h1>
      <p style="color: #99aabb;">Votre historique de visionnage</p>
    </div>

    <!-- Grouped by month -->
    <div v-for="[month, entries] in groupedEntries" :key="month" class="mb-10">
      <h2 class="text-lg font-semibold mb-4 pb-2 border-b" style="color: #00e054; border-color: #445566;">
        {{ month }}
      </h2>

      <div class="space-y-3">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="flex gap-4 p-4 rounded-lg"
          style="background-color: #2c3440;"
        >
          <!-- Date -->
          <div class="flex-shrink-0 w-10 text-center">
            <p class="text-lg font-bold text-white leading-none">
              {{ new Date(entry.date).getDate() }}
            </p>
            <p class="text-xs uppercase" style="color: #6c7a89;">
              {{ new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' }) }}
            </p>
          </div>

          <!-- Poster -->
          <NuxtLink :to="`/film/${entry.film.id}`" class="flex-shrink-0">
            <img
              :src="entry.film.poster"
              :alt="entry.film.title"
              class="w-12 h-16 object-cover rounded"
            />
          </NuxtLink>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <NuxtLink
                  :to="`/film/${entry.film.id}`"
                  class="font-semibold text-white hover:underline"
                >
                  {{ entry.film.title }}
                </NuxtLink>
                <p class="text-sm" style="color: #6c7a89;">{{ entry.film.year }}</p>
              </div>

              <!-- Badges -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span
                  v-if="entry.rewatch"
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  style="background-color: #1a1e24; color: #40bcf4;"
                >
                  Revu
                </span>
                <span
                  v-if="entry.liked"
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  style="background-color: #1a1e24; color: #e05400;"
                >
                  ♥ Aimé
                </span>
              </div>
            </div>

            <StarRating :rating="entry.rating" size="sm" class="mt-1.5" />

            <p v-if="entry.review" class="text-sm mt-1.5 line-clamp-2" style="color: #99aabb;">
              {{ entry.review }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mockDiaryEntries } from '~/data/mockData'
import type { DiaryEntry } from '~/data/mockData'

const groupedEntries = computed(() => {
  const groups = new Map<string, DiaryEntry[]>()

  for (const entry of mockDiaryEntries) {
    const monthKey = new Date(entry.date).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    })
    const monthEntries = groups.get(monthKey) ?? []
    monthEntries.push(entry)
    groups.set(monthKey, monthEntries)
  }

  return Array.from(groups.entries())
})
</script>
