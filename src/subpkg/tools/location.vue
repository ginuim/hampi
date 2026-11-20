<template>
  <view class="location-page" :class="{ 'dark': isDark }">
    <!-- 页面标题 -->
    <NavBar title="位置查询" />

    <!-- 全屏地图 -->
    <view class="map-container">
      <map class="full-map" show-location show-compass show-scale layer-style="2" :longitude="longitude" :latitude="latitude" scale="14" />
    </view>

    <!-- 位置信息展示区（底部浮层） -->
    <view class="location-info-container">
      <view class="location-info">
        <view class="location-info-title">
          我的位置
          <image @tap="getLocation" src="/static/icon-refresh.svg" class="icon-refresh" />
        </view>
        <!-- 经纬度信息 -->
        <view class="info-item" @click="copyToClipboard(longitude)">
          <text class="label">经度：</text>
          <text class="value">{{ longitude }}°</text>
          <text class="copy-icon">复制</text>
        </view>
        <view class="info-item" @click="copyToClipboard(latitude)">
          <text class="label">纬度：</text>
          <text class="value">{{ latitude }}°</text>
          <text class="copy-icon">复制</text>
        </view>
        
        <!-- 梅登海德坐标 -->
        <view class="info-item" @click="copyToClipboard(maidenhead)">
          <text class="label">梅登海德坐标：</text>
          <text class="value">{{ maidenhead }}</text>
          <text class="copy-icon">复制</text>
        </view>
        
        <!-- 海拔高度 -->
        <view v-if="altitude !== '--'" class="info-item" @click="copyToClipboard(formattedAltitude + '米')">
          <text class="label">海拔高度：</text>
          <text class="value">{{ formattedAltitude }}米</text>
          <text class="copy-icon">复制</text>
        </view>
      </view>
    </view>
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
const formattedAltitude = computed(() => {
  if (altitude.value === '--') return '--'
  return parseFloat(altitude.value).toFixed(2)
})

// 复制到剪贴板
const copyToClipboard = (text) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'none'
      })
    }
  })
}

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
  return `${lon1}${lat1}${lon2}${lat2}${lon3}${lat3}`.toUpperCase()
}

// 获取位置信息
const getLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    altitude: true,
    isHighAccuracy: true,
    success: (res) => {
      console.log(res)
      longitude.value = res.longitude.toFixed(6)
      latitude.value = res.latitude.toFixed(6)
      altitude.value = res.altitude
      maidenhead.value = calculateMaidenhead(res.latitude, res.longitude)
      uni.showToast({
        title: '位置获取成功',
        icon: 'none'
      })
    },
    fail: (err) => {
      console.log(err)
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
  position: relative;
  display: flex;
  flex-direction: column;

  .map-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    
    .full-map {
      width: 100%;
      height: 100%;
    }
  }

  .location-info-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 20px;
  }

  .location-info {
    background-color: var(--background-container);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid var(--border-color-light);
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);

    .location-info-title {
      font-size: 14px;
      text-align: center;
      color: var(--text-primary);
      font-weight: bold;
      margin-bottom: 20px;
    }

    .icon-refresh {
      width: 12px;
      height: 12px;
      margin-left: 5px;

      &:active {
        opacity: 0.8;
      }
    }

    .info-item {
      display: flex;
      align-items: center;
      position: relative;
      padding: 8px 0;
      
      &:active {
        background-color: var(--border-color-light);
        border-radius: 4px;
      }

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
      
      .copy-icon {
        font-size: 12px;
        color: var(--text-tertiary);
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-left: 10px;
      }
    }
  }

  .refresh-btn {
    margin-top: 10px;
    background-color: var(--primary-color);
    color: var(--text-white);
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    width: 100%;

    &:active {
      opacity: 0.8;
    }
  }
}
</style> 