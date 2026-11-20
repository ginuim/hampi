<template>
  <view class="about-page" :class="{ 'dark': isDark }">
    <NavBar title="关于作者" />
    <CardPanel noHighlight class="about-content">
      <rich-text :nodes="content"></rich-text>
    </CardPanel>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'

const themeStore = useThemeStore()
const configStore = useConfigStore()
const isDark = computed(() => themeStore.isDark)

const about = computed(() => configStore.about)
// const content = computed(() => configStore.about.content)
</script>

<style lang="less" scoped>
.about-page {
  box-sizing: border-box;
  padding: 20px;
  min-height: 100vh;
  background-color: var(--background-primary);
}

.about-content {
  margin: 10px;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 16px;
  
  :deep(.about-text) {
    margin: 10px 0;
  }
  
}
</style> 