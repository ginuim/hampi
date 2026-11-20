<template>
  <view class="sync-page" :class="{ 'dark': isDark }">
    <NavBar title="数据同步设置" :showBack="true" />
    
    <view class="sync-container">
      <view class="sync-header">
        <text class="title">数据同步设置</text>
        <text class="desc">设置HAM派是否将您的数据同步到云端服务器</text>
      </view>
      
      <view class="sync-content">
        <view class="sync-item">
          <view class="item-info">
            <text class="item-title">考试信息</text>
            <text class="item-desc">同步您的模拟考试记录和成绩信息</text>
          </view>
          <switch :checked="examSync" @change="toggleExamSync" color="#0D5BFF" />
        </view>
        
        <view class="sync-item">
          <view class="item-info">
            <text class="item-title">CW学习记录</text>
            <text class="item-desc">同步您的摩尔斯电码学习进度和记录</text>
          </view>
          <switch :checked="cwSync" @change="toggleCwSync" color="#0D5BFF" />
        </view>
        
        <view class="sync-item">
          <view class="item-info">
            <text class="item-title">通联日志</text>
            <text class="item-desc">同步您的QSO通联记录和日志信息</text>
          </view>
          <switch :checked="qsoSync" @change="toggleQsoSync" color="#0D5BFF" />
        </view>
      </view>

      <view class="warning-card">
        <text class="warning-title">数据安全提醒</text>
        <text class="warning-text">如不开启同步，数据将只保存在本地设备中。当您卸载小程序或清除缓存时，数据将永久丢失且无法恢复。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 同步设置状态
const examSync = ref(false)
const cwSync = ref(false)
const qsoSync = ref(false)

// 加载同步设置
const loadSyncSettings = () => {
  uni.getStorage({
    key: 'examSync',
    success: (res) => {
      examSync.value = res.data
    },
    fail: () => {
      examSync.value = false
    }
  })
  
  uni.getStorage({
    key: 'cwSync',
    success: (res) => {
      cwSync.value = res.data
    },
    fail: () => {
      cwSync.value = false
    }
  })
  
  uni.getStorage({
    key: 'qsoSync',
    success: (res) => {
      qsoSync.value = res.data
    },
    fail: () => {
      qsoSync.value = false
    }
  })
}

// 切换考试信息同步状态
const toggleExamSync = (e) => {
  examSync.value = e.detail.value
  uni.setStorage({
    key: 'examSync',
    data: examSync.value
  })
  showToast(examSync.value ? '已开启考试信息同步' : '已关闭考试信息同步')
}

// 切换CW学习记录同步状态
const toggleCwSync = (e) => {
  cwSync.value = e.detail.value
  uni.setStorage({
    key: 'cwSync',
    data: cwSync.value
  })
  showToast(cwSync.value ? '已开启CW学习记录同步' : '已关闭CW学习记录同步')
}

// 切换通联日志同步状态
const toggleQsoSync = (e) => {
  qsoSync.value = e.detail.value
  uni.setStorage({
    key: 'qsoSync',
    data: qsoSync.value
  })
  showToast(qsoSync.value ? '已开启通联日志同步' : '已关闭通联日志同步')
}

// 显示提示
const showToast = (title) => {
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000
  })
}

onMounted(() => {
  loadSyncSettings()
})
</script>

<style lang="less" scoped>
.sync-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--background-primary);
}

.sync-container {
  padding: 15px;
}

.sync-header {
  margin-bottom: 20px;
  
  .title {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-primary);
    display: block;
    margin-bottom: 5px;
  }
  
  .desc {
    font-size: 14px;
    color: var(--text-secondary);
    display: block;
  }
}

.warning-card {
  background-color: rgba(255, 122, 0, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
  
  .warning-title {
    font-size: 16px;
    font-weight: bold;
    color: #FF7A00;
    display: block;
    margin-bottom: 10px;
  }
  
  .warning-text {
    font-size: 14px;
    color: #FF7A00;
    line-height: 1.5;
  }
}

.sync-content {
  background-color: var(--background-container);
  border-radius: 10px;
  overflow: hidden;
}

.sync-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color-light);
  
  &:last-child {
    border-bottom: none;
  }
  
  .item-info {
    flex: 1;
  }
  
  .item-title {
    font-size: 15px;
    font-weight: bold;
    color: var(--text-primary);
    display: block;
    margin-bottom: 5px;
  }
  
  .item-desc {
    font-size: 12px;
    color: var(--text-secondary);
    display: block;
  }
}
</style> 