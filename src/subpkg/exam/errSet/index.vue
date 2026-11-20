<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar title="错题集" />
    <!-- 过滤弹窗 -->
    <view v-if="showFilter" class="filter-overlay" @tap="closeFilter">
      <view class="filter-panel" @tap.stop>
        <view class="filter-header">
          <text class="filter-title">错题筛选</text>
          <view class="filter-close" @tap="closeFilter">✕</view>
        </view>
        
        <!-- 错误次数筛选 -->
        <view class="filter-row">
          <text class="filter-label">错误次数：</text>
          <view class="quick-filters">
            <view 
              v-for="n in [1,2,3,4,5]" 
              :key="n"
              class="filter-btn" 
              :class="{ active: filterMinWrongCount === n }"
              @tap="setMinWrongCount(n)"
            >
              {{ n }}+
            </view>
            <view 
              class="filter-btn" 
              :class="{ active: !filterMinWrongCount }"
              @tap="clearWrongCountFilter"
            >
              全部
            </view>
          </view>
        </view>
        
        <!-- 题库类型筛选 -->
        <view class="filter-row">
          <text class="filter-label">题库类型：</text>
          <view class="type-filters">
            <view 
              v-for="type in ['A','B','C']" 
              :key="type"
              class="type-btn"
              :class="{ active: filterTypes.includes(type) }"
              @tap="toggleType(type)"
            >
              {{ type }}类
            </view>
            <view 
              class="type-btn"
              :class="{ active: filterTypes.length === 0 }"
              @tap="clearTypeFilter"
            >
              全部
            </view>
          </view>
        </view>
        
        <!-- 时间范围筛选 -->
        <view class="filter-row">
          <text class="filter-label">时间范围：</text>
          <view class="time-filters">
            <view 
              v-for="(option, index) in timeRangeOptions" 
              :key="index"
              class="time-btn"
              :class="{ active: filterTimeRange === option.value }"
              @tap="setTimeRange(option.value)"
            >
              {{ option.label }}
            </view>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="filter-actions">
          <button class="reset-btn" @tap="resetFilters">重置</button>
          <button class="confirm-btn" @tap="applyFilters">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 主要内容区域 -->
    <view class="content-container">
      <!-- 头部区域 -->
      <view class="header">
        <view class="question-header">
          <view class="question-number-container">
            <text class="question-number">第{{ currentQuestionIndex + 1 }}/{{ allWrongQuestions.length }}题</text>
            <text v-if="hasActiveFilters" class="filter-result">筛选结果: {{ allWrongQuestions.length }}题</text>
            <!-- 键盘快捷键提示 -->
            <view v-if="showKeyboardHint" class="keyboard-hint">
              <text>快捷键: ← → 切换题目 | E 切换解析 | F 筛选</text>
            </view>
          </view>
          <!-- 过滤图标 -->
          <view class="filter-icon" @tap="toggleFilter">
            <view class="filter-icon-inner">
              <text class="filter-text">筛选</text>
            </view>
            <!-- 激活状态指示点 -->
            <view v-if="hasActiveFilters" class="filter-dot"></view>
          </view>
        </view>
      </view>
      
      <!-- 主要内容区域 - 响应式布局 -->
      <view class="main-content" :class="{ 'has-explanation': showExplanationPanel }">
        <!-- 左侧：题目内容区域 -->
        <view class="question-body">
          <view v-if="allWrongQuestions.length === 0" class="empty-state">
            <text>暂无错题</text>
          </view>
          <swiper 
            v-else
            class="question-swiper" 
            :current="currentQuestionIndex" 
            @change="handleQuestionSwiperChange"
            :duration="150"
            :cache-extent="2"
            :disable-touch="showFilter"
          >
            <swiper-item v-for="item in allWrongQuestions" :key="item.id">
              <scroll-view scroll-y class="scroll-view">
                <Question
                  v-if="questionDetails[item.id]"
                  :style="{padding: '10px 20px', display: 'block'}"
                  :question="questionDetails[item.id]"
                  :selectedAnswer="questionDetails[item.id].userAnswer"
                  :showExplanation="showMobileExplanation"
                  @select="selectAnswer"
                />
                <view v-else class="loading-question">
                  <text>加载中...</text>
                </view>
              </scroll-view>
            </swiper-item>
          </swiper>
        </view>
        
        <!-- 右侧：答案解析区域（仅在PC端显示） -->
        <view 
          v-if="showExplanationPanel && currentQuestion" 
          class="explanation-panel">
          <view class="explanation-header">
            <text class="explanation-title">答案解析</text>
            <view class="close-explanation" @tap="hideExplanation">
              <text>×</text>
            </view>
          </view>
          <view class="explanation-content">
            <Question
              v-if="currentQuestion"
              :question="currentQuestion"
              :selectedAnswer="currentQuestion.userAnswer"
              :showExplanation="true"
              :explanation-only="true"
              @select="selectAnswer"
            />
          </view>
        </view>
      </view>
      
      <!-- 底部按钮区域 -->
      <view class="action-buttons">
        <pi-button @tap="prevQuestion" :disabled="currentQuestionIndex === 0" text="上一题" />
        <pi-button @tap="showAnswer" v-if="!showExplanationPanel && !showMobileExplanation" text="查看解析" />
        <pi-button @tap="hideExplanation" v-if="showMobileExplanation" text="隐藏解析" />
        <pi-button @tap="nextQuestion" :disabled="currentQuestionIndex === allWrongQuestions.length - 1" text="下一题" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useExamKeyboard, type ExamKeyEvent } from '../utils/keyboard'
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { getEnhancedWrongQuestions, migrateWrongQuestionStats } from '@/subpkg/exam/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import Question from '../components/Question.vue'
import PiButton from '@/components/PiButton.vue'
import NavBar from '@/components/NavBar/NavBar.vue'
// 静态导入题目数据
import allQuestions from '@/subpkg/exam/data/questions.json'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 过滤弹窗状态
const showFilter = ref(false)

// 错题数据
const allWrongQuestions = ref([])

// 滑动题目索引
const currentQuestionIndex = ref(0)

// 题目详情缓存
const questionDetails = reactive({})

// 筛选相关状态
const filterMinWrongCount = ref()
const filterTypes = ref([])
const filterTimeRange = ref()

// PC端解析面板显示状态
const showExplanationPanel = ref(false)

// 手机端解析显示状态
const showMobileExplanation = ref(false)

// 键盘提示显示状态
const showKeyboardHint = ref(false)

// 时间范围选项
const timeRangeOptions = [
  { label: '最近一周', value: 7 },
  { label: '最近一月', value: 30 },
  { label: '全部时间', value: undefined }
]

// 计算属性：是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filterMinWrongCount.value || 
         filterTypes.value.length > 0 || 
         filterTimeRange.value !== undefined
})

// 计算属性：当前题目
const currentQuestion = computed(() => {
  if (allWrongQuestions.value.length > 0 && currentQuestionIndex.value >= 0) {
    const wrongQuestion = allWrongQuestions.value[currentQuestionIndex.value]
    return wrongQuestion ? questionDetails[wrongQuestion.id] : null
  }
  return null
})

// 计算属性：获取筛选后的错题列表
const filteredWrongQuestions = computed(() => {
  const filters = {
    types: filterTypes.value.length > 0 ? filterTypes.value : undefined,
    minW: filterMinWrongCount.value || undefined,  // 只设置最小错误次数
    maxW: undefined,  // 不设置最大错误次数，表示"N+"
    days: filterTimeRange.value
  }
  
  return getEnhancedWrongQuestions(filters)
})

// 监听筛选结果变化，更新错题列表和题目详情
watch(filteredWrongQuestions, (newQuestions) => {
  allWrongQuestions.value = newQuestions
  currentQuestionIndex.value = 0 // 重置索引
  loadQuestionDetails()
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  loadWrongQuestions()
  
})

// 方法
async function loadWrongQuestions() {
  // 确保数据迁移完成
  migrateWrongQuestionStats()
  
  // 初始加载全部错题（无筛选条件）
  allWrongQuestions.value = getEnhancedWrongQuestions({})
  console.log('加载错题数量:', allWrongQuestions.value.length)
  
  // 重置索引
  currentQuestionIndex.value = 0
  
  // 加载题目详情
  loadQuestionDetails()
}

function loadQuestionDetails() {
  if (allWrongQuestions.value.length === 0) return
  
  console.log('加载题目详情, 错题数量:', allWrongQuestions.value.length)
  
  // 从完整题目数据中查找对应的题目
  allWrongQuestions.value.forEach(wrongQuestion => {
    const questionId = wrongQuestion.id
    
    // 跳过已经加载过的题目
    if (questionDetails[questionId]) {
      return
    }
    
    const question = allQuestions.find(q => q.id === questionId)
    if (question) {
      questionDetails[questionId] = {
        ...question,
        userAnswer: wrongQuestion.userAnswer || [],
        optionMapping: wrongQuestion.optionMapping || {},
        isWrongQuestion: true
      }
      
      console.log(`加载题目 ${questionId}:`, questionDetails[questionId])
    } else {
      console.warn(`未找到题目: ${questionId}`)
    }
  })
  
  console.log('题目详情缓存:', Object.keys(questionDetails).length, '个题目')
}

// ========== 过滤相关方法 ==========

function toggleFilter() {
  showFilter.value = !showFilter.value
}

function closeFilter() {
  showFilter.value = false
}

function resetFilters() {
  filterMinWrongCount.value = undefined
  filterTypes.value = []
  filterTimeRange.value = undefined
}

function applyFilters() {
  showFilter.value = false
  // 筛选逻辑会自动通过 computed 属性和 watch 触发
}

// ========== 题目导航方法 ==========

function handleQuestionSwiperChange(e) {
  currentQuestionIndex.value = e.detail.current
  // 切换题目时隐藏解析
  showMobileExplanation.value = false
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < allWrongQuestions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

function selectAnswer(data) {
  console.log('选择答案:', data)
  
  // 错题集模式：点击选项后自动显示正确答案和解析
  if (!showExplanationPanel.value && !showMobileExplanation.value) {
    // 自动展开解析
    showAnswer()
  }
}

// ========== 筛选设置方法 ==========

// 设置最小错误次数筛选
function setMinWrongCount(count) {
  filterMinWrongCount.value = count
}

// 清除错误次数筛选
function clearWrongCountFilter() {
  filterMinWrongCount.value = undefined
}

// 切换题库类型筛选
function toggleType(type) {
  const index = filterTypes.value.indexOf(type)
  if (index === -1) {
    filterTypes.value.push(type)
  } else {
    filterTypes.value.splice(index, 1)
  }
}

// 清除题库类型筛选
function clearTypeFilter() {
  filterTypes.value = []
}

// 设置时间范围筛选
function setTimeRange(days) {
  filterTimeRange.value = days
}

// ========== PC端相关方法 ==========

// 显示解析面板
function showAnswer() {
  // 在PC端显示右侧解析面板
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    showExplanationPanel.value = true
  } else {
    // 在移动端切换内联解析显示
    showMobileExplanation.value = true
  }
}

// 隐藏解析面板
function hideExplanation() {
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    showExplanationPanel.value = false
  } else {
    showMobileExplanation.value = false
  }
}

// 切换解析面板显示状态
function toggleExplanation() {
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    showExplanationPanel.value = !showExplanationPanel.value
  } else {
    showMobileExplanation.value = !showMobileExplanation.value
  }
}

useExamKeyboard(handleKeyboard, showKeyboardHint)

// 键盘快捷键处理
function handleKeyboard(event: ExamKeyEvent) {
  // 防止在输入框中触发


  // 如果过滤弹窗打开，不处理导航快捷键
  if (showFilter.value) return

  switch (event.key.toLowerCase()) {
    case 'arrowleft':
      event.preventDefault()
      prevQuestion()
      break
    case 'arrowright':
      event.preventDefault()
      nextQuestion()
      break
    case 'f':
      event.preventDefault()
      toggleFilter()
      break
    case 'e':
      event.preventDefault()
      toggleExplanation()
      break
  }
}
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

/* ========== 共享样式 ========== */
.question-number-container {
  color: var(--text-primary);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  white-space: nowrap;
}

.keyboard-hint {
  margin-left: 15px;
  padding: 4px 8px;
  background-color: var(--background-secondary);
  border-radius: 4px;

  // 动态显示，由 showKeyboardHint 控制
  display: block;

  text {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1;
  }
}

.filter-icon {
  display: flex;
  align-items: center;
  position: relative;
}

.filter-icon-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  min-width: 40px;
}

.filter-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.filter-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  background-color: var(--primary-color);
  border-radius: 50%;
}

/* ========== 过滤弹窗样式 ========== */
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}

.filter-panel {
  width: 90%;
  max-width: 300px;
  background-color: var(--background-primary);
  border-radius: 10px;
  padding: 20px 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-title {
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

.filter-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 12px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.reset-btn, .confirm-btn {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  font-size: 14px;
  border: none;
}

.reset-btn {
  background-color: var(--background-secondary);
  color: var(--text-secondary);
}

.confirm-btn {
  background-color: var(--primary-color);
  color: #fff;
}

/* ========== 内容区域样式 ========== */
.content-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* .header {
  头部区域
} */

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

.question-number {
  font-size: 16px; // 手机端使用px单位
  color: var(--text-primary);
  font-weight: bold;
  
  // 平板端缩小字体
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
  }
  
  // PC端字体
  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
}

.filter-result {
  display: block;
  font-size: 12px; // 手机端使用px单位
  color: var(--text-secondary);
  margin-top: 4px;
  
  // 平板端字体
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 13px;
  }
  
  // PC端字体
  @media screen and (min-width: 1025px) {
    font-size: 14px;
  }
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  
  // 手机端：垂直布局
  flex-direction: column;
  
  // 平板/PC端：水平布局
  @media screen and (min-width: 768px) {
    flex-direction: row;
    padding: 0 15px;
    justify-content: center;
    
    // 当显示解析面板时，调整布局
    &.has-explanation {
      justify-content: flex-start;
      padding: 0 7.5px;
    }
  }
}

.question-body {
  flex: 1;
  overflow: hidden;
  
  // 平板/PC端：固定宽度和居中
  @media screen and (min-width: 768px) {
    max-width: 600px;
    width: 600px;
    margin: 0 auto;
    transition: all 0.3s ease-out;
    
    // 当显示解析面板时，保持宽度不变
    .main-content.has-explanation & {
      flex: 0 0 600px;
      max-width: 600px;
      margin: 0 auto;
    }
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: var(--text-secondary);
  font-size: 14px;
}

.question-swiper {
  width: 100%;
  height: 100%;
  min-height: 60vh;
}

.question-swiper swiper-item {
  overflow-y: auto;
  height: 100%;
}

.scroll-view {
  height: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}

.loading-question {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: var(--text-secondary);
  font-size: 14px;
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
    border: 0.5px solid var(--border-color);
  }
}

/* ========== 解析面板样式 ========== */
.explanation-panel {
  display: none;
  
  // 手机端：隐藏右侧面板，保持原有的内联展示
  @media screen and (max-width: 767px) {
    display: none;
  }
  
  // 平板/PC端：显示右侧解析面板
  @media screen and (min-width: 768px) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 280px;
    max-width: 450px;
    background-color: var(--background-container);
    border: 1px solid var(--border-color-light);
    border-radius: 10px;
    overflow: hidden;
    margin-left: 2.5px;
    
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
}

/* ========== 过滤选项样式 ========== */
.filter-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.filter-label {
  min-width: 70px;
  font-size: 14px;
  color: var(--text-primary);
  margin-right: 10px;
  margin-top: 6px;
  flex-shrink: 0;
}

.quick-filters, .type-filters, .time-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.filter-btn, .type-btn, .time-btn {
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--background-secondary);
  border: 1px solid var(--border-color-light);
  transition: all 0.2s ease;
  
  // 平板端稍微缩小
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 5px 9px;
    font-size: 11px;
  }
  
  &.active {
    color: var(--primary-color);
    background-color: var(--primary-background);
    border-color: var(--primary-color);
  }
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.filter-result {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* ========== 暗色主题适配 ========== */
.dark {
  .filter-panel {
    background-color: var(--background-primary);
  }
  
  .filter-icon-inner {
    background-color: var(--background-tertiary);
    border-color: var(--border-color);
  }
  
  .filter-close {
    background-color: var(--background-tertiary);
  }
  
  .filter-btn, .type-btn, .time-btn {
    background-color: var(--background-tertiary);
    border-color: var(--border-color);
    
    &.active {
      background-color: rgba(var(--primary-color-rgb), 0.15);
    }
  }
  
  .reset-btn {
    background-color: var(--background-tertiary);
    color: var(--text-primary);
  }
}
</style>
