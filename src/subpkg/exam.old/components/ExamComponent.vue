<template>
  <view class="exam-container">
    <!-- 考试模式的介绍页面 -->
    <view v-if="mode === 'exam' && !examStarted" class="exam-intro">
      <text class="exam-title">{{ examType }}类模拟考试</text>
      <text class="exam-info">考试时间：{{ examConfig.duration }}分钟</text>
      <text class="exam-info">题目数量：{{ examConfig.questionCount }}题</text>
      <text class="exam-info">合格标准：{{ examConfig.passScore }}题及以上</text>
      <pi-button @tap="startExam" type="primary" text="开始考试" />
    </view>
    
    <view v-else class="content-container">
      <!-- 头部区域 -->
      <view class="header">
        <!-- 练习模式头部 -->
        <view v-if="mode === 'practice'" class="question-header">
          <view class="question-number-container">
            <text class="question-number">第{{ currentIndex + 1 }}/{{ questions.length }}题</text>
            <view class="index-icon" @tap="toggleQuestionList">
              <view class="iconfont icon-index">&#xe63b;</view>
            </view>
          </view>
          <pi-button @tap.stop="handleFavorite" :text="isFavorite ? '已收藏' : '收藏'" v-if="mode === 'practice'" />
        </view>
        
        <!-- 考试模式头部 -->
        <view v-else-if="mode === 'exam'" class="exam-header">
          <view class="question-number-container">
            <text class="timer">剩余时间：{{ formatTime(remainingTime) }}</text>
            <view class="index-icon" @tap="toggleQuestionList">
              <view class="iconfont icon-index">&#xe63b;</view>
            </view>
          </view>
          <text class="progress">{{ currentIndex + 1 }}/{{ examQuestions.length }}</text>
        </view>
      </view>
      
      <!-- 题目列表模态框 -->
      <question-list-modal 
        :is-visible="showQuestionList"
        :questions="mode === 'exam' ? examQuestions : questions"
        :current-index="currentIndex"
        :favorite-questions="mode === 'practice' ? favorites : []"
        :answered-questions="mode === 'exam' ? userAnswers : []"
        :mode="mode"
        @close="toggleQuestionList"
        @select="jumpToQuestion"
      />
      
      <!-- 题目内容 -->
      <view class="question-body">
        <swiper 
          v-if="initialPositionLoaded"
          :current="currentIndex" 
          @change="handleSwiperChange"
          :disable-touch="showQuestionList || swiperLocked"
          class="question-swiper"
          :duration="150"
          :skip-hidden-item-layout="true"
          :cache-extent="2">
          <swiper-item v-for="(question, index) in mode === 'exam' ? examQuestions : questions" :key="index">
            <view v-if="!question" class="no-question">
              <text>正在加载题目...</text>
            </view>
            <Question
              v-else-if="Math.abs(index - currentIndex) < 3"
              :style="{padding: '10px 20px', display: 'block'}"
              :question="question"
              :selectedAnswer="mode === 'practice' ? (question === currentQuestion ? (selectedAnswer || question.userAnswer) : question.userAnswer) : userAnswers[index]"
              :showExplanation="mode === 'practice' && (index === currentIndex && (showExplanation || props.alwaysShowExplanation))"
              @select="selectAnswer"
            />
          </swiper-item>
        </swiper>
        <view v-else class="loading-container">
          <text>加载中...</text>
        </view>
      </view>
      
      <!-- 底部按钮区域 -->
      <view class="action-buttons">
        <!-- 练习模式按钮 -->
        <template v-if="mode === 'practice'">
          <pi-button @tap="prevQuestion" :disabled="currentIndex === 0" text="上一题" />
          <pi-button @tap="showAnswer" v-if="!showExplanation && !props.alwaysShowExplanation" text="查看答案" />
          <pi-button @tap="nextQuestion" :disabled="currentIndex === questions.length - 1" text="下一题" />
        </template>
        
        <!-- 考试模式按钮 -->
        <template v-else-if="mode === 'exam'">
          <pi-button @tap="prevQuestion" :disabled="currentIndex === 0" text="上一题" />
          <pi-button @tap="submitExam" type="primary" v-if="currentIndex === examQuestions.length - 1" text="交卷" />
          <pi-button @tap="nextQuestion" v-else text="下一题" />
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  toggleFavorite, 
  savePracticePosition,
  getPracticePosition,
  getFavorites,
  shuffleArray, 
  EXAM_CONFIGS, 
  saveExamRecord
} from '@/subpkg/exam.old/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import PiButton from '@/components/PiButton.vue'
import Question from './Question.vue'
import QuestionListModal from './QuestionListModal.vue'

const props = defineProps<{
  alwaysShowExplanation?: boolean
  questions: any[]
  mode: 'practice' | 'exam'
  examType?: string
}>()

// 共享状态
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const currentIndex = ref(0)
const showQuestionList = ref(false)
const swiperLocked = ref(false)
const initialPositionLoaded = ref(false)

// 根据模式计算当前题目
const currentQuestion = computed(() => {
  if (props.mode === 'exam') {
    return examQuestions.value[currentIndex.value]
  } else {
    if (!props.questions?.length || !props.questions[currentIndex.value]) {
      return null
    }
    return props.questions[currentIndex.value]
  }
})

// 练习模式相关状态
const favorites = ref([])
const isFavorite = computed(() => {
  return props.mode === 'practice' && favorites.value.includes(props.questions[currentIndex.value]?.id)
})
const selectedAnswer = ref('')
const showExplanation = ref(false)

// 考试模式相关状态
const examStarted = ref(false)
const examQuestions = ref([])
const userAnswers = ref([])
const remainingTime = ref(0)
const timer = ref(null)
const examConfig = computed(() => EXAM_CONFIGS[props.examType])

const emit = defineEmits(['back', 'favoriteChanged'])

// 共享方法 - 切换题目列表
function toggleQuestionList() {
  showQuestionList.value = !showQuestionList.value
}

// 共享方法 - 滚动到页面顶部
function scrollToTop() {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 0
  })
}

// 共享方法 - 跳转到指定题目
function jumpToQuestion(index: number) {
  currentIndex.value = index
  if (props.mode === 'practice') {
    selectedAnswer.value = ''
    showExplanation.value = false
    savePosition()
  }
  showQuestionList.value = false
  scrollToTop()
}

// 共享方法 - 上一题
function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    if (props.mode === 'practice') {
      selectedAnswer.value = ''
      showExplanation.value = false
      savePosition()
    }
    scrollToTop()
  }
}

// 共享方法 - 下一题
function nextQuestion() {
  const maxIndex = props.mode === 'exam' ? examQuestions.value.length - 1 : props.questions.length - 1
  if (currentIndex.value < maxIndex) {
    currentIndex.value++
    if (props.mode === 'practice') {
      selectedAnswer.value = ''
      showExplanation.value = false
      savePosition()
    }
    scrollToTop()
  }
}

// 练习模式方法
function getFavoritesData() {
  favorites.value = getFavorites()
}

function savePosition() {
  if (props.examType && props.mode === 'practice') {
    savePracticePosition(props.examType, props.mode, currentIndex.value)
  }
}

function showAnswer() {
  showExplanation.value = true
}

async function handleFavorite() {
  if (!currentQuestion.value?.id) return
  
  const newState = toggleFavorite(currentQuestion.value.id)
  
  getFavoritesData()

  uni.showToast({
    title: newState ? '已收藏' : '已取消收藏',
    icon: 'none'
  })
  
  if (props.mode === 'favorites' && !newState) {
    if (currentIndex.value < props.questions.length - 1) {
      nextQuestion()
    } else if (currentIndex.value > 0) {
      prevQuestion()
    }
    emit('favoriteChanged', currentQuestion.value.id)
  }
}

// 考试模式方法
function startExam() {
  try {
    if (!props.questions || !props.questions.length) {
      throw new Error('题库数据无效')
    }
    
    examQuestions.value = shuffleArray(props.questions)
      .slice(0, examConfig.value.questionCount)
      
    userAnswers.value = new Array(examQuestions.value.length).fill('')
    remainingTime.value = examConfig.value.duration * 60
    examStarted.value = true
    startTimer()
  } catch (e) {
    console.error('开始考试失败:', e)
    uni.showToast({
      title: '题库加载失败',
      icon: 'none'
    })
  }
}

function startTimer() {
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      submitExam()
    }
  }, 1000)
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function submitExam() {
  clearInterval(timer.value)
  
  // 计算成绩并收集错题信息
  const wrongQuestions = []
  let correctCount = 0
  
  examQuestions.value.forEach((question, index) => {
    if (userAnswers.value[index] === question.answer) {
      correctCount++
    } else {
      wrongQuestions.push({
        id: question.id,
        userAnswer: userAnswers.value[index],
        optionMapping: question.optionMapping || {}
      })
    }
  })
  
  // 保存考试记录
  const record = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    duration: examConfig.value.duration * 60 - remainingTime.value,
    totalQuestions: examQuestions.value.length,
    correctCount,
    wrongQuestions,
    type: props.examType,
    passed: correctCount >= examConfig.value.passScore
  }
  
  saveExamRecord(record)
  
  // 显示成绩
  uni.showModal({
    title: '考试结束',
    content: `得分：${correctCount}/${examQuestions.value.length}分
用时：${formatTime(examConfig.value.duration * 60 - remainingTime.value)}
${correctCount >= examConfig.value.passScore ? '恭喜通过考试！' : '未达到合格标准，请继续努力！'}
${wrongQuestions.length > 0 ? '\n可在考试记录中查看错题' : ''}`,
    showCancel: false,
    success: () => {
      uni.navigateBack()
    }
  })
}

// 根据模式不同处理答案选择
function selectAnswer(data: { originalAnswer: string, questionId: string }) {
  if (props.mode === 'practice') {
    if (!showExplanation.value) {
      selectedAnswer.value = data.originalAnswer
      showExplanation.value = true
      
      // 选择答案后暂时锁定滑动，防止意外切换
      swiperLocked.value = true
      setTimeout(() => {
        swiperLocked.value = false
      }, 500)
    }
  } else if (props.mode === 'exam') {
    userAnswers.value[currentIndex.value] = data.originalAnswer
  }
}

// 生命周期钩子
onMounted(() => {
  if (props.mode === 'practice') {
    getFavoritesData()
    if (props.examType) {
      currentIndex.value = getPracticePosition(props.examType, props.mode)
    }
    // 设置标记，表示初始位置已加载
    initialPositionLoaded.value = true
  } else {
    // 考试模式不需要加载上次位置，直接标记为已加载
    initialPositionLoaded.value = true
  }
})

watch(() => props.questions, () => {
  if (props.mode === 'practice') {
    currentIndex.value = 0
    selectedAnswer.value = ''
    showExplanation.value = false
  }
}, { immediate: true })

onUnmounted(() => {
  if (props.mode === 'practice') {
    savePosition()
  } else if (props.mode === 'exam' && timer.value) {
    clearInterval(timer.value)
  }
})

function handleSwiperChange(e: any) {
  if (swiperLocked.value) {
    return
  }
  
  const newIndex = e.detail.current
  
  // 防止重复触发
  if (newIndex === currentIndex.value) {
    return
  }
  
  currentIndex.value = newIndex
  if (props.mode === 'practice') {
    selectedAnswer.value = ''
    showExplanation.value = false
    savePosition()
  }
  showQuestionList.value = false
  scrollToTop()
  
  // 短暂锁定，防止快速连续滑动
  swiperLocked.value = true
  setTimeout(() => {
    swiperLocked.value = false
  }, 300)
}
</script>

<style lang="less" scoped>
.exam-container {
  // padding: 10px;
  background-color: var(--background-primary);
}

/* 共享样式 */
.question-number-container {
  color: var(--text-primary);
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.index-icon {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 7.5px;
  padding: 2.5px;
  background-color: var(--background-container);
  border-radius: 4px;
}

.icon-index {
  width: 15px;
  height: 15px;
  font-size: 16px;
  color: var(--text-primary);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;

  :deep(view) {
    border: 0.5px solid var(--border-color-light);
  }
}

/* 练习模式样式 */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // margin-bottom: 10px;
  padding: 10px 20px 0 20px;
}

// .question-body {
//   margin-bottom: 40px;
// }

/* 考试模式样式 */
.exam-intro {
  text-align: center;
  padding: 20px;
}

.exam-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.exam-info {
  display: block;
  margin: 10px 0;
  color: var(--text-secondary);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  // margin-bottom: 15px;
  padding: 10px 20px 0 20px;
}

.timer {
  min-width: 125px;
  white-space: nowrap;
  color: var(--error-color);
}

.progress {
  color: var(--text-secondary);
}

.question-swiper {
  width: 100%;
  height: 100%;
  min-height: 60vh; /* 确保最小高度 */
}

.question-swiper swiper-item {
  overflow-y: auto;
  height: 100%;
}

.no-question {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  color: var(--text-secondary);
}

.content-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.question-body {
  flex: 1;
  overflow: hidden;
}

/* 答案解析区域 */
.explanation-area {
  max-height: 40vh;
  overflow-y: auto;
  padding: 10px;
  border-top: 1px solid var(--border-color-light);
}
</style> 