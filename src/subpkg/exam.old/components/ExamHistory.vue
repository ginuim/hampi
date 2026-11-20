<template>
  <view class="history-container">
    <view v-if="examRecords.length > 0" class="records-list">
      <CardPanel v-for="record in examRecords" 
            :key="record.id" 
            class="record-card"
            @tap="viewWrongQuestions(record)"
      >
        <view class="record-header">
          <text class="exam-type">{{ record.type }}类考试</text>
          <text class="exam-date">{{ formatDate(record.date) }}</text>
        </view>
        
        <view class="record-info">
          <view class="info-item">
            <text class="label">得分：</text>
            <text :class="['value', record.passed ? 'passed' : 'failed']">
              {{ record.correctCount }}/{{ record.totalQuestions }}
            </text>
          </view>
          <view class="info-item">
            <text class="label">用时：</text>
            <text class="value">{{ formatDuration(record.duration) }}</text>
          </view>
          <view class="info-item">
            <text class="label">错题数：</text>
            <text class="value">{{ record.wrongQuestions.length }}</text>
          </view>
          <view class="info-item">
            <text class="label">状态：</text>
            <text :class="['value', record.passed ? 'passed' : 'failed']">
              {{ record.passed ? '通过' : '未通过' }}
            </text>
          </view>
        </view>
      </CardPanel>
    </view>
    
    <CardPanel v-else class="empty-state">
      <text>暂无考试记录</text>
    </CardPanel>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PiButton from '@/components/PiButton.vue'
import CardPanel from '@/components/CardPanel/CardPanel.vue';

const props = defineProps<{
  onBack?: () => void
}>()

const examRecords = ref([])

// 加载错题的完整信息
async function loadWrongQuestions(record: any) {
  try {
    uni.showLoading({ title: '加载题库中' })
    
    let data = []
    const type = record.type
    // 动态导入对应的 json 文件
    if (type === 'A') {
      data = (await import('@/subpkg/exam.old/data/A.json')).default
    } else if (type === 'B') {
      data = (await import('@/subpkg/exam.old/data/B.json')).default
    } else if (type === 'C') {
      data = (await import('@/subpkg/exam.old/data/C.json')).default
    }
    
    if (Array.isArray(data)) {
      // 找出所有错题的完整信息
      const wrongQuestions = data.filter(question => 
        record.wrongQuestions.some(wrong => wrong.id === question.id)
      ).map(question => {
        const wrongInfo = record.wrongQuestions.find(w => w.id === question.id)
        return {
          ...question,
          answer: 'A',
          userAnswer: wrongInfo.userAnswer // 只保留用户的答案
        }
      })
      
      return wrongQuestions
    }
    return []
  } catch (e) {
    console.error('加载错题失败:', e)
    uni.showToast({
      title: '加载题库失败',
      icon: 'none'
    })
    return []
  } finally {
    uni.hideLoading()
  }
}

// 加载考试记录
onMounted(() => {
  try {
    const records = uni.getStorageSync('examRecords') || []
    examRecords.value = records
  } catch (e) {
    console.error('获取考试记录失败:', e)
  }
})

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化考试时长
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 查看错题
async function viewWrongQuestions(record: any) {
  // 确保错题数据完整性
  if (!record || !record.wrongQuestions || !Array.isArray(record.wrongQuestions) || record.wrongQuestions.length === 0) {
    uni.showToast({
      title: '暂无错题记录',
      icon: 'none'
    })
    return
  }
  
  const wrongQuestions = await loadWrongQuestions(record)
  if (wrongQuestions.length > 0) {
    emit('view-wrong', {
      wrongQuestions,
      examType: record.type
    })
  }
}

const emit = defineEmits(['back', 'view-wrong'])
</script>

<style lang="less" scoped>
.history-container {
  padding: 10px;
  // background-color: var(--background-primary);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
}

.record-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 8px;
}

.exam-type {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.exam-date {
  font-size: 12px;
  margin-left: 15px;
  color: var(--text-secondary);
}

.record-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.value {
  font-size: 14px;
  color: var(--text-primary);
  
  &.passed {
    color: var(--success-color);
  }
  
  &.failed {
    color: var(--error-color);
  }
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style> 