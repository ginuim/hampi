/**
 * 等级系统集成工具
 * 用于在现有功能中集成等级和成就系统
 */

import { useUserLevelStore } from '@/stores/userLevel'
import { AchievementSystem } from '@/utils/achievementSystem'

export class LevelIntegration {
  /**
   * 在考试完成时调用
   */
  static onExamComplete(result: {
    passed: boolean
    perfect: boolean
    totalQuestions: number
    correctCount: number
  }) {
    const userLevelStore = useUserLevelStore()

    if (result.passed) {
      if (result.perfect) {
        // 完美通过，获得额外经验
        userLevelStore.addExp('exam_perfect', 1, '完美通过考试')
      } else {
        // 普通通过
        const multiplier = result.correctCount / result.totalQuestions
        userLevelStore.addExp('exam_passed', multiplier, '通过考试')
      }
    }

    // 检查成就解锁
    this.checkAchievements()
  }

  /**
   * 在用户每日登录时调用
   */
  static onDailyLogin() {
    const userLevelStore = useUserLevelStore()
    userLevelStore.updateStudyDays()
    userLevelStore.addExp('study_daily', 1, '每日学习')
    this.checkAchievements()
  }

  /**
   * 在文章阅读时调用
   */
  static onArticleRead() {
    const userLevelStore = useUserLevelStore()
    userLevelStore.addExp('article_read', 1, '阅读文章')
    this.checkAchievements()
  }

  /**
   * 在记录QSO时调用
   */
  static onQSORecord() {
    const userLevelStore = useUserLevelStore()
    userLevelStore.addExp('qso_log', 1, '记录通联')
    this.checkAchievements()
  }

  /**
   * 检查并解锁成就
   */
  static checkAchievements() {
    const userLevelStore = useUserLevelStore()
    const stats = userLevelStore.getLevelStats()

    const { unlocked } = AchievementSystem.checkAchievements({
      studyDays: stats.studyDays,
      continuousDays: userLevelStore.levelData.studyDays, // 这里需要从其他地方获取连续天数
      totalExams: stats.totalExams,
      perfectExams: stats.perfectExams,
      currentLevel: stats.currentLevel,
      totalQsos: stats.totalQsos,
      articlesRead: stats.articlesRead,
      unlockedAchievements: userLevelStore.levelData.achievements
    })

    // 解锁新成就
    unlocked.forEach(achievement => {
      userLevelStore.addAchievement(achievement.id, achievement.name)
    })
  }

  
  
  /**
   * 获取等级相关建议
   */
  static getLevelAdvice(): string[] {
    const userLevelStore = useUserLevelStore()
    const currentLevel = userLevelStore.levelData.level
    const progress = userLevelStore.levelProgress

    const advice = []

    if (progress.progress < 0.3) {
      advice.push('继续完成模拟考试来获得更多经验')
      advice.push('每天阅读专业文章也能获得经验值')
    } else if (progress.progress < 0.7) {
      advice.push('你接近升级了！再努力一把')
      advice.push('尝试获得满分来获得额外经验')
    } else {
      advice.push('即将升级！完成一次考试就能升级')
      advice.push('继续保持学习热情')
    }

    // 根据等级给出特定建议
    if (currentLevel === 1) {
      advice.push('熟悉考试题型，为B类考试做准备')
    } else if (currentLevel === 2) {
      advice.push('可以开始尝试更难的考试题目')
    } else if (currentLevel >= 3) {
      advice.push('探索更多高级功能，如QSO记录')
    }

    return advice
  }

  /**
   * 生成等级分享内容
   */
  static generateShareContent(): {
    title: string
    content: string
    imageData?: string
  } {
    const userLevelStore = useUserLevelStore()
    const levelInfo = userLevelStore.currentLevelInfo
    const stats = userLevelStore.getLevelStats()

    return {
      title: `我在HAM派达到了${levelInfo.name}等级！`,
      content: `经过${stats.studyDays}天的学习，我通过了${stats.passedExams}次考试，获得了${stats.achievements}个成就，达到了${levelInfo.name}等级！一起来学习业余无线电知识吧！`,
      imageData: undefined // 这里可以生成分享图片
    }
  }
}

/**
 * 在页面中使用等级系统的示例
 */
export function useLevelFeatures() {
  const userLevelStore = useUserLevelStore()

  return {
    // 获取建议
    getAdvice: () => LevelIntegration.getLevelAdvice(),

    // 生成分享内容
    getShareContent: () => LevelIntegration.generateShareContent()
  }
}