import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 从本地存储初始化主题状态
  const isDark = ref(uni.getStorageSync('theme') === 'dark')

  // 初始化时应用主题
  if (isDark.value) {
    applyDarkTheme()
  }

  function applyDarkTheme() {
    // 设置导航栏
    // uni.setNavigationBarColor({
    //   frontColor: '#ffffff',
    //   backgroundColor: '#121212'
    // })
    // #ifdef APP-PLUS || MP-WEIXIN || QUICKAPP-WEBVIEW
    uni.setBackgroundColor({
      backgroundColor: '#03040B'
    })
    // #endif
    // 设置 tabBar
    uni.setTabBarStyle({
      backgroundColor: '#03040B',
      borderStyle: 'black',
      color: '#666666',
      selectedColor: '#ffffff'
    })
  }

  function applyLightTheme() {
    // 设置导航栏
    uni.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })

    // #ifdef APP-PLUS || MP-WEIXIN || QUICKAPP-WEBVIEW
    uni.setBackgroundColor({
      backgroundColor: '#ffffff'
    })
    // #endif
    
    // 设置 tabBar
    uni.setTabBarStyle({
      backgroundColor: '#ffffff',
      borderStyle: 'black',
      color: '#999999',
      selectedColor: '#333333'
    })
  }

  function setTheme(dark: boolean) {
    isDark.value = dark
    // 保存到本地存储
    uni.setStorageSync('theme', isDark.value ? 'dark' : 'light')
    
    // 应用主题
    if (isDark.value) {
      applyDarkTheme()
    } else {
      applyLightTheme()
    }
  }

  const toggleTheme = () => {
    setTheme(!isDark.value)
  }

  async function checkSystemTheme() {
    try {
      const res = await uni.getSystemInfo()
      if (res && res.theme) {
        setTheme(res.theme === 'dark')
      }
    } catch (e) {
      console.error('获取系统主题失败:', e)
    }
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    checkSystemTheme
  }
}) 