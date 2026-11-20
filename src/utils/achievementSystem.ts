/**
 * 成就系统
 * 与等级系统配合，提供额外的激励机制
 */

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'study' | 'exam' | 'social' | 'milestone' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  expReward: number
  requirements: AchievementRequirement[]
  unlocked: boolean
  unlockedAt?: number
  progress?: AchievementProgress
}

export interface AchievementRequirement {
  type: 'exam_count' | 'exam_perfect' | 'study_days' | 'level_reach' | 'qso_count' | 'article_read' | 'continuous_days'
  value: number
  description: string
}

export interface AchievementProgress {
  current: number
  total: number
  percentage: number
}

export class AchievementSystem {
  private static readonly ACHIEVEMENTS: Achievement[] = [
    // 学习类成就
    {
      id: 'first_study',
      name: '初学者',
      description: '开始你的无线电学习之旅',
      icon: '🎯',
      category: 'study',
      rarity: 'common',
      expReward: 10,
      requirements: [
        { type: 'study_days', value: 1, description: '学习1天' }
      ],
      unlocked: false
    },
    {
      id: 'week_warrior',
      name: '周战士',
      description: '连续一周坚持学习',
      icon: '📅',
      category: 'study',
      rarity: 'common',
      expReward: 30,
      requirements: [
        { type: 'continuous_days', value: 7, description: '连续学习7天' }
      ],
      unlocked: false
    },
    {
      id: 'month_master',
      name: '月度大师',
      description: '连续一个月坚持学习',
      icon: '📆',
      category: 'study',
      rarity: 'rare',
      expReward: 100,
      requirements: [
        { type: 'continuous_days', value: 30, description: '连续学习30天' }
      ],
      unlocked: false
    },
    {
      id: 'knowledge_seeker',
      name: '知识探索者',
      description: '阅读10篇专业文章',
      icon: '📚',
      category: 'study',
      rarity: 'common',
      expReward: 20,
      requirements: [
        { type: 'article_read', value: 10, description: '阅读10篇文章' }
      ],
      unlocked: false
    },

    // 考试类成就
    {
      id: 'first_exam',
      name: '初次尝试',
      description: '完成第一次模拟考试',
      icon: '✏️',
      category: 'exam',
      rarity: 'common',
      expReward: 15,
      requirements: [
        { type: 'exam_count', value: 1, description: '完成1次考试' }
      ],
      unlocked: false
    },
    {
      id: 'exam_rookie',
      name: '考试新秀',
      description: '完成10次模拟考试',
      icon: '📝',
      category: 'exam',
      rarity: 'common',
      expReward: 40,
      requirements: [
        { type: 'exam_count', value: 10, description: '完成10次考试' }
      ],
      unlocked: false
    },
    {
      id: 'perfect_score',
      name: '完美表现',
      description: '获得第一次满分',
      icon: '💯',
      category: 'exam',
      rarity: 'rare',
      expReward: 50,
      requirements: [
        { type: 'exam_perfect', value: 1, description: '获得1次满分' }
      ],
      unlocked: false
    },
    {
      id: 'perfectionist',
      name: '完美主义者',
      description: '累计获得5次满分',
      icon: '🏆',
      category: 'exam',
      rarity: 'epic',
      expReward: 100,
      requirements: [
        { type: 'exam_perfect', value: 5, description: '获得5次满分' }
      ],
      unlocked: false
    },

    // 等级里程碑成就
    {
      id: 'class_b_operator',
      name: 'B类操作员',
      description: '达到B类操作员等级',
      icon: '📡',
      category: 'milestone',
      rarity: 'rare',
      expReward: 80,
      requirements: [
        { type: 'level_reach', value: 3, description: '达到3级' }
      ],
      unlocked: false
    },
    {
      id: 'class_a_operator',
      name: 'A类操作员',
      description: '达到A类操作员等级',
      icon: '🛰️',
      category: 'milestone',
      rarity: 'epic',
      expReward: 150,
      requirements: [
        { type: 'level_reach', value: 4, description: '达到4级' }
      ],
      unlocked: false
    },
    {
      id: 'elite_operator',
      name: '精英操作员',
      description: '达到精英操作员等级',
      icon: '⭐',
      category: 'milestone',
      rarity: 'legendary',
      expReward: 300,
      requirements: [
        { type: 'level_reach', value: 5, description: '达到5级' }
      ],
      unlocked: false
    },
    {
      id: 'master_operator',
      name: '大师级操作员',
      description: '达到大师级操作员等级',
      icon: '👑',
      category: 'milestone',
      rarity: 'legendary',
      expReward: 500,
      requirements: [
        { type: 'level_reach', value: 6, description: '达到6级' }
      ],
      unlocked: false
    },

    // 通联类成就
    {
      id: 'first_qso',
      name: '首次通联',
      description: '记录第一次通联',
      icon: '📻',
      category: 'social',
      rarity: 'common',
      expReward: 25,
      requirements: [
        { type: 'qso_count', value: 1, description: '记录1次通联' }
      ],
      unlocked: false
    },
    {
      id: 'active_operator',
      name: '活跃操作员',
      description: '累计记录10次通联',
      icon: '📶',
      category: 'social',
      rarity: 'rare',
      expReward: 60,
      requirements: [
        { type: 'qso_count', value: 10, description: '记录10次通联' }
      ],
      unlocked: false
    },

    // 特殊成就
    {
      id: 'early_adopter',
      name: '早期使用者',
      description: '在应用早期就开始使用',
      icon: '🌟',
      category: 'special',
      rarity: 'rare',
      expReward: 50,
      requirements: [
        { type: 'study_days', value: 1, description: '早期使用' }
      ],
      unlocked: false
    },
    {
      id: 'persistent',
      name: '坚持不懈',
      description: '连续学习100天',
      icon: '💪',
      category: 'special',
      rarity: 'legendary',
      expReward: 200,
      requirements: [
        { type: 'continuous_days', value: 100, description: '连续学习100天' }
      ],
      unlocked: false
    }
  ]

  static getAllAchievements(): Achievement[] {
    return [...this.ACHIEVEMENTS]
  }

  static getAchievementById(id: string): Achievement | undefined {
    return this.ACHIEVEMENTS.find(a => a.id === id)
  }

  static getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this.ACHIEVEMENTS.filter(a => a.category === category)
  }

  static getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
    return this.ACHIEVEMENTS.filter(a => a.rarity === rarity)
  }

  static checkAchievements(
    userStats: {
      studyDays: number
      continuousDays: number
      totalExams: number
      perfectExams: number
      currentLevel: number
      totalQsos: number
      articlesRead: number
      unlockedAchievements: string[]
    }
  ): { unlocked: Achievement[], progress: Achievement[] } {
    const unlocked: Achievement[] = []
    const progress: Achievement[] = []

    this.ACHIEVEMENTS.forEach(achievement => {
      if (userStats.unlockedAchievements.includes(achievement.id)) {
        return // 已解锁的成就跳过
      }

      const requirement = achievement.requirements[0] // 目前每个成就只有一个需求
      let currentValue = 0
      let isCompleted = false

      switch (requirement.type) {
        case 'study_days':
          currentValue = userStats.studyDays
          isCompleted = currentValue >= requirement.value
          break
        case 'continuous_days':
          currentValue = userStats.continuousDays
          isCompleted = currentValue >= requirement.value
          break
        case 'exam_count':
          currentValue = userStats.totalExams
          isCompleted = currentValue >= requirement.value
          break
        case 'exam_perfect':
          currentValue = userStats.perfectExams
          isCompleted = currentValue >= requirement.value
          break
        case 'level_reach':
          currentValue = userStats.currentLevel
          isCompleted = currentValue >= requirement.value
          break
        case 'qso_count':
          currentValue = userStats.totalQsos
          isCompleted = currentValue >= requirement.value
          break
        case 'article_read':
          currentValue = userStats.articlesRead
          isCompleted = currentValue >= requirement.value
          break
      }

      if (isCompleted) {
        unlocked.push({
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now()
        })
      } else {
        // 计算进度
        const progressData: AchievementProgress = {
          current: currentValue,
          total: requirement.value,
          percentage: Math.min((currentValue / requirement.value) * 100, 100)
        }

        progress.push({
          ...achievement,
          progress: progressData
        })
      }
    })

    return { unlocked, progress }
  }

  static getRarityColor(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common':
        return '#94a3b8'
      case 'rare':
        return '#3b82f6'
      case 'epic':
        return '#a855f7'
      case 'legendary':
        return '#f59e0b'
      default:
        return '#94a3b8'
    }
  }

  static getRarityName(rarity: Achievement['rarity']): string {
    switch (rarity) {
      case 'common':
        return '普通'
      case 'rare':
        return '稀有'
      case 'epic':
        return '史诗'
      case 'legendary':
        return '传说'
      default:
        return '普通'
    }
  }

  static getCategoryName(category: Achievement['category']): string {
    switch (category) {
      case 'study':
        return '学习'
      case 'exam':
        return '考试'
      case 'social':
        return '社交'
      case 'milestone':
        return '里程碑'
      case 'special':
        return '特殊'
      default:
        return '其他'
    }
  }
}