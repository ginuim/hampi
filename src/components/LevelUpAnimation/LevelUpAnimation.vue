<template>
  <view v-if="visible" class="level-up-animation" @tap="handleTap">
    <!-- 背景遮罩 -->
    <view class="animation-overlay" :class="{ 'fade-in': overlayVisible }"></view>

    <!-- 升级动画内容 -->
    <view class="animation-content" :class="{ 'slide-up': contentVisible }">
      <!-- 粒子效果 -->
      <view class="particles">
        <view
          v-for="particle in particles"
          :key="particle.id"
          class="particle"
          :style="particle.style"
        ></view>
      </view>

      <!-- 主要内容 -->
      <view class="main-content">
        <!-- 旧等级淡出 -->
        <view v-if="showOldLevel" class="old-level fade-out">
          <LevelBadge :level-info="oldLevel" size="large" />
        </view>

        <!-- 新等级展示 -->
        <view v-if="showNewLevel" class="new-level">
          <view class="level-badge-container scale-in">
            <LevelBadge
              :level-info="newLevel"
              size="large"
              :show-glow="true"
              :show-decorations="true"
            />
          </view>

          <view class="level-info bounce-in">
            <text class="congrats-text">🎉 恭喜升级！🎉</text>
            <text class="level-name-text">{{ newLevel.name }}</text>
            <text class="level-desc-text">{{ newLevel.description }}</text>
          </view>

          <!-- 解锁特权 -->
          <view v-if="newLevel.privileges.length > 0" class="unlocked-privileges slide-up-delay">
            <text class="unlock-title">🎯 解锁新特权</text>
            <view class="privileges-list">
              <view
                v-for="(privilege, index) in newLevel.privileges"
                :key="privilege"
                class="privilege-item"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <view class="privilege-icon">✨</view>
                <text class="privilege-text">{{ privilege }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view v-if="showActions" class="actions fade-in-up">
          <button class="action-btn secondary" @tap="shareLevelUp">
            <text class="btn-icon">📤</text>
            <text class="btn-text">分享升级</text>
          </button>
          <button class="action-btn primary" @tap="closeAnimation">
            <text class="btn-text">继续学习</text>
          </button>
        </view>
      </view>

      <!-- 音效控制 -->
      <view class="sound-control" @tap.stop="toggleSound">
        <text class="sound-icon">{{ soundEnabled ? '🔊' : '🔇' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { UserLevel } from '@/utils/levelSystem'
import LevelBadge from '@/components/LevelBadge/LevelBadge.vue'

interface Props {
  visible: boolean
  oldLevel: UserLevel
  newLevel: UserLevel
  autoClose?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: true,
  duration: 5000
})

const emit = defineEmits<{
  close: []
  share: [newLevel: UserLevel]
}>()

// 动画状态控制
const overlayVisible = ref(false)
const contentVisible = ref(false)
const showOldLevel = ref(false)
const showNewLevel = ref(false)
const showActions = ref(false)
const soundEnabled = ref(true)

// 粒子效果
interface Particle {
  id: number
  style: any
}

const particles = ref<Particle[]>([])

// 创建粒子效果
const createParticles = () => {
  const particleCount = 30
  const newParticles: Particle[] = []

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const velocity = 2 + Math.random() * 3
    const size = 4 + Math.random() * 4

    newParticles.push({
      id: i,
      style: {
        '--x': `${Math.cos(angle) * velocity}px`,
        '--y': `${Math.sin(angle) * velocity}px`,
        '--size': `${size}px`,
        '--delay': `${Math.random() * 0.5}s`,
        '--duration': `${1 + Math.random() * 2}s`,
        '--color': props.newLevel.color
      }
    })
  }

  particles.value = newParticles
}

// 开始动画序列
const startAnimation = async () => {
  // 重置状态
  overlayVisible.value = false
  contentVisible.value = false
  showOldLevel.value = false
  showNewLevel.value = false
  showActions.value = false

  await nextTick()

  // 开始动画序列
  setTimeout(() => {
    overlayVisible.value = true
  }, 50)

  setTimeout(() => {
    contentVisible.value = true
    showOldLevel.value = true
    playSound('levelDown')
  }, 300)

  setTimeout(() => {
    showOldLevel.value = false
    showNewLevel.value = true
    createParticles()
    playSound('levelUp')
  }, 1500)

  setTimeout(() => {
    showActions.value = true
  }, 2500)

  // 自动关闭
  if (props.autoClose) {
    setTimeout(() => {
      closeAnimation()
    }, props.duration)
  }
}

// 播放音效
const playSound = (type: 'levelUp' | 'levelDown') => {
  if (!soundEnabled.value) return

  // 这里可以集成实际的音效播放
  // 例如使用 uni.createInnerAudioContext()
  try {
    uni.vibrateShort()
  } catch (e) {
    console.log('振动功能不可用')
  }
}

// 切换音效
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
}

// 处理点击
const handleTap = (e: any) => {
  // 防止内容区域的点击事件冒泡
  if (e.target === e.currentTarget) {
    closeAnimation()
  }
}

// 关闭动画
const closeAnimation = () => {
  overlayVisible.value = false
  contentVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

// 分享升级
const shareLevelUp = () => {
  emit('share', props.newLevel)
  closeAnimation()
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    startAnimation()
  }
}, { immediate: true })
</script>

<style lang="less" scoped>
.level-up-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  opacity: 0;
  transition: opacity 0.3s ease;

  &.fade-in {
    opacity: 1;
  }
}

.animation-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  transform: translateY(50px);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  &.slide-up {
    transform: translateY(0);
    opacity: 1;
  }
}

.main-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

// 粒子效果
.particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
  animation: particle-explode var(--duration) ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes particle-explode {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1);
    opacity: 0;
  }
}

// 等级徽章动画
.old-level {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.new-level {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.level-badge-container {
  display: flex;
  justify-content: center;
}

.level-info {
  text-align: center;
}

.congrats-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.level-name-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.level-desc-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

// 解锁特权
.unlocked-privileges {
  width: 100%;
  background: var(--background-secondary);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.unlock-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.privileges-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--background-container);
  border-radius: 8px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slide-in-left 0.5s ease forwards;

  .privilege-icon {
    font-size: 16px;
  }

  .privilege-text {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }
}

// 操作按钮
.actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &.secondary {
    background: var(--background-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color-light);

    &:hover {
      background: var(--background-hover);
    }
  }

  &.primary {
    background: var(--primary-color);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}

// 音效控制
.sound-control {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-container);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  .sound-icon {
    font-size: 16px;
  }
}

// 动画类
.fade-out {
  animation: fade-out 0.5s ease forwards;
}

.fade-in {
  animation: fade-in 0.5s ease forwards;
}

.fade-in-up {
  animation: fade-in-up 0.5s ease forwards;
}

.scale-in {
  animation: scale-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.bounce-in {
  animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.slide-up-delay {
  animation: slide-up 0.5s ease forwards;
  animation-delay: 0.3s;
  opacity: 0;
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-left {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 暗色主题适配
:deep(.dark) {
  .animation-content {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .sound-control {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
}
</style>