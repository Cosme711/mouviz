<template>
  <div class="flex items-center gap-1">
    <div class="flex items-center">
      <div v-for="i in 5" :key="i" class="relative" :style="starStyle">
        <!-- Empty star -->
        <svg :width="starSize" :height="starSize" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="#ff8000"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        <!-- Filled star (clip to fill amount) -->
        <div
          class="absolute inset-0 overflow-hidden"
          :style="{ width: getFillWidth(i) }"
        >
          <svg :width="starSize" :height="starSize" viewBox="0 0 24 24" fill="#ff8000">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
      </div>
    </div>
    <span v-if="showValue" class="text-sm font-medium ml-1" style="color: #ff8000;">
      {{ rating.toFixed(1) }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}>(), {
  size: 'sm',
  showValue: false,
})

const starSize = computed(() => {
  if (props.size === 'lg') return 20
  if (props.size === 'md') return 16
  return 12
})

const starStyle = computed(() => ({
  width: `${starSize.value}px`,
  height: `${starSize.value}px`,
}))

function getFillWidth(starIndex: number): string {
  const fillAmount = Math.max(0, Math.min(1, props.rating - (starIndex - 1)))
  return `${fillAmount * 100}%`
}
</script>
