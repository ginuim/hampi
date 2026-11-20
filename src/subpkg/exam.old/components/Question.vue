<template>
  <view class="question-wrapper">
    <text class="question-id">#{{ question.id }}</text>
    <text class="question-content">{{ question.content }}</text>
    <view v-if="question.img" class="image-wrapper">
      <view v-if="isDark" class="image-justify">
        <view class="image-mask" :style="{ opacity: maskOpacity }"></view>
        <view class="mask-icon" @tap="adjustMaskOpacity">
          <view class="mask-icon-progress" :style="{ width: `${maskOpacity * 100}%` }"></view>
        </view>
      </view>
      <image mode="widthFix" :src="`https://static-reaidea.oss-cn-beijing.aliyuncs.com/static/hampi/exam/${question.id}.jpg`" />
    </view>
    <view class="options-list">
      <view v-for="(option, index) in shuffledOptions" 
            :key="index"
            :class="[
              'option-item',
              showExplanation && letters[index] === shuffledAnswer ? 'correct' : '',
              showExplanation && userAnswer === letters[index] && userAnswer !== shuffledAnswer ? 'wrong' : '',
              userAnswer === letters[index] ? 'selected' : ''
            ]"
            @tap="handleSelect(letters[index])">
        <text class="option-letter">{{ letters[index] }}.</text>
        <text class="option-text">{{ option }}</text>
      </view>
    </view>
    
    <template v-if="showExplanation">
      <view class="explanation">
        <text class="explanation-title">答案解析：</text>
        <rich-text class="explanation-content" :nodes="processedExplanation" />
        <view class="explanation-footer">
          <text>答案解析由大语言模型生成，仅供参考</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { shuffleArray } from '../utils/examUtils'
import parse from '@rojer/katex-mini'
import '@/assets/katex.css'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 添加遮罩层透明度状态
const maskOpacity = ref(0.5)

// 添加调节透明度的方法
function adjustMaskOpacity() {
  maskOpacity.value = maskOpacity.value >= 0.8 ? 0.2 : maskOpacity.value + 0.2
}

const props = defineProps<{
  question: {
    id: string
    content: string
    options: string[]
    answer: string
    explanation?: string
    img?: string
    isFavorite?: boolean
  }
  selectedAnswer?: string
  showExplanation?: boolean
}>()

const emit = defineEmits(['select'])

const letters = ['A', 'B', 'C', 'D']

// 打乱选项
const shuffledOptions = ref<string[]>([])
const optionMapping = ref<Record<string, string>>({})
const shuffledAnswer = ref('')
const userAnswer = computed(() => {
  return Object.keys(optionMapping.value).find(key => optionMapping.value[key] === props.selectedAnswer) || ''
})
// 监听题目变化时重新打乱选项
watch(() => props.question, () => {
  shuffleOptions()
}, { immediate: true })

// 打乱选项的函数
function shuffleOptions() {
  // 保存原始选项
  const originalOptions = [...props.question.options]
  
  // 打乱选项
  shuffledOptions.value = shuffleArray([...originalOptions])
  
  // 创建选项映射关系（从打乱后的选项到原始选项的映射）
  optionMapping.value = {}
  
  // 建立新旧选项的映射关系
  shuffledOptions.value.forEach((option, index) => {
    const originalIndex = originalOptions.indexOf(option)
    optionMapping.value[letters[index]] = letters[originalIndex]
  })
  
  // 计算打乱后的正确答案
  const originalAnswerIndex = letters.indexOf(props.question.answer)
  const originalAnswerOption = originalOptions[originalAnswerIndex]
  const newAnswerIndex = shuffledOptions.value.indexOf(originalAnswerOption)
  shuffledAnswer.value = letters[newAnswerIndex]
}

// 处理解释文本
const processedExplanation = computed(() => {
  let explanation = String(props.question.e || '暂无解析')
  if (!explanation) {
    return [{ type: 'text', text: '暂无解析' }]
  }

  // 首先处理选项映射
  const map = {}
  Object.keys(optionMapping.value).forEach(key => {
    map[optionMapping.value[key]] = key
  })
  explanation = explanation.replace(/\{\{([A-D])\}\}/g, (match, letter) => {
    return ` ${map[letter] || letter} `
  })
  
  // 将文本分割成普通文本和公式部分
  const nodes: any[] = []
  let lastIndex = 0
  const formulaRegex = /(?<!\\)(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g
  let match

  while ((match = formulaRegex.exec(explanation)) !== null) {
    // 添加公式前的普通文本
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: explanation.slice(lastIndex, match.index)
      })
    }

    // 处理公式
    const formula = match[1]
    const isDisplayMode = formula.startsWith('\\[')
    const formulaContent = formula.slice(2, formula.length - 2)

    try {
      const parsed = parse(formulaContent, {
        throwOnError: true,
        displayMode: isDisplayMode
      })
      if (Array.isArray(parsed)) {
        // 直接给每个公式节点添加 style
        const wrappedNodes = parsed.map(node => ({
          ...node,
          styleStr: 'white-space: nowrap;' + (node.styleStr || '')
        }))
        nodes.push(...wrappedNodes)
      } else {
        nodes.push({
          type: 'text',
          text: formula
        })
      }
    } catch (error) {
      console.error('KaTeX parse error:', error)
      nodes.push({
        type: 'text',
        text: formula
      })
    }

    lastIndex = match.index + match[1].length
  }

  // 添加剩余的文本
  if (lastIndex < explanation.length) {
    nodes.push({
      type: 'text',
      text: explanation.slice(lastIndex)
    })
  }

  return nodes
})

// 处理选择答案
function handleSelect(letter: string) {
  // 将打乱后的选项映射回原始选项
  const originalAnswer = optionMapping.value[letter]
  emit('select', {
    originalAnswer, // 发送原始答案
    questionId: props.question.id
  })
}
</script>

<style lang="less" scoped>

.question-wrapper {
  margin-bottom: 15px;
}

.question-id {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 5px;
}

.question-content {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.image-wrapper {
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
  width: fit-content;
  margin: 15px auto 0;

  .image-justify {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 15px;
    overflow: hidden;

    .mask-icon {
      position: absolute;
      right: 15px;
      top: 15px;
      width: 15px;
      height: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      border: 1px solid var(--background-primary);
      flex-shrink: 0;
      overflow: hidden;
      opacity: 0.5;

      .mask-icon-progress {
        width: 15px;
        height: 15px;
        position: absolute;
        top: 0;
        left: 0;
        background-color: var(--background-primary);
      }
    }

    .mask-circle {
      width: 100%;
      height: 100%;
    }

    .image-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--background-container);
      opacity: 0.5;
      border-radius: 5px;
    }
  }
  
  image {
    display: block;
    max-width: 100%;
    border-radius: 15px;
  }
}

.options-list {
  margin: 15px 0;
}

.option-item {
  display: flex;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid var(--border-color-light);
  background-color: var(--background-container);
  color: var(--text-primary);
  border-radius: 14px;
}

.option-item.correct {
  background-color: var(--success-color);
  border-color: var(--success-color);

  text {
    color: #fff !important;
  }
}

.option-item.wrong {
  background-color: var(--error-color);
  border-color: var(--error-color);

  text {
    color: #fff !important;
  }
}

.selected {
  border-color: var(--primary-color);
}

.option-letter {
  margin-right: 10px;
}

.explanation {
  margin: 15px 0;
  padding: 15px;
  background-color: var(--background-container);
  border: 1px solid var(--border-color-light);
  color: var(--text-primary);
  border-radius: 15px;
  line-height: 1.5;
}

.explanation-title {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.explanation-content {
  display: block;
  overflow-x: auto;

  // .katex-wrapper,
  // .katex-html {
  //   white-space: nowrap;
  //   display: inline-block;
  //   margin: 0 2px;
  // }
  
  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color-light);
    border-radius: 1.5px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.explanation-footer {
  width: 100%;
  font-size: 12px;
  margin-top: 10px;

  text {
    color: var(--text-tertiary);
  }
}
</style> 