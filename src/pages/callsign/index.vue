<template>
  <view class="callsign-page" :class="{ 'dark': isDark }">
    <NavBar :showBack="true" title="查询呼号归属" />
    <view class="container">
      <view class="search-box">
        <view class="search-input-wrapper">
          <text class="iconfont search-icon">&#xe628;</text>
          <input 
            class="callsign-input" 
            v-model="callSign" 
            placeholder="请输入待查询呼号" 
            placeholder-class="placeholder"
            maxlength="10"
            @input="handleInputChange"
          />
          <text v-if="callSign" class="iconfont clear-icon" @tap="clearInput">&#xe648;</text>
        </view>
      </view>
      
      <view class="result-card" v-if="callSignResult">
        <view class="result-title">呼号基本信息</view>
        <view class="result-item">
          <text class="item-label">国家/地区：</text>
          <text class="item-value">{{ callSignResult.country }}</text>
        </view>
        
        <view class="result-item" v-if="callSignResult.province">
          <text class="item-label">省份：</text>
          <text class="item-value">{{ callSignResult.province }}</text>
        </view>

        <view class="result-item" v-if="callSignResult.region">
          <text class="item-label">区域：</text>
          <text class="item-value">{{ callSignResult.region }}</text>
        </view>
        
        <view class="result-item" v-if="callSignResult.type">
          <text class="item-label">电台类型：</text>
          <text class="item-value">{{ callSignResult.type }}</text>
        </view>
        
        <view class="result-item" v-if="callSignResult.isMobile">
          <text class="item-label">移动操作：</text>
          <text class="item-value">{{ callSignResult.operationRegion }}</text>
        </view>

        <view class="qrz-result" v-if="qrzResult">
          <view class="result-title">QRZ呼号数据</view>
          
          <view class="result-item" v-if="qrzResult.call">
            <text class="item-label">呼号：</text>
            <text class="item-value">{{ qrzResult.call }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.name || qrzResult.fname">
            <text class="item-label">姓名：</text>
            <text class="item-value">{{ qrzResult.fname || '' }} {{ qrzResult.name || '' }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.country">
            <text class="item-label">国家：</text>
            <text class="item-value">{{ qrzResult.country }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.state">
            <text class="item-label">州/省：</text>
            <text class="item-value">{{ qrzResult.state }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.addr1 || qrzResult.addr2">
            <text class="item-label">地址：</text>
            <text class="item-value">{{ qrzResult.addr1 || '' }} {{ qrzResult.addr2 || '' }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.grid">
            <text class="item-label">网格：</text>
            <text class="item-value">{{ qrzResult.grid }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.class">
            <text class="item-label">等级：</text>
            <text class="item-value">{{ qrzResult.class }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.aliases">
            <text class="item-label">别名：</text>
            <text class="item-value">{{ qrzResult.aliases }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.email">
            <text class="item-label">邮箱：</text>
            <text class="item-value">{{ qrzResult.email }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.url">
            <text class="item-label">网址：</text>
            <text class="item-value">{{ qrzResult.url }}</text>
          </view>
          
          <view class="result-item" v-if="qrzResult.image">
            <text class="item-label">照片：</text>
            <image class="qrz-image" :src="qrzResult.image" mode="aspectFit" @tap="previewImage(qrzResult.image)" />
          </view>
        </view>
      </view>
      
      <view class="no-result" v-else-if="hasSearched && callSign.trim()">
        <text>未找到呼号归属信息</text>
      </view>

      <view v-if="mapCenter" class="result-map">
        <map show-compass :enable-satellite="true" :scale="3" show-scale include-points :markers="[mapCenter]" show-location :longitude="mapCenter.longitude" :latitude="mapCenter.latitude" :polyline="polylines" />
        <!-- <view class="map-controls">
          <text class="refresh-btn" @tap="getUserLocationAndCreatePolyline">刷新连接线</text>
        </view> -->
      </view>

      <view class="no-result">
        <text>可以在首页顶部搜索框快速查询呼号基本信息</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed, watch, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
// import { data } from '@/resources/json/region.json'
import { queryCallSign } from './utils'
import { gridToLatLng } from '@/utils'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const isShowQRZQuery = ref(false)

const callSign = ref('')
const callSignResult = ref(null)
const hasSearched = ref(false)
const debounceTimer = ref(null)
const qrzLoading = ref(false)
const qrzResult = ref(null)
const mapCenter = ref(null)
const polylines = ref([])
let searchTimer = null

onMounted(() => {
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

// 输入框变化时触发
const handleInputChange = () => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    handleSearch()
  }, 500) // 500毫秒防抖
}

onLoad((options) => {
  callSign.value = options.query
  callSign.value && handleInputChange()
})

// 处理查询
const handleSearch = () => {
  isShowQRZQuery.value = false
  if (!callSign.value.trim()) {
    callSignResult.value = null
    hasSearched.value = false
    return
  }
  mapCenter.value = null

  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    uni.reportEvent('search', {
      'content': callSign.value
    })
    // 已停用 QRZ 详情查询，仅显示本地归属地信息。
  }, 2000)
  
  try {
    // 仅进行基本查询，不使用QRZ
    callSignResult.value = queryCallSign(callSign.value.trim())
    hasSearched.value = true
    // 重置QRZ查询结果
    qrzResult.value = null
  } catch (error) {
    console.error('查询呼号出错:', error)
    callSignResult.value = null
    hasSearched.value = true
    uni.showToast({
      title: '查询失败，请稍后重试',
      icon: 'none'
    })
  }
}

// // 查询QRZ详细信息
// const queryQRZInfo = async () => {
//   if (!callSign.value.trim()) {
//     qrzResult.value = null
//     return
//   }
//
//   if (qrzLoading.value) return
//
//   qrzLoading.value = true
//   try {
//     // 调用QRZ查询，传入true表示使用QRZ API
//     const result = await queryQRZ(callSign.value.trim())
//     const { lon, lat, grid } = result
//     if (lon && lat) {
//       mapCenter.value = {
//         longitude: lon,
//         latitude: lat
//       }
//     } else if (grid) {
//       mapCenter.value = gridToLatLng(grid)
//     }
//     qrzResult.value = result
//   } catch (error) {
//     console.error('查询QRZ信息出错:', error)
//     qrzResult.value = null
//     uni.showToast({
//       title: '查询失败: ' + (error.message || '请稍后重试'),
//       icon: 'none'
//     })
//   } finally {
//     qrzLoading.value = false
//   }
// }
//

// 监听输入变化
watch(callSign, (newVal) => {
  if (!newVal?.trim()) {
    callSignResult.value = null
    hasSearched.value = false
    qrzResult.value = null
  }
})

// 获取用户位置并创建连接线
const getUserLocationAndCreatePolyline = () => {
  if (!mapCenter.value) return
  
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      const userLocation = {
        latitude: res.latitude,
        longitude: res.longitude
      }
      
      polylines.value = [{
        points: [
          {
            latitude: mapCenter.value.latitude,
            longitude: mapCenter.value.longitude
          },
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          }
        ],
        color: '#3a8ee6',
        width: 2,
        dottedLine: true
      }]
    },
    fail: () => {
      uni.showToast({
        title: '获取位置失败',
        icon: 'none'
      })
    }
  })
}

// 监听mapCenter变化，自动创建连接线
watch(mapCenter, (newVal) => {
  if (newVal) {
    getUserLocationAndCreatePolyline()
  } else {
    polylines.value = []
  }
})

const previewImage = (url) => {
  if (!url) return
  
  uni.previewImage({
    urls: [url],
    current: url
  })
}

const clearInput = () => {
  callSign.value = ''
  callSignResult.value = null
  hasSearched.value = false
  mapCenter.value = null
}
</script>

<style lang="less" scoped>
.callsign-page {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.container {
  padding: 10px 20px;
}

.search-box {
  display: flex;
  margin-bottom: 15px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  height: 36px;
  border-radius: 18px;
  background-color: var(--search-background);
  transition: all 0.3s;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.callsign-input {
  flex: 1;
  height: 100%;
  padding: 0 12px 0 36px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--text-secondary);
  }
}

.clear-icon {
  color: var(--text-secondary);
  margin-right: 15px; 
}

.placeholder {
  color: var(--text-secondary);
}

.result-card {
  // margin-bottom: 10px;
  padding: 1px 15px 15px;
  background-color: var(--background-container);
  border-radius: 12px;
}

.result-map {
  margin-top: 10px;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 12px;
  position: relative;

  map {
    width: 100%;
    height: 100%;
  }
}

.result-title {
  position: relative;
  padding-left: 12px;
  font-size: 16px;
  font-weight: bold;
  margin: 20px 0;
  color: var(--text-primary);
}

.result-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #3a8ee6;
  border-radius: 2px;
}

.result-item {
  display: flex;
  margin-bottom: 10px;
}

.item-label {
  color: var(--text-secondary);
  width: 90px;
  font-size: 14px;
}

.item-value {
  color: var(--text-primary);
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.no-result {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.qrz-query {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrz-tip {
  margin: 10px 0;
  padding: 3px 18px;
  color: white;
  border-radius: 18px;
  background-color: var(--primary-color);
  font-size: 14px;

  .iconfont {
    font-size: 12px;
  }
}

// .qrz-btn {
//   padding: 6px 18px;
//   background-color: #3a8ee6;
//   color: #ffffff;
//   border-radius: 18px;
//   font-size: 14px;
//   border: none;
// }

.qrz-image {
  width: 100%;
  height: 150px;
  margin-top: 5px;
  object-fit: cover;
  border-radius: 6px;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.refresh-btn {
  padding: 4px 12px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 18px;
  font-size: 12px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
</style>
