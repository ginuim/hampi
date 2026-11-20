/**
 * 用户等级系统
 * 基于业余无线电等级制度设计
 */

export interface UserLevel {
  level: number
  name: string
  nameEn: string
  minExp: number
  maxExp: number
  badge: string
  color: string
  description: string
}

export interface UserLevelProgress {
  currentLevel: UserLevel
  nextLevel: UserLevel | null
  currentExp: number
  expToNext: number
  progress: number // 0-1
  totalExp: number
}

export class LevelSystem {
  private static readonly LEVELS: UserLevel[] = [
    {
      level: 1,
      name: '电波探索者',
      nameEn: 'EXPLORER',
      minExp: 0,
      maxExp: 100,
      badge: '📻',
      color: '#94a3b8',
      description: '开始探索无线电世界的奥秘'
    },
    {
      level: 2,
      name: '信号猎手',
      nameEn: 'HUNTER',
      minExp: 100,
      maxExp: 300,
      badge: '📡',
      color: '#60a5fa',
      description: '掌握了追踪和识别信号的能力'
    },
    {
      level: 3,
      name: '频率守护者',
      nameEn: 'GUARDIAN',
      minExp: 300,
      maxExp: 800,
      badge: '🛡️',
      color: '#34d399',
      description: '成为频率秩序的守护者'
    },
    {
      level: 4,
      name: '电波使者',
      nameEn: 'MESSENGER',
      minExp: 800,
      maxExp: 2000,
      badge: '📨',
      color: '#f59e0b',
      description: '传递信息和友谊的电波使者'
    },
    {
      level: 5,
      name: '空中指挥官',
      nameEn: 'COMMANDER',
      minExp: 2000,
      maxExp: 5000,
      badge: '🎖️',
      color: '#ef4444',
      description: '掌握空中通信艺术的指挥官'
    },
    {
      level: 6,
      name: '电波传奇',
      nameEn: 'LEGEND',
      minExp: 5000,
      maxExp: Infinity,
      badge: '👑',
      color: '#a855f7',
      description: '成为无线电领域的传奇人物'
    }
  ]

  static getLevelByExp(exp: number): UserLevel {
    return this.LEVELS.find(level => exp >= level.minExp && exp < level.maxExp) || this.LEVELS[this.LEVELS.length - 1]
  }

  static getLevelByLevel(level: number): UserLevel {
    return this.LEVELS.find(l => l.level === level) || this.LEVELS[0]
  }

  static getLevelProgress(exp: number): UserLevelProgress {
    const currentLevel = this.getLevelByExp(exp)
    const nextLevel = this.LEVELS.find(l => l.level === currentLevel.level + 1) || null

    const currentExp = exp - currentLevel.minExp
    const expNeeded = currentLevel.maxExp - currentLevel.minExp
    const expToNext = nextLevel ? nextLevel.minExp - exp : 0
    const progress = expNeeded > 0 ? Math.min(currentExp / expNeeded, 1) : 1

    return {
      currentLevel,
      nextLevel,
      currentExp: exp - currentLevel.minExp,
      expToNext: Math.max(0, expToNext),
      progress,
      totalExp: exp
    }
  }

  static getAllLevels(): UserLevel[] {
    return [...this.LEVELS]
  }

  static getTotalExpForLevel(targetLevel: number): number {
    const level = this.LEVELS.find(l => l.level === targetLevel)
    return level ? level.minExp : 0
  }
}

export interface ExpAction {
  type: 'exam_passed' | 'exam_perfect' | 'study_daily' | 'continuous_days' | 'qso_log' | 'article_read' | 'achievement'
  exp: number
  description: string
}

export class ExpCalculator {
  private static readonly ACTIONS: Record<string, ExpAction> = {
    exam_passed: {
      type: 'exam_passed',
      exp: 20,
      description: '通过考试'
    },
    exam_perfect: {
      type: 'exam_perfect',
      exp: 50,
      description: '完美通过考试'
    },
    study_daily: {
      type: 'study_daily',
      exp: 10,
      description: '每日学习'
    },
    continuous_days: {
      type: 'continuous_days',
      exp: 5,
      description: '连续学习天数'
    },
    qso_log: {
      type: 'qso_log',
      exp: 15,
      description: '记录通联'
    },
    article_read: {
      type: 'article_read',
      exp: 3,
      description: '阅读文章'
    },
    achievement: {
      type: 'achievement',
      exp: 30,
      description: '获得成就'
    }
  }

  static getExp(action: keyof typeof ExpCalculator.ACTIONS, multiplier: number = 1): number {
    const actionData = this.ACTIONS[action]
    return actionData ? Math.floor(actionData.exp * multiplier) : 0
  }

  static getActionDescription(action: keyof typeof ExpCalculator.ACTIONS): string {
    return this.ACTIONS[action]?.description || ''
  }

  static getAllActions(): ExpAction[] {
    return Object.values(this.ACTIONS)
  }
}