<template>
  <image
    v-if="name"
    :src="`/static/${name}.svg`" 
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      filter: isLightMode ? 'brightness(0)' : 'brightness(1)'
    }"
    mode="widthFix"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 24
  }
})

const themeStore = useThemeStore()

const isLightMode = computed(() => !themeStore.isDark)
</script> 