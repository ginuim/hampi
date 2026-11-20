import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const about = ref('')
  const banner = ref([])
  const articleList = ref([])

  // 从本地存储加载数据
  const loadFromStorage = () => {
    const storageData = uni.getStorageSync('articleData')
    if (storageData) {
      const data = JSON.parse(storageData)
      about.value = data.about
      banner.value = data.banner 
      articleList.value = data.articleList
    }
  }

  // 保存数据到本地存储
  const saveToStorage = (data) => {
    const storageData = {
      about: data.filter(item => item.category_name === '关于我')[0],
      banner: data.filter(item => item.category_name === '轮播图'),
      articleList: data.filter(item => !['关于我', '轮播图'].includes(item.category_name))
    }
    uni.setStorageSync('articleData', JSON.stringify(storageData))
    about.value = storageData.about
    banner.value = storageData.banner
    articleList.value = storageData.articleList
  }

  const fetchArticles = async () => {
    try {
      // 检查网络状态
      const networkType = await uni.getNetworkType()
      
      if (networkType.networkType === 'none') {
        // 无网络时加载本地数据
        loadFromStorage()
        return
      }

      const response = await uni.request({
        url: 'https://hampi.oss-cn-hangzhou.aliyuncs.com/article-list.json',
        method: 'GET'
      })
      
      if (response.data) {
        // 保存到本地并更新状态
        saveToStorage(response.data)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
      // 请求失败时加载本地数据
      loadFromStorage()
    }
  }
  
  return {
    about,
    banner,
    articleList,
    fetchArticles
  }
})