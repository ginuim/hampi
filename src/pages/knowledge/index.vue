<template>
  <view class="knowledge-page" :class="{ 'dark': isDark }">
    <NavBar title="相关知识" />
    <view class="container">
      <view 
        v-for="category in categories" 
        :key="category.source"
        class="category-card"
        @click="handleCategoryClick(category)"
      >
        <view class="category-title">{{ category.title }}</view>
        <view class="category-desc">{{ category.description }}</view>
        <view class="category-arrow iconfont">&#xe665;</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { onMounted } from 'vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

onMounted(() => {
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

const categories = [
  {
    title: 'Q简语',
    description: '常用的Q简语及其含义',
    source: 'qcodes'
  },
  {
    title: '分区代码',
    description: '世界各地区的分区代码',
    source: 'region'
  },
  {
    title: '摩尔斯电码',
    description: '摩尔斯电码对照表及练习',
    source: 'morse'
  },
  {
    title: '业余电台缩语',
    description: '常用的业余电台缩写术语',
    source: 'hamabbr'
  },
  {
    title: '字母解释法',
    description: '国际通用的无线电通信字母解释',
    source: 'phonetic'
  }
]

const handleCategoryClick = (category: any) => {
  if (category.source === 'morse') {
    uni.navigateTo({
      url: '/subpkg/cw/index'
    })
  } else {
    uni.navigateTo({
      url: `/pages/search/detail?source=${category.source}&type=list`
    })
  }
}
</script>

<style lang="less" scoped>
.knowledge-page {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.container {
  padding: 15px;
}

.category-card {
  margin-bottom: 15px;
  padding: 15px;
  background-color: var(--background-container);
  border: 1px solid var(--border-color-light);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  position: relative;

  &:active {
    border-color: var(--border-color-active);
    background-color: var(--background-container-active);
  }
}

.category-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.category-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.category-arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--text-secondary);
}
</style> 