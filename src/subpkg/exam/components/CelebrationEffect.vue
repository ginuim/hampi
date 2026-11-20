<template>
  <view v-if="isVisible" class="celebration-container">
    <view class="celebration-glow"></view>
    <view v-for="piece in confetti" :key="piece.id" class="confetti" :style="piece.style"></view>
    <view class="celebration-message">
      <text class="celebration-icon">✦</text>
      <text class="congrats-message">{{ message || '模拟考试通过' }}</text>
      <text class="celebration-subtitle">期待在电波中相遇</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'

const props = defineProps<{
  isVisible: boolean
  level?: { id?: string }
  message?: string
}>()

const emit = defineEmits(['finished'])
const colors = ['#F6C76A', '#F5E6B5', '#7AC8C4', '#E9A86B']
const confetti = computed(() => {
  const count = props.level?.id === 'outstanding' ? 32 : 24
  return Array.from({ length: count }, (_, id) => ({
    id,
    style: {
      left: `${(id * 37) % 100}%`,
      top: `${-8 - (id % 5) * 8}%`,
      width: `${5 + (id % 3) * 2}px`,
      height: `${9 + (id % 3) * 3}px`,
      backgroundColor: colors[id % colors.length],
      animationDelay: `${(id % 8) * 0.12}s`,
      animationDuration: `${2 + (id % 5) * 0.18}s`
    }
  }))
})

let finishTimer: ReturnType<typeof setTimeout> | undefined
function clearFinishTimer() {
  if (finishTimer) clearTimeout(finishTimer)
  finishTimer = undefined
}

watch(() => props.isVisible, (visible) => {
  clearFinishTimer()
  if (visible) {
    finishTimer = setTimeout(() => {
      finishTimer = undefined
      emit('finished')
    }, 3200)
  }
}, { immediate: true })

onUnmounted(clearFinishTimer)
</script>

<style lang="less" scoped>
.celebration-container {
  position: fixed;
  inset: 0;
  z-index: 10000;
  overflow: hidden;
  pointer-events: none;
}
.celebration-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 43%, rgba(248, 209, 121, 0.24), transparent 56%);
  animation: fade-away 3.2s ease-out both;
}
.confetti {
  position: absolute;
  border-radius: 2px;
  opacity: 0;
  animation-name: confetti-fall;
  animation-timing-function: ease-in;
  animation-fill-mode: both;
}
.celebration-message {
  position: absolute;
  top: 42%;
  left: 50%;
  width: 82vw;
  max-width: 380px;
  padding: 20px 16px;
  border-radius: 18px;
  background: rgba(17, 37, 48, 0.91);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.2);
  color: #fff;
  text-align: center;
  transform: translate(-50%, -50%);
  animation: message-enter 3.2s ease-out both;
}
.celebration-icon, .congrats-message, .celebration-subtitle { display: block; }
.celebration-icon { color: #f6c76a; font-size: 26px; }
.congrats-message { margin-top: 5px; font-size: 24px; font-weight: 700; }
.celebration-subtitle { margin-top: 7px; font-size: 12px; color: #c9dcdf; }
@keyframes confetti-fall {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(0deg); }
  10% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(35px, 110vh, 0) rotate(540deg); }
}
@keyframes message-enter {
  0% { opacity: 0; transform: translate(-50%, -40%) scale(0.94); }
  14%, 75% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -54%) scale(1); }
}
@keyframes fade-away {
  0%, 65% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
