<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar :title="`${type}类考试 - 练习模式`" />
    <view class="content">
      <exam-component 
        v-if="questions.length"
        mode="practice"
        :examType="type"
        :questions="questions"
        @back="goBack" 
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ExamComponent from '../components/ExamComponent.vue'
import { useThemeStore } from '@/stores/theme'
import { onLoad } from '@dcloudio/uni-app'
// import { getFavorites } from '@/subpkg/exam/utils/examUtils'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const questions = ref([])
const type = ref('')

onMounted(() => {
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

onLoad(async (options) => {
  type.value = options.type || ''
  if (type.value) {
    await loadQuestions(type.value)
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
      // 合并收藏状态到题目数据
      questions.value = data.map(item => ({
        ...item,
        answer: 'A'
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
  // padding: 10px;
}

:deep(.question-card) {
  background-color: var(--background-container);
  border: 1px solid var(--border-color-light);
  color: var(--text-primary);
}

:deep(.question-options) {
  color: var(--text-secondary);
}

:deep(.option-selected) {
  background-color: var(--primary-color);
  color: #ffffff;
}

:deep(.option-correct) {
  background-color: var(--correct-color);
  color: #ffffff !important;
}

:deep(.option-wrong) {
  background-color: var(--wrong-color);
  color: #ffffff;
}

/* :deep(.practice-button) {
  background-color: var(--button-background);
  color: var(--button-text);
}

:deep(.practice-button:active) {
  background-color: var(--button-active);
} */
</style> 