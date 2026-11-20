<template>
  <view class="level-progress" :class="[size, { 'compact': compact }]">
    <!-- 当前等级信息 -->
    <view class="current-level">
      <LevelBadge
        :level-info="progress.currentLevel"
        :size="size === 'large' ? 'medium' : 'small'"
        :show-glow="showGlow"
        :clickable="true"
        @tap="showLevelDetail"
      />
      <view class="level-info">
        <text class="level-name">{{ isEnglish ? progress.currentLevel.nameEn : progress.currentLevel.name }}</text>
        <text class="exp-text">{{ progress.currentExp }}/{{ progress.currentLevel.maxExp - progress.currentLevel.minExp }} EXP</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-container">
      <view class="progress-bar" :class="{ 'animated': animated }">
        <view
          class="progress-fill"
          :style="{ width: `${progress.progress * 100}%`, '--progress-color': progress.currentLevel.color }"
        >
          <view v-if="showProgressText && progress.progress > 0.1" class="progress-text">
            {{ Math.round(progress.progress * 100) }}%
          </view>
        </view>
      </view>

      <!-- 下一等级预览 -->
      <view v-if="progress.nextLevel && showNextLevel" class="next-level-preview">
        <text class="next-level-text">
          {{ progress.expToNext }} EXP → {{ isEnglish ? progress.nextLevel.nameEn : progress.nextLevel.name }}
        </text>
      </view>
    </view>

    <!-- 经验值动画 -->
    <view v-if="showExpAnimation && animatingExp.length > 0" class="exp-animations">
      <view
        v-for="anim in animatingExp"
        :key="anim.id"
        class="exp-animation"
        :style="{ '--anim-color': anim.color }"
      >
        +{{ anim.exp }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useUserLevelStore } from '@/stores/userLevel'
import { useThemeStore } from '@/stores/theme'
import LevelBadge from '@/components/LevelBadge/LevelBadge.vue'
import type { UserLevelProgress } from '@/utils/levelSystem'

interface Props {
  progress: UserLevelProgress
  size?: 'small' | 'medium' | 'large'
  compact?: boolean
  showGlow?: boolean
  showProgressText?: boolean
  showNextLevel?: boolean
  showExpAnimation?: boolean
  animated?: boolean
  isEnglish?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  compact: false,
  showGlow: true,
  showProgressText: true,
  showNextLevel: true,
  showExpAnimation: false,
  animated: true,
  isEnglish: false
})

const emit = defineEmits<{
  levelDetailTap: [levelInfo: any]
}>()

const userLevelStore = useUserLevelStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 经验值动画相关
interface ExpAnimation {
  id: string
  exp: number
  color: string
  timestamp: number
}

const animatingExp = ref<ExpAnimation[]>([])

// 显示等级详情
const showLevelDetail = (levelInfo: any) => {
  emit('levelDetailTap', levelInfo)
}

// 添加经验值动画
const addExpAnimation = (exp: number, color?: string) => {
  if (!props.showExpAnimation) return

  const animation: ExpAnimation = {
    id: Date.now().toString() + Math.random(),
    exp,
    color: color || '#10b981',
    timestamp: Date.now()
  }

  animatingExp.value.push(animation)

  // 3秒后移除动画
  setTimeout(() => {
    const index = animatingExp.value.findIndex(a => a.id === animation.id)
    if (index > -1) {
      animatingExp.value.splice(index, 1)
    }
  }, 3000)
}

// 监听等级变化，播放升级动画
const showLevelUpAnimation = () => {
  // 可以在这里添加升级特效
  uni.vibrateShort()

  // 添加特殊的经验值动画
  addExpAnimation(0, '#f59e0b') // 升级用橙色
}

// 暴露方法给父组件
defineExpose({
  addExpAnimation,
  showLevelUpAnimation
})
</script>

<style lang="less" scoped>
.level-progress {
  width: 100%;
  padding: 16px;
  background: var(--background-container);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &.small {
    padding: 12px;
    border-radius: 8px;

    .level-info .level-name {
      font-size: 14px;
    }

    .level-info .exp-text {
      font-size: 11px;
    }
  }

  &.large {
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    .level-info .level-name {
      font-size: 18px;
    }

    .level-info .exp-text {
      font-size: 14px;
    }
  }

  &.compact {
    padding: 12px 16px;

    .current-level {
      margin-bottom: 8px;
    }
  }
}

.current-level {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .level-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .level-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .exp-text {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: var(--background-secondary);
  border-radius: 4px;
  overflow: hidden;

  &.small {
    height: 6px;
  }

  &.large {
    height: 12px;
  }

  &.animated {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }
  }
}

.progress-fill {
  position: relative;
  height: 100%;
  // background: linear-gradient(90deg, var(--progress-color), fade(var(--progress-color), 80%));
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  // box-shadow: 0 0 8px fade(var(--progress-color), 30%);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: progress-shine 2s infinite;
  }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.next-level-preview {
  text-align: right;

  .next-level-text {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.exp-animations {
  position: relative;
  height: 40px;
  pointer-events: none;
}

.exp-animation {
  position: absolute;
  bottom: 0;
  right: 20px;
  padding: 4px 8px;
  background: var(--anim-color);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 16px;
  // box-shadow: 0 2px 8px fade(var(--anim-color), 40%);
  animation: float-up 3s ease-out forwards;
  z-index: 10;
}

// 动画定义
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(0.8);
    opacity: 0;
  }
  20% {
    transform: translateY(-10px) scale(1);
    opacity: 1;
  }
  80% {
    transform: translateY(-30px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(0.8);
    opacity: 0;
  }
}

// 暗色主题适配
:deep(.dark) {
  .level-progress {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .progress-bar {
    background: var(--background-hover);
  }

  .exp-animation {
    // box-shadow: 0 2px 8px fade(var(--anim-color), 60%);
  }
}
</style>