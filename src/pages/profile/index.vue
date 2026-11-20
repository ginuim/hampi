<template>
  <view class="profile-page" :class="{ 'dark': isDark }">
    <NavBar title="我的" :showBack="false" />

    <view class="profile-header" @click="goToEditProfile">
      <Avatar :size="120" />
      <view class="user-info" v-if="isLoggedIn && (userProfile.nickname || userProfile.callsign)">
        <text class="nickname">{{ userProfile.nickname }}</text>
        <text class="call">{{ userProfile.callsign }}</text>
      </view>
      <view class="user-info" v-else>
        <text class="nickname">点击头像</text>
        <text class="call">完善个人资料</text>
      </view>
      <text class="more iconfont">&#xe665;</text>
    </view>

    <!-- 等级展示区域 -->
    <!-- <view class="level-section" @click="goToLevelPage">
      <view class="level-header">
        <text class="level-title">我的等级</text>
        <text class="level-more iconfont">&#xe665;</text>
      </view>
      <view class="level-content">
        <LevelBadge
          :level-info="userLevelStore.currentLevelInfo"
          size="medium"
          :show-glow="true"
          :clickable="false"
        />
        <view class="level-info">
          <text class="level-name">{{ userLevelStore.currentLevelInfo.name }}</text>
          <text class="level-exp">{{ userLevelStore.levelData.totalExp }} EXP</text>
        </view>
      </view>
      <LevelProgress
        :progress="userLevelStore.levelProgress"
        size="small"
        :show-progress-text="true"
        :show-next-level="true"
        :animated="false"
      />
    </view> -->

    <view class="profile-content">
      <view class="menu-item">
        <SvgIcon name="icon-theme" size="20" class="icon" />
        <text class="menu-text">暗黑模式</text>
        <switch :checked="isDark" @change="toggleTheme" color="#0D5BFF" />
      </view>

      <view class="menu-item">
        <button class="share-button" open-type="share">
          <!-- <image src="@/static/icon-share.svg" class="icon" mode="widthFix" /> -->
          <SvgIcon name="icon-share" size="20" class="icon" />
          <text class="menu-text">分享小程序</text>
          <text class="more iconfont">&#xe665;</text>
        </button>
      </view>

      <!-- <view class="menu-item" @click="goToSyncSettings">
        <SvgIcon name="icon-sync" size="20" class="icon" />
        <text class="menu-text">数据同步设置</text>
        <text class="more iconfont">&#xe665;</text>
      </view> -->

      <view class="menu-item" @click="goToBackup">
        <SvgIcon name="icon-backup" size="20" class="icon" />
        <text class="menu-text">数据备份</text>
        <text class="more iconfont">&#xe665;</text>
      </view>

      <view class="menu-item" @click="goToAbout">
        <SvgIcon name="icon-about" size="20" class="icon" />
        <text class="menu-text">关于作者</text>
        <text class="more iconfont">&#xe665;</text>
      </view>

      <view class="menu-item" @click="goToChangeLog">
        <SvgIcon name="icon-update" size="20" class="icon" />
        <text class="menu-text">更新日志</text>
        <text class="more iconfont">&#xe665;</text>
      </view>
    </view>

    <!-- <view class="profile-content">
      <view class="qso-stats">
        <text class="section-title">通联地图</text>
        <text class="section-desc">已通联 {{ qsoHistory.length }} 个位置</text>
        <view class="map-container">
          <WorldMap 
            ref="qsoMapRef" 
            :isDark="isDark" 
            :qsoData="qsoData" 
            :mapWidth="mapWidth" 
            :mapHeight="mapHeight" 
          />
        </view>
      </view>
    </view> -->
  </view>
</template>

<script setup lang="ts">
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { computed, ref, onMounted } from 'vue'
import QsoMap from '@/components/QsoMap.vue'
import { useThemeStore } from '@/stores/theme'
import { useUserLevelStore } from '@/stores/userLevel'
import Avatar from '@/components/Avatar.vue'
import WorldMap from '@/subpkg/qso/WorldMap.vue'
import LevelBadge from '@/components/LevelBadge/LevelBadge.vue'
import LevelProgress from '@/components/LevelProgress/LevelProgress.vue'
import http from '@/utils/request'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const themeStore = useThemeStore()
const userLevelStore = useUserLevelStore()
const isDark = computed(() => themeStore.isDark)
const about = computed(() => configStore.about)

const toggleTheme = (e) => {
  themeStore.toggleTheme()
}

// 分享功能实现
onShareAppMessage(() => {
  return {
    title: 'HAM派 - 业余无线电助手',
    imageUrl: 'https://static-reaidea.oss-cn-beijing.aliyuncs.com/static/hampi/share-cover.jpg',
    path: '/pages/index/index',
  }
})

const mapWidth = ref(300)
const mapHeight = ref(150)

// 添加通联历史数据
const qsoHistory = ref([])

// 转换数据为地图组件需要的格式
const qsoData = computed(() => {
  return qsoHistory.value.map(item => {
    if (item.grid) {
      return {
        type: 'grid' as const,
        data: item.grid
      }
    } else {
      return {
        type: 'lnglat' as const,
        data: [Number(item.latitude), Number(item.longitude)]
      }
    }
  })
})

// 加载通联历史数据
const loadQsoHistory = () => {
  uni.getStorage({
    key: 'qsoHistory',
    success: (res) => {
      if (Array.isArray(res.data)) {
        qsoHistory.value = res.data
      }
    },
    fail: () => {
      qsoHistory.value = []
    }
  })
}

const userProfile = ref({
  avatar: '',
  nickname: '',
  callsign: '',
  qth: '',
  email: '',
  website: ''
})

const isLoggedIn = ref(false)

// 加载用户资料
const loadUserProfile = () => {
  const profileData = uni.getStorageSync('userProfile')

  if (profileData) {
    const parsed = JSON.parse(profileData)
    const profileSynced = uni.getStorageSync('profileSynced')
    if (!profileSynced) {
      http.post('/api/user/save', parsed).then(res => {
        if (res.data?.avatar) {
          parsed.avatar = res.data.avatar
        }
        uni.setStorageSync('userProfile', JSON.stringify(parsed))
        uni.setStorageSync('profileSynced', true)
      })
    }
    userProfile.value = parsed
    isLoggedIn.value = true
  } else {
    isLoggedIn.value = false
  }
}

// 使用onShow而不是onMounted，这样每次页面显示时都会刷新数据
onShow(() => {
  loadUserProfile()
  // loadQsoHistory()
})

const goToQsoPage = () => {
  uni.navigateTo({
    url: '/subpkg/qso/index'
  })
}

const goToEditProfile = () => {
  uni.navigateTo({
    url: '/subpkg/profile/edit'
  })
}

const goToSyncSettings = () => {
  uni.navigateTo({
    url: '/subpkg/settings/sync'
  })
}

const goToBackup = () => {
  uni.navigateTo({
    url: '/subpkg/settings/backup'
  })
}

const goToAbout = () => {
  uni.navigateTo({
    url: `/pages/article/index?aid=${about.value.id}`
  })
}

const goToChangeLog = () => {
  uni.navigateTo({
    url: '/subpkg/settings/updatelog'
  })
  // uni.navigateTo({
  //   url: '/subpkg/webview/index?url=' + encodeURIComponent('https://mp.weixin.qq.com/s/0evMdB_JvGoC2P5rgMr60A') + '&title=' + encodeURIComponent('更新日志')
  // })
}

const goToLevelPage = () => {
  uni.navigateTo({
    url: '/subpkg/profile/level'
  })
}

onMounted(() => {
  // 获取屏幕宽度来设置地图尺寸
  const systemInfo = uni.getSystemInfoSync()
  mapWidth.value = systemInfo.windowWidth - 40
  // 根据世界地图数据的宽高比(144:104)来设置高度
  mapHeight.value = (systemInfo.windowWidth - 40) * (104/144)
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})
</script>

<style lang="less" scoped>
.profile-page {
  box-sizing: border-box;
  padding: 20px; // 20px -> 20px
  min-height: 100vh;
  background-color: var(--background-primary);

  @media screen and (min-width: 768px) {
    padding: 25px;
  }

  @media screen and (min-width: 1025px) {
    padding: 30px;
  }
}

.profile-header {
  padding: 20px; // 20px -> 20px
  background-color: var(--background-container);
  border-radius: 20px; // 20px -> 20px
  display: flex;
  align-items: center;
  position: relative;

  @media screen and (min-width: 768px) {
    padding: 25px;
    border-radius: 25px;
  }

  @media screen and (min-width: 1025px) {
    padding: 30px;
    border-radius: 30px;
  }
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 15px; // 15px -> 15px

  @media screen and (min-width: 768px) {
    margin-left: 18px;
  }

  @media screen and (min-width: 1025px) {
    margin-left: 20px;
  }
}

.nickname {
  font-size: 16px; // 16px -> 16px
  color: var(--text-primary);
  font-weight: bold;

  @media screen and (min-width: 768px) {
    font-size: 18px;
  }

  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
}

.call {
  font-size: 14px; // 14px -> 14px
  margin-top: 10px; // 10px -> 10px
  color: var(--text-primary);

  @media screen and (min-width: 768px) {
    font-size: 15px;
    margin-top: 12px;
  }

  @media screen and (min-width: 1025px) {
    font-size: 16px;
    margin-top: 15px;
  }
}

// .level-section {
//   margin-top: 10px;
//   padding: 20px;
//   background-color: var(--background-container);
//   border-radius: 20px;
//   cursor: pointer;
//   transition: all 0.2s ease;

//   @media screen and (min-width: 768px) {
//     margin-top: 12px;
//     padding: 25px;
//     border-radius: 25px;
//   }

//   @media screen and (min-width: 1025px) {
//     margin-top: 15px;
//     padding: 30px;
//     border-radius: 30px;
//   }

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
//   }
// }

// .level-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 16px;

//   @media screen and (min-width: 768px) {
//     margin-bottom: 20px;
//   }

//   @media screen and (min-width: 1025px) {
//     margin-bottom: 24px;
//   }
// }

// .level-title {
//   font-size: 16px;
//   font-weight: bold;
//   color: var(--text-primary);

//   @media screen and (min-width: 768px) {
//     font-size: 18px;
//   }

//   @media screen and (min-width: 1025px) {
//     font-size: 20px;
//   }
// }

// .level-more {
//   color: var(--text-secondary);
//   font-size: 14px;

//   @media screen and (min-width: 768px) {
//     font-size: 15px;
//   }

//   @media screen and (min-width: 1025px) {
//     font-size: 16px;
//   }
// }

// .level-content {
//   display: flex;
//   align-items: center;
//   gap: 12px;
//   margin-bottom: 16px;

//   @media screen and (min-width: 768px) {
//     gap: 15px;
//     margin-bottom: 20px;
//   }

//   @media screen and (min-width: 1025px) {
//     gap: 18px;
//     margin-bottom: 24px;
//   }
// }

// .level-info {
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   gap: 4px;

//   @media screen and (min-width: 768px) {
//     gap: 6px;
//   }

//   @media screen and (min-width: 1025px) {
//     gap: 8px;
//   }
// }

// .level-name {
//   font-size: 16px;
//   font-weight: bold;
//   color: var(--text-primary);

//   @media screen and (min-width: 768px) {
//     font-size: 18px;
//   }

//   @media screen and (min-width: 1025px) {
//     font-size: 20px;
//   }
// }

// .level-exp {
//   font-size: 14px;
//   color: var(--text-secondary);

//   @media screen and (min-width: 768px) {
//     font-size: 15px;
//   }

//   @media screen and (min-width: 1025px) {
//     font-size: 16px;
//   }
// }

.profile-content {
  margin-top: 10px; // 10px -> 10px
  background-color: var(--background-container);
  padding: 10px; // 10px -> 10px
  border-radius: 20px; // 20px -> 20px

  @media screen and (min-width: 768px) {
    margin-top: 12px;
    padding: 12px;
    border-radius: 25px;
  }

  @media screen and (min-width: 1025px) {
    margin-top: 15px;
    padding: 15px;
    border-radius: 30px;
  }
}

.menu-item {
  display: flex;
  height: 60px; // 60px -> 60px
  box-sizing: border-box;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px; // 15px 10px -> 15px 10px
  border-bottom: 1px solid var(--border-color-light);
  position: relative;

  @media screen and (min-width: 768px) {
    height: 70px;
    padding: 18px 12px;
  }

  @media screen and (min-width: 1025px) {
    height: 80px;
    padding: 20px 15px;
  }

  .icon {
    width: 20px; // 20px -> 20px
    height: 20px; // 20px -> 20px

    @media screen and (min-width: 768px) {
      width: 22px;
      height: 22px;
    }

    @media screen and (min-width: 1025px) {
      width: 25px;
      height: 25px;
    }
  }

  &:last-child {
    border-bottom: none;
  }
}

.menu-text {
  flex: 1;
  padding-left: 10px; // 10px -> 10px
  font-size: 14px; // 14px -> 14px
  font-weight: bold;
  color: var(--text-primary);

  @media screen and (min-width: 768px) {
    padding-left: 12px;
    font-size: 15px;
  }

  @media screen and (min-width: 1025px) {
    padding-left: 15px;
    font-size: 16px;
  }
}

.share-button {
  background: none;
  padding: 0;
  margin: 0;
  line-height: 1;
  border: none;
  width: 100%;
  height: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
  font-size: inherit;

  &::after {
    border: none;
  }

  // .icon {
  //   width: 20px;
  //   height: 20px;
  // }

  .menu-text {
    flex: 1;
    padding-left: 10px; // 10px -> 10px
    font-size: 14px; // 14px -> 14px
    color: var(--text-primary);

    @media screen and (min-width: 768px) {
      padding-left: 12px;
      font-size: 15px;
    }

    @media screen and (min-width: 1025px) {
      padding-left: 15px;
      font-size: 16px;
    }
  }

  .more {
    color: var(--text-secondary);
    font-size: 14px; // 14px -> 14px
    position: static;
    right: auto;

    @media screen and (min-width: 768px) {
      font-size: 15px;
    }

    @media screen and (min-width: 1025px) {
      font-size: 16px;
    }
  }
}

.menu-item .share-button {
  padding: 0;
}

.qso-stats {
  padding: 10px; // 10px -> 10px
  border-radius: 6px; // 6px -> 6px

  @media screen and (min-width: 768px) {
    padding: 12px;
    border-radius: 8px;
  }

  @media screen and (min-width: 1025px) {
    padding: 15px;
    border-radius: 10px;
  }
}

.section-title {
  font-size: 16px; // 16px -> 16px
  color: var(--text-primary);
  margin-bottom: 5px; // 5px -> 5px
  display: block;
  font-weight: 500;

  @media screen and (min-width: 768px) {
    font-size: 18px;
    margin-bottom: 6px;
  }

  @media screen and (min-width: 1025px) {
    font-size: 20px;
    margin-bottom: 8px;
  }
}

.section-desc {
  font-size: 12px; // 12px -> 12px
  color: var(--text-secondary);
  display: block;

  @media screen and (min-width: 768px) {
    font-size: 13px;
  }

  @media screen and (min-width: 1025px) {
    font-size: 14px;
  }
}

.more {
  color: var(--text-secondary);
  font-size: 14px; // 14px -> 14px

  @media screen and (min-width: 768px) {
    font-size: 15px;
  }

  @media screen and (min-width: 1025px) {
    font-size: 16px;
  }
}

.map-container {
  border-radius: 10px; // 10px -> 10px
  overflow: hidden;
  border: 1px solid var(--border-color-light);

  @media screen and (min-width: 768px) {
    border-radius: 12px;
  }

  @media screen and (min-width: 1025px) {
    border-radius: 15px;
  }
}
</style>