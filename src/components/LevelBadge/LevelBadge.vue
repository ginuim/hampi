<template>
  <view
    class="level-badge"
    :class="[`level-${levelInfo.level}`, size, { 'clickable': clickable }]"
    :style="{ '--level-color': levelInfo.color }"
    @tap="handleTap"
  >
    <view class="badge-container">
      <view class="badge-icon">
        <text class="emoji">{{ levelInfo.badge }}</text>
        <view v-if="showGlow && !isDark" class="glow-effect"></view>
      </view>

      <view v-if="showText" class="badge-info">
        <text class="level-name">{{ isEnglish ? levelInfo.nameEn : levelInfo.name }}</text>
        <text v-if="showLevel" class="level-number">Lv.{{ levelInfo.level }}</text>
      </view>
    </view>

    <!-- 装饰元素 -->
    <view v-if="showDecorations" class="decorations">
      <view class="decoration decoration-1"></view>
      <view class="decoration decoration-2"></view>
      <view class="decoration decoration-3"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { UserLevel } from '@/utils/levelSystem'

interface Props {
  levelInfo: UserLevel
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  showLevel?: boolean
  showGlow?: boolean
  showDecorations?: boolean
  clickable?: boolean
  isEnglish?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showText: true,
  showLevel: true,
  showGlow: true,
  showDecorations: false,
  clickable: false,
  isEnglish: false
})

const emit = defineEmits<{
  tap: [levelInfo: UserLevel]
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const handleTap = () => {
  if (props.clickable) {
    emit('tap', props.levelInfo)
  }
}
</script>

<style lang="less" scoped>
.level-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.small {
    .badge-container {
      padding: 4px 8px;
      gap: 6px;
    }

    .badge-icon .emoji {
      font-size: 16px;
    }

    .level-name {
      font-size: 10px;
    }

    .level-number {
      font-size: 9px;
    }
  }

  &.medium {
    .badge-container {
      padding: 8px 12px;
      gap: 8px;
    }

    .badge-icon .emoji {
      font-size: 20px;
    }

    .level-name {
      font-size: 12px;
    }

    .level-number {
      font-size: 11px;
    }
  }

  &.large {
    .badge-container {
      padding: 12px 16px;
      gap: 10px;
    }

    .badge-icon .emoji {
      font-size: 24px;
    }

    .level-name {
      font-size: 14px;
    }

    .level-number {
      font-size: 13px;
    }
  }

  &.clickable {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

.badge-container {
  display: flex;
  align-items: center;
  // background: linear-gradient(135deg, var(--level-color), fade(var(--level-color), 70%));
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.badge-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .emoji {
    z-index: 2;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }

  .glow-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: glow 2s ease-in-out infinite alternate;
    z-index: 1;
  }
}

.badge-info {
  display: flex;
  flex-direction: column;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  .level-name {
    line-height: 1.2;
    letter-spacing: 0.5px;
  }

  .level-number {
    opacity: 0.9;
    line-height: 1;
    font-weight: 500;
  }
}

// 不同等级的特殊样式
.level-1 {
  --level-color: #94a3b8; // 灰色 - 新手

  .badge-container {
    background: linear-gradient(135deg, #94a3b8, #64748b);
  }
}

.level-2 {
  --level-color: #60a5fa; // 蓝色 - 见习

  .badge-container {
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
  }
}

.level-3 {
  --level-color: #34d399; // 绿色 - B类

  .badge-container {
    background: linear-gradient(135deg, #34d399, #10b981);
  }
}

.level-4 {
  --level-color: #f59e0b; // 橙色 - A类

  .badge-container {
    background: linear-gradient(135deg, #f59e0b, #f97316);

    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #fbbf24, #f59e0b, #f97316, #ea580c);
      border-radius: 22px;
      z-index: 0;
      opacity: 0.7;
      animation: shimmer 3s ease-in-out infinite;
    }
  }
}

.level-5 {
  --level-color: #ef4444; // 红色 - 精英

  .badge-container {
    background: linear-gradient(135deg, #ef4444, #dc2626);

    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #f87171, #ef4444, #dc2626, #b91c1c);
      border-radius: 22px;
      z-index: 0;
      opacity: 0.8;
      animation: shimmer 2s ease-in-out infinite;
    }
  }
}

.level-6 {
  --level-color: #a855f7; // 紫色 - 大师

  .badge-container {
    background: linear-gradient(135deg, #a855f7, #9333ea);

    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #c084fc, #a855f7, #9333ea, #7c3aed);
      border-radius: 22px;
      z-index: 0;
      opacity: 0.9;
      animation: shimmer 1.5s ease-in-out infinite;
    }
  }
}

// 装饰元素
.decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 20px;
}

.decoration {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;

  &.decoration-1 {
    top: -10%;
    right: -5%;
    width: 30%;
    height: 30%;
    animation: float 3s ease-in-out infinite;
  }

  &.decoration-2 {
    bottom: -15%;
    left: -10%;
    width: 25%;
    height: 25%;
    animation: float 4s ease-in-out infinite reverse;
  }

  &.decoration-3 {
    top: 50%;
    right: -8%;
    width: 20%;
    height: 20%;
    animation: float 2.5s ease-in-out infinite;
  }
}

// 动画
@keyframes glow {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.6;
  }
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-5px) rotate(180deg);
  }
}

// 暗色主题适配
:deep(.dark) {
  .level-badge {
    .badge-container {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .badge-icon .emoji {
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
    }

    .badge-info {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }
}
</style>