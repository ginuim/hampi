<template>
    <view class="worldmap-wrapper">
        <image :src="getMap()" mode="widthFix" />
    </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { worldMapSvg } from './mapData'
import { base64Encode, gridToLatLng } from '@/utils'

const props = defineProps<{
  isDark?: boolean,
  qsoData: Array<{
    type: 'lnglat' | 'grid',
    data: [number, number] | string
  }>
}>()

// 根据经纬度获取数组索引，之前 worldmap 的点阵信息是 144*98 的二维数组，现在改成 144*98 的一维数组，需要改这里的代码
const getArrayIndex = (latitude, longitude) => {
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error("Invalid latitude or longitude")
  }

  const i = Math.floor((longitude + 180) / 2.5) - 3 // 这里-4 修正地图偏移
  const j = Math.floor((90 - latitude) / 1.73) + 4 // 这里+2 修正地图偏移

  if (i < 0 || i >= 144 || j < 0 || j >= 98) {
    throw new Error("Calculated index is out of bounds")
  }

  return { i, j }
}

const getMap = () => {
    const color = props.isDark ? '"rgba(255, 255, 255, 0.7)"' : '"#666"'
    let svgContent = worldMapSvg.replace(/\{\{color\}\}/mg, color)

    // 将 qsoData 转换为索引数组 A
    const indexArray = props.qsoData.map(item => {
        let latitude, longitude
        if (item.type === 'grid') {
            const coords = gridToLatLng(item.data)
            latitude = coords.latitude
            longitude = coords.longitude
        } else if (item.type === 'lnglat') {
            [latitude, longitude] = item.data
        }
        return getArrayIndex(latitude, longitude)
    })

    console.log('indexArray: ', indexArray)

    // 遍历 worldMapSvg 的 circle 节点，修改颜色
    svgContent = svgContent.replace(/<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*>/g, (match, cx, cy) => {
        const index = { i: Math.floor(parseFloat(cx)), j: Math.floor(parseFloat(cy)) }
        if (indexArray.some(idx => idx.i === index.i && idx.j === index.j)) {
            return match.replace(/fill="[^"]*"/, 'fill="#00B42B"')
              .replace(/r="0\.25" /, 'r="0.5" ')
              // .replace(/\/>/, ' style="filter: drop-shadow(0 0 180px #00B42B);" />')
        }
        return match
    })

    console.log('svgContent: ', svgContent)
    return `data:image/svg+xml;base64,${base64Encode(svgContent)}`
}
</script>

<style lang="less" scoped>
.worldmap-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: var(--background-container);
}
</style>
