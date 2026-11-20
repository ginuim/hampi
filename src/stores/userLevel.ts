import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LevelSystem, ExpCalculator, UserLevel, UserLevelProgress, ExpAction } from '@/utils/levelSystem'

export interface UserLevelData {
  totalExp: number
  level: number
  studyDays: number
  lastStudyDate: string
  totalExams: number
  passedExams: number
  perfectExams: number
  totalQsos: number
  articlesRead: number
  achievements: string[]
  levelHistory: LevelUpRecord[]
  notifications: LevelNotification[]
}

export interface LevelUpRecord {
  fromLevel: number
  toLevel: number
  timestamp: number
  reason: string
}

export interface LevelNotification {
  id: string
  type: 'level_up' | 'achievement' | 'exp_gain'
  title: string
  message: string
  exp?: number
  timestamp: number
  read: boolean
}

export const useUserLevelStore = defineStore('userLevel', () => {
  const levelData = ref<UserLevelData>({
    totalExp: 0,
    level: 1,
    studyDays: 0,
    lastStudyDate: '',
    totalExams: 0,
    passedExams: 0,
    perfectExams: 0,
    totalQsos: 0,
    articlesRead: 0,
    achievements: [],
    levelHistory: [],
    notifications: []
  })

  // 加载用户等级数据
  const loadLevelData = () => {
    try {
      const stored = uni.getStorageSync('userLevelData')
      if (stored) {
        levelData.value = { ...levelData.value, ...stored }
        // 确保等级和经验值同步
        const currentLevel = LevelSystem.getLevelByExp(levelData.value.totalExp)
        if (currentLevel.level !== levelData.value.level) {
          levelData.value.level = currentLevel.level
        }
      }
    } catch (e) {
      console.error('加载等级数据失败:', e)
    }
  }

  // 保存等级数据
  const saveLevelData = () => {
    try {
      uni.setStorageSync('userLevelData', levelData.value)
    } catch (e) {
      console.error('保存等级数据失败:', e)
    }
  }

  // 计算的属性
  const currentLevelInfo = computed(() => {
    return LevelSystem.getLevelByLevel(levelData.value.level)
  })

  const levelProgress = computed(() => {
    return LevelSystem.getLevelProgress(levelData.value.totalExp)
  })

  const hasNewNotifications = computed(() => {
    return levelData.value.notifications.some(n => !n.read)
  })

  const unreadNotifications = computed(() => {
    return levelData.value.notifications.filter(n => !n.read)
  })

  // 增加经验值
  const addExp = (action: keyof typeof ExpCalculator.ACTIONS, multiplier: number = 1, reason?: string) => {
    const exp = ExpCalculator.getExp(action, multiplier)
    const oldLevel = levelData.value.level
    const oldExp = levelData.value.totalExp

    levelData.value.totalExp += exp
    const newLevel = LevelSystem.getLevelByExp(levelData.value.totalExp)
    levelData.value.level = newLevel.level

    // 添加经验获得通知
    const notification: LevelNotification = {
      id: Date.now().toString(),
      type: 'exp_gain',
      title: '经验值获得',
      message: `${ExpCalculator.getActionDescription(action)} +${exp} 经验`,
      exp,
      timestamp: Date.now(),
      read: false
    }
    levelData.value.notifications.unshift(notification)

    // 检查是否升级
    if (newLevel.level > oldLevel) {
      const levelUpRecord: LevelUpRecord = {
        fromLevel: oldLevel,
        toLevel: newLevel.level,
        timestamp: Date.now(),
        reason: reason || '经验积累'
      }
      levelData.value.levelHistory.push(levelUpRecord)

      // 添加升级通知
      const levelUpNotification: LevelNotification = {
        id: (Date.now() + 1).toString(),
        type: 'level_up',
        title: '恭喜升级！',
        message: `您已升级到 ${newLevel.name}！`,
        timestamp: Date.now(),
        read: false
      }
      levelData.value.notifications.unshift(levelUpNotification)
    }

    // 更新统计数据
    updateStats(action)

    saveLevelData()

    return { exp, levelUp: newLevel.level > oldLevel, newLevel }
  }

  // 更新统计数据
  const updateStats = (action: keyof typeof ExpCalculator.ACTIONS) => {
    switch (action) {
      case 'exam_passed':
        levelData.value.totalExams++
        levelData.value.passedExams++
        break
      case 'exam_perfect':
        levelData.value.totalExams++
        levelData.value.passedExams++
        levelData.value.perfectExams++
        break
      case 'study_daily':
        updateStudyDays()
        break
      case 'qso_log':
        levelData.value.totalQsos++
        break
      case 'article_read':
        levelData.value.articlesRead++
        break
      case 'achievement':
        // 成就已经在其他地方处理
        break
    }
  }

  // 更新学习天数
  const updateStudyDays = () => {
    const today = new Date().toISOString().split('T')[0]

    if (levelData.value.lastStudyDate !== today) {
      levelData.value.lastStudyDate = today
      levelData.value.studyDays++

      // 连续学习奖励
      if (levelData.value.studyDays > 1) {
        const bonusMultiplier = Math.min(levelData.value.studyDays * 0.1, 2) // 最多2倍
        addExp('continuous_days', bonusMultiplier, `连续学习${levelData.value.studyDays}天`)
      }
    }
  }

  // 标记通知为已读
  const markNotificationRead = (notificationId: string) => {
    const notification = levelData.value.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      saveLevelData()
    }
  }

  // 标记所有通知为已读
  const markAllNotificationsRead = () => {
    levelData.value.notifications.forEach(n => n.read = true)
    saveLevelData()
  }

  // 清除过期通知
  const cleanOldNotifications = (daysToKeep: number = 7) => {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    levelData.value.notifications = levelData.value.notifications.filter(n => n.timestamp > cutoffTime)
    saveLevelData()
  }

  // 添加成就
  const addAchievement = (achievementId: string, achievementName: string) => {
    if (!levelData.value.achievements.includes(achievementId)) {
      levelData.value.achievements.push(achievementId)

      const notification: LevelNotification = {
        id: Date.now().toString(),
        type: 'achievement',
        title: '获得成就！',
        message: achievementName,
        timestamp: Date.now(),
        read: false
      }
      levelData.value.notifications.unshift(notification)

      addExp('achievement', 1, achievementName)
    }
  }

  
  // 获取等级统计
  const getLevelStats = () => {
    return {
      currentLevel: levelData.value.level,
      totalExp: levelData.value.totalExp,
      studyDays: levelData.value.studyDays,
      totalExams: levelData.value.totalExams,
      passedExams: levelData.value.passedExams,
      perfectExams: levelData.value.perfectExams,
      passRate: levelData.value.totalExams > 0
        ? (levelData.value.passedExams / levelData.value.totalExams * 100).toFixed(1)
        : '0',
      totalQsos: levelData.value.totalQsos,
      articlesRead: levelData.value.articlesRead,
      achievements: levelData.value.achievements.length,
      levelUpCount: levelData.value.levelHistory.length
    }
  }

  // 初始化
  loadLevelData()

  return {
    levelData,
    currentLevelInfo,
    levelProgress,
    hasNewNotifications,
    unreadNotifications,
    addExp,
    updateStudyDays,
    markNotificationRead,
    markAllNotificationsRead,
    cleanOldNotifications,
    addAchievement,
    getLevelStats,
    saveLevelData
  }
})