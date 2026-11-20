<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar title="错题集" />
    <view class="tabs">
      <view 
        class="tab" 
        :class="{ 'active': activeTab === 0 }" 
        @tap="switchTab(0)"
      >
        当前错题
      </view>
      <view 
        class="tab" 
        :class="{ 'active': activeTab === 1 }" 
        @tap="switchTab(1)"
      >
        历史错题
      </view>
    </view>
    
    <swiper 
      class="swiper" 
      :current="activeTab" 
      @change="handleSwiperChange"
    >
      <!-- 当前错题 -->
      <swiper-item>
        <view v-if="currentWrongQuestions.length === 0" class="empty-state">
          <text>暂无当前错题</text>
        </view>
        <view v-else class="question-container">
          <view class="question-header">
            <text class="question-number">第{{ currentQuestionIndex + 1 }}/{{ currentWrongQuestions.length }}题</text>
          </view>
          <swiper 
            class="question-swiper" 
            :current="currentQuestionIndex" 
            @change="handleQuestionSwiperChange"
            :duration="150"
            :cache-extent="2"
          >
            <swiper-item v-for="item in currentWrongQuestions" :key="item.id">
              <scroll-view scroll-y class="scroll-view">
                <Question
                  v-if="questionDetails[item.id]"
                  :question="questionDetails[item.id]"
                  :showExplanation="true"
                  @select="selectAnswer"
                />
                <view v-else class="loading-question">
                  <text>加载中...</text>
                </view>
              </scroll-view>
            </swiper-item>
          </swiper>
          <view class="action-buttons">
            <button 
              class="nav-btn" 
              :disabled="currentQuestionIndex === 0" 
              @tap="prevQuestion"
            >上一题</button>
            <button 
              class="nav-btn" 
              :disabled="currentQuestionIndex === currentWrongQuestions.length - 1" 
              @tap="nextQuestion"
            >下一题</button>
          </view>
        </view>
      </swiper-item>
      
      <!-- 历史错题 -->
      <swiper-item>
        <view v-if="allWrongQuestions.length === 0" class="empty-state">
          <text>暂无历史错题</text>
        </view>
        <view v-else class="question-container">
          <view class="question-header">
            <text class="question-number">第{{ historyQuestionIndex + 1 }}/{{ allWrongQuestions.length }}题</text>
          </view>
          <swiper 
            class="question-swiper" 
            :current="historyQuestionIndex" 
            @change="handleHistoryQuestionSwiperChange"
            :duration="150"
            :cache-extent="2"
          >
            <swiper-item v-for="item in allWrongQuestions" :key="item.id">
              <scroll-view scroll-y class="scroll-view">
                <Question
                  v-if="questionDetails[item.id]"
                  :question="questionDetails[item.id]"
                  :showExplanation="true"
                  @select="selectAnswer"
                />
                <view v-else class="loading-question">
                  <text>加载中...</text>
                </view>
              </scroll-view>
            </swiper-item>
          </swiper>
          <view class="action-buttons">
            <button 
              class="nav-btn" 
              :disabled="historyQuestionIndex === 0" 
              @tap="prevHistoryQuestion"
            >上一题</button>
            <button 
              class="nav-btn" 
              :disabled="historyQuestionIndex === allWrongQuestions.length - 1" 
              @tap="nextHistoryQuestion"
            >下一题</button>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { getCurrentWrongQuestions, getAllWrongQuestions } from '@/subpkg/exam/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import Question from '@/subpkg/exam/components/Question.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// Tab 相关状态
const activeTab = ref(0)

// 错题数据
const currentWrongQuestions = ref([])
const allWrongQuestions = ref([])

// 滑动题目索引
const currentQuestionIndex = ref(0)
const historyQuestionIndex = ref(0)

// 题目详情缓存
const questionDetails = reactive({})

// 生命周期钩子
onMounted(() => {
  loadWrongQuestions()
})

// 方法
async function loadWrongQuestions() {
  currentWrongQuestions.value = getCurrentWrongQuestions()
  allWrongQuestions.value = getAllWrongQuestions()
  
  // 按答错次数排序
  currentWrongQuestions.value.sort((a, b) => b.w - a.w)
  allWrongQuestions.value.sort((a, b) => b.w - a.w)
  
  // 重置索引
  currentQuestionIndex.value = 0
  historyQuestionIndex.value = 0
  
  // 加载题目详情
  await loadQuestionDetails()
}

async function loadQuestionDetails() {
  const allQuestions = [...currentWrongQuestions.value, ...allWrongQuestions.value]
  
  // 按题目类型分组
  const typesMap = {}
  allQuestions.forEach(q => {
    if (!typesMap[q.t]) {
      typesMap[q.t] = []
    }
    if (!typesMap[q.t].includes(q.id)) {
      typesMap[q.t].push(q.id)
    }
  })
  
  // 加载各类题目
  for (const type in typesMap) {
    try {
      const data = (await import(`@/subpkg/exam/data/${type}.json`)).default
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (typesMap[type].includes(item.id)) {
            questionDetails[item.id] = item
          }
        })
      }
    } catch (e) {
      console.error(`加载${type}类题目失败:`, e)
    }
  }
}

function switchTab(index) {
  activeTab.value = index
}

function handleSwiperChange(e) {
  activeTab.value = e.detail.current
}

function handleQuestionSwiperChange(e) {
  currentQuestionIndex.value = e.detail.current
}

function handleHistoryQuestionSwiperChange(e) {
  historyQuestionIndex.value = e.detail.current
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < currentWrongQuestions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

function prevHistoryQuestion() {
  if (historyQuestionIndex.value > 0) {
    historyQuestionIndex.value--
  }
}

function nextHistoryQuestion() {
  if (historyQuestionIndex.value < allWrongQuestions.value.length - 1) {
    historyQuestionIndex.value++
  }
}

function selectAnswer(data) {
  console.log('选择答案:', data)
}

function navigateToQuestion(item) {
  uni.navigateTo({
    url: `/subpkg/exam/practice/index?type=${item.t}&questionId=${item.id}&source=errSet`
  })
}
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.tabs {
  display: flex;
  height: 40px;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-secondary);
  font-size: 14px;
  position: relative;
}

.tab.active {
  color: var(--text-primary);
  font-weight: bold;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 30%;
    width: 40%;
    height: 2px;
    background-color: var(--primary-color);
  }
}

.swiper {
  height: calc(100vh - 90px);
}

.scroll-view {
  height: 100%;
  padding: 0 10px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: var(--text-secondary);
  font-size: 14px;
}

.question-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.question-header {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid var(--border-color-light);
}

.question-number {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: bold;
}

.question-swiper {
  flex: 1;
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
  padding: 10px;
  border-top: 1px solid var(--border-color-light);
}

.nav-btn {
  background-color: var(--button-background);
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  padding: 7.5px 20px;
  font-size: 14px;
  
  &:disabled {
    opacity: 0.5;
  }
}
</style>
