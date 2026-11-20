<template>
  <view class="level-page">
    <NavBar title="我的等级" :showBack="true" />

    <!-- 等级概览卡片 -->
    <view class="level-overview">
      <view class="overview-header">
        <LevelBadge
          :level-info="userLevelStore.currentLevelInfo"
          size="large"
          :show-glow="true"
          :show-decorations="true"
        />
        <view class="overview-stats">
          <text class="welcome-text">{{ getWelcomeMessage() }}</text>
          <text class="level-description">{{ userLevelStore.currentLevelInfo.description }}</text>
        </view>
      </view>

      <LevelProgress
        :progress="userLevelStore.levelProgress"
        size="large"
        :show-exp-animation="true"
        :animated="true"
        ref="levelProgressRef"
        @level-detail-tap="showLevelDetailModal"
      />
    </view>

    <!-- 统计数据 -->
    <view class="stats-section">
      <view class="section-title">
        <text class="title">📊 学习统计</text>
        <text class="subtitle">见证你的成长历程</text>
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">{{ stats.totalExams }}</text>
          <text class="stat-label">总考试次数</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.passRate }}%</text>
          <text class="stat-label">通过率</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.studyDays }}</text>
          <text class="stat-label">学习天数</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.achievements }}</text>
          <text class="stat-label">获得成就</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.totalQsos }}</text>
          <text class="stat-label">通联记录</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.levelUpCount }}</text>
          <text class="stat-label">升级次数</text>
        </view>
      </view>
    </view>

    <!-- 获得经验的方法 -->
    <view class="exp-methods-section">
      <view class="section-title">
        <text class="title">🚀 获得经验</text>
        <text class="subtitle">多种方式快速升级</text>
      </view>
      <view class="exp-methods">
        <view
          v-for="method in expMethods"
          :key="method.type"
          class="exp-method-item"
        >
          <view class="method-info">
            <text class="method-name">{{ method.name }}</text>
            <text class="method-desc">{{ method.description }}</text>
          </view>
          <view class="method-exp">
            <text class="exp-value">+{{ method.exp }}</text>
            <text class="exp-label">EXP</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 升级历史 -->
    <view v-if="userLevelStore.levelData.levelHistory.length > 0" class="history-section">
      <view class="section-title">
        <text class="title">📈 升级历史</text>
        <text class="subtitle">回顾你的成长轨迹</text>
      </view>
      <view class="history-list">
        <view
          v-for="record in userLevelStore.levelData.levelHistory.slice().reverse()"
          :key="record.timestamp"
          class="history-item"
        >
          <view class="history-info">
            <text class="history-level">
              {{ getLevelName(record.fromLevel) }} → {{ getLevelName(record.toLevel) }}
            </text>
            <text class="history-time">{{ formatTime(record.timestamp) }}</text>
          </view>
          <text class="history-reason">{{ record.reason }}</text>
        </view>
      </view>
    </view>

    <!-- 等级详情弹窗 -->
    <view v-if="showModal" class="level-modal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">等级详情</text>
          <button class="close-btn" @tap="closeModal">×</button>
        </view>
        <view class="modal-body">
          <LevelBadge
            :level-info="selectedLevel"
            size="large"
            :show-decorations="true"
          />
          <view class="level-details">
            <text class="level-desc">{{ selectedLevel.description }}</text>
            <view class="exp-requirement">
              <text class="exp-text">需要经验: {{ selectedLevel.minExp }} EXP</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserLevelStore } from '@/stores/userLevel'
import { useThemeStore } from '@/stores/theme'
import { LevelSystem, ExpCalculator } from '@/utils/levelSystem'
import NavBar from '@/components/NavBar/NavBar.vue'
import LevelBadge from '@/components/LevelBadge/LevelBadge.vue'
import LevelProgress from '@/components/LevelProgress/LevelProgress.vue'

const userLevelStore = useUserLevelStore()
const themeStore = useThemeStore()
const levelProgressRef = ref()

const isDark = computed(() => themeStore.isDark)
const stats = computed(() => userLevelStore.getLevelStats())

// 弹窗控制
const showModal = ref(false)
const selectedLevel = ref(LevelSystem.getLevelByLevel(1))

// 欢迎消息
const getWelcomeMessage = () => {
  const hour = new Date().getHours()
  let greeting = '早上好'

  if (hour >= 12 && hour < 18) {
    greeting = '下午好'
  } else if (hour >= 18) {
    greeting = '晚上好'
  }

  const levelName = userLevelStore.currentLevelInfo.name
  return `${greeting}，${levelName}！`
}

// 获得经验的方法
const expMethods = computed(() => {
  return [
    {
      type: 'exam_passed',
      name: '通过考试',
      description: '成功通过任何等级考试',
      exp: ExpCalculator.getExp('exam_passed')
    },
    {
      type: 'exam_perfect',
      name: '完美通过',
      description: '考试获得满分',
      exp: ExpCalculator.getExp('exam_perfect')
    },
    {
      type: 'study_daily',
      name: '每日学习',
      description: '每天打开应用学习',
      exp: ExpCalculator.getExp('study_daily')
    },
    {
      type: 'continuous_days',
      name: '连续学习',
      description: '保持连续学习记录',
      exp: ExpCalculator.getExp('continuous_days')
    },
    {
      type: 'qso_log',
      name: '记录通联',
      description: '记录一次通联活动',
      exp: ExpCalculator.getExp('qso_log')
    },
    {
      type: 'article_read',
      name: '阅读文章',
      description: '学习专业知识文章',
      exp: ExpCalculator.getExp('article_read')
    },
    {
      type: 'achievement',
      name: '获得成就',
      description: '解锁各种成就徽章',
      exp: ExpCalculator.getExp('achievement')
    }
  ]
})

// 显示等级详情弹窗
const showLevelDetailModal = (levelInfo: any) => {
  selectedLevel.value = levelInfo
  showModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
}

// 获取等级名称
const getLevelName = (level: number) => {
  return LevelSystem.getLevelByLevel(level).name
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 页面加载时更新学习天数
onMounted(() => {
  userLevelStore.updateStudyDays()
})
</script>

<style lang="less" scoped>
.level-page {
  min-height: 100vh;
  background: var(--background-primary);
  padding-bottom: 20px;
}

.level-overview {
  margin: 16px;
  padding: 20px;
  background: var(--background-container);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  .overview-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .overview-stats {
      flex: 1;

      .welcome-text {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .level-description {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
}

.section-title {
  margin: 24px 16px 12px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.stats-section {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 0 16px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      background: var(--background-container);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--text-secondary);
        text-align: center;
      }
    }
  }
}

.exp-methods-section {
  .exp-methods {
    margin: 0 16px;

    .exp-method-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--background-container);
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .method-info {
        flex: 1;

        .method-name {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .method-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }

      .method-exp {
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .exp-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--success-color);
        }

        .exp-label {
          font-size: 11px;
          color: var(--text-secondary);
        }
      }
    }
  }
}

.history-section {
  .history-list {
    margin: 0 16px;

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--background-container);
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .history-info {
        display: flex;
        flex-direction: column;

        .history-level {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .history-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }

      .history-reason {
        font-size: 13px;
        color: var(--text-secondary);
        text-align: right;
      }
    }
  }
}

// 弹窗样式
.level-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--background-container);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-color-light);

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--background-hover);
    }
  }
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .level-details {
    width: 100%;

    .level-desc {
      font-size: 14px;
      color: var(--text-secondary);
      text-align: center;
      margin-bottom: 16px;
    }

    .exp-requirement {
      text-align: center;
      padding-top: 12px;
      border-top: 1px solid var(--border-color-light);

      .exp-text {
        font-size: 14px;
        color: var(--primary-color);
        font-weight: 500;
      }
    }
  }
}

// 暗色主题适配
:deep(.dark) {
  .level-overview,
  .stat-item,
  .exp-method-item,
  .history-item,
  .modal-content {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>