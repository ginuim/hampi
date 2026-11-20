<template>
  <view :class="{ 'dark': isDark }" class="articles-page">
    <NavBar title="文章" :showBack="false" />
    <view class="content">
      <!-- <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="errorMsg" class="error">
        <text>{{ errorMsg }}</text>
      </view> -->
      <view>
        <view v-for="(articles, category) in categorizedArticles" :key="category" class="category-section">
          <view class="category-title">
            <text>{{ category }}</text>
          </view>
          <view class="article-list">
            <view v-for="article in articles" :key="article.id" class="article-item" @click="goToDetail(article.id)">
              <view class="article-info">
                <text class="article-title">{{ article.title }}</text>
                <view class="article-meta">
                  <text class="author">作者：{{ article.author || 'BI1XMT' }}</text>
                  <text class="publish-date">{{ formatDate(article.published_at) }}</text>
                </view>
              </view>
              <image v-if="article.cover_image" class="article-cover" :src="article.cover_image" mode="aspectFill"></image>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { ref, computed, onMounted, reactive } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const articles = computed(() => configStore.articleList)

// 定义文章接口
interface Article {
  id: number
  title: string
  cover_image: string | null
  category_id: number
  category_name: string
  read_count: number
  created_at: string
  published_at: string
}

// const articles = ref<Article[]>([])
const isLoading = ref(true)
const errorMsg = ref('')

// 按分类整理的文章
const categorizedArticles = computed(() => {
  const result: Record<string, Article[]> = {}
  
  articles.value.forEach(article => {
    const category = article.category_name
    if (!result[category]) {
      result[category] = []
    }
    result[category].push(article)
  })
  
  return result
})

// // 获取文章列表
// const fetchArticles = async () => {
//   isLoading.value = true
//   errorMsg.value = ''
  
//   try {
//     const response = await uni.request({
//       url: 'https://hampi.oss-cn-hangzhou.aliyuncs.com/article-list.json',
//       method: 'GET'
//     })
    
//     if (response.statusCode === 200) {
//       articles.value = response.data as Article[]
//     } else {
//       errorMsg.value = '获取文章列表失败'
//     }
//   } catch (error) {
//     console.error('请求文章列表出错:', error)
//     errorMsg.value = '网络错误，请稍后重试'
//   } finally {
//     isLoading.value = false
//   }
// }

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 跳转到文章详情页
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/article/index?aid=${id}`
  })
}

// onMounted(() => {
//   fetchArticles()
// })

// onShow(() => {
//   // 页面显示时刷新数据
//   fetchArticles()
// })

// 定义分享内容
onShareAppMessage(() => {
  return {
    title: '文章',
    path: '/src/pages/articles/index'
  }
})
</script>

<style lang="less" scoped>
.articles-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background-primary);
  padding: 20px;
}

.loading, .error {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  
  text {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.category-section {
  margin-bottom: 20px;
  
  .category-title {
    margin-bottom: 10px;
    
    text {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-primary);
    }
  }
}

.article-list {
  .article-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color-light);
    
    .article-info {
      flex: 1;
      margin-right: 10px;
      
      .article-title {
        font-size: 17px;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 8px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      
      .article-meta {
        display: flex;
        font-size: 12px;
        color: var(--text-tertiary);
        
        .category, .read-count {
          margin-right: 8px;
        }
      }
    }
    
    .article-cover {
      width: 80px;
      height: 60px;
      border-radius: 4px;
    }
  }
}
</style>