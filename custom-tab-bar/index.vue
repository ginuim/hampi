<template>
  <view class="custom-tabbar" :class="isDarkMode ? 'dark-tabbar' : ''">
    <view 
      v-for="(item, index) in tabList" 
      :key="index"
      class="tab-item"
      :class="{ active: current === index }"
      @tap="switchTab(item.pagePath, index)"
    >
      <text class="iconfont" :class="item.icon"></text>
      <text class="text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const current = ref(0)

const tabList = [
  { text: '首页', pagePath: '/pages/home/index', icon: 'icon-home' },
  { text: '考试2', pagePath: '/pages/exam/index', icon: 'icon-exam' },
  { text: '历史', pagePath: '/pages/exam/history/index', icon: 'icon-history' }
]

const isDarkMode = computed(() => themeStore.isDark)

const switchTab = (url: string, index: number) => {
  if (current.value === index) return
  current.value = index
  uni.switchTab({
    url
  })
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  background-color: #ffffff;
  border-top: 1px solid #eee;
  z-index: 999;
}

.dark-tabbar {
  background-color: #1c1c1e;
  border-top: 1px solid #2c2c2e;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
}

.dark-tabbar .tab-item {
  color: #8e8e93;
}

.tab-item.active {
  color: #007aff;
}

.dark-tabbar .tab-item.active {
  color: #ffffff;
}

.tab-item .text {
  font-size: 12px;
  margin-top: 4px;
}

/* 确保底部安全区域 */
@supports (bottom: constant(safe-area-inset-bottom)) {
  .custom-tabbar {
    padding-bottom: constant(safe-area-inset-bottom);
    height: calc(50px + constant(safe-area-inset-bottom));
  }
}

@supports (bottom: env(safe-area-inset-bottom)) {
  .custom-tabbar {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(50px + env(safe-area-inset-bottom));
  }
}
</style> 