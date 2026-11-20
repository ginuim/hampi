/**
 * 考试结果配置
 * 根据分数段显示不同的文案和特效
 */

export interface ExamResultLevel {
  id: string
  name: string
  minScore: number
  maxScore: number
  color: string
  backgroundColor: string
  textColor: string
  quotes: string[]
  specialEffects: {
    confetti: boolean
    fireworks: boolean
    particles: boolean
    sound?: string
  }
  encouragement: string
}

export const examResultLevels: ExamResultLevel[] = [
  {
    id: 'fail',
    name: '不及格段',
    minScore: 0,
    maxScore: 59,
    color: '#f44336',
    backgroundColor: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
    textColor: '#ffffff',
    quotes: [
      '莫道电磁无声，跬步可越千山',
      '纵有QRN扰频，守得云开见月明',
      '电波未达处，正是修行时',
      '驻波起伏寻常事，调谐终得谐振音',
      '失联非败局，静待电离层开'
    ],
    specialEffects: {
      confetti: false,
      fireworks: false,
      particles: true
    },
    encouragement: '不要气馁，继续学习，下次一定能通过！'
  },
  {
    id: 'pass',
    name: '及格段',
    minScore: 60,
    maxScore: 75,
    color: '#ff9800',
    backgroundColor: 'linear-gradient(135deg, #ffb74d, #ff9800)',
    textColor: '#ffffff',
    quotes: [
      '微瓦聚星河，初通万里遥',
      '振子初展翼，已掠三重天',
      '莫羡DX远，UV亦江湖',
      '法规为基台，操作作天梯',
      '频段虽窄，心向苍穹'
    ],
    specialEffects: {
      confetti: true,
      fireworks: false,
      particles: true
    },
    encouragement: '恭喜通过！继续努力，争取更好成绩！'
  },
  {
    id: 'good',
    name: '良段',
    minScore: 76,
    maxScore: 85,
    color: '#4caf50',
    backgroundColor: 'linear-gradient(135deg, #81c784, #4caf50)',
    textColor: '#ffffff',
    quotes: [
      '短波传心志，皓月照征程',
      '三阶滤波器，九转功乃成',
      '天线指北斗，规章刻于心',
      '莫问传播路，勤修自通天',
      '驻波比渐稳，征途日渐明'
    ],
    specialEffects: {
      confetti: true,
      fireworks: false,
      particles: true
    },
    encouragement: '成绩优良！你对HAM知识掌握得很好！'
  },
  {
    id: 'excellent',
    name: '优段',
    minScore: 86,
    maxScore: 95,
    color: '#2196f3',
    backgroundColor: 'linear-gradient(135deg, #64b5f6, #2196f3)',
    textColor: '#ffffff',
    quotes: [
      '银汉纵贯八万里，规章横陈九百篇',
      '电离层上凌云志，莫尔斯中点江山',
      '频谱为卷电为墨，写就空中锦绣文',
      '月面反射通天路，规章在心任我行',
      '电波越过山海，热爱自有回响'
    ],
    specialEffects: {
      confetti: true,
      fireworks: true,
      particles: true,
      sound: 'celebration'
    },
    encouragement: '优秀！你的HAM技能已达到专业水平！'
  },
  {
    id: 'outstanding',
    name: '拔尖段',
    minScore: 96,
    maxScore: 100,
    color: '#9c27b0',
    backgroundColor: 'linear-gradient(135deg, #ba68c8, #9c27b0)',
    textColor: '#ffffff',
    quotes: [
      '天地为枰频作子，规章作律谱华章',
      '手握星辰电磁力，心纳寰宇频谱图',
      '千般Q简语，万卷电波书',
      '三阶互调浑不怕，九重天外任遨游',
      '电离层上留名处，皆是寒窗苦读时'
    ],
    specialEffects: {
      confetti: true,
      fireworks: true,
      particles: true,
      sound: 'victory'
    },
    encouragement: '卓越！你是真正的HAM大师！'
  }
]

/**
 * 根据分数获取对应的等级配置
 */
export function getExamResultLevel(score: number): ExamResultLevel {
  return examResultLevels.find(level =>
    score >= level.minScore && score <= level.maxScore
  ) || examResultLevels[0]
}

/**
 * 获取随机文案
 */
export function getRandomQuote(level: ExamResultLevel): string {
  const quotes = level.quotes
  return quotes[Math.floor(Math.random() * quotes.length)]
}

/**
 * 计算考试等级
 */
export function calculateExamLevel(correctCount: number, totalCount: number, passScore?: number): {
  score: number  // 正确题数
  level: ExamResultLevel
  quote: string
  percentage: number  // 百分比
} {
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const level = passScore !== undefined && correctCount < passScore
    ? examResultLevels[0]
    : getExamResultLevel(percentage)
  const quote = getRandomQuote(level)

  return {
    score: correctCount,  // 返回正确题数，不是百分比
    level,
    quote,
    percentage
  }
}

/**
 * 格式化考试用时为 xx分xx秒 或 xx秒
 */
export function formatExamDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}秒`
  } else {
    return `${minutes}分${remainingSeconds}秒`
  }
}
