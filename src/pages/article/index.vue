<template>
  <view class="article-page" :class="{ 'dark': isDark }">
    <NavBar :title="data?.title" />
    <image v-if="data?.cover_image && !['轮播图', '关于我'].includes(data?.category_name)" class="article-cover" :src="data?.cover_image" mode="widthFix" />
    <CardPanel noHighlight class="article-content">
      <rich-text :nodes="data?.content_html"></rich-text>
    </CardPanel>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const data = ref({})
const id = ref('')
// const title = ref('')
// const content = ref('')

onLoad(async options => {
  const { aid } = options
  await getArticle(aid)
  // const articleData = data.value[aid]
  // console.log()
  // if (articleData) {
  //   title.value = articleData.title
  //   content.value = articleData.content
  // }
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

const getArticle = async (aid) => {
  const response = await uni.request({
    url: 'https://hampi.oss-cn-hangzhou.aliyuncs.com/articles/' + aid + '.json',
    method: 'GET'
  })
  if (response.data) {
    data.value = response.data
    console.log('data: ', data.value.content_html)
  }
}

</script>

<style lang="less" scoped>
.article-page {
  box-sizing: border-box;
  padding: 20px;
  min-height: 100vh;
  background-color: var(--background-primary);
}

.article-cover {
  width: 100%;
  height: 200px;
  border-radius: 10px;
}

.article-content {
  margin: 10px;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 16px;
  
  :deep(.article-text) {
    margin: 10px 0;
  }
}
</style> 