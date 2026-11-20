import { ref } from 'vue'

// 题目类型定义
interface Question {
  id: string
  content: string
  options: string[]
  answer: string
  explanation: string
  shuffledAnswer?: string // 打乱后的答案
  originalOptions?: string[] // 原始选项顺序
  optionMapping?: Record<string, string> // 选项映射关系
  isFavorite: boolean
  userAnswer?: string[] // 用户的答案
  isWrongQuestion?: boolean // 是否是错题
  img?: string // 题目图片
}

// 考试记录类型
interface ExamRecord {
  id: string
  date: string
  duration: number
  totalQuestions: number
  correctCount: number
  wrongQuestions: string[] // 错题ID数组
  type: string // 题库类型 A/B/C
  passed: boolean // 是否通过考试
}

// 考试配置类型
interface ExamConfig {
  questionCount: number
  duration: number // 分钟
  passScore: number
  singleChoiceCount: number
  multipleChoiceCount: number
}

// 错题统计数据结构 - 超紧凑版本
interface WrongQuestionStats {
  id: string    // 题目ID（如 MC2-0001）
  w: number     // 答错次数 wrongCount -> w
  l: string     // 最后答错日期 lastWrongDate -> l (YYYY-MM-DD格式)
  f?: string    // 首次答错日期 firstWrongDate -> f (可选)
}

// 筛选选项接口
interface FilterOptions {
  types?: string[]      // 题库类型 ['A','B','C']
  minW?: number        // 最少答错次数
  maxW?: number        // 最多答错次数
  days?: number        // 最近N天内，undefined表示全部
}

// 考试类型配置，不要随意修改这里的代码，这段代码时对的
export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  'A': {
    questionCount: 40,
    singleChoiceCount: 32,
    multipleChoiceCount: 8,
    duration: 40,
    passScore: 30
  },
  'B': {
    questionCount: 60,
    singleChoiceCount: 45,
    multipleChoiceCount: 15,
    duration: 60,
    passScore: 45
  },
  'C': {
    questionCount: 90,
    singleChoiceCount: 70,
    multipleChoiceCount: 20,
    duration: 90,
    passScore: 70
  }
}

// 打乱数组顺序
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// 保存考试记录
export function saveExamRecord(record: any) {
  try {
    const existingRecords = uni.getStorageSync('examRecords.20250728') || []
    const updatedRecords = [record, ...existingRecords]
    uni.setStorageSync('examRecords.20250728', updatedRecords)
  } catch (error) {
    console.error('保存考试记录失败:', error)
    uni.showToast({
      title: '保存记录失败',
      icon: 'none'
    })
  }
}

// 从本地存储获取收藏列表
export function getFavorites(): string[] {
  const stored = uni.getStorageSync('examFavorites.20250728')
  return stored ? JSON.parse(stored) : []
}

// 切换收藏状态
export function toggleFavorite(id: string): boolean {
  const favorites = getFavorites()
  const index = favorites.indexOf(id)
  
  if (index === -1) {
    favorites.push(id)
  } else {
    favorites.splice(index, 1)
  }
  
  uni.setStorageSync('examFavorites.20250728', JSON.stringify(favorites))
  return index === -1 // 返回新的收藏状态
}

// 保存考试类型到本地存储
export const saveExamType = (type: string): void => {
  uni.setStorageSync('examType', type)
}

// 从本地存储获取考试类型
export const getExamType = (): string => {
  return uni.getStorageSync('examType') || 'A'
}

// 保存练习位置
export function savePracticePosition(examType: string, mode: string, position: number): void {
  try {
    const key = `position_${examType}_${mode}.20250728`
    uni.setStorageSync(key, position)
  } catch (error) {
    console.error('保存练习位置失败:', error)
  }
}

// 获取练习位置
export function getPracticePosition(examType: string, mode: string): number {
  try {
    const key = `position_${examType}_${mode}.20250728`
    return uni.getStorageSync(key) || 0
  } catch (error) {
    console.error('获取练习位置失败:', error)
    return 0
  }
}

// 获取当前错题列表（从最近的考试记录中获取）
export function getCurrentWrongQuestions(): any[] {
  try {
    const records = uni.getStorageSync('examRecords.20250728') || []
    if (records.length === 0) return []
    
    // 获取最新的考试记录
    const latestRecord = records[0]
    if (!latestRecord.wrongQuestions) return []
    
    // 将错题ID转换为错题对象，包含答错次数
    return latestRecord.wrongQuestions.map((wrongQuestion: any) => ({
      id: wrongQuestion.id,
      userAnswer: wrongQuestion.userAnswer,
      optionMapping: wrongQuestion.optionMapping,
      w: 1 // 默认答错1次
    }))
  } catch (error) {
    console.error('获取当前错题失败:', error)
    return []
  }
}

// 获取所有历史错题列表（从所有考试记录中统计）
export function getAllWrongQuestions(): any[] {
  try {
    const records = uni.getStorageSync('examRecords.20250728') || []
    if (records.length === 0) return []
    
    // 统计所有错题的答错次数
    const wrongQuestionsMap = new Map()
    
    records.forEach((record: any) => {
      if (record.wrongQuestions && Array.isArray(record.wrongQuestions)) {
        record.wrongQuestions.forEach((wrongQuestion: any) => {
          const questionId = wrongQuestion.id
          if (wrongQuestionsMap.has(questionId)) {
            const existing = wrongQuestionsMap.get(questionId)
            wrongQuestionsMap.set(questionId, {
              ...existing,
              w: existing.w + 1 // 增加答错次数
            })
          } else {
            wrongQuestionsMap.set(questionId, {
              id: questionId,
              userAnswer: wrongQuestion.userAnswer,
              optionMapping: wrongQuestion.optionMapping,
              w: 1
            })
          }
        })
      }
    })
    
    return Array.from(wrongQuestionsMap.values())
  } catch (error) {
    console.error('获取历史错题失败:', error)
    return []
  }
}

// ========== 新的错题统计功能 ==========

// 获取错题统计数据
export function getWrongQuestionStats(): WrongQuestionStats[] {
  try {
    return uni.getStorageSync('wqStats.20250728') || []
  } catch (error) {
    console.error('读取错题统计失败:', error)
    return []
  }
}

// 添加/更新错题统计
export function addWrongQuestion(questionId: string, examDate: string): void {
  try {
    const key = 'wqStats.20250728'
    const stats: WrongQuestionStats[] = uni.getStorageSync(key) || []
    const existing = stats.find(s => s.id === questionId)
    
    if (existing) {
      existing.w++          // 增加答错次数
      existing.l = examDate // 更新最后答错日期
    } else {
      stats.push({
        id: questionId,
        w: 1,
        l: examDate,
        f: examDate        // 首次答错日期
      })
    }
    
    uni.setStorageSync(key, stats)
  } catch (error) {
    console.error('更新错题统计失败:', error)
  }
}

// 静态导入题库数据
import questionsDataA from '@/subpkg/exam/data/A.json'
import questionsDataB from '@/subpkg/exam/data/B.json'
import questionsDataC from '@/subpkg/exam/data/C.json'

// 获取指定题库类型包含的所有题目ID
export function getQuestionIdsByTypes(types: string[]): string[] {
  try {
    const allIds: string[] = []
    
    // 使用预导入的数据，确保同步获取
    for (const type of types) {
      try {
        let questionIds: string[] = []
        
        switch (type) {
          case 'A':
            questionIds = questionsDataA
            break
          case 'B':
            questionIds = questionsDataB
            break
          case 'C':
            questionIds = questionsDataC
            break
        }
        
        if (Array.isArray(questionIds)) {
          allIds.push(...questionIds)
        }
      } catch (error) {
        console.warn(`无法加载题库${type}:`, error)
      }
    }
    
    // 去重并返回
    return Array.from(new Set(allIds))
  } catch (error) {
    console.error('获取题库题目ID失败:', error)
    return []
  }
}

// 筛选错题 - 支持多维度筛选
export function filterWrongQuestions(opts: FilterOptions = {}): WrongQuestionStats[] {
  const stats = getWrongQuestionStats()
  let filtered = stats
  
  // 按题库类型筛选
  if (opts.types?.length) {
    const qIds = getQuestionIdsByTypes(opts.types) // 获取指定题库的题目ID
    filtered = filtered.filter(s => qIds.includes(s.id))
  }
  
  // 按答错次数筛选
  if (opts.minW) filtered = filtered.filter(s => s.w >= opts.minW)
  if (opts.maxW) filtered = filtered.filter(s => s.w <= opts.maxW)
  
  // 按时间筛选
  if (opts.days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - opts.days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    filtered = filtered.filter(s => s.l >= cutoffStr)
  }
  
  return filtered.sort((a, b) => b.w - a.w) // 按错误次数降序
}

// 数据迁移函数 - 从examRecords迁移到新的统计格式
export function migrateWrongQuestionStats(): WrongQuestionStats[] {
  const newKey = 'wqStats.20250728'
  
  // 检查是否已有新格式数据
  let stats = uni.getStorageSync(newKey)
  if (stats && Array.isArray(stats) && stats.length > 0) {
    console.log('错题统计数据已存在，跳过迁移')
    return stats
  }
  
  console.log('开始错题数据迁移...')
  
  // 从examRecords迁移数据
  const records = uni.getStorageSync('examRecords.20250728') || []
  const map = new Map<string, WrongQuestionStats>()
  
  records.forEach((record: any) => {
    if (!record.wrongQuestions) return
    
    record.wrongQuestions.forEach((wq: any) => {
      const id = wq.id
      const date = record.date?.split('T')[0] || record.date || new Date().toISOString().split('T')[0]
      
      if (map.has(id)) {
        const existing = map.get(id)!
        existing.w++
        existing.l = date // 更新最后答错日期
      } else {
        map.set(id, { 
          id, 
          w: 1, 
          l: date,
          f: date 
        })
      }
    })
  })
  
  const newStats = Array.from(map.values())
  uni.setStorageSync(newKey, newStats)
  console.log(`错题数据迁移完成: ${newStats.length} 个错题`)
  return newStats
}

// 获取增强版历史错题列表 - 使用新的统计数据
export function getEnhancedWrongQuestions(opts: FilterOptions = {}): any[] {
  // 确保数据已迁移并获取最新数据
  const stats = migrateWrongQuestionStats()
  
  // 直接对迁移后的数据进行筛选，而不是重新读取
  let filtered = stats
  
  // 按题库类型筛选
  if (opts.types?.length) {
    const qIds = getQuestionIdsByTypes(opts.types)
    filtered = filtered.filter(s => qIds.includes(s.id))
  }
  
  // 按答错次数筛选
  if (opts.minW) filtered = filtered.filter(s => s.w >= opts.minW)
  if (opts.maxW) filtered = filtered.filter(s => s.w <= opts.maxW)
  
  // 按时间筛选
  if (opts.days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - opts.days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    filtered = filtered.filter(s => s.l >= cutoffStr)
  }
  
  // 按错误次数降序排序并转换为兼容格式
  return filtered
    .sort((a, b) => b.w - a.w)
    .map(stat => ({
      id: stat.id,
      w: stat.w,
      userAnswer: [], // 新格式中不保存具体答案
      optionMapping: {} // 新格式中不保存选项映射
    }))
} 