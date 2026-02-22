<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    style="background-color: #2c3440; color: #99aabb;"
  >
    {{ genre }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  genre: string
}>()
</script>
