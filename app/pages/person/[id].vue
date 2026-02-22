<template>
  <div v-if="person">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <!-- Portrait -->
        <div class="md:col-span-1">
          <img
            :src="person.photo"
            :alt="person.name"
            class="w-full rounded-xl object-cover"
            style="aspect-ratio: 2/3;"
          />
        </div>

        <!-- Info -->
        <div class="md:col-span-2 flex flex-col justify-center">
          <p class="text-sm font-medium mb-1" style="color: #00e054;">{{ person.role }}</p>
          <h1 class="text-4xl font-bold text-white mb-4">{{ person.name }}</h1>

          <!-- Stats -->
          <div class="flex gap-6 mb-5">
            <div v-if="person.filmsCount">
              <p class="text-2xl font-bold text-white">{{ person.filmsCount }}</p>
              <p class="text-xs" style="color: #6c7a89;">Films</p>
            </div>
            <div v-if="person.averageRating">
              <p class="text-2xl font-bold" style="color: #ff8000;">{{ person.averageRating.toFixed(1) }}</p>
              <p class="text-xs" style="color: #6c7a89;">Note moyenne</p>
            </div>
            <div v-if="person.birthYear">
              <p class="text-2xl font-bold text-white">{{ person.birthYear }}</p>
              <p class="text-xs" style="color: #6c7a89;">Naissance</p>
            </div>
            <div v-if="person.nationality">
              <p class="text-lg font-semibold text-white">{{ person.nationality }}</p>
              <p class="text-xs" style="color: #6c7a89;">Lieu de naissance</p>
            </div>
          </div>

          <p v-if="person.biography" class="leading-relaxed" style="color: #99aabb;">
            {{ person.biography }}
          </p>

          <!-- Known for -->
          <div v-if="person.knownFor && person.knownFor.length > 0" class="mt-5">
            <p class="text-sm font-medium text-white mb-2">Connu pour</p>
            <div class="flex flex-wrap gap-2">
              <GenrePill v-for="film in person.knownFor" :key="film" :genre="film" />
            </div>
          </div>
        </div>
      </div>

      <!-- Filmography -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-white mb-5">Filmographie</h2>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          <PosterCard v-for="film in filmography" :key="film.id" :film="film" />
        </div>
      </section>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-2xl font-bold text-white mb-2">Artiste introuvable</p>
      <NuxtLink to="/" style="color: #00e054;" class="hover:underline">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PersonDetail, FilmCard } from '~/types'

const route = useRoute()
const personId = computed(() => Number(route.params.id))

const { data: person } = await useFetch<PersonDetail>(
  () => `/api/persons/${personId.value}`,
  { watch: [personId] },
)

const { data: filmographyData } = await useFetch(
  () => `/api/persons/${personId.value}/filmography`,
  {
    watch: [personId],
    default: () => ({ films: [] as FilmCard[] }),
  },
)

const filmography = computed(() => filmographyData.value?.films ?? [])
</script>
