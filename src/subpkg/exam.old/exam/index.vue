<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar title="模拟考试" />
    <view class="content">
      <ExamComponent 
        v-if="questions.length"
        :questions="questions"
        :examType="examType"
        mode="exam"
        @back="goBack" 
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, onMounted } from 'vue'
import ExamComponent from '../components/ExamComponent.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const questions = ref([])
const examType = ref('')

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const type = currentPage.$page?.options?.type

  if (type) {
    examType.value = type
    await loadQuestions(type)
  }
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

onLoad(async (options) => {
  examType.value = options.type || ''
  if (examType.value) {
    await loadQuestions(examType.value)
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

/* 添加考试相关的样式 */
:deep(.question-correct) {
  color: var(--correct-color);
}

:deep(.question-wrong) {
  color: var(--wrong-color);
}

/* :deep(.exam-button) {
  background-color: var(--button-background);
  color: var(--button-text);
}

:deep(.exam-button:active) {
  background-color: var(--button-active);
} */
</style> 