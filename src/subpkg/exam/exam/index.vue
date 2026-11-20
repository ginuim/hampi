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
import NavBar from '@/components/NavBar/NavBar.vue'
import { useThemeStore } from '@/stores/theme'
// 静态导入题目数据
import questionsDataA from '../data/A.json'
import questionsDataB from '../data/B.json'
import questionsDataC from '../data/C.json'
import allQuestionsData from '../data/questions.json'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const questions = ref([])
const examType = ref('')

onMounted(async () => {
  // 在 onMounted 中，优先使用 onLoad 中的参数
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
    
    // 获取题目ID列表和完整题目数据
    let questionIds = []
    const allQuestions = allQuestionsData
    
    // 使用静态导入的题目ID列表
    if (type === 'A') {
      questionIds = questionsDataA
    } else if (type === 'B') {
      questionIds = questionsDataB
    } else if (type === 'C') {
      questionIds = questionsDataC
    }
    
    // 根据ID筛选题目
    if (Array.isArray(questionIds) && Array.isArray(allQuestions)) {
      questions.value = allQuestions.filter(question => 
        questionIds.includes(question.id)
      ).map(item => ({
        ...item,
        isFavorite: false
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

/* .content {
  padding: 10px;
} */

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