<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useThemeStore } from '@/stores/theme'
import { useConfigStore } from '@/stores/config'
import { nextTick } from 'vue'
import http from '@/utils/request'

onLaunch(async () => {
  console.log('App Launch')

  // #ifdef MP-WEIXIN
  uni.setInnerAudioOption({
    obeyMuteSwitch: false,
    mixWithOther: true,
  })
  // #endif
  
  // 确保 store 已经初始化
  await nextTick()
  const themeStore = useThemeStore()
  const configStore = useConfigStore()
  
  try {
    // 获取系统主题设置
    const res = await uni.getSystemInfo({
      success: (result) => {
        if (result?.theme) {
          const theme = uni.getStorageSync('theme')
          console.log(result, theme)
          themeStore.setTheme(result.theme === 'dark' || theme === 'dark')
        }
      }
    })
    
    // 监听系统主题变化
    uni.onThemeChange(({ theme }) => {
      themeStore.setTheme(theme === 'dark')
    })
    
    // 获取配置
    await configStore.fetchArticles()
  } catch (e) {
    console.error('初始化失败:', e)
  }

  getUserOpenid()
})

// 获取用户openid并存储到storage
const getUserOpenid = () => {
  // #ifdef MP-WEIXIN
  uni.login({
    success: (res) => {
      if (res.code) {
        // 发送code到后端换取openid
        http.post('/api/wx/mini/login', {
          code: res.code
        }).then(res => {
          console.log('res: ', res)
          if (res.code === 0) {
            const { session_key, openid } = res.data
            // 存储openid到本地storage
            uni.setStorageSync('openid', openid)
            uni.setStorageSync('session_key', session_key)
          } else {
            console.error('获取openid失败:', res.data)
          }
        })
      } else {
        console.error('登录失败:', res.errMsg)
      }
    },
    fail: (err) => {
      console.error('uni.login调用失败:', err)
    }
  })
  // #endif
}

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="less">
@import './styles/theme.less';

@font-face {
  font-family: 'iconfont';  /* Project id 4820972 */
  src: url('//at.alicdn.com/t/c/font_4820972_oik2d4fqscn.woff2?t=1770732335451') format('woff2'),
       url('//at.alicdn.com/t/c/font_4820972_oik2d4fqscn.woff?t=1770732335451') format('woff'),
       url('//at.alicdn.com/t/c/font_4820972_oik2d4fqscn.ttf?t=1770732335451') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 添加一些全局样式 */

page {
  background-color: var(--background-primary);
  color: var(--text-primary);
}

/* 确保变量能被子组件继承 */
:root, page {
  .light-theme();
}

/* 暗色模式，这里不要删除！！ */
// @media (prefers-color-scheme: dark) {
//   :root, page {
//     .dark-theme();
//   }
// }

.dark {
  :root, page {
    .dark-theme();
  }
}
</style>
