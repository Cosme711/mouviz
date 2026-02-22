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
            <button
              class="px-4 py-2 rounded text-sm font-medium transition-colors"
              :class="route.path === '/journal' ? 'text-white' : 'hover:text-white'"
              :style="route.path === '/journal' ? 'color: #00e054;' : 'color: #99aabb;'"
              @click="loggedIn ? navigateTo('/journal') : (showAuthPopover = true)"
            >
              Journal
            </button>
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

            <!-- Logged in: avatar + dropdown -->
            <div v-if="loggedIn && user" class="relative">
              <button
                class="flex items-center gap-2 p-1 rounded transition-colors hover:bg-white/10"
                @click="showUserMenu = !showUserMenu"
              >
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  :alt="user.displayName"
                  class="w-7 h-7 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style="background-color: #00e054; color: #14181c;"
                >
                  {{ user.displayName?.charAt(0).toUpperCase() }}
                </div>
              </button>

              <!-- Dropdown menu -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 rounded-lg border shadow-xl py-1"
                style="background-color: #2c3440; border-color: #445566;"
              >
                <div class="px-4 py-2 border-b" style="border-color: #445566;">
                  <p class="text-sm font-medium text-white truncate">{{ user.displayName }}</p>
                  <p class="text-xs truncate" style="color: #99aabb;">@{{ user.username }}</p>
                </div>
                <NuxtLink
                  :to="`/profile/${user.username}`"
                  class="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/10 text-white"
                  @click="showUserMenu = false"
                >
                  <User :size="15" />
                  Mon profil
                </NuxtLink>
                <button
                  class="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors hover:bg-white/10 text-left"
                  style="color: #99aabb;"
                  @click="logout"
                >
                  <LogOut :size="15" />
                  Déconnexion
                </button>
              </div>
            </div>

            <!-- Not logged in: user icon opens auth popover -->
            <button
              v-else
              class="p-2 rounded transition-colors hover:bg-white/10"
              style="color: #99aabb;"
              @click="showAuthPopover = true"
            >
              <User :size="20" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Auth popover -->
    <AuthPopover v-if="showAuthPopover" @close="showAuthPopover = false" />

    <!-- Close user menu on outside click -->
    <div
      v-if="showUserMenu"
      class="fixed inset-0 z-40"
      @click="showUserMenu = false"
    />

    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Search, User, LogOut } from 'lucide-vue-next'

const route = useRoute()
const { loggedIn, user, clear } = useUserSession()

const showAuthPopover = ref(false)
const showUserMenu = ref(false)

async function logout() {
  showUserMenu.value = false
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/')
}
</script>
