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
}

// 考试类型配置，不要随意修改这里的代码，这段代码时对的
export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  'A': {
    questionCount: 30,
    duration: 40,
    passScore: 25
  },
  'B': {
    questionCount: 50,
    duration: 60,
    passScore: 40
  },
  'C': {
    questionCount: 80,
    duration: 90,
    passScore: 60
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
    const existingRecords = uni.getStorageSync('examRecords') || []
    const updatedRecords = [record, ...existingRecords]
    uni.setStorageSync('examRecords', updatedRecords)
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
  const stored = uni.getStorageSync('favorites')
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
  
  uni.setStorageSync('favorites', JSON.stringify(favorites))
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
    const key = `position_${examType}_${mode}`
    uni.setStorageSync(key, position)
  } catch (error) {
    console.error('保存练习位置失败:', error)
  }
}

// 获取练习位置
export function getPracticePosition(examType: string, mode: string): number {
  try {
    const key = `position_${examType}_${mode}`
    return uni.getStorageSync(key) || 0
  } catch (error) {
    console.error('获取练习位置失败:', error)
    return 0
  }
} 