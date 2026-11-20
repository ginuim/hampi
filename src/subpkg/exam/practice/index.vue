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
import NavBar from '@/components/NavBar/NavBar.vue'
import { useThemeStore } from '@/stores/theme'
import { onLoad } from '@dcloudio/uni-app'
// import { getFavorites } from '../utils/examUtils'
// 静态导入题目数据
import questionsDataA from '../data/A.json'
import questionsDataB from '../data/B.json'
import questionsDataC from '../data/C.json'
import allQuestionsData from '../data/questions.json'

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
    uni.showLoading({ title: '加载题库中' });

    // 1. 使用静态导入的全量题库
    const allQuestionsMap = new Map(allQuestionsData.map(q => [q.id, q]));

    // 2. 使用静态导入的分类ID列表
    let questionIds = [];
    if (type === 'A') {
      questionIds = questionsDataA;
    } else if (type === 'B') {
      questionIds = questionsDataB;
    } else if (type === 'C') {
      questionIds = questionsDataC;
    }

    // 3. 根据ID列表筛选题目
    if (Array.isArray(questionIds)) {
      questions.value = questionIds.map(id => allQuestionsMap.get(id)).filter(Boolean);
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