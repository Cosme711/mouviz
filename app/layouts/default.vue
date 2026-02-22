<template>
  <div class="min-h-screen" style="background-color: #14181c; color: #e8eaf0;">
    <nav class="sticky top-0 z-50 border-b" style="background-color: #1a1e24; border-color: #445566;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-xl font-bold tracking-wider" style="color: #00e054;">MOUVIZ</span>
          </NuxtLink>

          <!-- Center nav links -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              to="/"
              class="px-4 py-2 rounded text-sm font-medium transition-colors"
              :class="route.path === '/' ? 'text-white' : 'hover:text-white'"
              :style="route.path === '/' ? 'color: #00e054;' : 'color: #99aabb;'"
            >
              Films
            </NuxtLink>
            <NuxtLink
              to="/lists"
              class="px-4 py-2 rounded text-sm font-medium transition-colors"
              :class="route.path === '/lists' ? 'text-white' : 'hover:text-white'"
              :style="route.path === '/lists' ? 'color: #00e054;' : 'color: #99aabb;'"
            >
              Listes
            </NuxtLink>
            <NuxtLink
              to="/journal"
              class="px-4 py-2 rounded text-sm font-medium transition-colors"
              :class="route.path === '/journal' ? 'text-white' : 'hover:text-white'"
              :style="route.path === '/journal' ? 'color: #00e054;' : 'color: #99aabb;'"
            >
              Journal
            </NuxtLink>
          </div>

          <!-- Right icons -->
          <div class="flex items-center gap-2">
            <NuxtLink
              to="/search"
              class="p-2 rounded transition-colors hover:bg-white/10"
              :style="route.path === '/search' ? 'color: #00e054;' : 'color: #99aabb;'"
            >
              <Search :size="20" />
            </NuxtLink>
            <NuxtLink
              to="/profile/currentuser"
              class="p-2 rounded transition-colors hover:bg-white/10"
              :style="route.path.startsWith('/profile') ? 'color: #00e054;' : 'color: #99aabb;'"
            >
              <User :size="20" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Search, User } from 'lucide-vue-next'

const route = useRoute()
</script>
