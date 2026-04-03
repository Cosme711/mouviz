<template>
  <div v-if="list">
    <!-- Header -->
    <div class="border-b" style="border-color: #445566;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p class="text-sm mb-3 uppercase tracking-widest font-medium" style="color: #6c7a89;">
          Une liste par
          <span class="font-semibold" style="color: #99aabb;">{{ list.creator }}</span>
        </p>

        <h1 class="text-4xl font-bold text-white mb-4 leading-tight">{{ list.title }}</h1>

        <p
          v-if="list.description"
          class="text-base leading-relaxed mb-6 max-w-2xl"
          style="color: #99aabb;"
        >
          {{ list.description }}
        </p>

        <div class="flex items-center gap-2 text-sm mb-6" style="color: #6c7a89;">
          <span>{{ filmCount }} film{{ filmCount !== 1 ? 's' : '' }}</span>
          <span aria-hidden="true">·</span>
          <div class="flex items-center gap-1">
            <Heart :size="13" />
            <span>{{ list.likes }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold border transition-colors hover:bg-white/10"
            :style="localLiked
              ? 'border-color: #40bcf4; color: #40bcf4;'
              : 'border-color: #445566; color: #99aabb;'"
            @click="localLiked = !localLiked"
          >
            <Heart :size="15" />
            {{ localLiked ? 'Aimé' : "J'aime" }}
          </button>

          <NuxtLink
            to="/lists"
            class="inline-flex items-center gap-1 px-4 py-2 rounded text-sm font-medium border transition-colors hover:bg-white/10"
            style="border-color: #445566; color: #99aabb;"
          >
            <ChevronLeft :size="15" />
            Toutes les listes
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Films -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <p class="text-sm font-semibold uppercase tracking-wider mb-5" style="color: #6c7a89;">
        {{ filmCount }} film{{ filmCount !== 1 ? 's' : '' }}
      </p>

      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        <div
          v-for="(film, index) in list.films"
          :key="film.id"
          class="relative"
        >
          <PosterCard :film="film" />
          <span
            class="absolute bottom-5 left-0 z-10 min-w-[18px] h-[18px] px-1 rounded-sm
                   flex items-center justify-center
                   text-[10px] font-bold text-white leading-none
                   select-none pointer-events-none"
            style="background-color: rgba(0,0,0,0.65);"
          >
            {{ index + 1 }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-2xl font-bold text-white mb-2">Liste introuvable</p>
      <NuxtLink to="/lists" class="hover:underline" style="color: #00e054;">
        Voir toutes les listes
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, Heart } from 'lucide-vue-next'
import type { FilmList } from '~/types'

const route = useRoute()
const listId = computed(() => Number(route.params.id))

const { data: list } = await useFetch<FilmList>(
  () => `/api/lists/${listId.value}`,
  { watch: [listId] },
)

const filmCount = computed(() => list.value?.films.length ?? 0)
const localLiked = ref(false)
</script>
