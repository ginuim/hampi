<template>
  <view class="cw-container" :class="{ 'dark': isDark }">
    <NavBar title="CW 学习" />
    
    <view class="header-section">
      <!-- Tab切换 -->
      <view class="tab-section">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'single' }"
          @click="currentTab = 'single'"
        >
          单字
        </view>
       
        <view 
          class="tab-item"
          :class="{ active: currentTab === 'listen' }"
          @click="currentTab = 'listen'"
        >
          抄听
        </view>
      </view>

      <!-- <view class="settings-btn" @click="showSettings">
        <text class="iconfont">&#xe632;</text>
      </view> -->
    </view>

    <!-- 单字模式 -->
    <view v-if="currentTab === 'single'">

      <!-- 在 play-overlay 前移除现有设置弹窗，添加卡片面板设置 -->
      <view class="morse-section settings-section">
        <CardPanel noHighlight padding="20px" class="listen-settings" :class="{ 'collapsed': settingsCollapsed }">
          <view class="settings-header" @click="toggleSettingsPanel">
            <text class="settings-title">设置</text>
            <text class="settings-toggle iconfont" :class="{ 'collapsed': settingsCollapsed }">&#xe6b8;</text>
          </view>
          
          <view class="settings-content" v-show="!settingsCollapsed">
            <view class="setting-group">
              <text class="setting-title">速度：{{ wpm }} WPM</text>
              <view class="wpm-buttons">
                <view 
                  v-for="speed in wpmOptions" 
                  :key="speed"
                  class="wpm-btn"
                  :class="{ active: wpm === speed }"
                  @click="updateWpm(speed)"
                >
                  {{ speed }}
                </view>
              </view>
            </view>
            
            <view class="setting-group">
              <text class="setting-title">频率：{{ freq }} Hz</text>
              <slider 
                min="400" 
                max="1000" 
                step="10" 
                :value="freq" 
                @changing="updateFrequency"
                @change="updateFrequency"
                activeColor="#007AFF"
              />
            </view>

            <view class="setting-tips">
              本页面仅供了解莫尔斯电码使用，如果希望达到较高水准不建议将字符和图形/点划对应记忆，推荐使用 Farnsworth 学习法或 Koch 学习法，后续会推出相关功能，敬请期待。
            </view>
          </view>
        </CardPanel>
      </view>
      <!-- 字母部分 -->
      <view class="morse-section">
        <view class="section-header">
          <text class="section-title">字母</text>
          <view class="play-buttons">
            <view class="play-btn" @click="startSectionPlay('letters', false)">
              <text class="iconfont">&#xe6ba; 顺序播放</text>
            </view>
            <view class="play-btn" @click="startSectionPlay('letters', true)">
              <text class="iconfont">&#xe622; 随机播放</text>
            </view>
          </view>
        </view>
        <view class="morse-grid">
          <view 
            v-for="item in categorizedMorse.letters" 
            :key="item.char"
            class="morse-item"
            :class="{ 'playing': currentLoopItem === (item.char + ':' + item.code) }"
            @click="playMorse(item.char + ':' + item.code)"
            @touchstart="(e) => startLoopPlay(item.char + ':' + item.code, e)"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchEnd"
          >
            <text class="character">{{ item.char }}</text>
            <text class="code">{{ item.code }}</text>
          </view>
        </view>
      </view>

      <!-- 数字部分 -->
      <view class="morse-section">
        <view class="section-header">
          <text class="section-title">数字</text>
          <view class="play-buttons">
            <view class="play-btn" @click="startSectionPlay('numbers', false)">
              <text class="iconfont">&#xe6ba; 顺序播放</text>
            </view>
            <view class="play-btn" @click="startSectionPlay('numbers', true)">
              <text class="iconfont">&#xe622; 随机播放</text>
            </view>
          </view>
        </view>
        <view class="morse-grid">
          <view 
            v-for="item in categorizedMorse.numbers" 
            :key="item.char"
            class="morse-item"
            :class="{ 'playing': currentLoopItem === (item.char + ':' + item.code) }"
            @click="playMorse(item.char + ':' + item.code)"
            @touchstart="(e) => startLoopPlay(item.char + ':' + item.code, e)"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchEnd"
          >
            <text class="character">{{ item.char }}</text>
            <text class="code">{{ item.code }}</text>
          </view>
        </view>
      </view>

      <!-- 符号部分 -->
      <view class="morse-section">
        <view class="section-header">
          <text class="section-title">符号</text>
          <view class="play-buttons">
            <view class="play-btn" @click="startSectionPlay('symbols', false)">
              <text class="iconfont">&#xe6ba; 顺序播放</text>
            </view>
            <view class="play-btn" @click="startSectionPlay('symbols', true)">
              <text class="iconfont">&#xe622; 随机播放</text>
            </view>
          </view>
        </view>
        <view class="morse-grid">
          <view 
            v-for="item in categorizedMorse.symbols" 
            :key="item.char"
            class="morse-item"
            :class="{ 'playing': currentLoopItem === (item.char + ':' + item.code) }"
            @click="playMorse(item.char + ':' + item.code)"
            @touchstart="(e) => startLoopPlay(item.char + ':' + item.code, e)"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchEnd"
          >
            <text class="character">{{ item.char }}</text>
            <text class="code">{{ item.code }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 抄听模式 -->
    <view v-else-if="currentTab === 'listen'" class="listen-section">
      <CwListen 
        :audioCtx="audioCtx" 
        :categorizedMorse="categorizedMorse" 
        :dit="dit" 
        :freq="freq" 
      />
    </view>

    <!-- 添加浮层 -->
    <view class="play-overlay" v-if="isPlaying && playingItems.length">
      <view class="overlay-content">
        <Words
          v-if="!!currentPlayingChar.match(/^[a-zA-Z]$/)"
          :isDark="isDark"
          :word="currentPlayingChar"
          :num="currentPlayingIndex"
        />
        <view v-else class="playing-char">{{ currentPlayingChar }}</view>
        <view class="playing-code">{{ currentPlayingCode }}</view>
        <view class="stop-btn" @click="stopSectionPlay">
          <text>停止</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { computed, ref, onUnmounted } from 'vue'
import morseData from '@/resources/json/morse.json'
import { useThemeStore } from '@/stores/theme'
import Words from './components/Words.vue'
import CwListen from './components/CwListen.vue'
import CardPanel from '@/components/CardPanel/CardPanel.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

export default {
  components: {
    Words,
    CwListen,
    CardPanel,
  },
  data() {
    return {
      currentTab: 'single',
      categorizedMorse: {
        letters: [],
        numbers: [],
        symbols: []
      },
      isShowSettings: false,
      isDark,
      audioCtx: null,
      isPlaying: false,
      dit: 60,
      freq: 700,
      startDelay: 500,
      loopTimer: null,
      loopDelay: 1000,
      currentLoopItem: null,
      wpm: 10,
      wpmOptions: [5, 10, 20, 30],
      wpmIndex: 1,
      currentPlayingChar: '',
      currentPlayingCode: '',
      playingSection: null,
      playingIndex: 0,
      isRandom: false,
      playingItems: [],
      repeatCount: 0,
      maxRepeats: 3,
      touchStartTime: 0,
      touchStartPosition: null,
      touchThreshold: 10,
      longPressDelay: 50,
      longPressTimer: null,
      currentPlayingIndex: 0,
      settingsCollapsed: true,
      activeOscillators: [],
      activeGainNodes: [],
      currentPlayQueueId: null,
      sectionPlayTimer: null,
    }
  },
  
  onLoad() {
    this.categorizeMorseData()

    // 初始化音频上下文，添加错误处理
    try {
      this.audioCtx = uni.createWebAudioContext()
      if (!this.audioCtx) {
        console.error('无法创建音频上下文')
        uni.showToast({
          title: '音频初始化失败',
          icon: 'none'
        })
      }
    } catch (e) {
      console.error('创建音频上下文时出错:', e)
      uni.showToast({
        title: '音频功能不可用',
        icon: 'none'
      })
    }

    // #ifdef MP-WEIXIN
    uni.setInnerAudioOption({
      obeyMuteSwitch: false,
      mixWithOther: true,
    })
    // #endif

    const savedFreq = uni.getStorageSync('cw_frequency')
    if (savedFreq) {
      this.freq = savedFreq
    }

    const savedWpm = uni.getStorageSync('cw_wpm')
    if (savedWpm) {
      this.wpm = savedWpm
      this.wpmIndex = this.wpmOptions.indexOf(savedWpm)
      this.dit = Math.round(1200 / this.wpm)
    }

    uni.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },
  
  onUnload() {
    // 清理所有音频相关资源
    this.stopAllOscillators();
    this.stopLoopPlay();
    clearTimeout(this.sectionPlayTimer);
    this.sectionPlayTimer = null;
    this.currentPlayQueueId = null;

    // 安全关闭音频上下文
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {
        console.warn('关闭音频上下文时出错:', e);
      }
    }
    this.audioCtx = null;
    this.stopLoopPlay()
  },

  onUnmounted () {
    // 确保清理所有定时器和音频资源
    this.stopAllOscillators();
    this.loopTimer && clearInterval(this.loopTimer)
    this.longPressTimer && clearTimeout(this.longPressTimer)
    clearTimeout(this.sectionPlayTimer);
    this.sectionPlayTimer = null;
    this.currentPlayQueueId = null;
  },
  
  methods: {
    categorizeMorseData() {
      morseData.data.forEach(item => {
        const [char, code] = item.split(': ')
        const morseItem = { char, code }
        console.log('char: ', char, code, morseItem)

        
        if (/^[A-Z]$/.test(char)) {
          this.categorizedMorse.letters.push(morseItem)
        } else if (/^[0-9]$/.test(char)) {
          this.categorizedMorse.numbers.push(morseItem)
        } else {
          this.categorizedMorse.symbols.push(morseItem)
        }
      })
    },

    startLoopPlay(item, event) {
      // 先停止所有音频
      this.stopAllOscillators();
      
      this.touchStartTime = Date.now()
      this.touchStartPosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      }
      
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
      }
      
      this.longPressTimer = setTimeout(() => {
        this.stopLoopPlay()
        this.currentLoopItem = item
        this.playMorse(item)
        this.loopTimer = setInterval(() => {
          if (!this.isPlaying) {
            this.playMorse(item)
          }
        }, this.loopDelay)
      }, this.longPressDelay)
    },
    
    stopLoopPlay() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
      if (this.loopTimer) {
        clearInterval(this.loopTimer)
        this.loopTimer = null
        this.currentLoopItem = null
      }
      
      // 确保停止所有音频
      this.stopAllOscillators();
    },

    async playMorse(item, fromQueue = false, queueId = null) {
      // 强制停止所有现有音频，避免重叠
      this.stopAllAudio();
      
      // 如果来自播放队列，检查队列ID是否匹配
      if (fromQueue && queueId !== this.currentPlayQueueId) {
        return; // 不匹配则不播放
      }
      
      if (this.isPlaying && !this.playingSection && !fromQueue) return;
      
      let char = '';
      let code = '';
      const separatorIndex = item.indexOf(':');
      
      if (separatorIndex !== -1) {
          char = item.substring(0, separatorIndex);
          code = item.substring(separatorIndex + 1);
          // 处理特殊情况：当字符本身是 ':' 时，item 格式为 "::code"
          if (char === "" && item.startsWith("::")) {
            char = ":";
            code = item.substring(2); // 跳过两个冒号
          }
      } else {
          // 没有找到分隔符，可能是不规范的数据或者直接是代码
          console.warn("Invalid item format or direct code:", item);
          code = item; // 尝试将整个 item 作为 code
      }

      console.log(`Playing item: ${item}, Extracted char: ${char}, Extracted code: ${code}`);

      if (!code || code.trim() === '') {
        console.error("Could not extract valid code for item:", item);
        // 无效代码，无需设置 isPlaying = true，直接返回
        return; 
      }
      
      this.isPlaying = true;
      await this.playCode(code.trim(), true);
      
      if (!this.playingSection && !fromQueue) {
        this.isPlaying = false;
      }
    },
    
    // 添加全局音频停止方法
    stopAllAudio() {
      // 停止所有正在播放的振荡器
      this.stopAllOscillators();

      // 清除任何可能正在播放的其他音频
      const ctx = this.audioCtx;
      if (ctx && ctx.state !== 'closed') {
        try {
          const currentTime = ctx.currentTime;
          const oscillator = ctx.createOscillator();
          if (oscillator) {
            oscillator.stop(currentTime);
            oscillator.disconnect();
          }
        } catch (e) {
          // 忽略错误
          console.warn('停止音频时出错:', e);
        }
      }
    },
    
    async playCode(code, isCharacterPlay = false) {
      if (isCharacterPlay) {
        await this.sleep(this.startDelay)
      }
      
      this.currentPlayingIndex = 0
      
      for (const symbol of code) {
        console.log('code: ', code)
        if (symbol === '·') {
          this.currentPlayingIndex++
          await this.playTone(this.dit)
          await this.sleep(this.dit)
        } else if (symbol === '-') {
          this.currentPlayingIndex++
          await this.playTone(this.dit * 3)
          await this.sleep(this.dit)
        } else if (symbol === '+') {
          await this.sleep(this.dit * 7)
        } else if (symbol === ' ') {
          await this.sleep(this.dit * 3)
        }
        console.log('this.currentPlayingIndex: ', this.currentPlayingIndex)
      }
      
      this.currentPlayingIndex = 0
    },
    
    playTone(duration) {
      return new Promise((resolve) => {
        // 先停止和清理所有当前活跃的音频节点
        this.stopAllOscillators();

        const ctx = this.audioCtx

        // 检查音频上下文是否有效
        if (!ctx || ctx.state === 'closed') {
          console.error('音频上下文无效或已关闭，尝试重新创建');
          this.audioCtx = uni.createWebAudioContext();
          if (!this.audioCtx) {
            console.error('无法创建音频上下文');
            resolve();
            return;
          }
          // 更新 ctx 引用
          const newCtx = this.audioCtx;
          const now = newCtx.currentTime;

          const oscillator = newCtx.createOscillator();
          const gainNode = newCtx.createGain();

          // 检查创建的音频节点是否有效
          if (!oscillator || !gainNode) {
            console.error('无法创建音频节点');
            resolve();
            return;
          }

          // 将新创建的节点添加到跟踪数组
          this.activeOscillators.push(oscillator);
          this.activeGainNodes.push(gainNode);

          try {
            oscillator.type = 'sine';
            oscillator.frequency.value = this.freq;

            oscillator.connect(gainNode);
            gainNode.connect(newCtx.destination);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.8, now + 0.005);
            gainNode.gain.setValueAtTime(0.8, now + duration/1000 - 0.005);
            gainNode.gain.linearRampToValueAtTime(0, now + duration/1000);

            oscillator.start(now);
            oscillator.stop(now + duration/1000);

            setTimeout(() => {
              // 从跟踪数组中移除
              const oscIndex = this.activeOscillators.indexOf(oscillator);
              if (oscIndex > -1) this.activeOscillators.splice(oscIndex, 1);

              const gainIndex = this.activeGainNodes.indexOf(gainNode);
              if (gainIndex > -1) this.activeGainNodes.splice(gainIndex, 1);

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
          return;
        }

        const now = ctx.currentTime;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // 检查创建的音频节点是否有效
        if (!oscillator || !gainNode) {
          console.error('无法创建音频节点');
          resolve();
          return;
        }

        // 将新创建的节点添加到跟踪数组
        this.activeOscillators.push(oscillator);
        this.activeGainNodes.push(gainNode);

        try {
          oscillator.type = 'sine';
          oscillator.frequency.value = this.freq;

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.8, now + 0.005);
          gainNode.gain.setValueAtTime(0.8, now + duration/1000 - 0.005);
          gainNode.gain.linearRampToValueAtTime(0, now + duration/1000);

          oscillator.start(now);
          oscillator.stop(now + duration/1000);

          setTimeout(() => {
            // 从跟踪数组中移除
            const oscIndex = this.activeOscillators.indexOf(oscillator);
            if (oscIndex > -1) this.activeOscillators.splice(oscIndex, 1);

            const gainIndex = this.activeGainNodes.indexOf(gainNode);
            if (gainIndex > -1) this.activeGainNodes.splice(gainIndex, 1);

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
          // 清理可能已创建的节点
          const oscIndex = this.activeOscillators.indexOf(oscillator);
          if (oscIndex > -1) this.activeOscillators.splice(oscIndex, 1);

          const gainIndex = this.activeGainNodes.indexOf(gainNode);
          if (gainIndex > -1) this.activeGainNodes.splice(gainIndex, 1);

          resolve();
        }
      })
    },
    
    // 停止所有活跃的音频振荡器
    stopAllOscillators() {
      if (this.activeOscillators.length > 0) {
        this.activeOscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            // 忽略已停止的振荡器的错误
          }
        });
        
        this.activeGainNodes.forEach(gain => {
          try {
            gain.disconnect();
          } catch (e) {
            // 忽略错误
          }
        });
        
        this.activeOscillators = [];
        this.activeGainNodes = [];
      }
    },
    
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    updateFrequency(event) {
      this.freq = event.detail.value;
      uni.setStorageSync('cw_frequency', this.freq)
    },

    updateWpm(speed) {
      this.wpm = speed
      this.wpmIndex = this.wpmOptions.indexOf(speed)
      this.dit = Math.round(1200 / this.wpm)
      uni.setStorageSync('cw_wpm', this.wpm)
    },

    startSectionPlay(section, isRandom) {
      // 先完全停止之前的播放
      this.stopSectionPlay();
      this.stopAllOscillators();
      
      // 清除可能存在的定时器
      clearTimeout(this.sectionPlayTimer);
      
      // 等待100ms确保之前的播放完全停止
      this.sectionPlayTimer = setTimeout(() => {
        // 只有在当前没有活跃播放队列时才开始新的播放
        if (!this.currentPlayQueueId) {
          this.playingSection = section;
          this.isRandom = isRandom;
          this.playingItems = [...this.categorizedMorse[section]];
          
          if (isRandom) {
            for (let i = this.playingItems.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [this.playingItems[i], this.playingItems[j]] = [this.playingItems[j], this.playingItems[i]];
            }
          }
          
          this.playingIndex = 0;
          // 生成新的队列ID
          this.currentPlayQueueId = Date.now();
          const queueId = this.currentPlayQueueId;
          this.playNext(queueId);
        }
        this.sectionPlayTimer = null;
      }, 100);
    },

    async playNext(queueId) {
      // 检查是否是当前活跃的播放队列
      if (queueId !== this.currentPlayQueueId || !this.playingSection || this.playingIndex >= this.playingItems.length) {
        if (queueId === this.currentPlayQueueId) {
          this.stopSectionPlay();
        }
        return;
      }

      // 确保停止之前的音频
      this.stopAllOscillators();

      const item = this.playingItems[this.playingIndex];
      this.currentPlayingChar = item.char;
      this.currentPlayingCode = item.code;
      this.isPlaying = true;
      
      this.repeatCount = 0;
      while (this.repeatCount < this.maxRepeats && this.playingSection && queueId === this.currentPlayQueueId) {
        // 使用队列ID播放
        await this.playMorse(item.char + ':' + item.code, true, queueId);
        this.repeatCount++;
        if (this.repeatCount < this.maxRepeats && this.playingSection && queueId === this.currentPlayQueueId) {
          await this.sleep(500);
        }
      }
      
      // 再次检查队列ID，确保这个播放序列仍然是当前活跃的
      if (this.playingSection && queueId === this.currentPlayQueueId) {
        await this.sleep(1000);
        this.playingIndex++;
        this.playNext(queueId);
      }
    },

    stopSectionPlay() {
      // 重置队列ID以中断任何正在进行的播放序列
      this.currentPlayQueueId = null;
      
      this.playingItems = [];
      this.playingSection = null;
      this.currentPlayingChar = '';
      this.currentPlayingCode = '';
      this.isPlaying = false;
      this.repeatCount = 0;
      this.currentPlayingIndex = 0;
      
      // 确保停止所有音频
      this.stopAllOscillators();
      
      // 清除可能存在的定时器
      clearTimeout(this.sectionPlayTimer);
    },

    onTouchMove(event) {
      if (!this.touchStartPosition) return
      
      const currentX = event.touches[0].clientX
      const currentY = event.touches[0].clientY
      
      const deltaX = Math.abs(currentX - this.touchStartPosition.x)
      const deltaY = Math.abs(currentY - this.touchStartPosition.y)
      
      if (deltaX > this.touchThreshold || deltaY > this.touchThreshold) {
        this.stopLoopPlay()
      }
    },
    
    onTouchEnd() {
      this.touchStartPosition = null
      this.stopLoopPlay()
    },

    // showSettings() {
    //   this.settingsCollapsed = false;
    // },

    toggleSettingsPanel() {
      this.settingsCollapsed = !this.settingsCollapsed;
    },

    handleMorsePlayed() {
      // 如果需要在播放完成后执行某些操作，可以在这里添加
    },
  }
}
</script>

<style lang="less">
.cw-container {
  padding: 10px;
  padding-bottom: 50px;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: var(--background-primary);

  .header-section {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  .tab-section {
    flex: 1;
    display: flex;
    
    .tab-item {
      flex: 1;
      text-align: center;
      padding: 10px;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      
      &.active {
        color: var(--text-primary);
        border-bottom-color: var(--primary-color);
      }
    }
  }
  
  .settings-btn {
    padding: 10px;
    color: var(--text-secondary);
    
    .iconfont {
      font-size: 20px;
    }
    
    &:active {
      opacity: 0.7;
    }
  }

  .section-title {
    width: 100%;
    display: block;
    font-size: 18px;
    font-weight: bold;
    text-align: left;
    padding-left: 10px;
    line-height: 1;
    border-left: 4px solid var(--text-secondary);
    color: var(--text-primary);
  }
  
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

  .frequency-section {
    margin-top: 20px;
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-primary);
      margin-bottom: 10px;
    }
    
    .frequency-value {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 5px;
      text-align: center;
    }
  }

  .wpm-buttons {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    
    .wpm-btn {
      padding: 5px 15px;
      background-color: var(--background-primary);
      border: 1px solid var(--border-color-light);
      border-radius: 4px;
      font-size: 14px;
      color: var(--text-primary);
      text-align: center;
      
      &.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: #fff;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    
    .play-buttons {
      display: flex;
      gap: 10px;
    }
  }

  .settings-content {
    padding: 10px;
    margin-top: 20px;
    
    .setting-item {
      margin-bottom: 15px;
      
      .setting-label {
        font-size: 14px;
        color: var(--text-primary);
        margin-bottom: 10px;
        display: block;
      }
    }
    
    .wpm-buttons {
      display: flex;
      justify-content: space-between;
      gap: 5px;
      
      .wpm-btn {
        flex: 1;
        padding: 5px;
        background-color: var(--background-primary);
        border: 1px solid var(--border-color-light);
        border-radius: 4px;
        font-size: 14px;
        color: var(--text-primary);
        text-align: center;
        
        &.active {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          color: #fff;
        }
      }
    }
  }

  .play-btn {
    padding: 10px 15px;
    background-color: var(--background-container);
    border: 1px solid var(--border-color-light);
    border-radius: 20px;
    font-size: 12px;
    color: var(--text-primary);
    white-space: nowrap;

    .iconfont {
      font-size: 12px;
      margin-right: 5px;
      white-space: nowrap;
    }
    
    &:active {
      opacity: 0.7;
    }
  }

  .stop-btn {
    color: var(--text-primary);
    opacity: 0.3;
    padding: 10px 15px;
    border-radius: 20px;
    background-color: var(--text-tertiary);
  }

  .play-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    .overlay-content {
      background-color: var(--background-container);
      padding: 20px 60px;
      border-radius: 10px;
      text-align: center;
      
      .playing-char {
        font-size: 40px;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 10px;
      }
      
      .playing-code {
        font-size: 20px;
        color: var(--text-primary);
        margin-bottom: 20px;
      }
    }
  }

  .listen-section {
    padding: 0 10px;
  }

  .listen-settings {
    .setting-group {
      margin-bottom: 20px;
    }

    .setting-title {
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 10px;
      display: block;
    }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 5px;
      
      .checkbox {
        width: 20px;
        height: 20px;
        border: 1px solid var(--text-secondary);
        border-radius: 4px;
        position: relative;
        
        &.checked:after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background-color: var(--primary-color);
          border-radius: 2px;
        }
      }
      
      text {
        color: var(--text-primary);
        font-size: 14px;
      }
    }

    .setting-tips {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 10px;
    }

    .start-listen-btn {
      margin-top: 30px;
      background-color: var(--primary-color);
      color: #fff;
      text-align: center;
      padding: 10px;
      border-radius: 5px;
      font-size: 16px;
    }
  }

  .listen-player {
    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      .player-title {
        font-size: 18px;
        color: var(--text-primary);
        font-weight: bold;
      }
      
      .player-progress {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }

    .progress-bar {
      margin-bottom: 30px;
      position: relative;
      
      .progress-track {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--border-color-light);
        transform: translateY(-50%);
        z-index: 1;
        
        .progress-fill {
          height: 100%;
          background-color: var(--primary-color);
        }
      }
      
      slider {
        margin: 0;
        z-index: 2;
        position: relative;
      }
    }

    .player-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 30px;
      
      .control-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--background-container);
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--border-color-light);
        
        .iconfont {
          font-size: 20px;
          color: var(--text-primary);
        }
        
        &.play-pause {
          width: 50px;
          height: 50px;
          
          .iconfont {
            font-size: 25px;
          }
        }
      }
    }
  }

  .answer-section {
    .answer-header {
      margin-bottom: 20px;
      
      .answer-title {
        font-size: 18px;
        color: var(--text-primary);
        font-weight: bold;
      }
    }

    .answer-input {
      width: 100%;
      height: 150px;
      background-color: var(--background-container);
      border: 1px solid var(--border-color-light);
      border-radius: 5px;
      padding: 10px;
      color: var(--text-primary);
      font-size: 16px;
      margin-bottom: 20px;
    }

    .answer-buttons {
      display: flex;
      gap: 15px;
      
      .answer-btn {
        flex: 1;
        text-align: center;
        padding: 10px;
        border-radius: 5px;
        font-size: 16px;
        
        &.cancel {
          background-color: var(--background-container);
          border: 1px solid var(--border-color-light);
          color: var(--text-primary);
        }
        
        &.submit {
          background-color: var(--primary-color);
          color: #fff;
        }
      }
    }
  }

  .result-section {
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      .result-title {
        font-size: 18px;
        color: var(--text-primary);
        font-weight: bold;
      }
      
      .result-score {
        font-size: 16px;
        color: var(--primary-color);
        font-weight: bold;
      }
    }

    .result-comparison {
      margin-bottom: 30px;
      
      .comparison-item {
        margin-bottom: 15px;
        
        .comparison-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 5px;
          display: block;
        }
        
        .comparison-text {
          font-size: 16px;
          padding: 10px;
          border-radius: 5px;
          display: block;
          word-break: break-all;
          
          &.correct {
            background-color: rgba(0, 200, 0, 0.1);
            color: #00a000;
          }
          
          &.user {
            background-color: var(--background-container);
            color: var(--text-primary);
          }
        }
      }
    }

    .result-buttons {
      display: flex;
      gap: 15px;
      
      .result-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10px;
        border-radius: 5px;
        background-color: var(--background-container);
        border: 1px solid var(--border-color-light);
        
        .iconfont {
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 5px;
        }
        
        text {
          font-size: 14px;
          color: var(--text-primary);
        }
      }
    }
  }

  .settings-section {
    margin-bottom: 20px;
  }
  
  .listen-settings {
    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .settings-title {
        font-size: 16px;
        color: var(--text-primary);
        font-weight: bold;
      }
      
      .settings-toggle {
        font-size: 16px;
        color: var(--text-secondary);
        transition: transform 0.3s ease;
        transform: rotate(0deg);
        
        &.collapsed {
          transform: rotate(180deg);
        }
      }
    }
    
    .settings-content {
      padding: 0;
      margin-top: 20px;
    }
    
    .setting-group {
      margin-bottom: 15px;
    }

    .setting-title {
      font-size: 16px;
      color: var(--text-primary);
      margin-bottom: 10px;
      display: block;
    }
  }
}
</style>