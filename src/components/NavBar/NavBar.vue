<template>
  <view class="nav-container" :class="{ 'dark': isDark }">
    <!-- placeholder 占位，防止内容被 fixed 的导航栏遮挡 -->
    <view class="nav-placeholder" :style="{ height: totalHeight + 'px' }"></view>
    
    <!-- 实际的导航栏 -->
    <view class="nav-wrapper" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar">
        <!-- 左侧区域 -->
        <view class="left">
          <view class="back-btn" v-if="showBack" @click="handleBack">
            <text class="iconfont">&#xe665;</text>
          </view>
          <slot name="left"></slot>
        </view>
        
        <!-- 中间标题 -->
        <view class="center">
          <text class="title" :class="{ 'dark': isDark }">{{ title }}</text>
        </view>
        
        <!-- 右侧区域 -->
        <view class="right">
          <slot name="right"></slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: true
  },
  onBack: {
    type: Function,
    default: null
  }
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const statusBarHeight = ref(0)
const navBarHeight = 44 // 导航栏固定高度，单位px
const totalHeight = computed(() => statusBarHeight.value + navBarHeight)

onMounted(() => {
  // #ifdef MP-WEIXIN || APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight
  // #endif
})

const handleBack = () => {
  if (props.onBack) {
    props.onBack()
  } else {
    uni.navigateBack({
      delta: 1,
      complete: () => {
        console.log('navigateBack complete')
      }
    })
  }
}
</script>

<style lang="less" scoped>

.nav-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--background-primary);
}

.navbar {
  height: 44px;
  display: flex;
  align-items: center;
  
  .left {
    width: 60px;
    height: 100%;
    display: flex;
    align-items: center;
  }
  
  .center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80%;
      font-size: 16px;
      font-weight: bold;
      color: var(--text-primary);
    }
  }
  
  .right {
    width: 60px;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

.back-btn {
  padding: 0 10px;
  height: 44px;
  display: flex;
  align-items: center;
  
  .iconfont {
    font-size: 18px;
    color: var(--text-primary);
    transform: rotate(180deg);
  }
}
</style> 