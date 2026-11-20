<template>
  <view class="quick-search" :class="{ 'show': show, 'dark': isDark }" @tap.stop>
    <!-- 背景遮罩 -->
    <view v-if="show" class="mask" @tap="handleClose"></view>
    
    <!-- 搜索框 -->
    <view class="search-header" :class="{ 'show': show }">
      <view class="search-box" :style="{ paddingTop: safeAreaTop }">
        <view class="search-input-wrapper">
          <text class="iconfont search-icon">&#xe628;</text>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="请输入搜索关键词"
            @input="handleSearch"
            :focus="show"
          />
          <text v-if="searchQuery" class="iconfont clear-icon" @tap="searchQuery = ''">&#xe648;</text>
        </view>
        <text class="cancel-btn" @tap="handleClose">取消</text>
      </view>
    </view>

    <!-- 搜索结果容器 -->
    <view class="results-container" :class="{ 'show': show }">
      <scroll-view 
        class="results-scroll" 
        scroll-y
        :style="{ height: resultsContainerHeight }"
      >
        <view v-if="searchResults.length === 0 && searchQuery" class="no-results">
          未找到相关结果
        </view>
        <view v-else-if="searchResults.length === 0" class="tips">
          <view>可以在这里输入常见的业余无线电关键词进行查询</view>
          <view>比如 <text>Q简语</text>、<text>分区代码</text>、<text>国内外呼号归属</text>、<text>业余电台缩语</text>、<text>字母解释法</text>甚至<text>摩尔斯电码</text>等</view>
        </view>
        <view
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-card"
          @tap="handleResultClick(result.item)"
        >
          <view class="result-title">{{ result.item.title || '未知标题' }}</view>
          <view class="result-content">{{ result.item.content || '暂无内容' }}</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Fuse from 'fuse.js'
import qcodes from '@/resources/json/qcodes.json'
import region from '@/resources/json/region.json'
import morse from '@/resources/json/morse.json'
import hamabbr from '@/resources/json/hamabbr.json'
import phonetic from '@/resources/json/phonetic.json'
import dxPhonetic from '@/resources/json/dx-phonetic.json'
import { useThemeStore } from '@/stores/theme'
import { queryCallSign } from '@/pages/callsign/utils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  searchBoxRect: {
    type: Object,
    default: () => ({})
  },
  statusBarHeight: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:show', 'close'])

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const searchQuery = ref('')
const searchResults = ref([])
let searchTimer = null
let fuse: any = null

const safeAreaTop = computed(() => `${props.statusBarHeight + 40}px`)
const resultsContainerHeight = computed(() => 
  `calc(100vh - ${props.statusBarHeight + 110}px)`  // 状态栏 + 搜索框高度(72) + 上下padding(20+40)
)

const flatMap = (data: any) => {
  const { title, source } = data
  return data.data.map((item: any, index: number) => ({
    content: item,
    index,
    title,
    source
  }))
}

onMounted(() => {
  const allData = [
    ...flatMap(qcodes), 
    ...flatMap(region), 
    ...flatMap(morse),
    ...flatMap(hamabbr),
    ...flatMap(phonetic),
    ...flatMap(dxPhonetic)
  ]
  
  fuse = new Fuse(allData, {
    keys: ['title', 'content'],
    threshold: 0.3,
    includeScore: true
  })
  
  // #ifdef H5
  document.documentElement.style.setProperty('--status-bar-height', `${props.statusBarHeight}px`)
  // #endif
  
  // #ifdef MP-WEIXIN
  // 微信小程序直接使用 CSS 计算
  // #endif
})

const handleSearch = () => {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    uni.reportEvent('search', {
      'content': searchQuery.value
    })
  }, 5000)
  searchResults.value = fuse.search(searchQuery.value)
  if (searchQuery.value.match(/^[A-Z0-9]{2,}$/i)) {
    const callSign = queryCallSign(searchQuery.value)
    // 处理呼号查询结果
    if (callSign.country) {
      const result = [callSign.country]
      if (callSign.province) {
        result.push(callSign.province)
      }
      if (callSign.region) {
        result.push(callSign.region)
      }
      if (callSign.type) {
        result.push(callSign.type)
      }
      searchResults.value.push({
        item: {
          content: `${searchQuery.value.length > 3 ? '呼号' : '呼号前缀'}归属：` + result.join('，'),
          title: searchQuery.value,
          source: 'callsign'
        },
        score: 0
      })
    }
  }
}

const handleClose = () => {
  searchQuery.value = ''
  searchResults.value = []
  emit('close')
}

const handleResultClick = (item: any) => {
  if (item.source === 'morse') {
    uni.navigateTo({
      url: '/subpkg/cw/index'
    })
    return
  }

  if (item.source === 'callsign') {
    uni.navigateTo({
      url: `/pages/callsign/index?query=${searchQuery.value}`
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/search/detail?source=${item.source}&index=${item.index}&query=${searchQuery.value}`
  })
}
</script>

<style lang="less" scoped>
.quick-search {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  pointer-events: none;

  &.show {
    pointer-events: auto;
  }
}

// 背景遮罩动画
.mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

// 搜索框头部
.search-header {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1001;
  background-color: var(--background-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.show {
    opacity: 1;
  }
}

.search-box {
  display: flex;
  align-items: center;
  padding: 10px 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  height: 36px;
  border-radius: 18px;
  background-color: var(--search-background);
  transition: all 0.3s;
}

.cancel-btn {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 10px 0 10px 10px;
  white-space: nowrap;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  height: 100%;
  padding: 0 12px 0 36px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--text-secondary);
  }
}

.clear-icon {
  color: var(--text-secondary);
  margin-right: 15px; 
}

.tips {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  padding: 10px 0;
  
  text {
    color: var(--text-primary);
    font-weight: bold;
    margin: 0 2px;
  }
}

.no-results {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.result-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.result-card {
  margin-bottom: 10px;
  padding: 15px;
  background-color: var(--background-container);
  border-radius: 12px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 搜索结果容器
.results-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: var(--background-primary);
  padding: 0 20px 20px;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.show {
    transform: translateY(0);
  }
}

.results-scroll {
  height: 100%;
  overflow: hidden;
  
  ::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
    color: transparent;
  }
}

.show {
  .mask {
    opacity: 1;
    background-color: var(--background-primary);
  }
}
</style> 