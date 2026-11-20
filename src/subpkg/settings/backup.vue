<template>
  <view class="backup-page" :class="{ 'dark': isDark }">
    <NavBar title="数据备份" />

    <view class="content">
      <view class="status-card">
        <view class="status-icon">
          <SvgIcon name="icon-backup" size="20" class="icon" />
        </view>
        <view class="status-info">
          <text class="status-title">云端备份</text>
          <text class="status-desc" v-if="lastBackupTime">
            上次备份: {{ formatTime(lastBackupTime) }}
          </text>
          <text class="status-desc" v-else>暂无备份记录</text>
        </view>
      </view>

      <view class="action-section">
        <view class="section-title">备份与恢复</view>
        
        <view class="action-card">
          <view class="action-item" @click="handleBackup">
            <view class="item-left">
              <view class="icon-box upload">
                <text class="iconfont">&#xe689;</text>
              </view>
              <view class="item-info">
                <text class="item-title">立即备份</text>
                <text class="item-desc">上传本地数据到云端</text>
              </view>
            </view>
            <text class="iconfont arrow">&#xe665;</text>
          </view>

          <view class="divider"></view>

          <view class="action-item" @click="handleRestore">
            <view class="item-left">
              <view class="icon-box download">
                <text class="iconfont">&#xe8b7;</text>
              </view>
              <view class="item-info">
                <text class="item-title">恢复数据</text>
                <text class="item-desc">从云端下载最新备份并覆盖本地数据</text>
              </view>
            </view>
            <text class="iconfont arrow">&#xe665;</text>
          </view>
        </view>
      </view>

      <view class="tips-section">
        <text class="tips-title">温馨提示</text>
        <text class="tips-text">• 备份数据包括您的等级信息、通联历史、用户资料等。</text>
        <text class="tips-text">• 恢复数据将覆盖当前的本地记录，请谨慎操作。</text>
        <text class="tips-text">• 建议定期通过云端备份您的重要数据。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useUserLevelStore } from '@/stores/userLevel'
import http from '@/utils/request'

const themeStore = useThemeStore()
const userLevelStore = useUserLevelStore()
const isDark = computed(() => themeStore.isDark)

const lastBackupTime = ref('')

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchLatestBackup = async () => {
  try {
    const res = await http.get('/api/backup/latest')
    if (res.code === 0 && res.data) {
      lastBackupTime.value = res.data.created_at
      return res.data
    }
  } catch (error) {
    console.error('Failed to fetch backup info', error)
  }
  return null
}

const handleBackup = async () => {
  uni.showModal({
    title: '确认备份',
    content: '将把本地数据上传至云端，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '备份中...' })
        try {
          // Gather data
          const backupPayload = {
            userLevelData: uni.getStorageSync('userLevelData'),
            qsoHistory: uni.getStorageSync('qsoHistory'),
            userProfile: uni.getStorageSync('userProfile'),
            // Add other keys if necessary
          }
          
          const deviceRes = uni.getSystemInfoSync()
          const deviceInfo = `${deviceRes.brand} ${deviceRes.model} (${deviceRes.platform} ${deviceRes.system})`

          const response = await http.post('/api/backup/upload', {
            backup_data: backupPayload,
            device_info: deviceInfo
          })

          uni.hideLoading()
          if (response.code === 0) {
            uni.showToast({ title: '备份成功', icon: 'success', duration: 2000 })
            fetchLatestBackup()
          } else {
            uni.showToast({ title: '备份失败', icon: 'none', duration: 2000 })
          }
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '网络请求失败', icon: 'none', duration: 2000 })
          console.error(error)
        }
      }
    }
  })
}

const handleRestore = () => {
  uni.showModal({
    title: '确认恢复',
    content: '恢复数据将覆盖当前本地数据，且不可撤销，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '恢复中...' })
        try {
          const res = await http.get('/api/backup/latest')
          
          uni.hideLoading()
          if (res.code === 0 && res.data && res.data.backup_data) {
            const data = res.data.backup_data
            
            // Restore data
            if (data.userLevelData) uni.setStorageSync('userLevelData', data.userLevelData)
            if (data.qsoHistory) uni.setStorageSync('qsoHistory', data.qsoHistory)
            if (data.userProfile) uni.setStorageSync('userProfile', data.userProfile)
            
            // Reload stores if necessary
            // For userLevelStore, we might need to trigger a reload or just let it reload on next app launch/page visit.
            // Since stores usually load on init, forced reload might be needed.
            if (userLevelStore.loadLevelData) {
                 // The store might not expose loadLevelData directly if not returned, 
                 // but checking the file `userLevel.ts`, it returns `loadLevelData`? 
                 // Let's check userLevel.ts again. It returns `saveLevelData`, but `loadLevelData` is called internally.
                 // Actually `loadLevelData` is not returned in the `return { ... }` block of `userLevel.ts`.
                 // So we can rely on the fact that `userLevelData` is reactive and we updated storage.
                 // To update the store state immediately, we might need to manually refresh the page or restart app.
                 // A simple way is to show a toast "Restore complete, please restart app" or navigate back.
            }
            
            uni.showToast({ title: '恢复成功', icon: 'success', duration: 2000 })
            setTimeout(() => {
                uni.navigateBack()
            }, 2000)
            
          } else {
             uni.showToast({ title: '未找到备份数据', icon: 'none', duration: 2000 })
          }
        } catch (error) {
           uni.hideLoading()
           uni.showToast({ title: '恢复失败', icon: 'none', duration: 2000 })
           console.error(error)
        }
      }
    }
  })
}

onMounted(() => {
  fetchLatestBackup()
})
</script>

<style lang="less" scoped>
.backup-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background-primary);
  padding: 20px;
  
  @media screen and (min-width: 768px) {
    padding: 25px;
  }
}

.status-card {
  background-color: var(--background-container);
  border-radius: 20px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  text-align: center;
}

.status-icon {
  margin-bottom: 15px;
}

.status-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: block;
}

.status-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 12px;
  margin-left: 5px;
}

.action-card {
  background-color: var(--background-container);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 25px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background-color: var(--background-container);
  
  &:active {
    background-color: var(--background-active);
  }
}

.item-left {
  display: flex;
  align-items: center;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  
  .iconfont {
    font-size: 24px;
    color: #fff;
  }
  
  &.upload {
    background: linear-gradient(135deg, #0D5BFF 0%, #0046CC 100%);
  }
  
  &.download {
    background: linear-gradient(135deg, #00C853 0%, #009624 100%);
  }
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.arrow {
  color: var(--text-secondary);
  font-size: 16px;
}

.divider {
  height: 1px;
  background-color: var(--border-color-light);
  margin: 0 20px;
}

.tips-section {
  padding: 0 10px;
}

.tips-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-secondary);
  margin-bottom: 10px;
  display: block;
}

.tips-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 5px;
  display: block;
}
</style>
