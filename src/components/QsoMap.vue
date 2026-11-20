<template>
  <view class="qso-map-container">
    <canvas 
      canvas-id="qsoMap" 
      class="qso-map"
      @touchstart="handleTouch"
    ></canvas>
    <cover-view v-if="loading" class="loading-container">
      <cover-view class="loading"></cover-view>
    </cover-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue'
import { useThemeStore } from '@/stores/theme'
import worldmapData from '@/resources/json/worldmap-data.json'

const themeStore = useThemeStore()
const SCALE_RATIO = uni.getSystemInfoSync().pixelRatio || 2

// 根据世界地图数据的宽高比计算画布尺寸
const mapRatio = worldmapData.width / worldmapData.height
const canvasWidth = 335 * SCALE_RATIO // 基准宽度
const canvasHeight = Math.floor(canvasWidth / mapRatio)

console.log(canvasWidth, canvasHeight)

const props = defineProps({
  // 通联数据，格式：[{lat: number, lng: number, count: number}]
  qsoData: {
    type: Array,
    default: () => []
  }
})

// 删除原来的 MAP_POINTS 常量，使用导入的数据
const MAP_DATA = worldmapData.data

// 添加loading状态
const isLoading = ref(true)

const initMap = () => {
  isLoading.value = true
  const ctx = uni.createCanvasContext('qsoMap', getCurrentInstance())
  
  // 设置画布实际尺寸
  ctx.width = canvasWidth
  ctx.height = canvasHeight
  
  // 清空画布时使用缩放后的尺寸
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 修改点大小计算，考虑缩放因素
  const pointSize = (canvasWidth/SCALE_RATIO) / worldmapData.width
  
  // 绘制地图点函数
  const drawMapPoint = (x, y, point) => {
    if (point >= 1) {
      const posX = x * pointSize
      const posY = y * pointSize

      if (point > 1) {
        const glowRadius = pointSize * 2.4
        const gradient = ctx.createCircularGradient(posX, posY, glowRadius)
        gradient.addColorStop(0, themeStore.isDark ? 'rgba(13, 91, 255, 0.5)' : 'rgba(13, 91, 255, 0.6)')
        gradient.addColorStop(1, 'rgba(13, 91, 255, 0)')
        ctx.setFillStyle(gradient)
        ctx.beginPath()
        ctx.arc(posX, posY, glowRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        // 绘制中心点
        ctx.setFillStyle(themeStore.isDark ? '#1E90FF' : '#0D5BFF')
        ctx.beginPath()
        ctx.arc(posX, posY, pointSize * 0.4, 0, 2 * Math.PI)
        ctx.fill()
        return
      }

      ctx.setFillStyle(themeStore.isDark ? '#dddddd' : '#333333')
      ctx.beginPath()
      ctx.arc(posX, posY, pointSize * 0.2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
  
  // 使用存储的地图数据
  uni.getStorage({
    key: 'worldMapData',
    success: (res) => {
      const mapData = res.data.data
      mapData.forEach((row, y) => {
        row.forEach((point, x) => {
          drawMapPoint(x, y, point)
        })
      })
      ctx.draw(false, () => {
        isLoading.value = false
      })
    },
    fail: () => {
      // 如果没有存储的数据，使用原始数据
      MAP_DATA.forEach((row, y) => {
        row.forEach((point, x) => {
          drawMapPoint(x, y, point)
        })
      })
      ctx.draw(false, () => {
        isLoading.value = false
      })
    }
  })
}

// 监听主题变化
const watchTheme = () => {
  // 使用 watch 来监听主题变化
  const unwatch = watch(
    () => themeStore.isDark,
    () => {
      console.log(themeStore.isDark)
      initMap()
    }
  )
  return unwatch
}

// 添加 watch 来监听 qsoData 的变化
watch(
  () => props.qsoData,
  () => {
    // 当 qsoData 变化时重新初始化地图
    initMap()
  },
  { deep: true }
)

onMounted(() => {
  initMap()
  const unwatch = watchTheme()
  
  onUnmounted(() => {
    unwatch()
  })
})

// 暴露 initMap 方法给父组件
defineExpose({
  initMap
})
</script>

<style scoped>
.qso-map-container {
  overflow: hidden;
  width: 100%;
  background: var(--map-background);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qso-map {
  width: 335px;
  /* 修改高度计算 */
  height: calc(335px / 1.38); /* 1.67 是大致的地图宽高比 */
  display: block;
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading {
  width: 30px;
  height: 30px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color-light);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 