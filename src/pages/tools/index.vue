<template>
  <view class="tools-page" :class="{ 'dark': isDark }">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 页面标题 -->
    <view class="header">
      <view class="left-content">
        <view class="back-button" @tap="goBack">
          <text class="iconfont">&#xe665;</text>
        </view>
        <text class="title">全部工具</text>
      </view>
      <view class="settings-button" @tap="toggleSorting">
        <text>{{ isSorting ? '完成' : '设置' }}</text>
      </view>
    </view>
    
    <!-- 引入常用工具组件并显示全部 -->
    <CommonTools :showHeader="false" :isSorting="isSorting" />
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import CommonTools from '@/components/CommonTools.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const statusBarHeight = ref(0)
const isSorting = ref(false)

onMounted(() => {
  // #ifdef MP-WEIXIN || APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight
  // #endif
})

const goBack = () => {
  uni.navigateBack()
}

const toggleSorting = () => {
  isSorting.value = !isSorting.value
}
</script>

<style lang="less">
.tools-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background-primary);
  padding: 20px; // 20px -> 20px

  @media screen and (min-width: 768px) {
    padding: 25px;
  }

  @media screen and (min-width: 1025px) {
    padding: 30px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between; // 使标题和按钮分布在两端
    margin-top: 20px; // 20px -> 20px
    margin-bottom: 20px; // 20px -> 20px

    @media screen and (min-width: 768px) {
      margin-top: 25px;
      margin-bottom: 25px;
    }

    @media screen and (min-width: 1025px) {
      margin-top: 30px;
      margin-bottom: 30px;
    }

    .left-content {
      display: flex;
      align-items: center;
    }

    .back-button {
      width: 35px; // 35px -> 35px
      height: 35px; // 35px -> 35px
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(180deg);
      background-color: var(--background-container);
      border-radius: 17px; // 17.5px -> 17px
      margin-right: 10px; // 10px -> 10px

      @media screen and (min-width: 768px) {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        margin-right: 12px;
      }

      @media screen and (min-width: 1025px) {
        width: 45px;
        height: 45px;
        border-radius: 22px;
        margin-right: 15px;
      }

      .iconfont {
        font-size: 20px; // 20px -> 20px
        color: var(--text-primary);

        @media screen and (min-width: 768px) {
          font-size: 22px;
        }

        @media screen and (min-width: 1025px) {
          font-size: 25px;
        }
      }
    }

    .title {
      font-size: 20px; // 20px -> 20px
      font-weight: bold;
      color: var(--text-primary);

      @media screen and (min-width: 768px) {
        font-size: 22px;
      }

      @media screen and (min-width: 1025px) {
        font-size: 25px;
      }
    }

    .settings-button {
      padding: 5px 15px; // 5px 15px -> 5px 15px
      background-color: var(--background-container);
      color: var(--text-primary);
      border-radius: 15px; // 15px -> 15px
      font-size: 14px; // 14px -> 14px
      cursor: pointer; // 增加鼠标手势

      @media screen and (min-width: 768px) {
        padding: 6px 18px;
        border-radius: 18px;
        font-size: 15px;
      }

      @media screen and (min-width: 1025px) {
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 16px;
      }
    }
  }
}
</style> 