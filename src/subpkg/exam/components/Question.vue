<template>
  <view class="question-wrapper">
    <!-- 仅解析模式：只显示解析内容 -->
    <template v-if="explanationOnly">
      <view class="explanation-only-wrapper">
        <!-- 正确答案显示 -->
        <!-- <view class="correct-answer-display">
          <text class="answer-label">正确答案：</text>
          <text class="answer-text">{{ question.answer }}</text>
        </view> -->
        
        <!-- 用户答案显示（如果有） -->
        <!-- <view v-if="selectedAnswer && selectedAnswer.length > 0" class="user-answer-display">
          <text class="answer-label">您的答案：</text>
          <text class="answer-text">{{ selectedAnswer.join('') }}</text>
        </view> -->
        
        <!-- 如果没有用户答案，显示提示 -->
        <!-- <view v-else-if="!showExplanation" class="no-answer-display">
          <text class="answer-label">您的答案：</text>
          <text class="no-answer-text">未作答</text>
        </view> -->
        
        <!-- 解析内容 -->
        <view v-if="showExplanation" class="explanation">
          <view v-if="isLoadingExplanation" class="explanation-loading">
            <text>加载解析中...</text>
          </view>
          <rich-text v-else-if="explanation" class="explanation-content" :nodes="processedExplanation" />
          <view v-else class="explanation-empty">
            <text>暂无解析</text>
          </view>
          <view class="explanation-footer">
            <text>答案解析由大语言模型生成，仅供参考</text>
          </view>
        </view>
      </view>
    </template>
    
    <!-- 普通模式：显示完整题目 -->
    <template v-else>
      <text class="question-id">#{{ question.id }}</text>
      <rich-text class="question-content" :nodes="processedQuestionContent" />
      <text v-if="question.answer.length > 1" class="multiple-choice-tip">(多选题)</text>
      <text v-if="question.answer.length === 1" class="single-choice-tip">(单选题)</text>
      <view v-if="question.img" class="image-wrapper">
        <view v-if="isDark" class="image-justify">
          <view class="image-mask" :style="{ opacity: maskOpacity }"></view>
          <view class="mask-icon" @tap="adjustMaskOpacity">
            <view class="mask-icon-progress" :style="{ width: `${maskOpacity * 100}%` }"></view>
          </view>
        </view>
        <image mode="widthFix" :src="`https://hampi.oss-cn-hangzhou.aliyuncs.com/exam/img/${question.img}`" />
      </view>
      <view class="options-list">
        <view v-for="(option, index) in shuffledOptions" 
              :key="index"
              :class="[
                'option-item',
                getOptionClass(letters[index])
              ]"
              @tap="handleSelect(letters[index])">
          <text class="option-letter">{{ letters[index] }}.</text>
          <text class="option-text">{{ option }}</text>
        </view>
      </view>
      
      <!-- 手机端内联解析（保持原有行为） -->
      <template v-if="showExplanation">
        <view class="explanation mobile-explanation">
          <text class="explanation-title">答案解析：</text>
          <view v-if="isLoadingExplanation" class="explanation-loading">
            <text>加载解析中...</text>
          </view>
          <rich-text v-else-if="explanation" class="explanation-content" :nodes="processedExplanation" />
          <view v-else class="explanation-empty">
            <text>暂无解析</text>
          </view>
          <view class="explanation-footer">
            <text>答案解析由大语言模型生成，仅供参考</text>
          </view>
        </view>
      </template>
    </template>
  </view>
</template>

<script setup lang="ts">

import { ref, computed, watch } from 'vue'
import { createOptionMapping } from '../utils/paper'
import { useThemeStore } from '@/stores/theme'
import '@/assets/katex.css'
import { loadExplanation, getCachedExplanation } from '@/utils/explanationLoader'
import md from '@/utils/markdown'
import parse from '@rojer/katex-mini'

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
    optionMapping?: Record<string, string>
    isWrongQuestion?: boolean
  }
  selectedAnswer?: string[]
  showExplanation?: boolean
  explanationOnly?: boolean  // 新增：仅显示解析模式
}>()

const emit = defineEmits(['select', 'option-mapping-change'])

const letters = ['A', 'B', 'C', 'D']

// 打乱选项
const shuffledOptions = ref<string[]>([])
const optionMapping = ref<Record<string, string>>({})
const shuffledAnswer = ref<string[]>([])
const explanation = ref<string>('')
const isLoadingExplanation = ref<boolean>(false)

const userAnswer = computed(() => {
  if (!props.selectedAnswer) return []
  
  // 如果是错题回顾（有保存的optionMapping），用户答案已经是基于当时选项的
  if (props.question.optionMapping && Object.keys(props.question.optionMapping).length > 0) {
    return props.selectedAnswer
  }
  
  // 新逻辑：直接使用传入的答案作为显示位置，不进行映射转换
  // 这样用户点击哪个位置就高亮哪个位置
  return props.selectedAnswer
})
// 监听题目变化时重新打乱选项
watch(() => props.question, () => {
  shuffleOptions()
}, { immediate: true })

// 监听showExplanation变化，动态加载explanation
watch(() => props.showExplanation, async (show) => {
  if (show && props.question?.id && !explanation.value) {
    await loadQuestionExplanation()
  }
}, { immediate: true })

// 加载题目解释
async function loadQuestionExplanation() {
  if (!props.question?.id) return
  
  // 先检查缓存
  const cached = getCachedExplanation(props.question.id)
  if (cached) {
    explanation.value = cached
    return
  }
  
  // 如果没有缓存，异步加载
  isLoadingExplanation.value = true
  try {
    explanation.value = await loadExplanation(props.question.id)
  } catch (error) {
    console.error('加载explanation失败:', error)
    explanation.value = '解释加载失败，请稍后重试'
  } finally {
    isLoadingExplanation.value = false
  }
}

// 打乱选项的函数
function shuffleOptions() {
  // 检查题目和选项是否存在
  if (!props.question || !props.question.options || !Array.isArray(props.question.options)) {
    shuffledOptions.value = []
    // 即使在无效情况下，也创建基本的1:1映射，防止选择时出错
    optionMapping.value = {}
    letters.forEach(letter => {
      optionMapping.value[letter] = letter
    })
    shuffledAnswer.value = []
    return
  }
  
  // 保存原始选项
  const originalOptions = [...props.question.options]
  
  // 如果题目已经有optionMapping（错题回顾），使用已有的映射
  if (props.question.optionMapping && Object.keys(props.question.optionMapping).length > 0) {
    // 使用已有的选项映射还原选项顺序
    optionMapping.value = props.question.optionMapping
    
    // 根据映射关系重建shuffledOptions
    const tempShuffledOptions = new Array(originalOptions.length)
    for (const [shuffledIndex, originalIndex] of Object.entries(optionMapping.value)) {
      const shuffledPos = letters.indexOf(shuffledIndex)
      const originalPos = letters.indexOf(originalIndex)
      if (shuffledPos !== -1 && originalPos !== -1 && originalOptions[originalPos]) {
        tempShuffledOptions[shuffledPos] = originalOptions[originalPos]
      }
    }
    shuffledOptions.value = tempShuffledOptions.filter(Boolean)
  } else {
    // 检查是否是错题回顾模式（通过question的isWrongQuestion属性判断）
    if (props.question.isWrongQuestion) {
      // 错题回顾模式且没有optionMapping（旧数据）
      // 不打乱选项，保持原始顺序，创建1:1映射
      console.log(`错题回顾-旧数据格式: ${props.question.id}，保持原始选项顺序`)
      shuffledOptions.value = [...originalOptions]
      
      // 创建1:1映射关系
      optionMapping.value = {}
      letters.forEach((letter, index) => {
        if (index < originalOptions.length) {
          optionMapping.value[letter] = letter
        }
      })
    } else {
      // 正常的打乱逻辑（新题目、练习模式等）
      optionMapping.value = createOptionMapping(originalOptions.length)
      shuffledOptions.value = Object.values(optionMapping.value).map(letter => originalOptions[letters.indexOf(letter)])
      
      // 发送选项映射给父组件
      emit('option-mapping-change', {
        questionId: props.question.id,
        optionMapping: optionMapping.value
      })
    }
  }
  
  // 计算打乱后的正确答案
  if (props.question.answer) {
    const originalAnswers = props.question.answer.split('');
    shuffledAnswer.value = originalAnswers.map(ans => {
      const originalAnswerIndex = letters.indexOf(ans);
      if (originalAnswerIndex === -1) return '';
      return Object.keys(optionMapping.value).find(letter => optionMapping.value[letter] === ans) || '';
    }).filter(Boolean);
  } else {
    shuffledAnswer.value = []
  }
}

function getOptionClass(letter: string): string {
  if (props.showExplanation) {
    if (shuffledAnswer.value.includes(letter)) {
      return 'correct';
    }
    if (userAnswer.value.includes(letter)) {
      return 'wrong';
    }
  }
  if (userAnswer.value.includes(letter)) {
    return 'selected';
  }
  return '';
}

// 处理题目内容中的公式
const processedQuestionContent = computed(() => {
  if (!props.question?.content) {
    return [{ type: 'text', text: '' }]
  }

  return parseTextWithFormula(props.question.content)
})

// 处理解释文本
const processedExplanation = computed(() => {
  if (!explanation.value) {
    return ''
  }

  let explanationText = String(explanation.value)
  
  // 第一步：处理选项映射占位符
  // {{A}} 表示原始位置A，需要找到它现在显示在哪个位置
  explanationText = explanationText.replace(/\{\{([A-D])\}\}/g, (match, letter) => {
    // optionMapping: 显示位置 -> 原始位置
    // 需要找到：哪个显示位置对应这个原始位置
    const displayLetter = Object.keys(optionMapping.value).find(
      key => optionMapping.value[key] === letter
    )
    return `**${displayLetter || letter}**`
  })

  // 第二步：使用 marked 解析 markdown（但不解析KaTeX）
  try {
    // 临时替换公式为占位符，避免被markdown解析器处理
    const formulas: string[] = []
    let tempText = explanationText
    
    // 保存行间公式 \[...\]
    tempText = tempText.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      formulas.push(`display:${formula.trim()}`)
      return `<!--FORMULA${formulas.length - 1}-->`
    })
    
    // 保存行内公式 \(...\)
    tempText = tempText.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
      formulas.push(`inline:${formula.trim()}`)
      return `<!--FORMULA${formulas.length - 1}-->`
    })
    
    // 使用marked解析markdown
    let html = String(md.parse(tempText))
    const explanationTagClasses: Record<string, string> = {
      p: 'explanation-paragraph',
      strong: 'explanation-strong',
      ol: 'explanation-list',
      ul: 'explanation-list',
      li: 'explanation-list-item',
      h3: 'explanation-heading'
    }
    Object.entries(explanationTagClasses).forEach(([tag, className]) => {
      html = html.replace(
        new RegExp(`<${tag}(\\s[^>]*)?>`, 'g'),
        (_match, attributes = '') => `<${tag} class="${className}"${attributes}>`
      )
    })
    
    // 第三步：将占位符替换为katex-mini生成的HTML（带内联样式）
    formulas.forEach((formula, index) => {
      const [type, tex] = formula.split(':')
      try {
        const katexResult = parse(tex, {
          displayMode: type === 'display'
        })
        
        // 将 KaTeX 结果转换为 HTML 字符串
        let katexHtml = ''
        if (Array.isArray(katexResult)) {
          // 将对象数组转换为 HTML 字符串
          katexHtml = convertKatexNodesToHtml(katexResult)
        } else if (typeof katexResult === 'string') {
          katexHtml = katexResult
        } else {
          // 如果是单个对象，也尝试转换
          katexHtml = convertKatexNodesToHtml([katexResult])
        }
        
        html = html.replace(`<!--FORMULA${index}-->`, katexHtml)
      } catch (error) {
        console.error('KaTeX parse error:', error, 'Formula:', tex)
        // 解析失败时保留原始公式
        html = html.replace(`<!--FORMULA${index}-->`, type === 'display' ? `\\[${tex}\\]` : `\\(${tex}\\)`)
      }
    })
    
    return html
  } catch (error) {
    console.error('Explanation parse error:', error)
    return explanationText
  }
})

// 将 KaTeX 节点数组转换为 HTML 字符串
function convertKatexNodesToHtml(nodes: any[]): string {
  return nodes.map(node => {
    if (typeof node === 'string') {
      return node
    }
    
    if (node.type === 'text') {
      return node.text || ''
    }
    
    // 处理带标签的节点
    const tag = node.name || 'span'
    const styles: string[] = []
    const attrs: string[] = []
    
    // 处理现有的 attrs
    if (node.attrs) {
      for (const [key, value] of Object.entries(node.attrs)) {
        if (key === 'class') {
          // 将 class 转换为内联样式
          const classStyles = convertKatexClassToStyle(value as string)
          if (classStyles) {
            styles.push(classStyles)
          }
          // 保留 class 属性用于调试（可选）
          // attrs.push(`class="${value}"`)
        } else if (key === 'style') {
          styles.push(value as string)
        } else {
          attrs.push(`${key}="${value}"`)
        }
      }
    }
    
    // 添加 styleStr（KaTeX 特有的样式字符串）
    if (node.styleStr) {
      styles.push(node.styleStr)
    }
    
    // 合并所有样式
    if (styles.length > 0) {
      const mergedStyle = styles.join(';').replace(/;;+/g, ';')
      attrs.push(`style="${mergedStyle}"`)
    }
    
    const attrsStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
    const children = node.children ? convertKatexNodesToHtml(node.children) : ''
    
    return `<${tag}${attrsStr}>${children}</${tag}>`
  }).join('')
}

// 将 KaTeX class 转换为内联样式
function convertKatexClassToStyle(className: string): string {
  const styles: string[] = []
  const classes = className.split(' ')
  
  for (const cls of classes) {
    switch (cls) {
      case 'katex':
        styles.push('font-family:KaTeX_Main,Times New Roman,serif')
        styles.push('font-size:1em')
        styles.push('text-indent:0')
        break
      case 'katex-html':
        styles.push('display:inline-block')
        break
      case 'base':
        styles.push('position:relative')
        styles.push('display:inline-block')
        break
      case 'strut':
        styles.push('display:inline-block')
        break
      case 'mord':
        // 普通字符
        break
      case 'msupsub':
        styles.push('position:relative')
        break
      case 'vlist-t':
        styles.push('display:inline-table')
        styles.push('table-layout:fixed')
        break
      case 'vlist-r':
        styles.push('display:table-row')
        break
      case 'vlist':
        styles.push('display:table-cell')
        styles.push('vertical-align:bottom')
        styles.push('position:relative')
        break
      case 'pstrut':
        styles.push('display:inline-block')
        break
      case 'sizing':
        // 字体大小调整
        break
      case 'reset-size6':
        styles.push('font-size:1em')
        break
      case 'size3':
        styles.push('font-size:0.7em')
        break
      case 'mtight':
        styles.push('margin:0')
        break
      case 'mbin':
        styles.push('margin-left:0.2222em')
        styles.push('margin-right:0.2222em')
        break
      case 'mopen':
      case 'mclose':
        break
      case 'mrel':
        styles.push('margin-left:0.2778em')
        styles.push('margin-right:0.2778em')
        break
      case 'mspace':
        break
      case 'mfrac':
        styles.push('vertical-align:0.686em')
        break
      case 'frac-line':
        styles.push('border-bottom:1px solid currentColor')
        break
      case 'minner':
        break
      case 'katex-display':
        styles.push('display:block')
        styles.push('text-align:center')
        styles.push('margin:0.5em 0')
        break
    }
  }
  
  return styles.join(';')
}

// 通用的公式解析函数
function parseTextWithFormula(text: string) {
  const nodes: any[] = []
  let lastIndex = 0
  // 匹配 \[...\] 或 \(...\) 格式的公式
  const formulaRegex = /(?<!\\)(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g
  let match

  while ((match = formulaRegex.exec(text)) !== null) {
    // 添加公式前的普通文本
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: text.slice(lastIndex, match.index)
      })
    }

    // 处理公式
    const formula = match[1]
    const isDisplayMode = formula.startsWith('\\[')
    const formulaContent = formula.slice(2, formula.length - 2)

    try {
      const parsed = parse(formulaContent, {
        throwOnError: false,
        displayMode: isDisplayMode
      })
      if (Array.isArray(parsed)) {
        // 给每个公式节点添加样式，确保在移动端正确显示
        const wrappedNodes = parsed.map(node => ({
          ...node,
          styleStr: 'white-space: nowrap; display: inline-block; max-width: 100%; overflow-x: auto;' + (node.styleStr || '')
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
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.slice(lastIndex)
    })
  }

  return nodes
}

// 处理选择答案
function handleSelect(letter: string) {
  // 将打乱后的选项映射回原始选项
  // 如果映射不存在，说明选项没有打乱，直接使用当前字母
  const originalAnswer = optionMapping.value[letter] || letter
  
  // 判断是单选题还是多选题
  const isSingleChoice = props.question.answer.length === 1
  
  if (isSingleChoice) {
    // 单选题逻辑：如果点击已选中的选项则取消选择，否则只选择当前选项
    const isCurrentlySelected = props.selectedAnswer?.includes(letter)
    emit('select', {
      originalAnswer,        // 用于存储的原始答案
      displayAnswer: letter, // 用于显示高亮的位置
      questionId: props.question.id,
      isSingleChoice: true,
      shouldClear: !isCurrentlySelected, // 如果当前未选中，需要清除其他选择
      shouldShowExplanation: !isCurrentlySelected // 单选题选择后立即显示解释
    })
  } else {
    // 多选题逻辑：保持原有逻辑
    const isCurrentlySelected = props.selectedAnswer?.includes(letter)
    emit('select', {
      originalAnswer,        // 用于存储的原始答案
      displayAnswer: letter, // 用于显示高亮的位置
      questionId: props.question.id,
      isSingleChoice: false
    })
  }
}
</script>

<style lang="less" scoped>

.question-wrapper {
  margin-bottom: 15px; // 手机端使用px单位
}

.question-id {
  display: block;
  font-size: 12px; // 手机端使用px单位
  color: var(--text-tertiary);
  margin-bottom: 5px;
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 14px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 16px;
  }
}

.question-content {
  font-size: 16px; // 手机端使用px单位
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
  // 平板端使用px单位，避免rpx放大
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
  }
  
  // PC端也使用px
  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
}

.multiple-choice-tip, .single-choice-tip {
  font-size: 14px; // 手机端使用px单位
  color: var(--text-secondary);
  margin-left: 5px;
  
  // 平板端使用px单位
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    font-size: 18px;
  }
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
  margin: 15px 0; // 手机端使用px单位
  
  // 平板端减少间距
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    margin: 18px 0;
  }
  
  // PC端间距
  @media screen and (min-width: 1025px) {
    margin: 20px 0;
  }
}

.option-item {
  display: flex;
  padding: 10px; // 手机端使用px单位
  margin-bottom: 10px;
  border: 1px solid var(--border-color-light);
  background-color: var(--background-container);
  color: var(--text-primary);
  border-radius: 14px;
  
  // 平板端减少内边距和间距
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 16px;
  }
  
  // PC端间距
  @media screen and (min-width: 1025px) {
    padding: 14px;
    margin-bottom: 14px;
    border-radius: 18px;
  }
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
  margin-right: 10px; // 手机端使用px单位
}

.explanation {
  margin: 15px 0;
  padding: 15px;
  background-color: var(--background-container);
  // border: 1px solid var(--border-color-light);
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
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
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
  
  // rich-text 组件渲染 HTML 的样式
  :deep(.explanation-paragraph) {
    margin: 0.5em 0;
    line-height: 1.6;
  }
  
  :deep(.explanation-strong) {
    font-weight: bold;
    color: var(--primary-color);
  }
  
  :deep(.explanation-list) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  :deep(.explanation-list-item) {
    margin: 0.3em 0;
  }
  
  :deep(.explanation-heading) {
    font-size: 1.1em;
    font-weight: bold;
    margin: 0.8em 0 0.4em;
  }
  
  // KaTeX 公式样式
  :deep(.katex-display) {
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0.5em 0;
  }
  
  :deep(.katex) {
    font-size: 1em;
  }
}

.explanation-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  text-align: center;
  color: var(--text-secondary);
}

.explanation-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  text-align: center;
  color: var(--text-secondary);
}

.explanation-footer {
  width: 100%;
  font-size: 12px;
  margin-top: 10px;

  text {
    color: var(--text-tertiary);
  }
}

/* 仅解析模式样式 */
.explanation-only-wrapper {
  padding: 0;

  // PC端全宽面板适配
  @media screen and (min-width: 1025px) {
    padding: 0 10px;
  }
}

.correct-answer-display,
.user-answer-display {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: var(--background-secondary);
  border-radius: 8px;
}

.correct-answer-display {
  border-left: 2px solid var(--success-color);
}

.user-answer-display {
  border-left: 2px solid var(--error-color);
}

.no-answer-display {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  background-color: var(--background-secondary);
  border-radius: 8px;
  border-left: 2px solid var(--text-tertiary);
}

.no-answer-text {
  font-size: 16px;
  color: var(--text-tertiary);
  font-style: italic;
}

.answer-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: 10px;
  white-space: nowrap;
}

.answer-text {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

/* 手机端内联解析样式 */
.mobile-explanation {
  /* 在PC端隐藏手机端的内联解析 */
  @media screen and (min-width: 768px) {
    display: none;
  }
}
</style>
