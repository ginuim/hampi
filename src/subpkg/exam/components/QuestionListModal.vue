<template>
  <view class="question-list-overlay" v-if="isVisible" @tap="closeModal">
    <view class="question-list-container" @tap.stop>
      <view class="question-list-header">
        <text>题目列表</text>
        <view class="close-icon" @tap="closeModal">×</view>
      </view>
      <scroll-view scroll-y class="question-list">
        <view class="question-list-inner">
          <view 
            v-for="(_, index) in questions" 
            :key="index"
            :class="[
              'question-item', 
              currentIndex === index ? 'current-question' : '',
              mode === 'exam' && !answeredQuestions[index]?.length ? 'unanswered-question' : '',
              mode === 'practice' && favoriteQuestions.includes(questions[index].id) ? 'favorite-question' : ''
            ]"
            @tap="selectQuestion(index)"
          >
            <text>{{ index + 1 }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  questions: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  mode: {
    type: String,
    default: 'practice' // 'practice' 或 'exam'
  },
  // 对于考试模式，这是已回答的题目
  answeredQuestions: {
    type: Array,
    default: () => []
  },
  // 对于练习模式，这是收藏的题目ID
  favoriteQuestions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

function closeModal() {
  emit('close')
}

function selectQuestion(index) {
  emit('select', index)
}
</script>

<style lang="less" scoped>
.question-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.question-list-container {
  width: 80%;
  max-width: 300px;
  background-color: var(--background-container);
  border-radius: 8px;
  overflow: hidden;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.question-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color-light);
}

.close-icon {
  font-size: 20px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.question-list {
  max-height: 60vh;
}

.question-list-inner {
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 5px;
  width: 100%;
  box-sizing: border-box;
}

.question-item {
  height: 35px;
  border-radius: 20px;
  background-color: var(--background-primary);
  border: 1px solid var(--border-color-light);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.question-item text {
  font-size: 14px;
  color: var(--text-primary);
}

.current-question {
  opacity: 1 !important;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.current-question text {
  color: #fff;
}

.unanswered-question {
  opacity: 0.6;
}

.favorite-question {
  background-color: var(--warning-color);
  border-color: var(--warning-color);
}

.favorite-question text {
  color: #fff;
}
</style>
