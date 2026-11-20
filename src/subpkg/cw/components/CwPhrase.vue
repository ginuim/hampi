<template>
  <view class="morse-section">
    <view class="morse-grid">
      <view 
        v-for="item in commonPhrases" 
        :key="item.phrase"
        class="morse-item phrase-item"
        :class="{ 'playing': currentLoopItem === item.code }"
        @click="playMorse(item.code)"
        @touchstart="(e) => startLoopPlay(item.code, e)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <text class="character">{{ item.phrase }}</text>
        <text class="code">{{ item.code }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    audioCtx: Object,
    dit: Number,
    freq: Number,
    isDark: Boolean
  },
  data() {
    return {
      commonPhrases: [
        { phrase: 'CQ CQ CQ', code: '-·-· --·- + -·-· --·- + -·-· --·-' },
        { phrase: 'QRZ', code: '--·- ·-· --··' },
        { phrase: 'QSL?', code: '--·- ··· ·-·· ··-··' },
        { phrase: 'QTH?', code: '--·- - ···· ··-··' },
        { phrase: 'QRP', code: '--·- ·-· ·--·' },
        { phrase: 'RST 599', code: '·-· ··· - + ····· ----· ----·' },
        { phrase: 'SK 73', code: '··· -·- + --··· ···--' },
        { phrase: 'HW R U?', code: '···· ·-- + ·-· + ··- ··-··' },
        { phrase: 'R UR', code: '·-· + ··- ·-·' },
        { phrase: 'PSE K', code: '·--· ··· · + -·-' },
        { phrase: 'CL, 73', code: '-·-· ·-·· + --··· ···--' }
      ],
      loopTimer: null,
      currentLoopItem: null,
      isPlaying: false,
      startDelay: 500,
      loopDelay: 1000,
      touchStartTime: 0,
      touchStartPosition: null,
      touchThreshold: 10,
      longPressDelay: 50,
      longPressTimer: null
    }
  },
  methods: {
    async playMorse(item) {
      if (this.isPlaying) return;
      
      this.isPlaying = true;
      await this.playCode(item.trim(), true);
      this.isPlaying = false;
      
      // 触发事件通知父组件
      this.$emit('morse-played');
    },
    
    async playCode(code, isCharacterPlay = false) {
      if (isCharacterPlay) {
        await this.sleep(this.startDelay);
      }
      
      for (const symbol of code) {
        if (symbol === '·') {
          await this.playTone(this.dit);
          await this.sleep(this.dit);
        } else if (symbol === '-') {
          await this.playTone(this.dit * 3);
          await this.sleep(this.dit);
        } else if (symbol === '+') {
          await this.sleep(this.dit * 7);
        } else if (symbol === ' ') {
          await this.sleep(this.dit * 3);
        }
      }
    },
    
    playTone(duration) {
      return new Promise((resolve) => {
        const ctx = this.audioCtx;

        // 检查音频上下文是否有效
        if (!ctx || ctx.state === 'closed') {
          console.error('音频上下文无效或已关闭');
          resolve();
          return;
        }

        const now = ctx.currentTime;

        try {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          // 检查创建的音频节点是否有效
          if (!oscillator || !gainNode) {
            console.error('无法创建音频节点');
            resolve();
            return;
          }

          oscillator.type = 'sine';
          oscillator.frequency.value = this.freq;

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          // 添加渐变效果以避免爆音
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.8, now + 0.005);
          gainNode.gain.setValueAtTime(0.8, now + duration/1000 - 0.005);
          gainNode.gain.linearRampToValueAtTime(0, now + duration/1000);

          oscillator.start(now);
          oscillator.stop(now + duration/1000);

          setTimeout(() => {
            try {
              oscillator.disconnect();
              gainNode.disconnect();
            } catch (e) {
              console.warn('音频节点断开连接时出错:', e);
            }
            resolve();
          }, duration);
        } catch (e) {
          console.error('音频播放过程中出错:', e);
          resolve();
        }
      });
    },
    
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    startLoopPlay(item, event) {
      // 记录触摸开始时间和位置
      this.touchStartTime = Date.now();
      this.touchStartPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      
      // 清除之前的定时器
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
      
      // 设置新的定时器
      this.longPressTimer = setTimeout(() => {
        this.stopLoopPlay();
        this.currentLoopItem = item;
        this.playMorse(item);
        this.loopTimer = setInterval(() => {
          if (!this.isPlaying) {
            this.playMorse(item);
          }
        }, this.loopDelay);
      }, this.longPressDelay);
    },
    
    stopLoopPlay() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (this.loopTimer) {
        clearInterval(this.loopTimer);
        this.loopTimer = null;
        this.currentLoopItem = null;
      }
    },
    
    onTouchMove(event) {
      if (!this.touchStartPosition) return;
      
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      
      // 计算移动距离
      const deltaX = Math.abs(currentX - this.touchStartPosition.x);
      const deltaY = Math.abs(currentY - this.touchStartPosition.y);
      
      // 如果移动超过阈值，取消长按
      if (deltaX > this.touchThreshold || deltaY > this.touchThreshold) {
        this.stopLoopPlay();
      }
    },
    
    onTouchEnd() {
      this.touchStartPosition = null;
      this.stopLoopPlay();
    }
  },
  beforeUnmount() {
    this.stopLoopPlay();
  }
}
</script>

<style lang="less" scoped>
.morse-section {
  margin-bottom: 20px;
}

.morse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 10px;
  margin-top: 15px;
  
  .morse-item {
    background-color: var(--background-container);
    padding: 10px;
    border-radius: 10px;
    text-align: center;
    border: 1px solid var(--border-color-light);
    transition: all 0.3s ease;
    
    &:active {
      opacity: 0.7;
    }

    &.playing,
    &:active {
      opacity: 1;
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      .character, .code {
        color: #fff;
      }
    }
    
    &.phrase-item {
      grid-column: span 2;
    }
    
    .character {
      font-size: 18px;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
      color: var(--text-primary);
    }
    
    .code {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}
</style> 