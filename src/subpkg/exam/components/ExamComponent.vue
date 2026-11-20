<template>
  <view class="exam-container">
    <!-- 考试模式的介绍页面 -->
    <view v-if="mode === 'exam' && !examStarted" class="exam-intro">
      <text class="exam-title">{{ examType }}类模拟考试</text>
      <text class="exam-info">考试时间：{{ examConfig.duration }}分钟</text>
      <text class="exam-info">题目数量：{{ examConfig.questionCount }}题({{ examConfig.singleChoiceCount }}单选，{{ examConfig.multipleChoiceCount }}多选)</text>
      <text class="exam-info">合格标准：{{ examConfig.passScore }}题及以上</text>
      <pi-button @tap="startExam" type="primary" text="开始考试" />
    </view>
    
    <view v-else class="content-container">
      <!-- 头部区域 -->
      <view class="header">
        <!-- 练习模式头部 -->
        <view v-if="isPracticeMode" class="question-header">
          <view class="question-number-container">
            <text class="question-number">第{{ currentIndex + 1 }}/{{ questions.length }}题</text>
            <view class="index-icon" @tap="toggleQuestionList">
              <view class="iconfont icon-index">&#xe63b;</view>
            </view>
            <!-- 键盘快捷键提示 -->
            <view :class="['keyboard-hint', { show: showKeyboardHint }]">
              <text>快捷键: ← → 切换题目 | A-D/1-4 选择 | E 显示答案 | F 收藏</text>
            </view>
          </view>
          <pi-button @tap.stop="handleFavorite" :text="isFavorite ? '已收藏' : '收藏'" v-if="isPracticeMode" />
        </view>
        
        <!-- 考试模式头部 -->
        <view v-else-if="mode === 'exam'" class="exam-header">
          <view class="question-number-container">
            <text class="timer">剩余时间：{{ formatTime(remainingTime) }}</text>
            <view class="index-icon" @tap="toggleQuestionList">
              <view class="iconfont icon-index">&#xe63b;</view>
            </view>
            <!-- PC端键盘快捷键提示 -->
            <view :class="['keyboard-hint', { show: showKeyboardHint }]">
              <text>快捷键: ← → 切换题目 | A-D/1-4 选择 | E 答题情况</text>
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
        :favorite-questions="isPracticeMode ? favorites : []"
        :answered-questions="mode === 'exam' ? userAnswers : []"
        :mode="mode"
        @close="toggleQuestionList"
        @select="jumpToQuestion"
      />
      
      <!-- 主要内容区域 - 响应式布局 -->
      <view class="main-content" :class="{ 'has-explanation': (isPracticeMode && (showExplanation || (props.alwaysShowExplanation && props.mode !== 'review'))) || (props.mode === 'review' && showExplanation) }">
        <!-- 左侧：题目内容区域 -->
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
                :selectedAnswer="isPracticeMode ? (question.userAnswer || selectedAnswer) : displayAnswers[index]"
                :showExplanation="isPracticeMode && (index === currentIndex && (showExplanation || props.alwaysShowExplanation))"
                @select="selectAnswer"
                @option-mapping-change="handleOptionMappingChange"
              />
            </swiper-item>
          </swiper>
          <view v-else class="loading-container">
            <text>加载中...</text>
          </view>
        </view>
        
        <!-- 右侧：答案解析区域（仅在PC端且显示解析时可见） -->
        <view 
          v-if="(isPracticeMode && (showExplanation || (props.alwaysShowExplanation && props.mode !== 'review'))) || (props.mode === 'review' && showExplanation)" 
          class="explanation-panel">
          <view class="explanation-header">
            <text class="explanation-title">{{ isPracticeMode ? '答案解析' : '答题情况' }}</text>
            <view class="close-explanation" @tap="hideExplanation">
              <text>×</text>
            </view>
          </view>
          <view class="explanation-content">
            <Question
              v-if="currentQuestion"
              :question="currentQuestion"
              :selectedAnswer="isPracticeMode ? (currentQuestion.userAnswer || selectedAnswer) : displayAnswers[currentIndex]"
              :showExplanation="isPracticeMode"
              :explanation-only="true"
              @select="selectAnswer"
              @option-mapping-change="handleOptionMappingChange"
            />
          </view>
        </view>
      </view>
      
      <!-- 底部按钮区域 -->
      <view class="action-buttons">
        <!-- 练习模式按钮 -->
        <template v-if="isPracticeMode">
          <pi-button @tap="prevQuestion" :disabled="currentIndex === 0" text="上一题" />
          <pi-button @tap="showAnswer" v-if="!showExplanation && (!props.alwaysShowExplanation || props.mode === 'review')" text="查看解析" />
          <pi-button @tap="nextQuestion" :disabled="currentIndex === questions.length - 1" text="下一题" />
        </template>
        
        <!-- 考试模式按钮 -->
        <template v-else-if="mode === 'exam'">
          <pi-button @tap="prevQuestion" :disabled="currentIndex === 0" text="上一题" />
          <pi-button @tap="handleFavorite" :text="isFavoriteInExam ? '已收藏' : '收藏'" />
          <pi-button @tap="requestSubmitExam" type="primary" v-if="currentIndex === examQuestions.length - 1" text="交卷" />
          <pi-button @tap="nextQuestion" v-else text="下一题" />
        </template>
      </view>
    </view>

    <!-- 考试结果模态框 -->
    <view v-if="showExamResult && examResult" class="exam-result-modal">
      <view class="modal-overlay" @tap="closeExamResult"></view>
      <view class="modal-content">
        <view class="result-header" :class="{ 'result-header--passed': examResult.passed }">
          <text class="result-kicker">{{ examType }}类模拟考试 · 已交卷</text>
          <text class="result-title">{{ examResult.passed ? '模拟考试通过' : '继续加油' }}</text>
          <text class="result-score">{{ examResult.percentage }}%</text>
          <text class="result-score-label">正确率</text>
        </view>

        <view class="result-body">
          <view class="result-quote">
            <text class="quote-text">{{ examResult.quote }}</text>
          </view>

          <view class="result-stats">
            <view class="stat-item">
              <text class="stat-label">正确题数</text>
              <text class="stat-value">{{ examResult.score }}题</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">正确率</text>
              <text class="stat-value">{{ examResult.percentage }}%</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">考试用时</text>
              <text class="stat-value">{{ formatExamDuration(examResult.duration) }}</text>
            </view>
          </view>

          <view class="result-encouragement">
            <text class="encouragement-text">{{ examResult.level.encouragement }}</text>
          </view>

          <view class="result-actions">
            <pi-button @tap="showSharePosterModal" type="primary" block text="生成成绩海报" />
            <view class="result-secondary-actions">
              <pi-button @tap="viewWrongQuestions" v-if="examResult.wrongQuestionsCount > 0" text="查看错题" />
              <pi-button @tap="closeExamResult" text="完成" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 庆祝效果 -->
    <celebration-effect
      :is-visible="showCelebration"
      :level="examResult?.level"
      :message="getCelebrationMessage()"
      @finished="onCelebrationFinished"
    />

    <!-- 分享海报 -->
    <exam-result-poster
      :is-visible="showSharePoster"
      :exam-result="examResult"
      :exam-type="props.examType"
      :exam-date="examResult?.examDate || new Date().toISOString()"
      :user-info="userInfo"
      @close="closeSharePosterModal"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  toggleFavorite, 
  savePracticePosition,
  getPracticePosition,
  getFavorites,
  EXAM_CONFIGS, 
  saveExamRecord,
  addWrongQuestion
} from '@/subpkg/exam/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import { loadExplanation } from '@/utils/explanationLoader'
import PiButton from '@/components/PiButton.vue'
import Question from './Question.vue'
import QuestionListModal from './QuestionListModal.vue'
import CelebrationEffect from './CelebrationEffect.vue'
import ExamResultPoster from './ExamResultPoster.vue'
import { calculateExamLevel, formatExamDuration } from '../utils/examResultsConfig'
import { buildExamPaper } from '../utils/paper'
import { useExamKeyboard, type ExamKeyEvent } from '../utils/keyboard'

const props = defineProps<{
  alwaysShowExplanation?: boolean
  questions: any[]
  mode: 'practice' | 'exam' | 'favorites' | 'review'
  examType?: string
  isReview?: boolean
}>()

// 共享状态
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const currentIndex = ref(0)
const showQuestionList = ref(false)
const swiperLocked = ref(false)
const initialPositionLoaded = ref(false)
const showKeyboardHint = ref(false)
useExamKeyboard(handleKeyboard, showKeyboardHint)

// 考试结果状态
const examResult = ref<any>(null)
const showExamResult = ref(false)
const showCelebration = ref(false)
const showSharePoster = ref(false)

// 用户信息
const userInfo = ref({
  avatar: '',
  nickname: 'HAM爱好者'
})



// 练习模式相关状态
const favorites = ref([])
const isFavorite = computed(() => {
  return isPracticeMode.value && favorites.value.includes(props.questions[currentIndex.value]?.id)
})

// 考试模式下的收藏状态
const isFavoriteInExam = computed(() => {
  return props.mode === 'exam' && favorites.value.includes(examQuestions.value[currentIndex.value]?.id)
})

const selectedAnswer = ref<string[]>([])
const showExplanation = ref(false)

// 考试模式相关状态
const examStarted = ref(false)
const examSubmitted = ref(false)
const examQuestions = ref([])
const userAnswers = ref<string[][]>([])        // 存储原始答案（用于提交）
const displayAnswers = ref<string[][]>([])    // 存储显示答案（用于高亮）
const remainingTime = ref(0)
const deadlineAt = ref(0)
const timer = ref(null)
const showExamExplanation = ref(false)        // 考试模式右侧面板显示状态
const examConfig = computed(() => EXAM_CONFIGS[props.examType])

const emit = defineEmits(['back', 'favoriteChanged'])

// 辅助函数：判断是否是练习类模式（practice、favorites 或 review）
const isPracticeMode = computed(() => props.mode === 'practice' || props.mode === 'favorites' || props.mode === 'review')

const currentQuestion = computed(() => {
  if (isPracticeMode.value && props.questions) {
    return props.questions[currentIndex.value]
  }
  if (props.mode === 'exam' && examQuestions.value) {
    return examQuestions.value[currentIndex.value]
  }
  return null
})

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
  if (isPracticeMode.value) {
    selectedAnswer.value = []
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
    if (isPracticeMode.value) {
      selectedAnswer.value = []
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
    if (isPracticeMode.value) {
      selectedAnswer.value = []
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
  if (props.examType && isPracticeMode.value && props.mode !== 'review') {
    savePracticePosition(props.examType, props.mode, currentIndex.value)
  }
}

function showAnswer() {
  showExplanation.value = true
  
  // 选择答案后暂时锁定滑动，防止意外切换
  swiperLocked.value = true
  setTimeout(() => {
    swiperLocked.value = false
  }, 500)
}

function hideExplanation() {
  if (isPracticeMode.value) {
    // 在 review 模式中，如果设置了 alwaysShowExplanation，则不允许隐藏内联解析
    // 但可以隐藏右侧面板（通过控制 showExplanation 状态）
    if (props.mode === 'review' && props.alwaysShowExplanation) {
      showExplanation.value = false // 这会隐藏右侧面板，但保持内联解析
    } else {
      showExplanation.value = false
    }
  } else if (props.mode === 'exam') {
    showExamExplanation.value = false
  }
}

async function handleFavorite(fromKeyboard = false) {
  if (!currentQuestion.value?.id) return
  
  const newState = toggleFavorite(currentQuestion.value.id)
  
  getFavoritesData()

  uni.showToast({
    title: newState ? '已收藏' : '已取消收藏',
    icon: 'none'
  })
  
  // 只有在练习模式下且非键盘触发且取消收藏时才自动跳转
  if (isPracticeMode.value && !newState && !fromKeyboard) {
    if (currentIndex.value < props.questions.length - 1) {
      nextQuestion()
    } else if (currentIndex.value > 0) {
      prevQuestion()
    }
    emit('favoriteChanged', currentQuestion.value.id)
  }

  // 考试模式下不自动跳转，让用户继续答题
}

// 考试模式方法
function startExam() {
  try {
    if (examStarted.value) return
    if (!props.questions || !props.questions.length) {
      throw new Error('题库数据无效')
    }

    let records = []
    try {
      const storedRecords = uni.getStorageSync('examRecords.20250728') || []
      const parsed = typeof storedRecords === 'string' ? JSON.parse(storedRecords) : storedRecords
      records = Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('读取历史试卷失败，使用完整题库组卷:', error)
    }
    const recentIds: string[] = []
    records
      .filter(record => record.type === props.examType && Array.isArray(record.questionIds))
      .slice(0, 3)
      .forEach(record => recentIds.push(...record.questionIds))
    examQuestions.value = buildExamPaper(props.questions, examConfig.value, recentIds)

    userAnswers.value = Array.from({ length: examQuestions.value.length }, () => [])
    displayAnswers.value = Array.from({ length: examQuestions.value.length }, () => [])
    examSubmitted.value = false
    currentIndex.value = 0
    remainingTime.value = examConfig.value.duration * 60
    deadlineAt.value = Date.now() + remainingTime.value * 1000
    examStarted.value = true
    startTimer()
  } catch (e) {
    console.error('开始考试失败:', e)
    uni.showToast({
      title: '题库加载失败',
      icon: 'none'
    })
    return
  }
  uni.reportEvent('exam_start', { exam_type: props.examType })
}

function startTimer() {
  timer.value = setInterval(() => {
    remainingTime.value = Math.max(0, Math.ceil((deadlineAt.value - Date.now()) / 1000))
    if (remainingTime.value === 0) {
      submitExam()
    }
  }, 1000)
}

function requestSubmitExam() {
  if (!examStarted.value || examSubmitted.value) return
  const firstUnanswered = userAnswers.value.findIndex(answer => !answer?.length)
  if (firstUnanswered === -1) {
    submitExam()
    return
  }
  const unansweredCount = userAnswers.value.filter(answer => !answer?.length).length
  uni.showModal({
    title: '还有未答题目',
    content: `还有 ${unansweredCount} 题未作答，确定交卷吗？`,
    cancelText: '返回检查',
    confirmText: '仍要交卷',
    success: result => {
      if (examSubmitted.value) return
      if (result.confirm) submitExam()
      else if (result.cancel) jumpToQuestion(firstUnanswered)
    }
  })
}

// 处理选项映射变化
function handleOptionMappingChange(event: { questionId: string, optionMapping: Record<string, string> }) {
  const { questionId, optionMapping } = event
  
  // 在examQuestions中找到对应题目并保存选项映射
  const targetQuestions = props.mode === 'exam' ? examQuestions.value : props.questions
  const questionIndex = targetQuestions.findIndex(q => q.id === questionId)
  
  if (questionIndex !== -1) {
    // 直接修改对应题目的optionMapping属性
    targetQuestions[questionIndex].optionMapping = optionMapping
  } else {
    console.error(`找不到题目${questionId}来保存选项映射`)
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

async function submitExam() {
  if (!examStarted.value || examSubmitted.value) return
  examSubmitted.value = true
  clearInterval(timer.value)
  remainingTime.value = Math.max(0, Math.ceil((deadlineAt.value - Date.now()) / 1000))

  // 计算成绩并收集错题信息
  const wrongQuestions = []
  let correctCount = 0

  for (let index = 0; index < examQuestions.value.length; index++) {
    const question = examQuestions.value[index]
    const userAnswer = [...(userAnswers.value[index] || [])].sort().join('')
    const correctAnswer = question.answer.split('').sort().join('')

    if (userAnswer === correctAnswer) {
      correctCount++
    } else {
      // 记录错题信息（explanation在回顾时动态加载）
      const wrongAnswerRecord = {
        id: question.id,
        userAnswer: userAnswers.value[index] || [],
        optionMapping: question.optionMapping || {}
      }

      wrongQuestions.push(wrongAnswerRecord)
    }
  }

  // 使用新的考试结果配置系统
  const resultData = calculateExamLevel(correctCount, examQuestions.value.length, examConfig.value.passScore)

  // 保存考试记录
  const record = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    duration: examConfig.value.duration * 60 - remainingTime.value,
    totalQuestions: examQuestions.value.length,
    correctCount,
    questionIds: examQuestions.value.map(question => question.id),
    wrongQuestions,
    type: props.examType,
    passed: correctCount >= examConfig.value.passScore
  }

  saveExamRecord(record)

  // 同时更新新的错题统计数据
  wrongQuestions.forEach(wrongQuestion => {
    addWrongQuestion(wrongQuestion.id, record.date.split('T')[0])
  })

  // 设置考试结果并显示
  examResult.value = {
    ...resultData,
    duration: examConfig.value.duration * 60 - remainingTime.value,
    wrongQuestionsCount: wrongQuestions.length,
    recordId: record.id,
    totalQuestions: examQuestions.value.length,
    passed: record.passed,
    examDate: record.date
  }

  showExamResult.value = true

  showCelebration.value = record.passed

  uni.reportEvent('exam_finish', {
    exam_type: props.examType,
    correct_count: correctCount,
    duration: examResult.value.duration,
    result: examResult.value.level.id
  })
}

// 关闭考试结果
function closeExamResult() {
  showExamResult.value = false
  examResult.value = null
  uni.navigateBack()
}

// 查看错题
function viewWrongQuestions() {
  if (examResult.value && examResult.value.recordId) {
    // 导航到考试记录页面并显示错题
    uni.navigateTo({
      url: `/subpkg/exam/history/index?recordId=${examResult.value.recordId}`
    })
  }
}

// 庆祝效果结束
function onCelebrationFinished() {
  showCelebration.value = false
}

// 获取庆祝消息
function getCelebrationMessage() {
  if (!examResult.value?.passed) return ''

  const messages = {
    'fail': '💪 继续加油！',
    'pass': '🎉 恭喜通过！',
    'good': '🎊 表现优秀！',
    'excellent': '🏆 太棒了！',
    'outstanding': '👑 完美！'
  }

  return messages[examResult.value.level.id] || '🎉 考试完成！'
}

// 获取用户信息
async function getUserInfo() {
  try {
    // 尝试从本地存储获取用户信息
    const storedUserInfo = uni.getStorageSync('userInfo')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
    }

    // 微信小程序环境，获取用户信息
    if (typeof wx !== 'undefined' && typeof wx.getUserInfo === 'function') {
      const wxUserInfo = await new Promise<any>((resolve) => {
        wx.getUserInfo({
          success: (res) => resolve(res.userInfo),
          fail: () => resolve(null)
        })
      })

      if (wxUserInfo) {
        userInfo.value = {
          avatar: wxUserInfo.avatarUrl,
          nickname: wxUserInfo.nickName
        }
        // 保存到本地存储
        uni.setStorageSync('userInfo', JSON.stringify(userInfo.value))
      }
    }
  } catch (error) {
    console.warn('获取用户信息失败:', error)
  }
}

// 显示分享海报
function showSharePosterModal() {
  showSharePoster.value = true
  uni.reportEvent('exam_share_poster', {
    exam_type: props.examType,
    correct_count: Number(examResult.value.correctCount),
    duration: String(examResult.value.duration),
    result: examResult.value.level.id
  })
}

// 关闭分享海报
function closeSharePosterModal() {
  showSharePoster.value = false
}

// 根据模式不同处理答案选择
function selectAnswer(data: { originalAnswer: string, displayAnswer?: string, questionId: string, isSingleChoice?: boolean, shouldClear?: boolean, shouldShowExplanation?: boolean }) {
  const { originalAnswer, displayAnswer, isSingleChoice = false, shouldClear = false, shouldShowExplanation = false } = data;

  
  if (isPracticeMode.value) {
    if (!showExplanation.value) {
      const useAnswer = displayAnswer || originalAnswer; // 优先使用显示答案，回退到原始答案
      
      if (isSingleChoice) {
        // 单选题逻辑
        const isCurrentlySelected = selectedAnswer.value.includes(useAnswer);
        if (isCurrentlySelected) {
          // 如果当前选项已选中，则取消选择
          selectedAnswer.value = [];
          showExplanation.value = false;
        } else {
          // 如果当前选项未选中，则仅选择当前选项
          selectedAnswer.value = [useAnswer];
          // 单选题选择后立即显示解释
          showExplanation.value = true;
        }
      } else {
        // 多选题逻辑：保持原有逻辑
        const answerIndex = selectedAnswer.value.indexOf(useAnswer);
        if (answerIndex > -1) {
          selectedAnswer.value.splice(answerIndex, 1);
        } else {
          selectedAnswer.value.push(useAnswer);
        }
      }
    }
  } else if (props.mode === 'exam') {
    // 考试模式：同时维护原始答案（存储）和显示答案（高亮）
    const currentAnswers = [...(userAnswers.value[currentIndex.value] || [])];
    const currentDisplayAnswers = [...(displayAnswers.value[currentIndex.value] || [])];
    const useDisplayAnswer = displayAnswer || originalAnswer;
    
    if (isSingleChoice) {
      // 单选题逻辑 - 检查是否已选中（基于显示答案）
      const isCurrentlySelected = currentDisplayAnswers.includes(useDisplayAnswer);
      if (isCurrentlySelected) {
        // 如果当前选项已选中，则取消选择
        userAnswers.value[currentIndex.value] = [];
        displayAnswers.value[currentIndex.value] = [];
      } else {
        // 如果当前选项未选中，则仅选择当前选项
        userAnswers.value[currentIndex.value] = [originalAnswer];        // 存储原始答案
        displayAnswers.value[currentIndex.value] = [useDisplayAnswer];   // 存储显示答案

        // 单选题选择后自动切换到下一题
        if (currentIndex.value < examQuestions.value.length - 1) {
          const selectedIndex = currentIndex.value
          setTimeout(() => {
            if (!examSubmitted.value && currentIndex.value === selectedIndex) {
              currentIndex.value++
              scrollToTop()
            }
          }, 200) // 延迟200ms让用户看到选择效果
        }
      }
    } else {
      // 多选题逻辑
      const displayAnswerIndex = currentDisplayAnswers.indexOf(useDisplayAnswer);
      const originalAnswerIndex = currentAnswers.indexOf(originalAnswer);

      if (displayAnswerIndex > -1 && originalAnswerIndex > -1) {
        // 移除选择
        currentAnswers.splice(originalAnswerIndex, 1);
        currentDisplayAnswers.splice(displayAnswerIndex, 1);
      } else {
        // 添加选择
        currentAnswers.push(originalAnswer);
        currentDisplayAnswers.push(useDisplayAnswer);
      }

      userAnswers.value[currentIndex.value] = currentAnswers;
      displayAnswers.value[currentIndex.value] = currentDisplayAnswers;
    }

    // 注意：模拟考试时不自动显示右侧面板，让用户专注答题
  }
}

// 键盘快捷键处理
function handleKeyboard(event: ExamKeyEvent) {
  // 防止在输入框中触发
  if (props.mode === 'exam' && (!examStarted.value || examSubmitted.value)) return
  if (showQuestionList.value && event.key.toLowerCase() !== 'e') return

  switch (event.key.toLowerCase()) {
    case 'arrowleft':
      event.preventDefault()
      prevQuestion()
      break
    case 'arrowright':
      event.preventDefault()
      nextQuestion()
      break
    case 'e':
      event.preventDefault()
      if (isPracticeMode.value) {
        if (props.mode === 'review' && props.alwaysShowExplanation) {
          // review 模式中切换右侧面板
          showExplanation.value = !showExplanation.value
        } else if (showExplanation.value || props.alwaysShowExplanation) {
          hideExplanation()
        } else {
          showAnswer()
        }
      }
      else if (props.mode === 'exam') {
        toggleQuestionList()
      }
      break
    case 'a':
    case '1':
      event.preventDefault()
      selectOptionByKey('A')
      break
    case 'b':
    case '2':
      event.preventDefault()
      selectOptionByKey('B')
      break
    case 'c':
    case '3':
      event.preventDefault()
      selectOptionByKey('C')
      break
    case 'd':
    case '4':
      event.preventDefault()
      selectOptionByKey('D')
      break
    case 'f':
      event.preventDefault()
      if (isPracticeMode.value) {
        handleFavorite(true) // 标记为键盘触发
      }
      break
  }
}

// 通过键盘选择选项
function selectOptionByKey(letter: string) {
  const question = currentQuestion.value
  if (!question) return
  
  // 检查选项是否存在
  const optionIndex = ['A', 'B', 'C', 'D'].indexOf(letter)
  if (optionIndex >= question.options.length) return
  
  // 键盘输入的letter是当前显示的选项位置（A/B/C/D）
  // 需要根据选项映射找到对应的原始选项位置
  const optionMapping = question.optionMapping || {}
  const originalLetter = optionMapping[letter] || letter // 如果没有映射，说明没有打乱
  
  const isSingleChoice = question.answer.length === 1
  
  // 调用selectAnswer，传入正确的原始答案和显示答案
  selectAnswer({
    originalAnswer: originalLetter, // 原始选项位置（用于存储和比较）
    displayAnswer: letter,          // 显示选项位置（用于UI高亮）
    questionId: question.id,
    isSingleChoice
  })
}

// 生命周期钩子
onMounted(() => {
  // 加载收藏数据（所有模式都需要）
  getFavoritesData()

  if (isPracticeMode.value) {
    if (props.examType && props.mode !== 'review') {
      currentIndex.value = getPracticePosition(props.examType, props.mode)
    }
    // 设置标记，表示初始位置已加载
    initialPositionLoaded.value = true
  } else {
    // 考试模式不需要加载上次位置，直接标记为已加载
    initialPositionLoaded.value = true
  }
  
  // 获取用户信息
  getUserInfo()
})

watch(() => props.questions, () => {
  if (isPracticeMode.value) {
    currentIndex.value = 0
    selectedAnswer.value = []
    showExplanation.value = false
  }
}, { immediate: true })

onUnmounted(() => {
  if (isPracticeMode.value) {
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
  if (isPracticeMode.value) {
    selectedAnswer.value = []
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

.question-number {
  font-size: 16px; // 手机端使用px单位
  font-weight: bold;
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
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

.keyboard-hint {
  margin-left: 15px;
  padding: 4px 8px;
  background-color: var(--background-secondary);
  border-radius: 4px;

  // 完全由 showKeyboardHint 变量控制显示
  display: none;

  // 当 showKeyboardHint 为 true 时显示
  &.show {
    display: block;
  }

  text {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1;
  }
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;

  // 平板端减少底部间距
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    bottom: 17.5px;
    left: 17.5px;
    right: 17.5px;
  }

  :deep(view) {
    border: 0.5px solid var(--border-color);
  }
}

/* 练习模式样式 */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px 0 20px; // 手机端使用px单位
  
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 12px 25px 8px 25px;
    border-bottom: 1px solid var(--border-color);
  }
  
  @media screen and (min-width: 1025px) {
    padding: 15px 30px 10px 30px;
    border-bottom: 1px solid var(--border-color);
  }
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
  font-size: 20px; // 手机端使用px单位
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--text-primary);
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 28px;
    margin-bottom: 25px;
  }
}

.exam-info {
  display: block;
  margin: 10px 0; // 手机端使用px单位
  color: var(--text-secondary);
  font-size: 15px; // 手机端使用px单位
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
    margin: 15px 0;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 18px;
    margin: 18px 0;
  }
}

.exam-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px 0 20px; // 手机端使用px单位
  
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 12px 25px 8px 25px;
    border-bottom: 1px solid var(--border-color);
  }
  
  @media screen and (min-width: 1025px) {
    padding: 15px 30px 10px 30px;
    border-bottom: 1px solid var(--border-color);
  }
}

.timer {
  min-width: 160px; // 手机端使用px单位
  white-space: nowrap;
  color: var(--error-color);
  font-size: 16px; // 手机端使用px单位
  font-weight: bold;
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
    min-width: 180px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 20px;
    min-width: 200px;
  }
}

.progress {
  color: var(--text-secondary);
  font-size: 15px; // 手机端使用px单位
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 18px;
  }
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

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  
  // 手机端：垂直布局
  flex-direction: column;
  
  // 平板端：紧凑布局
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    flex-direction: row;
    padding: 0 10px;
    justify-content: center;
    
    // 当显示解析面板时，调整布局
    &.has-explanation {
      justify-content: flex-start;
      padding: 0 5px;
    }
  }
  
  // PC端：始终居中布局，为右侧面板预留空间
  @media screen and (min-width: 1025px) {
    flex-direction: row;
    padding: 0 15px;
    justify-content: center;

    // 当显示解析面板时，保持居中布局，但增加右侧空间
    &.has-explanation {
      justify-content: center;
      padding: 0 420px 0 15px; // 右侧预留固定定位面板的空间
    }

    // 响应式调整
    @media screen and (min-width: 1200px) {
      &.has-explanation {
        padding: 0 470px 0 15px; // 右侧预留更大空间
      }
    }

    @media screen and (min-width: 1440px) {
      &.has-explanation {
        padding: 0 520px 0 15px; // 右侧预留最大空间
      }
    }
  }
}

.question-body {
  flex: 1;
  overflow: hidden;
  
  // 平板端：适中宽度和间距
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    max-width: 500px;
    width: 500px;
    transition: all 0.3s ease-out;
    margin: 0 auto;
    
    // 当显示解析面板时，保持宽度不变
    .main-content.has-explanation & {
      flex: 0 0 500px;
      max-width: 500px;
      margin: 0 auto;
    }
  }
  
  // PC端：固定宽度，不随解析面板变化
  @media screen and (min-width: 1025px) {
    max-width: 700px; // 固定最大宽度
    width: 700px; // 固定宽度
    transition: none; // 移除过渡动画
    margin: 0 auto; // 始终居中

    // 当显示解析面板时，保持固定宽度和居中位置
    .main-content.has-explanation & {
      flex: 0 0 700px; // 固定宽度，不伸缩
      max-width: 700px; // 保持最大宽度不变
      width: 700px; // 固定宽度
      margin: 0 auto; // 保持居中对齐
    }
  }
}

.explanation-panel {
  display: none;
  
  // 手机端：在移动端隐藏右侧面板，保持原有的内联展示
  @media screen and (max-width: 767px) {
    display: none;
  }
  
  // 平板端：紧凑的右侧解析面板
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 240px;
    max-width: 380px;
    background-color: var(--background-container);
    border: 1px solid var(--border-color-light);
    border-radius: 8px;
    overflow: hidden;
    margin-left: 4px;
    
    // 优雅的进入动画
    animation: slideInRight 0.3s ease-out;
    transform-origin: right center;
  }
  
  // PC端：全屏右侧布局，不受父级容器限制
  @media screen and (min-width: 1025px) {
    display: flex;
    flex-direction: column;
    position: fixed; // 改为固定定位，脱离父级容器
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px; // 基础宽度
    background-color: var(--background-container);
    border-left: 1px solid var(--border-color-light);
    overflow: hidden;
    z-index: 10; // 确保在正确的层级

    // 响应式宽度调整
    @media screen and (min-width: 1200px) {
      width: 450px;
    }

    @media screen and (min-width: 1440px) {
      width: 500px;
    }

    // 优雅的进入动画
    animation: slideInRight 0.3s ease-out;
    transform-origin: right center;
  }
}

// 右侧滑入动画
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.explanation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color-light);
  background-color: var(--background-secondary);

  // PC端全高面板样式调整
  @media screen and (min-width: 1025px) {
    padding: 20px 15px;
    border-bottom: 1px solid var(--border-color-light);
    background-color: var(--background-secondary);
  }
}

.explanation-title {
  font-size: 16px; // 手机端使用px单位
  font-weight: bold;
  color: var(--text-primary);
  
  // 平板端缩小字体
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
  }
  
  // PC端字体
  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
}

.close-explanation {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: var(--background-primary);
  cursor: pointer;
  
  text {
    font-size: 20px;
    color: var(--text-secondary);
  }
  
  &:hover {
    background-color: var(--border-color-light);
  }
}

.explanation-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;

  // PC端全高面板内容区域调整
  @media screen and (min-width: 1025px) {
    padding: 15px;
    overflow-y: auto;
    height: calc(100vh - 60px); // 减去头部高度
  }
}

/* 答案解析区域 */
.explanation-area {
  max-height: 40vh;
  overflow-y: auto;
  padding: 10px;
  border-top: 1px solid var(--border-color-light);
}

/* 考试结果提示：用紧凑的成绩卡片呈现结论和下一步。 */
.exam-result-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(3, 10, 22, 0.72);
}

.modal-content {
  position: relative;
  width: 88%;
  max-width: 460px;
  max-height: 86vh;
  overflow-y: auto;
  background: var(--background-primary);
  border-radius: 20px;
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.result-header {
  padding: 22px 22px 20px;
  color: #fff;
  background: #15243D;
}

.result-header--passed { background: #103E48; }
.result-kicker {
  display: block;
  margin-bottom: 13px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}
.result-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
}
.result-score {
  display: block;
  margin-top: 8px;
  font-size: 46px;
  font-weight: 700;
  line-height: 1.05;
}
.result-score-label {
  display: block;
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.result-body { padding: 18px; }
.result-quote {
  padding: 0 0 14px;
  border-bottom: 1px solid var(--border-color-light);
}
.quote-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-primary);
}
.result-stats {
  display: flex;
  margin: 16px 0;
}
.stat-item {
  flex: 1;
  min-width: 0;
  text-align: center;
  border-right: 1px solid var(--border-color-light);
}
.stat-item:last-child { border-right: 0; }
.stat-label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 11px;
}
.stat-value {
  display: block;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
}
.result-encouragement {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--background-secondary);
}
.encouragement-text {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}
.result-secondary-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
</style>
