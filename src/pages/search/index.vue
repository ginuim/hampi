<template>
  <view class="search-page" :class="{ 'dark': isDark }">
    <NavBar title="搜索" />
    <view class="container">
      <view class="search-box">
        <view class="search-input-wrapper">
          <text class="iconfont search-icon">&#xe628;</text>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="请输入搜索关键词"
            @input="handleSearch"
            focus
          />
        </view>
      </view>
      
      <view class="results-container">
        <view v-if="searchResults.length === 0 && searchQuery" class="no-results">
          未找到相关结果
        </view>
        <view v-else-if="searchResults.length === 0" class="tips">
          <view>可以在这里输入常见的业余无线电关键词进行查询</view>
          <view>比如 <text>Q简语</text>、<text>分区代码</text>、<text>业余电台缩语</text>、<text>字母解释法</text>甚至<text>摩尔斯电码</text>等</view>
        </view>
        <CardPanel
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-card"
          @tap.native="handleResultClick(result.item)"
        >
          <view class="result-title">{{ result.item.title || '未知标题' }}</view>
          <view class="result-content">{{ result.item.content || '暂无内容' }}</view>
        </CardPanel>
      </view>
    </view>
  </view>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import Fuse from 'fuse.js'
import qcodes from '@/resources/json/qcodes.json'
import region from '@/resources/json/region.json'
import morse from '@/resources/json/morse.json'
import hamabbr from '@/resources/json/hamabbr.json'
import phonetic from '@/resources/json/phonetic.json'
import { useThemeStore } from '@/stores/theme'

const flatMap = data => {
    const { title, source } = data
    return data.data.map((item, index) => ({
        content: item,
        index,
        title,
        source
    }))
}

export default {
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      fuse: null,
      allData: [],
    }
  },
  created() {
    // 合并所有数据，添加新的数据源
    this.allData = [
      ...flatMap(qcodes), 
      ...flatMap(region), 
      ...flatMap(morse),
      ...flatMap(hamabbr),    // 添加业余电台缩语
      ...flatMap(phonetic)    // 添加字母解释法
    ]
    
    // 初始化Fuse.js
    this.fuse = new Fuse(this.allData, {
      keys: ['title', 'content'],
      threshold: 0.3,
      includeScore: true
    })
  },
  methods: {
    handleSearch() {
      if (!this.searchQuery) {
        this.searchResults = []
        return
      }
      this.searchResults = this.fuse.search(this.searchQuery)
    },
    handleResultClick(item) {
      console.log(item)
      // 如果是摩尔斯电码相关，跳转到 cw 页面
      if (item.source === 'morse') {
        uni.navigateTo({
          url: '/subpkg/cw/index'
        })
        return
      }
      
      // 其他情况跳转到详情页
      uni.navigateTo({
        url: `/pages/search/detail?source=${item.source}&index=${item.index}`
      })
    }
  },
  setup() {
    const themeStore = useThemeStore()
    const isDark = computed(() => themeStore.isDark)

    return {
      isDark
    }
  }
}
</script>

<style lang="less" scoped>
.search-page {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.container {
  padding: 20px;
  box-sizing: border-box;
}

.search-box {
  border-radius: 5px;
  box-sizing: border-box;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  border-radius: 20px;
  background-color: var(--search-background);
  box-sizing: border-box;
}

.search-icon {
  position: absolute;
  left: 15px;
  font-size: 14px;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  height: 100%;
  padding: 0 15px 0 40px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--text-secondary);
  }
}

.results-container {
}

.result-card {
  margin-bottom: 10px;
  padding: 15px;
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

.tips {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 10px;

  view {
    margin-bottom: 5px;
    line-height: 1.6;
  }

  text {
    font-weight: bold;
  }
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>