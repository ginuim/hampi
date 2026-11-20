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
          <view v-if="record.wrongQuestions" class="info-item">
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
import CardPanel from '@/components/CardPanel/CardPanel.vue';

const props = defineProps<{
  onBack?: () => void
}>()

const examRecords = ref([])

// 加载错题的完整信息
async function loadWrongQuestions(record: any) {
  try {
    uni.showLoading({ title: '加载题库中' })
    
    // 导入完整题目数据
    const allQuestions = (await import('@/subpkg/exam/data/questions.json')).default
    
    if (Array.isArray(allQuestions)) {
      // 按照wrongQuestions的原始顺序处理错题
      const wrongQuestions = record.wrongQuestions.map(wrongInfo => {
        // 从完整题库中找到对应的题目
        const question = allQuestions.find(q => q.id === wrongInfo.id)
        if (!question) {
          console.warn(`找不到题目 ${wrongInfo.id}`)
          return null
        }

        // --- 以下是核心修复逻辑 ---

        // 1. 标准化userAnswer格式（兼容旧数据）
        let normalizedUserAnswer = []
        if (Array.isArray(wrongInfo.userAnswer)) {
          normalizedUserAnswer = wrongInfo.userAnswer
        } else if (wrongInfo.userAnswer && typeof wrongInfo.userAnswer === 'object') {
          normalizedUserAnswer = Object.values(wrongInfo.userAnswer)
        } else {
          normalizedUserAnswer = wrongInfo.userAnswer ? [wrongInfo.userAnswer] : []
        }
        
        // 2. 将原始用户答案转换为显示答案
        let displayUserAnswer = []
        if (wrongInfo.optionMapping && Object.keys(wrongInfo.optionMapping).length > 0) {
          // 新数据格式：有mapping，转换答案
          displayUserAnswer = normalizedUserAnswer.map((originalAnswer: string) => {
            for (const [displayPos, originalPos] of Object.entries(wrongInfo.optionMapping)) {
              if (originalPos === originalAnswer) {
                return displayPos
              }
            }
            return originalAnswer
          })
        } else {
          // 旧数据格式：无mapping，直接使用
          displayUserAnswer = normalizedUserAnswer
        }

        // 3. 组合最终的题目对象，注意：不修改原始的 question.options
        return {
          ...question, // 使用原始的question对象
          userAnswer: displayUserAnswer, // 附加上处理过的、用于显示的用户答案
          optionMapping: wrongInfo.optionMapping || {}, // 附加上mapping
          isWrongQuestion: true, // 标记为错题
        }
      }).filter(Boolean) // 过滤掉null值
      
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
    const records = uni.getStorageSync('examRecords.20250728') || []
    console.log('records: ', typeof records, records)
    examRecords.value = typeof records === 'string' ? JSON.parse(records) : records
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
  if (!record || !record.wrongQuestions || !Array.isArray(record.wrongQuestions) || record.wrongQuestions?.length === 0) {
    uni.showToast({
      title: '暂无错题记录',
      icon: 'none'
    })
    return
  }
  
  const wrongQuestions = await loadWrongQuestions(record)
  if (wrongQuestions.length > 0) {
    // 将完整的错题数据附加到record上，然后传递给父组件
    const recordWithQuestions = {
      ...record,
      wrongQuestions: wrongQuestions
    }
    emit('view-wrong', recordWithQuestions)
  }
}

const emit = defineEmits(['back', 'view-wrong'])
</script>

<style lang="less" scoped>
.history-container {
  width: 100%;
  padding: 0;
  // background-color: var(--background-primary);

  // 手机端完全自适应 100% 宽度
  @media screen and (max-width: 767px) {
    width: 100%;
    max-width: 100%;
    padding: 0;
    box-sizing: border-box;
  }

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    min-width: 600px;
    max-width: 750px;
    margin: 0 auto;
    padding: 15px;
  }

  // PC端适配，增加宽度
  @media screen and (min-width: 1025px) {
    min-width: 600px;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }

  // 超大屏幕适配
  @media screen and (min-width: 1440px) {
    min-width: 600px;
    max-width: 1000px;
    margin: 0 auto;
    padding: 25px;
  }
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;

  // 手机端优化
  @media screen and (max-width: 767px) {
    gap: 8px;
  }

  // 平板端优化
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    gap: 12px;
  }

  // PC端优化
  @media screen and (min-width: 1025px) {
    gap: 15px;
  }
}

.record-card {
  cursor: pointer;
  width: 100%;

  // 手机端卡片优化
  @media screen and (max-width: 767px) {
    width: 100%;
    box-sizing: border-box;
  }
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

  // 手机端适配
  @media screen and (max-width: 767px) {
    font-size: 15px;
  }
}

.exam-date {
  font-size: 12px;
  margin-left: 15px;
  color: var(--text-secondary);

  // 手机端适配
  @media screen and (max-width: 767px) {
    font-size: 11px;
    margin-left: 10px;
  }
}

.record-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;

  // 手机端优化，防止内容溢出
  @media screen and (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 6px;
  }

  // 平板端优化
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    gap: 10px;
    margin-bottom: 10px;
  }

  // PC端优化
  @media screen and (min-width: 1025px) {
    gap: 12px;
    margin-bottom: 12px;
  }
}

.info-item {
  display: flex;
  align-items: center;
  width: 100%;

  // 手机端优化
  @media screen and (max-width: 767px) {
    flex-wrap: wrap;
    min-width: 0; // 防止文本溢出
  }
}

.label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: 4px;

  // 手机端适配
  @media screen and (max-width: 767px) {
    font-size: 13px;
    margin-right: 3px;
  }
}

.value {
  font-size: 14px;
  color: var(--text-primary);

  // 手机端适配
  @media screen and (max-width: 767px) {
    font-size: 13px;
  }

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