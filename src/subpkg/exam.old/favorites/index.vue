<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar title="我的收藏" />
    <view class="content">
      <view v-if="filteredQuestions.length === 0" class="empty-state">
        <text>暂无收藏题目</text>
      </view>
      <exam-component 
        v-else
        :questions="filteredQuestions"
        :examType="type"
        mode="practice"
        @favorite-changed="handleFavoriteChanged"
        @back="goBack" 
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ExamComponent from '../components/ExamComponent.vue'
import { getFavorites } from '../utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import { onLoad } from '@dcloudio/uni-app'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const questions = ref([])
const currentIndex = ref(0)

const filteredQuestions = computed(() => {
  const favorites = getFavorites()
  return questions.value
    .filter(q => favorites.includes(q.id))
    .map(question => ({
      ...question,
    }))
})

onLoad(async (options) => {
  const type = options.type
  if (type) {
    await loadQuestions(type)
  }
})

async function loadQuestions(type: string) {
  try {
    uni.showLoading({ title: '加载题库中' })
    
    let data = []
    // 动态导入对应的 json 文件
    if (type === 'A') {
      data = (await import('@/subpkg/exam.old/data/A.json')).default
    } else if (type === 'B') {
      data = (await import('@/subpkg/exam.old/data/B.json')).default
    } else if (type === 'C') {
      data = (await import('@/subpkg/exam.old/data/C.json')).default
    }
    
    if (Array.isArray(data)) {
      const favorites = getFavorites()
      questions.value = data.map(question => ({
        ...question,
        answer: 'A',
        isFavorite: favorites.includes(question.id)
      }))
    }
  } catch (e) {
    console.log(e)
    uni.showToast({
      title: '加载题库失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

function handleFavoriteChanged(questionId: string) {
  const favorites = getFavorites()
  if (favorites.length === 0) {
    goBack()
    return
  }
  
  // 更新原始题目列表的收藏状态
  // questions.value = questions.value.map(question => ({
  //   ...question,
  //   isFavorite: favorites.includes(question.id)
  // }))

  // 如果当前题目已经不在收藏列表中，且是最后一题，则需要调整 currentIndex
  const filtered = questions.value.filter(q => favorites.includes(q.id))
  if (filtered.length === 0) {
    goBack()
    return
  }
  
  if (currentIndex.value >= filtered.length) {
    currentIndex.value = filtered.length - 1
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.content {
  padding: 10px;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--text-tertiary);
}

/* :deep(.favorite-button) {
  background-color: var(--button-background);
  color: var(--button-text);
}

:deep(.favorite-button:active) {
  background-color: var(--button-active);
} */
</style> 