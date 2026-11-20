<template>
  <view class="cw-listen">
    <!-- 抄听设置部分 -->
    <CardPanel noHighlight padding="20px" class="listen-settings" :class="{ 'collapsed': settingsCollapsed }">
      <view class="settings-header" @click="toggleSettings">
        <text class="settings-title">抄听设置</text>
        <text class="settings-toggle iconfont" :class="{ 'collapsed': settingsCollapsed }">&#xe6b8;</text>
      </view>
      
      <view class="settings-summary" v-if="settingsCollapsed">
        <text class="summary-item">速度：{{ listenOptions.wpm }}WPM</text>
        <text class="summary-item">内容：{{ [
          listenOptions.includeLetters ? '字母' : '',
          listenOptions.includeNumbers ? '数字' : '',
          listenOptions.includeSymbols ? '符号' : ''
        ].filter(Boolean).join('') }}</text>
        <text class="summary-item">字符数量：{{ listenOptions.charCount }}</text>
        <text class="summary-item">字符间隔：{{ listenOptions.charSpacing }}倍dit</text>
      </view>
      
      <view class="settings-content" v-show="!settingsCollapsed">
        <view class="setting-group">
          <text class="setting-title">内容</text>
          <view class="checkbox-group">
            <view class="checkbox-item" @click="toggleOption('includeLetters')">
              <view class="checkbox" :class="{ checked: listenOptions.includeLetters }"></view>
              <text>字母</text>
            </view>
            <view class="checkbox-item" @click="toggleOption('includeNumbers')">
              <view class="checkbox" :class="{ checked: listenOptions.includeNumbers }"></view>
              <text>数字</text>
            </view>
            <view class="checkbox-item" @click="toggleOption('includeSymbols')">
              <view class="checkbox" :class="{ checked: listenOptions.includeSymbols }"></view>
              <text>符号</text>
            </view>
          </view>
        </view>

        <view class="setting-group">
          <text class="setting-title">字符数量: {{ listenOptions.charCount }}</text>
          <slider 
            min="5" 
            max="30" 
            step="5" 
            :value="listenOptions.charCount" 
            @changing="updateCharCount"
            @change="updateCharCount"
            activeColor="#007AFF"
          />
        </view>

        <view class="setting-group">
          <text class="setting-title">速度: {{ listenOptions.wpm }} WPM</text>
          <view class="wpm-buttons">
            <view 
              v-for="speed in wpmOptions" 
              :key="speed"
              class="wpm-btn"
              :class="{ active: listenOptions.wpm === speed }"
              @click="updateWpm(speed)"
            >
              {{ speed }}
            </view>
          </view>
        </view>

        <view class="setting-group">
          <text class="setting-title">字符间隔: {{ listenOptions.charSpacing }}倍dit</text>
          <slider 
            min="1" 
            max="7" 
            step="0.5" 
            :value="listenOptions.charSpacing" 
            @changing="updateCharSpacing"
            @change="updateCharSpacing"
            activeColor="#007AFF"
          />
        </view>

        <!-- <view class="setting-group">
          <text class="setting-title">单词间隔: {{ listenOptions.wordSpacing }}倍</text>
          <slider 
            min="3" 
            max="10" 
            step="1" 
            :value="listenOptions.wordSpacing" 
            @changing="updateWordSpacing"
            activeColor="#007AFF"
          />
        </view> -->

        <!-- 新增应用设置按钮 -->
        <button class="apply-settings-btn" @tap="applySettings">
          应用设置
        </button>
      </view>
    </CardPanel>

    <!-- 播放控制部分 -->
    <CardPanel noHighlight padding="20px" class="listen-player" v-if="isListening">
      <view class="player-header">
        <text class="player-title">
          播放
          <!-- ({{ listenOptions.includeLetters ? '字母' : '' }}{{ listenOptions.includeNumbers ? '数字' : '' }}{{ listenOptions.includeSymbols ? '符号' : '' }}) -->
        </text>
        <text class="player-progress">{{ currentCharPosition + 1 }}/{{ listenContent.replace(/\s/g, '').length }} 字符</text>
      </view>

      <view class="progress-bar">
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: `${playProgress}%` }"></view>
        </view>
        <slider 
          min="0" 
          max="100" 
          :value="playProgress" 
          @change="seekTo"
          activeColor="#007AFF"
        />
      </view>

      <view class="player-controls">
        <view class="control-btn" @click="restartListening">
          <text class="iconfont">&#xe601;</text>
        </view>
        <view class="control-btn play-pause" @click="togglePlayPause">
          <text class="iconfont">{{ !isPaused ? '&#xe62a;' : '&#xe63d;' }}</text>
        </view>
        <!-- <view class="control-btn" @click="newListening">
          <text class="iconfont">&#xe76d;</text>
        </view> -->
      </view>
      <view class="start-listen-btn" @click="newListening">
        <text class="iconfont">&#xe622; 换一换</text>
      </view>
    </CardPanel>

    <!-- 答案输入部分 -->
    <CardPanel noHighlight padding="20px" class="answer-section" v-if="isListening">
      <view class="answer-header">
        <text class="answer-title">请输入您听到的内容</text>
      </view>

      <textarea 
        class="answer-input" 
        v-model="userAnswer" 
        placeholder="在此输入您听到的内容..."
        :maxlength="-1"
        style="text-transform: uppercase;"
      />

      <view class="answer-buttons">
        <view class="answer-btn submit" @click="submitAnswer">
          提交
        </view>
      </view>
    </CardPanel>

    <!-- 结果部分 -->
    <CardPanel noHighlight padding="20px" class="result-section" v-if="showResult">
      <view class="result-header">
        <text class="result-title">抄听结果</text>
        <text class="result-score">正确率: {{ score }}%</text>
      </view>

      <view class="result-comparison">
        <view class="comparison-item">
          <text class="comparison-label">正确内容:</text>
          <text class="comparison-text correct">{{ listenContent }}</text>
          <text class="comparison-morse">{{ getContentMorse(listenContent) }}</text>
        </view>
        <view class="comparison-item">
          <text class="comparison-label">您的答案:</text>
          <text class="comparison-text user">{{ userAnswer.toUpperCase() }}</text>
          <text class="comparison-morse">{{ getContentMorse(userAnswer) }}</text>
        </view>
      </view>
      
      <!-- 新增重新播放按钮 -->
      <view class="replay-btn" @click="replayResult">
        <text class="iconfont">&#xe601; 再听一遍</text>
      </view>
    </CardPanel>

    <!-- 修改历史记录部分 -->
    <CardPanel noHighlight padding="20px" class="history-section" v-if="true">
      <view class="settings-header" @click="toggleHistory">
        <text class="settings-title">练习历史</text>
        <text class="settings-toggle iconfont" :class="{ 'collapsed': historyCollapsed }">&#xe6b8;</text>
      </view>
      
      <view class="history-content" v-show="!historyCollapsed">
        <view v-if="practiceHistory.length > 0">
          <view 
            v-for="(record, index) in displayedHistory" 
            :key="index"
            class="history-item"
          >
            <view class="history-header">
              <text class="history-date">{{ formatDate(record.date) }}</text>
              <text class="history-score">正确率: {{ record.score }}%</text>
            </view>
            <view class="history-settings">
              <text class="settings-badge">{{ record.wpm }}WPM</text>
              <text class="settings-badge">间隔{{ record.charSpacing }}倍</text>
              <text class="settings-badge">{{ record.charCount }}字符</text>
            </view>
            <view class="history-details">
              <view class="history-row">
                <text class="history-label">正确内容:</text>
                <text class="history-text">{{ record.content }}</text>
              </view>
              <view class="history-row">
                <text class="history-label">您的答案:</text>
                <text class="history-text">{{ record.answer }}</text>
              </view>
            </view>
          </view>
          
          <view class="view-more" @click="toggleViewAll" v-if="practiceHistory.length > 10 && !viewAllHistory">
            查看全部记录({{ practiceHistory.length }}条)
          </view>
          
          <view class="view-more" @click="toggleViewAll" v-if="viewAllHistory">
            收起记录
          </view>
        </view>
        
        <view v-else class="empty-history">
          <text>暂无练习记录</text>
        </view>
      </view>
    </CardPanel>
  </view>
</template>

<script>
import CardPanel from '../../../components/CardPanel/CardPanel.vue'
export default {
  components: {
    CardPanel
  },
  props: {
    audioCtx: {
      type: Object,
      required: true
    },
    categorizedMorse: {
      type: Object,
      required: true
    },
    dit: {
      type: Number,
      required: true
    },
    freq: {
      type: Number,
      required: true
    }
  },

  onMounted () {
    uni.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },
  
  data() {
    return {
      isListening: false,
      showResult: false,
      isPaused: true,
      settingsCollapsed: true,
      historyCollapsed: true,
      wpmOptions: [5, 10, 15, 20, 25, 30],
      listenOptions: {
        includeLetters: true,
        includeNumbers: false,
        includeSymbols: false,
        charCount: 5,
        charSpacing: 3,
        wordSpacing: 7,
        wpm: 10
      },
      listenContent: '',
      userAnswer: '',
      playProgress: 0,
      currentPlayPosition: '00:00',
      totalPlayDuration: '00:00',
      currentCharPosition: 0,
      progressTimer: null,
      listenAudioBuffer: null,
      listenSource: null,
      listenStartTime: 0,
      listenPausedAt: 0,
      score: 0,
      localDit: 60,
      practiceHistory: [],
      viewAllHistory: false,
      displayedHistory: [],
      previousSettings: {...this.listenOptions}
    }
  },
  
  computed: {
    // 根据是否查看全部来显示历史记录
    displayedHistory() {
      return this.viewAllHistory ? this.practiceHistory : this.practiceHistory.slice(0, 10);
    }
  },
  
  created() {
    // 从本地存储加载上次的设置
    this.loadSettings()
    
    // 从本地存储加载历史记录
    this.loadHistory()
    
    // 初始化时自动生成内容但不播放
    this.initListening()
  },
  
  methods: {
    toggleSettings() {
      this.settingsCollapsed = !this.settingsCollapsed
    },
    
    toggleHistory() {
      this.historyCollapsed = !this.historyCollapsed
    },
    
    loadSettings() {
      const savedSettings = uni.getStorageSync('cw_listen_options')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          this.listenOptions = { ...this.listenOptions, ...settings }
        } catch (e) {
          console.error('Failed to parse saved settings', e)
        }
      }
      
      // 更新 dit 值
      this.updateLocalDit()
    },
    
    saveSettings() {
      uni.setStorageSync('cw_listen_options', JSON.stringify(this.listenOptions))
    },
    
    toggleOption(option) {
      this.listenOptions[option] = !this.listenOptions[option]
      
      // 确保至少选择一项
      if (!this.listenOptions.includeLetters && 
          !this.listenOptions.includeNumbers && 
          !this.listenOptions.includeSymbols) {
        this.listenOptions[option] = true
      }
      
      this.saveSettings()
    },
    
    updateCharCount(e) {
      this.listenOptions.charCount = e.detail.value
      this.saveSettings()
    },
    
    updateCharSpacing(e) {
      this.listenOptions.charSpacing = e.detail.value
    },
    
    updateWpm(speed) {
      this.listenOptions.wpm = speed
      this.updateLocalDit()
    },
    
    updateLocalDit() {
      // 根据 WPM 计算 dit 时长
      this.localDit = Math.round(1200 / this.listenOptions.wpm)
    },
    
    generateListenContent() {
      let availableChars = []
      
      if (this.listenOptions.includeLetters) {
        availableChars = availableChars.concat(this.categorizedMorse.letters)
      }
      
      if (this.listenOptions.includeNumbers) {
        availableChars = availableChars.concat(this.categorizedMorse.numbers)
      }
      
      if (this.listenOptions.includeSymbols) {
        availableChars = availableChars.concat(this.categorizedMorse.symbols)
      }
      
      let content = ''
      for (let i = 0; i < this.listenOptions.charCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length)
        content += availableChars[randomIndex].char
        
        // 每5个字符添加空格，模拟单词
        if ((i + 1) % 5 === 0 && i < this.listenOptions.charCount - 1) {
          content += ' '
        }
      }
      
      return content
    },
    
    async initListening() {
      const wasPlaying = !this.isPaused;
      if (wasPlaying) {
        this.pauseListenAudio();
      }

      this.listenContent = this.generateListenContent();
      this.isListening = true;
      this.showResult = false;
      this.isPaused = true;
      this.playProgress = 0;
      this.userAnswer = '';

      await this.generateListenAudio(this.listenContent);
      this.currentPlayPosition = '00:00';

      if (wasPlaying) {
        this.playListenAudio();
        this.startProgressTimer();
      }
    },
    
    async startListening() {
      // 停止可能存在的音频源
      if (this.listenSource) {
        this.listenSource.stop()
      }
      this.stopProgressTimer()
      
      await this.initListening()
      
      // 开始播放
      this.playListenAudio()
      
      // 开始进度更新
      this.startProgressTimer()
    },
    
    async generateListenAudio(content) {
      // 如果有现有的音频源，先停止它
      if (this.listenSource) {
        try {
          this.listenSource.stop()
        } catch (e) {
          console.warn('停止音频源时出错:', e)
        }
        this.listenSource = null
      }

      const ctx = this.audioCtx

      // 检查音频上下文是否有效
      if (!ctx || ctx.state === 'closed') {
        console.error('音频上下文无效或已关闭')
        uni.showToast({
          title: '音频生成失败',
          icon: 'none'
        })
        return
      }

      const charSpacing = this.localDit * this.listenOptions.charSpacing
      const wordSpacing = this.localDit * this.listenOptions.wordSpacing
      
      // 计算总时长
      let totalDuration = 0
      for (let i = 0; i < content.length; i++) {
        const char = content[i]
        
        if (char === ' ') {
          totalDuration += wordSpacing
          continue
        }
        
        // 查找字符的莫尔斯码
        const morseItem = this.findMorseItem(char)
        if (!morseItem) continue
        
        const code = morseItem.code
        
        for (const symbol of code) {
          if (symbol === '·') {
            totalDuration += this.localDit
            totalDuration += this.localDit // 间隔
          } else if (symbol === '-') {
            totalDuration += this.localDit * 3
            totalDuration += this.localDit // 间隔
          }
        }
        
        // 字符间间隔
        if (i < content.length - 1 && content[i+1] !== ' ') {
          totalDuration += charSpacing
        }
      }
      
      // 创建音频缓冲区
      let audioBuffer, channelData
      try {
        audioBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * (totalDuration / 1000)), ctx.sampleRate)
        if (!audioBuffer) {
          console.error('无法创建音频缓冲区')
          return
        }
        channelData = audioBuffer.getChannelData(0)
      } catch (e) {
        console.error('创建音频缓冲区时出错:', e)
        uni.showToast({
          title: '音频生成失败',
          icon: 'none'
        })
        return
      }
      
      // 生成音频数据
      let currentTime = 0
      for (let i = 0; i < content.length; i++) {
        const char = content[i]
        
        if (char === ' ') {
          currentTime += wordSpacing / 1000
          continue
        }
        
        // 查找字符的莫尔斯码
        const morseItem = this.findMorseItem(char)
        if (!morseItem) continue
        
        const code = morseItem.code
        
        for (const symbol of code) {
          if (symbol === '·') {
            this.generateTone(channelData, currentTime, this.localDit / 1000, ctx.sampleRate)
            currentTime += this.localDit / 1000
            currentTime += this.localDit / 1000 // 间隔
          } else if (symbol === '-') {
            this.generateTone(channelData, currentTime, this.localDit * 3 / 1000, ctx.sampleRate)
            currentTime += this.localDit * 3 / 1000
            currentTime += this.localDit / 1000 // 间隔
          }
        }
        
        // 字符间间隔
        if (i < content.length - 1 && content[i+1] !== ' ') {
          currentTime += charSpacing / 1000
        }
      }
      
      this.listenAudioBuffer = audioBuffer
      this.totalPlayDuration = this.formatTime(audioBuffer.duration)
    },
    
    findMorseItem(char) {
      // 在所有分类中查找字符
      for (const category of ['letters', 'numbers', 'symbols']) {
        const found = this.categorizedMorse[category].find(item => item.char === char.toUpperCase())
        if (found) return found
      }
      return null
    },
    
    generateTone(channelData, startTime, duration, sampleRate) {
      const startSample = Math.floor(startTime * sampleRate)
      const endSample = Math.floor((startTime + duration) * sampleRate)
      
      // 添加淡入淡出以避免爆音
      const fadeInSamples = Math.min(Math.floor(0.005 * sampleRate), Math.floor((endSample - startSample) / 4))
      const fadeOutSamples = Math.min(Math.floor(0.005 * sampleRate), Math.floor((endSample - startSample) / 4))
      
      for (let i = startSample; i < endSample; i++) {
        // 正弦波
        const t = (i - startSample) / sampleRate
        const value = Math.sin(2 * Math.PI * this.freq * t)
        
        // 应用渐变
        let amplitude = 0.8
        if (i - startSample < fadeInSamples) {
          amplitude *= (i - startSample) / fadeInSamples
        } else if (endSample - i < fadeOutSamples) {
          amplitude *= (endSample - i) / fadeOutSamples
        }
        
        channelData[i] += value * amplitude
      }
    },
    
    playListenAudio() {
      if (!this.listenAudioBuffer) return

      // 先停止可能存在的音频源，避免声音重叠
      if (this.listenSource) {
        try {
          this.listenSource.stop()
        } catch (e) {
          console.warn('停止音频源时出错:', e)
        }
      }

      const ctx = this.audioCtx

      // 检查音频上下文是否有效
      if (!ctx || ctx.state === 'closed') {
        console.error('音频上下文无效或已关闭')
        uni.showToast({
          title: '音频播放失败',
          icon: 'none'
        })
        return
      }

      try {
        const source = ctx.createBufferSource()
        if (!source) {
          console.error('无法创建音频缓冲源')
          return
        }

        source.buffer = this.listenAudioBuffer
        source.connect(ctx.destination)

        if (this.isPaused) {
          // 从暂停位置继续
          this.listenStartTime = ctx.currentTime - this.listenPausedAt
          source.start(0, this.listenPausedAt)
        } else {
          // 从头开始
          this.listenStartTime = ctx.currentTime
          source.start()
        }

        this.listenSource = source
        this.isPaused = false
      } catch (e) {
        console.error('播放音频时出错:', e)
        uni.showToast({
          title: '音频播放失败',
          icon: 'none'
        })
      }
    },
    
    pauseListenAudio() {
      if (this.listenSource) {
        this.listenSource.stop()
        this.listenPausedAt = this.audioCtx.currentTime - this.listenStartTime
        this.isPaused = true
        this.stopProgressTimer()
      }
    },
    
    togglePlayPause() {
      if (this.isPaused) {
        // 如果播放已结束（进度为100%），则从头开始播放
        if (this.playProgress >= 100) {
          this.restartListening()
        } else {
          this.playListenAudio()
          this.startProgressTimer()
        }
      } else {
        this.pauseListenAudio()
      }
    },
    
    restartListening() {
      if (this.listenSource) {
        this.listenSource.stop()
      }
      this.isPaused = false
      this.listenPausedAt = 0
      this.playProgress = 0
      this.currentPlayPosition = '00:00'
      this.playListenAudio()
      this.startProgressTimer()
    },
    
    seekTo(e) {
      if (!this.listenAudioBuffer) return
      
      const progress = e.detail.value
      const duration = this.listenAudioBuffer.duration
      const seekTime = duration * (progress / 100)
      
      if (this.listenSource) {
        this.listenSource.stop()
      }
      
      // 停止进度计时器
      this.stopProgressTimer()
      
      this.listenPausedAt = seekTime
      this.isPaused = true
      this.playProgress = progress
      this.currentPlayPosition = this.formatTime(seekTime)
      
      // 如果之前在播放，则继续播放
      if (!this.isPaused) {
        this.playListenAudio()
        this.startProgressTimer()
      }
    },
    
    startProgressTimer() {
      this.stopProgressTimer()
      
      this.progressTimer = setInterval(() => {
        if (!this.listenAudioBuffer || this.isPaused) return
        
        const currentTime = this.audioCtx.currentTime - this.listenStartTime
        const duration = this.listenAudioBuffer.duration
        
        // 增加容错机制
        if (currentTime >= duration - 0.1) { // 增加0.1秒容差
          this.playProgress = 100
          this.stopProgressTimer()
          this.isPaused = true
          this.listenPausedAt = 0
          return
        }
        
        if (currentTime >= 0 && currentTime <= duration) {
          this.playProgress = (currentTime / duration) * 100
          this.currentPlayPosition = this.formatTime(currentTime)
          
          // 计算当前播放到的字符位置
          const contentWithoutSpaces = this.listenContent.replace(/\s/g, '');
          this.currentCharPosition = Math.min(
            Math.floor((currentTime / duration) * contentWithoutSpaces.length),
            contentWithoutSpaces.length
          );
        } else if (currentTime > duration) {
          this.stopProgressTimer()
          this.isPaused = true  // 播放结束时设置为暂停状态
          this.listenPausedAt = 0  // 重置暂停位置
        }
      }, 100)
    },
    
    stopProgressTimer() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    
    submitAnswer() {
      // 计算得分
      this.calculateScore()
      
      // 添加到历史记录
      this.addToHistory()
      
      // 显示结果
      this.showResult = true
    },
    
    calculateScore() {
      const correctAnswer = this.listenContent.replace(/\s/g, '').toUpperCase()
      const userAnswer = this.userAnswer.replace(/\s/g, '').toUpperCase()
      
      let correctCount = 0
      const maxLength = Math.max(correctAnswer.length, userAnswer.length)
      
      for (let i = 0; i < maxLength; i++) {
        if (i < correctAnswer.length && i < userAnswer.length && correctAnswer[i] === userAnswer[i]) {
          correctCount++
        }
      }
      
      this.score = Math.round((correctCount / correctAnswer.length) * 100)
    },
    
    newListening() {
      if (this.listenSource) {
        this.listenSource.stop()
      }
      this.stopProgressTimer()
      this.updateLocalDit()
      this.startListening()
    },
    
    // 获取内容的摩尔斯码表示
    getContentMorse(content) {
      if (!content) return '';
      
      const chars = content.toUpperCase().split('');
      const morseCodes = chars.map(char => {
        if (char === ' ') return '    ';
        
        const morseItem = this.findMorseItem(char);
        return morseItem ? morseItem.code : '';
      });
      
      return morseCodes.join(' ');
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },
    
    // 切换全部历史记录显示
    toggleViewAll() {
      this.viewAllHistory = !this.viewAllHistory;
    },
    
    // 加载历史记录
    loadHistory() {
      const savedHistory = uni.getStorageSync('cw_listen_history')
      if (savedHistory) {
        try {
          this.practiceHistory = JSON.parse(savedHistory)
        } catch (e) {
          console.error('加载历史记录失败', e)
          this.practiceHistory = []
        }
      }
    },
    
    // 保存历史记录
    saveHistory() {
      uni.setStorageSync('cw_listen_history', JSON.stringify(this.practiceHistory))
    },
    
    // 添加记录到历史
    addToHistory() {
      const record = {
        date: new Date().getTime(),
        content: this.listenContent,
        answer: this.userAnswer.toUpperCase(),
        score: this.score,
        wpm: this.listenOptions.wpm,
        charSpacing: this.listenOptions.charSpacing,
        charCount: this.listenOptions.charCount,
        includeLetters: this.listenOptions.includeLetters,
        includeNumbers: this.listenOptions.includeNumbers,
        includeSymbols: this.listenOptions.includeSymbols
      }
      
      this.practiceHistory.unshift(record) // 添加到历史记录开头
      
      // 限制历史记录数量，最多保存100条
      if (this.practiceHistory.length > 100) {
        this.practiceHistory = this.practiceHistory.slice(0, 100)
      }
      
      // 保存到本地存储
      this.saveHistory()
    },
    
    applySettings() {
      // 显示提示
      uni.showToast({
        title: '设置已应用',
        icon: 'success',
        duration: 2000
      });

      this.settingsCollapsed = true
      
      // 检测内容相关设置是否变化
      const contentSettingsChanged = 
        this.listenOptions.includeLetters !== this.previousSettings.includeLetters ||
        this.listenOptions.includeNumbers !== this.previousSettings.includeNumbers ||
        this.listenOptions.includeSymbols !== this.previousSettings.includeSymbols ||
        this.listenOptions.charCount !== this.previousSettings.charCount;

      // 保存当前设置
      this.saveSettings();
      const wasPlaying = !this.isPaused;
      const currentProgress = this.playProgress;

      // 停止当前播放
      if (this.listenSource) {
        this.listenSource.stop();
      }
      this.stopProgressTimer();

      if (contentSettingsChanged) {
        // 内容设置变化时重新初始化
        this.initListening().then(() => {
          if (wasPlaying) {
            this.playListenAudio();
            this.startProgressTimer();
          }
          // 更新previousSettings
          this.previousSettings = {...this.listenOptions};
        });
      } else {
        // 仅播放参数变化时重新生成当前内容音频
        this.generateListenAudio(this.listenContent).then(() => {
          if (wasPlaying) {
            const seekTime = this.listenAudioBuffer.duration * (currentProgress / 100);
            this.listenPausedAt = seekTime;
            this.playListenAudio();
            this.startProgressTimer();
          }
          // 更新previousSettings
          this.previousSettings = {...this.listenOptions};
        });
      }
    },
    
    // 新增重新播放结果函数
    replayResult() {
      if (this.listenSource) {
        this.listenSource.stop();
      }
      this.stopProgressTimer();
      
      // 重置播放位置
      this.listenPausedAt = 0;
      this.playProgress = 0;
      this.currentCharPosition = 0;
      
      // 播放音频
      this.playListenAudio();
      this.startProgressTimer();
    }
  },
  
  beforeUnmount() {
    this.stopProgressTimer()
    if (this.listenSource) {
      this.listenSource.stop()
    }
  }
}
</script>

<style lang="less" scoped>
slider {
  margin: 0;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 0 7px;
}

.start-listen-btn {
  margin-top: 15px;
  background-color: var(--primary-color);
  color: #fff;
  text-align: center;
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
}

.cw-listen {
  .listen-settings,
  .listen-player,
  .answer-section,
  .result-section,
  .history-section {
    display: block;
    margin-bottom: 15px;
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
    
    .settings-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 7.5px 0;
      
      .summary-item {
        font-size: 13px;
        color: var(--text-secondary);
        background-color: var(--background-primary);
        padding: 3px 8px;
        border-radius: 15px;
      }
    }
    
    .settings-content {
      padding: 0;
      margin-top: 20px;
    }
    
    .setting-group {
      margin-bottom: 30px;
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

    // 新增应用设置按钮
    .apply-settings-btn {
      width: 100%;
      margin-top: 15px;
      background-color: var(--primary-color);
      color: #fff;
      text-align: center;
      padding: 0 10px;
      border-radius: 5px;
      font-size: 16px;
    }
  }

  .listen-player {
    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .player-title {
        font-size: 16px;
        color: var(--text-primary);
        font-weight: bold;
      }
      
      .player-progress {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }

    .progress-bar {
      margin: 20px 0 15px 0;
      position: relative;
      
      .progress-track {
        position: absolute;
        top: 50%;
        left: 7.5px;
        right: 7.5px;
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
        border: 1px solid var(--text-primary);
        
        .iconfont {
          font-size: 20px;
          color: var(--text-primary);
        }
      }
    }
  }

  .answer-section {
    .answer-header {
      margin-bottom: 10px;
      
      .answer-title {
        font-size: 16px;
        color: var(--text-primary);
        font-weight: bold;
      }
    }

    .answer-input {
      width: 100%;
      height: 100px;
      background-color: var(--background-primary);
      border: 1px solid var(--border-color-light);
      border-radius: 10px;
      padding: 10px;
      color: var(--text-primary);
      font-size: 16px;
      margin-bottom: 10px;
      text-transform: uppercase;
      box-sizing: border-box;
    }

    .answer-buttons {
      .answer-btn {
        text-align: center;
        padding: 10px;
        border-radius: 5px;
        font-size: 16px;
        
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
      margin-bottom: 10px;
      
      .result-title {
        font-size: 16px;
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
      .comparison-item {
        margin-bottom: 10px;
        
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
          margin-bottom: 5px;
          
          &.correct {
            background-color: rgba(0, 200, 0, 0.1);
            color: #00a000;
          }
          
          &.user {
            background-color: var(--background-primary);
            color: var(--text-primary);
          }
        }
        
        .comparison-morse {
          font-size: 14px;
          padding: 5px 10px;
          background-color: var(--background-primary);
          color: var(--text-secondary);
          border-radius: 5px;
          display: block;
          word-break: break-all;
          font-family: monospace;
          letter-spacing: 1px;
        }
      }
    }
    
    // 新增重播按钮样式
    .replay-btn {
      margin-top: 15px;
      background-color: var(--primary-color);
      color: #fff;
      text-align: center;
      padding: 10px;
      border-radius: 5px;
      font-size: 16px;
    }
  }

  .history-section {
    margin-top: 15px;
    
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
    
    .history-content {
      margin-top: 15px;
    }
    
    .history-item {
      margin-bottom: 15px;
      padding: 10px;
      background-color: var(--background-primary);
      border-radius: 5px;
      
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        
        .history-date {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .history-score {
          font-size: 13px;
          color: var(--primary-color);
          font-weight: bold;
        }
      }
      
      .history-settings {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 8px;
        
        .settings-badge {
          font-size: 11px;
          background-color: var(--background-container);
          color: var(--text-secondary);
          padding: 2px 6px;
          border-radius: 15px;
        }
      }
      
      .history-details {
        .history-row {
          margin-bottom: 5px;
          
          .history-label {
            font-size: 13px;
            color: var(--text-secondary);
            margin-right: 5px;
          }
          
          .history-text {
            font-size: 14px;
            color: var(--text-primary);
            word-break: break-all;
          }
        }
      }
    }
    
    .view-more {
      text-align: center;
      padding: 10px;
      color: var(--primary-color);
      font-size: 14px;
    }
    
    .empty-history {
      text-align: center;
      padding: 15px;
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
}

.apply-settings-btn {
  margin-top: 15px;
  background-color: var(--primary-color);
  color: #fff;
  text-align: center;
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
}
</style>
