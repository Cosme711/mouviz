<template>
  <div class="flex gap-3 py-3">
    <!-- Avatar -->
    <img
      :src="avatar"
      :alt="user"
      class="w-9 h-9 rounded-full object-cover flex-shrink-0"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Action icon -->
        <component
          :is="actionIcon"
          :size="14"
          :style="{ color: iconColor }"
        />

        <span class="text-sm font-medium text-white">{{ user }}</span>
        <span class="text-sm" style="color: #99aabb;">{{ actionText }}</span>
        <NuxtLink
          :to="`/film/${film.id}`"
          class="text-sm font-medium hover:underline"
          style="color: #e8eaf0;"
        >
          {{ film.title }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-2 mt-1">
        <StarRating v-if="rating" :rating="rating" size="sm" />
        <span class="text-xs" style="color: #6c7a89;">{{ formattedDate }}</span>
      </div>

      <p v-if="review" class="text-sm mt-1 line-clamp-2" style="color: #99aabb;">
        {{ review }}
      </p>
    </div>

    <!-- Film thumbnail -->
    <NuxtLink :to="`/film/${film.id}`" class="flex-shrink-0">
      <img
        :src="film.poster"
        :alt="film.title"
        class="w-10 h-14 object-cover rounded"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { Eye, Heart, MessageSquare, List } from 'lucide-vue-next'
import type { Film } from '~/data/mockData'

const props = defineProps<{
  type: 'watched' | 'liked' | 'reviewed' | 'listed'
  user: string
  avatar: string
  film: Film
  rating?: number
  review?: string
  date: string
}>()

const actionIcon = computed(() => {
  const icons = { watched: Eye, liked: Heart, reviewed: MessageSquare, listed: List }
  return icons[props.type]
})

const iconColor = computed(() => {
  const colors = {
    watched: '#00e054',
    liked: '#e05400',
    reviewed: '#40bcf4',
    listed: '#99aabb',
  }
  return colors[props.type]
})

const actionText = computed(() => {
  const texts = {
    watched: 'a vu',
    liked: 'a aimé',
    reviewed: 'a critiqué',
    listed: 'a listé',
  }
  return texts[props.type]
})

const formattedDate = computed(() => {
  return new Date(props.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
})
</script>
