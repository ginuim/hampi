<template>
  <view class="detail-page" :class="{ 'dark': isDark }">
    <NavBar :title="title" />
    
    <view class="container">
      <!-- 添加搜索框 -->
      <view class="search-bar">
        <view class="search-input">
          <text class="search-icon iconfont">&#xe64c;</text>
          <input 
            type="text" 
            v-model="searchText" 
            :placeholder="'搜索' + title" 
            confirm-type="search"
            @input="onSearch"
          />
          <text v-if="searchText" class="clear-icon iconfont" @tap="clearSearch">&#xe648;</text>
        </view>
      </view>
      
      <view class="detail-card">
        <!-- 添加标签页 - 仅当数据类型为phonetic或dx-phonetic时显示 -->
        <view v-if="source === 'phonetic' || source === 'dx-phonetic'" class="tabs">
          <view 
            class="tab-item" 
            :class="{ 'active': activeTab === 'phonetic' }"
            @tap="switchTab('phonetic')"
          >
            标准字母解释法
          </view>
          <view 
            class="tab-item" 
            :class="{ 'active': activeTab === 'dx-phonetic' }"
            @tap="switchTab('dx-phonetic')"
          >
            其他字母解释法
          </view>
        </view>
        
        <scroll-view 
          scroll-y 
          :class="['detail-content', source.includes('phonetic') ? 'detail-content-phonetic' : '']"
          :scroll-top="scrollTop"
          @scrolltolower="onScrollToLower"
        >
          <view v-if="loading" class="loading">加载中...</view>
          <block v-else>
            <!-- 音标数据使用网格布局 -->
            <template v-if="source === 'phonetic' || source === 'dx-phonetic'">
              <view class="morse-grid">
                <view 
                  class="morse-item"
                  v-for="(item, idx) in filteredData" 
                  :key="idx"
                  :class="{ 'highlight': idx === currentIndex }"
                  :id="`item-${idx}`"
                  @click="playPhoneticAudio(item.split(':')[0])"
                >
                  <text class="character">{{ item.split(':')[0] }}</text>
                  <text class="code">{{ item.split(':')[1] }}</text>
                </view>
              </view>
            </template>
            <!-- 其他类型数据保持原有布局 -->
            <template v-else>
              <view 
                class="content-item" 
                v-for="(item, idx) in filteredData" 
                :key="idx"
                :class="{ 'highlight': idx === currentIndex }"
                :id="`item-${idx}`"
              >
                <text class="item-value">{{ item }}</text>
              </view>
            </template>
            
            <!-- 当没有搜索结果时显示提示 -->
            <view v-if="filteredData.length === 0" class="no-results">
              没有找到匹配的结果
            </view>
          </block>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import qcodesJson from '@/resources/json/qcodes.json'
import regionJson from '@/resources/json/region.json'
import morseJson from '@/resources/json/morse.json'
import hamabbrJson from '@/resources/json/hamabbr.json'
import phoneticJson from '@/resources/json/phonetic.json'
import dxPhoneticJson from '@/resources/json/dx-phonetic.json'
// 导入音频文件
import phoneticAudioFile from '@/assets/freecompress-phonetic.mp3'
import dxPhoneticAudioFile from '@/assets/freecompress-dx-phonetic.mp3' // 添加dx-phonetic音频文件

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const title = ref('')
const loading = ref(true)
const detailData = ref([])
const currentIndex = ref(0)
const source = ref('')
const scrollTop = ref(0)
const audioContext = ref(null)
const audioTimer = ref(null)
const searchText = ref('')
const originalData = ref([]) // 存储原始数据
const activeTab = ref('phonetic') // 当前激活的标签

// 将 timeMap 提取到函数外部
const phoneticTimeMap = {
  // 每个字符的开始播放时间和持续时间（秒）
  'a': { start: 0, duration: 1.5 },
  'b': { start: 1.5, duration: 1.5 },
  'c': { start: 3, duration: 1.4 },
  'd': { start: 4.4, duration: 1.5 },
  'e': { start: 6, duration: 1.5 },
  'f': { start: 7.5, duration: 1.5 },
  'g': { start: 9, duration: 1.5 },
  'h': { start: 10.5, duration: 1.5 },
  'i': { start: 12, duration: 1.5 },
  'j': { start: 13.7, duration: 1.5 },
  'k': { start: 15.2, duration: 1.5 },
  'l': { start: 16.7, duration: 1.5 },
  'm': { start: 18.2, duration: 1.5 },
  'n': { start: 19.7, duration: 1.5 },
  'o': { start: 21.2, duration: 1.5 },
  'p': { start: 22.5, duration: 1.5 },
  'q': { start: 24, duration: 1.5 },
  'r': { start: 25.5, duration: 1.5 },
  's': { start: 27.2, duration: 1.5 },
  't': { start: 28.7, duration: 1.5 },
  'u': { start: 30.2, duration: 1.5 },
  'v': { start: 31.7, duration: 1.5 },
  'w': { start: 33.2, duration: 1.5 },
  'x': { start: 34.7, duration: 1.5 },
  'y': { start: 36.2, duration: 1.5 },
  'z': { start: 37.7, duration: 1.5 },
}

// 添加 dx-phonetic 的 timeMap
const dxPhoneticTimeMap = {
  // 每个字符的开始播放时间和持续时间（秒）- 请根据实际音频文件调整
  'a': { start: 0, duration: 1.2 },
  'b': { start: 1.5, duration: 0.8 },
  'c': { start: 2.5, duration: 0.5 },
  'd': { start: 3.5, duration: 0.8 },
  'e': { start: 4.5, duration: 0.8 },
  'f': { start: 5.6, duration: 0.6 },
  'g': { start: 6.2, duration: 0.8 },
  'h': { start: 7, duration: 1 },
  'i': { start: 8.2, duration: 1.1 },
  'j': { start: 9.5, duration: 1 },
  'k': { start: 10.5, duration: 1.2 },
  'l': { start: 11.7, duration: 1 },
  'm': { start: 12.7, duration: 1.2 },
  'n': { start: 13.9, duration: 1 },
  'o': { start: 14.9, duration: 1.2 },
  'p': { start: 16.1, duration: 1.1 },
  'q': { start: 17.9, duration: 1 },
  'r': { start: 18.9, duration: 1.2 },
  's': { start: 20.1, duration: 0.9 },
  't': { start: 21, duration: 1 },
  'u': { start: 22, duration: 1.2 },
  'v': { start: 23.7, duration: 0.8 },
  'w': { start: 24.5, duration: 1.2 },
  'x': { start: 25.8, duration: 1 },
  'y': { start: 26.8, duration: 1 },
  'z': { start: 28.2, duration: 1 },
}

// 计算过滤后的数据
const filteredData = computed(() => {
  if (!searchText.value) {
    return detailData.value
  }
  
  const query = searchText.value.toLowerCase()
  return detailData.value.filter(item => {
    if (source.value === 'phonetic') {
      // 对于音标数据，同时搜索字符和音标
      const [char, code] = item.split(':')
      return char.toLowerCase().includes(query) || 
             code.toLowerCase().includes(query)
    } else {
      // 对于其他数据，直接搜索整个字符串
      return item.toLowerCase().includes(query)
    }
  })
})

// 搜索处理函数
const onSearch = () => {
  scrollTop.value = 0 // 搜索时滚动回顶部
  currentIndex.value = null // 重置高亮项
}

// 清除搜索文本
const clearSearch = () => {
  searchText.value = ''
  onSearch()
}

// 初始化音频上下文
const initAudioContext = () => {
  if (!audioContext.value) {
    audioContext.value = uni.createInnerAudioContext()
    audioContext.value.src = phoneticAudioFile
    
    // 处理错误情况
    audioContext.value.onError((err) => {
      console.error('音频播放错误:', err)
      // 尝试使用备选路径
      audioContext.value.src = '../../assets/phonetic.mp3'
      
      // 设置第二次的错误处理
      audioContext.value.onError((err2) => {
        console.error('备选路径也失败:', err2)
        uni.showToast({
          title: '音频播放失败',
          icon: 'none'
        })
        
        // 清理资源
        if (audioContext.value) {
          audioContext.value.destroy()
          audioContext.value = null
        }
      })
    })
  }
}

onMounted(() => {
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
  
  // 页面加载时初始化音频上下文
  initAudioContext()
})

// 在组件卸载时清理音频资源
onUnmounted(() => {
  if (audioTimer.value) {
    clearTimeout(audioTimer.value)
  }
  if (audioContext.value) {
    audioContext.value.destroy()
  }
})

// 滚动到指定位置
const scrollToIndex = (index) => {
  if (index === null || index === undefined) return
  
  // 等待DOM更新完成后再滚动
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query.select(`#item-${index}`).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      if (res[0]) {
        // 计算需要滚动的距离
        scrollTop.value = res[0].top - 200 // 200是预留的顶部空间，可以根据实际情况调整
      }
    })
  })
}

// 修改获取详情数据函数
const getDetailData = async (sourceType, index) => {
  try {
    loading.value = true
    
    let jsonData
    switch (sourceType) {
      case 'qcodes':
        jsonData = qcodesJson
        break
      case 'region':
        jsonData = regionJson
        break
      case 'morse':
        jsonData = morseJson
        break
      case 'hamabbr':
        jsonData = hamabbrJson
        break
      case 'phonetic':
        jsonData = phoneticJson
        activeTab.value = 'phonetic'
        break
      case 'dx-phonetic':
        jsonData = dxPhoneticJson
        activeTab.value = 'dx-phonetic'
        break
      default:
        break
    }
    
    title.value = jsonData.title
    detailData.value = jsonData.data
    originalData.value = [...jsonData.data] // 保存原始数据副本
    currentIndex.value = index !== null ? parseInt(index) : null
    
    if (currentIndex.value !== null) {
      scrollToIndex(currentIndex.value)
    }
    
  } catch (error) {
    console.error('获取详情数据失败:', error)
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 添加标签切换函数
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  currentIndex.value = null
  searchText.value = ''
  
  // 根据选择的标签加载对应数据
  getDetailData(tab, null)
}

// 分享功能
const handleShare = () => {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
  // #endif
}

// 处理滚动到底部事件
const onScrollToLower = () => {
  // 可以在这里处理加载更多数据的逻辑
}

// 优化后的播放音标发音函数
const playPhoneticAudio = (character) => {
  // 清理现有音频资源和定时器
  const cleanupAudio = () => {
    if (audioContext.value) {
      audioContext.value.stop()
      audioContext.value.destroy()
      audioContext.value = null
    }
    if (audioTimer.value) {
      clearTimeout(audioTimer.value)
      audioTimer.value = null
    }
  }

  cleanupAudio() // 先清理之前的资源

  // 找到当前字符对应的索引
  const charIndex = detailData.value.findIndex(item => 
    item.toLowerCase().startsWith(character.toLowerCase() + ':')
  );
  currentIndex.value = charIndex;

  // 获取字符的小写形式
  const char = character.toLowerCase()
  
  // 根据当前活动标签选择相应的timeMap和音频文件
  const currentTimeMap = activeTab.value === 'phonetic' ? phoneticTimeMap : dxPhoneticTimeMap
  const audioFile = activeTab.value === 'phonetic' ? phoneticAudioFile : dxPhoneticAudioFile
  
  if (!currentTimeMap[char]) {
    uni.showToast({
      title: '未找到该字母的音频',
      icon: 'none'
    })
    return
  }
  
  // 创建新的音频实例
  audioContext.value = uni.createInnerAudioContext()
  audioContext.value.src = audioFile
  audioContext.value.startTime = currentTimeMap[char].start

  // 统一错误处理
  const errorHandler = (err) => {
    console.error('音频播放错误:', err)
    uni.showToast({
      title: '音频播放失败',
      icon: 'none'
    })
    cleanupAudio()
  }

  audioContext.value.onError(errorHandler)
  
  // 新增播放结束监听
  audioContext.value.onEnded(() => {
    cleanupAudio()
    currentIndex.value = null
  })

  // 开始播放
  audioContext.value.play()

  // 设置双重停止保障
  audioTimer.value = setTimeout(() => {
    cleanupAudio()
    currentIndex.value = null
  }, currentTimeMap[char].duration * 1000 + 300)
}

// 重置函数 - 可在需要时恢复原始数据
const resetData = () => {
  searchText.value = ''
  detailData.value = [...originalData.value]
  scrollTop.value = 0
  currentIndex.value = null
}

onLoad((options) => {
  const { source: sourceType, index } = options
  source.value = sourceType
  
  if (sourceType) {
    getDetailData(sourceType, index ? parseInt(index) : null)
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
  }
})
</script>

<style lang="less" scoped>
.detail-page {
  height: 100vh;
  overflow: hidden;
  background-color: var(--background-primary);
}

.container {
  padding: 10px;
}

/* 添加搜索框样式 */
.search-bar {
  margin-bottom: 10px;
  
  .search-input {
    display: flex;
    align-items: center;
    background-color: var(--search-background);
    border-radius: 20px;
    padding: 7.5px 10px;
    
    .search-icon {
      margin-left: 10px;
      margin-right: 5px;
      color: var(--text-secondary);
    }
    
    input {
      flex: 1;
      height: 30px;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .clear-icon {
      padding: 0 5px;
      font-size: 19px;
      color: var(--text-tertiary);
    }
  }
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.detail-card {
  background-color: var(--background-container);
  border-radius: 15px;
  margin-bottom: 10px;
  
  .detail-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-primary);
    margin: 0 10px 20px 20px;

    display: block;
    text-align: left;
    padding-left: 10px;
    line-height: 1;
    border-left: 4px solid var(--text-secondary);
    color: var(--text-primary);
  }
  
  .detail-content {
    padding: 10px 15px;
    box-sizing: border-box;
    height: calc(100vh - 180px); // 修改高度以适应搜索框
    overflow-y: auto;
  }

  .detail-content-phonetic {
    height: calc(100vh - 230px);
  }
}

.loading {
  text-align: center;
  padding: 15px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.nav-right {
  padding-right: 10px;
  
  .share-btn {
    font-size: 14px;
    color: var(--text-primary);
  }
}

.morse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 10px;
  
  .morse-item {
    background-color: var(--background-primary);
    padding: 10px;
    border-radius: 10px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    
    &.highlight {
      background-color: var(--primary-light);
      border-color: var(--primary-color);
    }

    &:active {
      background-color: var(--primary-light);
    }
    
    .character {
      font-size: 18px;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
      color: var(--text-primary);
    }
    
    .code {
      font-size: 12.5px;
      color: var(--text-secondary);
    }
  }
}

.content-item {
  padding: 10px;
  border-radius: 14px;
  position: relative;
  
  &.highlight {
    background-color: var(--primary-light);
    border: 1px solid var(--primary-color);

    &::after {
      display: none;
    }
  }
  
  .item-value {
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.6;
  }

  &::after {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    position: absolute;
    bottom: 0;
    left: 0;
    background-color: var(--border-color);
  }

  &:last-child::after {
    display: none;
  }
}

/* 添加标签页样式 */
.tabs {
  display: flex;
  padding: 10px 0 0;
  margin: 0 20px;
  border-bottom: 1px solid var(--border-color);
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 14px;
    color: var(--text-secondary);
    position: relative;
    transition: all 0.3s;
    
    &.active {
      color: var(--primary-color);
      font-weight: bold;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0%;
        width: 100%;
        height: 2px;
        background-color: var(--primary-color);
        border-radius: 2px;
      }
    }
  }
}
</style>