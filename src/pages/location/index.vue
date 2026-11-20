<template>
  <view class="location-page" :class="{ 'dark': isDark }">
    <!-- 页面标题 -->
    <NavBar title="位置查询" />

    <!-- 位置信息展示区 -->
    <view class="location-info">
      <!-- 经纬度信息 -->
      <view class="info-item">
        <text class="label">经度：</text>
        <text class="value">{{ longitude }}°</text>
      </view>
      <view class="info-item">
        <text class="label">纬度：</text>
        <text class="value">{{ latitude }}°</text>
      </view>
      
      <!-- 梅登海德坐标 -->
      <view class="info-item">
        <text class="label">梅登海德坐标：</text>
        <text class="value">{{ maidenhead }}</text>
      </view>
      
      <!-- 海拔高度 -->
      <view class="info-item">
        <text class="label">海拔高度：</text>
        <text class="value">{{ altitude }}米</text>
      </view>
    </view>

    <!-- 刷新按钮 -->
    <button class="refresh-btn" @click="getLocation">刷新位置</button>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const longitude = ref('--')
const latitude = ref('--')
const maidenhead = ref('--')
const altitude = ref('--')

// 计算梅登海德坐标
const calculateMaidenhead = (lat, lon) => {
  // 确保经度在 -180 到 180 之间
  while (lon < -180) lon += 360
  while (lon > 180) lon -= 360

  // 确保纬度在 -90 到 90 之间
  lat = Math.max(-90, Math.min(90, lat))

  // 调整坐标到正数范围
  lon += 180
  lat += 90

  // 计算第一对字符 (经度/20)
  const lon1 = String.fromCharCode(65 + Math.floor(lon / 20))
  // 计算第二对字符 (纬度/10) 
  const lat1 = String.fromCharCode(65 + Math.floor(lat / 10))

  // 计算第二对数字
  const lon2 = Math.floor((lon % 20) / 2)
  const lat2 = Math.floor((lat % 10))

  // 计算第三对小写字母
  const lon3 = String.fromCharCode(97 + Math.floor((lon % 2) * 12))
  const lat3 = String.fromCharCode(97 + Math.floor((lat % 1) * 24))

  // 组合成6位梅登海德网格定位
  return `${lon1}${lat1}${lon2}${lat2}${lon3}${lat3}`
}

// 获取位置信息
const getLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    altitude: true,
    success: (res) => {
      longitude.value = res.longitude.toFixed(6)
      latitude.value = res.latitude.toFixed(6)
      altitude.value = res.altitude ? res.altitude.toFixed(1) : '未知'
      maidenhead.value = calculateMaidenhead(res.latitude, res.longitude)
    },
    fail: () => {
      uni.showToast({
        title: '获取位置失败',
        icon: 'none'
      })
    }
  })
}

onMounted(() => {
  getLocation()
})
</script>

<style lang="less" scoped>
.location-page {
  min-height: 100vh;
  background-color: var(--background-primary);
  padding: 20px;

  .header {
    margin-bottom: 30px;
    
    .title {
      font-size: 24px;
      color: var(--text-primary);
      font-weight: bold;
    }
  }

  .location-info {
    background-color: var(--background-secondary);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);

    .info-item {
      margin-bottom: 20px;
      display: flex;
      align-items: center;

      .label {
        color: var(--text-secondary);
        font-size: 16px;
        min-width: 120px;
      }

      .value {
        color: var(--text-primary);
        font-size: 16px;
        flex: 1;
      }
    }
  }

  .refresh-btn {
    margin-top: 30px;
    background-color: var(--primary-color);
    color: var(--text-white);
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;

    &:active {
      opacity: 0.8;
    }
  }
}
</style> 