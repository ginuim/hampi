<template>
  <view
    class="achievement-card"
    :class="[`rarity-${achievement.rarity}`, { 'unlocked': achievement.unlocked, 'clickable': clickable }]"
    @tap="handleTap"
  >
    <!-- 卡片背景效果 -->
    <view v-if="achievement.unlocked" class="card-glow"></view>

    <!-- 成就内容 -->
    <view class="card-content">
      <!-- 成就图标 -->
      <view class="achievement-icon">
        <text class="icon-emoji">{{ achievement.icon }}</text>
        <view v-if="achievement.unlocked" class="unlocked-badge">
          <text class="badge-text">✓</text>
        </view>
        <view v-else class="locked-overlay">
          <text class="lock-icon">🔒</text>
        </view>
      </view>

      <!-- 成就信息 -->
      <view class="achievement-info">
        <view class="achievement-header">
          <text class="achievement-name">{{ achievement.name }}</text>
          <view class="rarity-badge" :style="{ '--rarity-color': rarityColor }">
            <text class="rarity-text">{{ rarityName }}</text>
          </view>
        </view>

        <text class="achievement-desc">{{ achievement.description }}</text>

        <!-- 进度条 (未解锁时显示) -->
        <view v-if="!achievement.unlocked && achievement.progress" class="progress-section">
          <view class="progress-info">
            <text class="progress-text">{{ achievement.progress.current }}/{{ achievement.progress.total }}</text>
            <text class="progress-percentage">{{ Math.round(achievement.progress.percentage) }}%</text>
          </view>
          <view class="progress-bar">
            <view
              class="progress-fill"
              :style="{ width: `${achievement.progress.percentage}%`, '--progress-color': rarityColor }"
            ></view>
          </view>
        </view>

        <!-- 奖励信息 -->
        <view class="reward-section">
          <view class="exp-reward">
            <text class="reward-icon">⭐</text>
            <text class="reward-text">+{{ achievement.expReward }} EXP</text>
          </view>
          <view v-if="achievement.unlocked && achievement.unlockedAt" class="unlock-time">
            <text class="time-text">{{ formatTime(achievement.unlockedAt) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 装饰效果 -->
    <view v-if="achievement.unlocked" class="sparkles">
      <view class="sparkle sparkle-1"></view>
      <view class="sparkle sparkle-2"></view>
      <view class="sparkle sparkle-3"></view>
      <view class="sparkle sparkle-4"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AchievementSystem } from '@/utils/achievementSystem'
import type { Achievement } from '@/utils/achievementSystem'

interface Props {
  achievement: Achievement
  clickable?: boolean
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  showProgress: true
})

const emit = defineEmits<{
  tap: [achievement: Achievement]
}>()

const rarityColor = computed(() => {
  return AchievementSystem.getRarityColor(props.achievement.rarity)
})

const rarityName = computed(() => {
  return AchievementSystem.getRarityName(props.achievement.rarity)
})

const handleTap = () => {
  if (props.clickable) {
    emit('tap', props.achievement)
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks}周前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style lang="less" scoped>
.achievement-card {
  position: relative;
  background: var(--background-container);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &.clickable {
    cursor: pointer;
  }

  &:hover.clickable {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  // 不同稀有度的边框效果
  &.rarity-common {
    border: 2px solid #e2e8f0;
  }

  &.rarity-rare {
    border: 2px solid #3b82f6;
  }

  &.rarity-epic {
    border: 2px solid #a855f7;
  }

  &.rarity-legendary {
    border: 2px solid #f59e0b;
  }

  // 解锁状态的特殊效果
  &.unlocked {
    &.rarity-rare {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }

    &.rarity-epic {
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
    }

    &.rarity-legendary {
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
    }
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--rarity-color, #3b82f6) 0%, transparent 70%);
  opacity: 0.1;
  animation: rotate 10s linear infinite;
}

.card-content {
  position: relative;
  display: flex;
  padding: 16px;
  gap: 12px;
  z-index: 1;
}

.achievement-icon {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-secondary);
  border-radius: 12px;
  flex-shrink: 0;

  .icon-emoji {
    font-size: 28px;
    z-index: 2;
  }

  .unlocked-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    background: var(--success-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;

    .badge-text {
      font-size: 12px;
      color: white;
      font-weight: 600;
    }
  }

  .locked-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;

    .lock-icon {
      font-size: 20px;
    }
  }
}

.achievement-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.achievement-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.rarity-badge {
  padding: 2px 8px;
  background: var(--rarity-color, #3b82f6);
  border-radius: 12px;
  flex-shrink: 0;

  .rarity-text {
    font-size: 10px;
    color: white;
    font-weight: 500;
  }
}

.achievement-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-percentage {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
}

.progress-bar {
  height: 4px;
  background: var(--background-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--progress-color, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.reward-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exp-reward {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reward-icon {
  font-size: 14px;
}

.reward-text {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
}

.unlock-time {
  .time-text {
    font-size: 11px;
    color: var(--text-secondary);
  }
}

// 装饰效果
.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--rarity-color, #3b82f6);
  border-radius: 50%;
  opacity: 0;
  animation: sparkle 3s ease-in-out infinite;

  &.sparkle-1 {
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }

  &.sparkle-2 {
    top: 10%;
    right: 15%;
    animation-delay: 0.5s;
  }

  &.sparkle-3 {
    bottom: 15%;
    left: 20%;
    animation-delay: 1s;
  }

  &.sparkle-4 {
    bottom: 20%;
    right: 10%;
    animation-delay: 1.5s;
  }
}

// 动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

// 暗色主题适配
:deep(.dark) {
  .achievement-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover.clickable {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
  }

  .achievement-icon .locked-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>