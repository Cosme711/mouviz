<template>
  <div class="min-h-screen flex items-center justify-center" style="background-color: #14181c;">
    <div class="w-full max-w-md px-4">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="text-3xl font-bold tracking-wider" style="color: #00e054;">
          MOUVIZ
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="rounded-xl border p-8" style="background-color: #2c3440; border-color: #445566;">
        <h1 class="text-xl font-semibold text-white text-center mb-2">Créer un compte</h1>
        <p class="text-sm text-center mb-8" style="color: #99aabb;">
          Rejoignez la communauté pour suivre vos films.
        </p>

        <a
          href="/auth/google"
          class="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border font-medium text-sm transition-colors hover:bg-white/5 text-white"
          style="border-color: #445566;"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          S'inscrire avec Google
        </a>

        <p class="mt-6 text-sm text-center" style="color: #99aabb;">
          Déjà un compte ?
          <NuxtLink to="/" class="ml-1 font-medium hover:underline" style="color: #00e054;">
            Se connecter
          </NuxtLink>
        </p>

        <p class="mt-4 text-xs text-center" style="color: #6c7a89;">
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()

// Redirect if already logged in
if (loggedIn.value) {
  await navigateTo('/')
}
</script>
