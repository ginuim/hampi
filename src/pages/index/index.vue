<template>
  <view class="home-page" :class="{ 'dark': isDark }">
    <view class="home-wrapper">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

      <!-- 顶部搜索区 -->
      <view class="search-area">
        <view class="logo-wrapper">
          <image class="logo" :src="isDark ? '/static/logo-light.svg' : '/static/logo-dark.svg'" mode="aspectFit" />
          <text>期待在电波中相遇.</text>
        </view>
        <view class="search-box" @tap="openSearch" ref="searchBoxRef">
          <text class="search-icon iconfont">&#xe64c;</text>
          <text>搜索</text>
        </view>
      </view>

      <!-- 轮播图区域 -->
      <swiper class="banner" :indicator-dots="bannerList.length > 1" :autoplay="true" interval="3000" duration="500">
        <swiper-item v-for="(item, index) in bannerList" :key="index" @click="navigateToArticle(item)">
          <view class="banner-item">
            <image v-if="item.cover_image" :src="item.cover_image" mode="aspectFill" />
            <image v-else src="/static/banner.png" mode="aspectFill" />
          </view>
        </swiper-item>
      </swiper>

      <!-- 常用工具组件 -->
      <CommonTools :limitCount="4" @more="navigateToToolsPage" />

      <!-- 快速搜索组件 -->
      <QuickSearch
        v-model:show="showSearch"
        :statusBarHeight="statusBarHeight"
        :search-box-rect="searchBoxRect"
        @close="closeSearch"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import QuickSearch from '@/components/QuickSearch.vue'
import { useConfigStore } from '@/stores/config'
import CommonTools from '@/components/CommonTools.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const statusBarHeight = ref(0)

const showSearch = ref(false)
const searchBoxRef = ref<any>(null)
const searchBoxRect = ref({})

const configStore = useConfigStore()
const bannerList = computed(() => configStore.banner)

onMounted(() => {
  // #ifdef MP-WEIXIN || APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
  // #endif
})

const navigateToToolsPage = () => {
  uni.navigateTo({
    url: '/pages/tools/index'
  })
}

const openSearch = () => {
  // 获取搜索框的位置和尺寸信息
  const query = uni.createSelectorQuery()
  query.select('.search-box').boundingClientRect(rect => {
    if (rect) {
      searchBoxRect.value = rect
      showSearch.value = true
    }
  }).exec()
}

// 分享功能实现
onShareAppMessage(() => {
  return {
    title: 'HAM派 - 业余无线电助手',
    // imageUrl: 'https://static-reaidea.oss-cn-beijing.aliyuncs.com/static/hampi/share-cover.jpg',
    // path: '/pages/index/index',
  }
})

const closeSearch = () => {
  showSearch.value = false
}

const navigateToArticle = (item) => {
  uni.navigateTo({
    url: `/pages/article/index?aid=${item.id}`
  })
}
</script>

<style lang="less">
.home-page {
  min-height: 100vh;
  background-color: var(--background-primary);

  .home-wrapper {
    box-sizing: border-box;
    padding: 20px; // 20px -> 20px

    @media screen and (min-width: 768px) {
      max-width: 600px;
      margin: 0 auto;
      padding: 25px; // 平板端稍大一些
    }

    @media screen and (min-width: 1025px) {
      padding: 30px; // PC端更大一些
    }
  }
}

.search-area {
  display: flex;
  align-items: center;
  padding: 10px; // 10px -> 10px
  margin-top: 20px; // 20px -> 20px

  @media screen and (min-width: 768px) {
    padding: 12px;
    margin-top: 25px;
  }

  @media screen and (min-width: 1025px) {
    padding: 15px;
    margin-top: 30px;
  }

  .logo-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    text {
      font-size: 11px; // 11px -> 11px
      color: var(--text-secondary);

      @media screen and (min-width: 768px) {
        font-size: 12px;
      }

      @media screen and (min-width: 1025px) {
        font-size: 13px;
      }
    }
  }

  .logo {
    width: 90px; // 90px -> 90px
    height: 19px; // 19px -> 19px

    @media screen and (min-width: 768px) {
      width: 100px;
      height: 21px;
    }

    @media screen and (min-width: 1025px) {
      width: 110px;
      height: 23px;
    }
  }

  .search-box {
    display: flex;
    align-items: center;
    margin-left: 20px; // 20px -> 20px
    padding: 5px 20px 5px 15px; // 5px 20px 5px 15px -> 5px 20px 5px 15px
    height: 40px; // 40px -> 40px
    background-color: var(--search-background);
    border-radius: 20px; // 20px -> 20px
    box-sizing: border-box;
    transition: all 0.3s ease;

    @media screen and (min-width: 768px) {
      margin-left: 25px;
      padding: 6px 25px 6px 18px;
      height: 45px;
      border-radius: 22px;
    }

    @media screen and (min-width: 1025px) {
      margin-left: 30px;
      padding: 8px 30px 8px 20px;
      height: 50px;
      border-radius: 25px;
    }

    text {
      color: var(--text-secondary);
      font-size: 14px; // 14px -> 14px

      @media screen and (min-width: 768px) {
        font-size: 15px;
      }

      @media screen and (min-width: 1025px) {
        font-size: 16px;
      }
    }

    .search-icon {
      width: 16px; // 16px -> 16px
      height: 16px; // 16px -> 16px
      margin-right: 5px; // 5px -> 5px

      @media screen and (min-width: 768px) {
        width: 18px;
        height: 18px;
        margin-right: 6px;
      }

      @media screen and (min-width: 1025px) {
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }
    }
  }
}

.banner {
  height: 107px; // 107px -> 107px
  margin: 10px 0; // 10px 0 -> 10px 0
  border-radius: 24px; // 24px -> 24px
  overflow: hidden;

  @media screen and (min-width: 768px) {
    height: 120px;
    margin: 12px 0;
    border-radius: 28px;
  }

  @media screen and (min-width: 1025px) {
    height: 140px;
    margin: 15px 0;
    border-radius: 32px;
  }

  .banner-item {
    position: relative;
    width: 100%;
    height: 100%;

    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-info {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      padding: 10px; // 10px -> 10px
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.6));

      @media screen and (min-width: 768px) {
        padding: 12px;
      }

      @media screen and (min-width: 1025px) {
        padding: 15px;
      }

      .banner-title {
        font-size: 18px; // 18px -> 18px
        color: #fff;
        font-weight: bold;

        @media screen and (min-width: 768px) {
          font-size: 20px;
        }

        @media screen and (min-width: 1025px) {
          font-size: 22px;
        }
      }

      .banner-date {
        font-size: 12px; // 12px -> 12px
        color: rgba(255,255,255,0.8);
        margin-top: 5px; // 5px -> 5px

        @media screen and (min-width: 768px) {
          font-size: 13px;
          margin-top: 6px;
        }

        @media screen and (min-width: 1025px) {
          font-size: 14px;
          margin-top: 8px;
        }
      }
    }
  }
}
</style> 