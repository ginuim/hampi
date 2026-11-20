<template>
  <view class="qso-page" :class="{ 'dark': isDark }">
    <NavBar title="通联日志" />
    
    <view class="container">
      <!-- 地图展示区域 -->
      <view class="map-section">
        <WorldMap ref="qsoMapRef" :isDark="isDark" :qsoData="qsoData" :mapWidth="mapWidth" :mapHeight="mapHeight" />
        <!-- <QsoMap ref="qsoMapRef" :qsoData="qsoData" :mapWidth="mapWidth" :mapHeight="mapHeight" /> -->
      </view>

      <!-- 添加tab切换组件 -->
      <view class="tabs">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'form' }"
          @tap="activeTab = 'form'"
        >
          记录通联
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'history' }"
          @tap="activeTab = 'history'"
        >
          历史记录
        </view>
      </view>

      <!-- 修改表单和历史记录部分的显示逻辑 -->
      <view class="tab-content">
        <!-- 表单部分 -->
        <view class="form-section" v-show="activeTab === 'form'">
          <view class="form-item">
            <text class="label">对方呼号</text>
            <input 
              class="input" 
              :value="formData.callsign"
              @input="e => formData.callsign = e.detail.value.toUpperCase()"
              placeholder="请输入对方呼号"
            />
          </view>

          <view class="form-item">
            <text class="label">频率 ({{ frequencyUnit }})</text>
            <view class="frequency-input-container">
              <input 
                class="input frequency-input" 
                type="digit"
                :value="frequency"
                @blur="onFrequencyChange"
                :placeholder="'请输入频率(' + frequencyUnit + ')'"
              />
              <view class="unit-switch" @tap="toggleFrequencyUnit">
                {{ frequencyUnit }}
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="label">通联模式</text>
            <picker 
              :range="modes"
              :value="modeIndex"
              @change="onModeChange"
            >
              <view class="picker">{{ formData.mode }}</view>
            </picker>
          </view>

          <view class="form-item">
            <text class="label">频段</text>
            <picker 
              :range="bands"
              :value="bandIndex"
              @change="onBandChange"
            >
              <view class="picker">{{ formData.band }}</view>
            </picker>
          </view>

          <view class="form-item">
            <text class="label">位置信息</text>
            <view class="location-inputs">
              <view class="location-type">
                <text 
                  class="type-item" 
                  :class="{'active': locationType === 'grid'}"
                  @tap="locationType = 'grid'"
                >梅登海德</text>
                <text 
                  class="type-item" 
                  :class="{'active': locationType === 'latlng'}"
                  @tap="locationType = 'latlng'"
                >经纬度</text>
                <text 
                  class="type-item" 
                  :class="{'active': locationType === 'location'}"
                  @tap="locationType = 'location'"
                >城市</text>
              </view>

              <template v-if="locationType === 'grid'">
                <input 
                  class="input" 
                  :value="formData.grid"
                  @input="e => formData.grid = e.detail.value.toUpperCase()"
                  placeholder="如: OM89"
                />
              </template>
              <view v-else-if="locationType === 'location'" class="picker-container">
                <uni-data-picker
                  popup-title="选择城市(暂时只支持国内)"
                  :localdata="cities"
                  @change="handlePickerChange"
                ></uni-data-picker>
              </view>
              <template v-else>
                <view class="latlng-inputs">
                  <input 
                    class="input half" 
                    v-model="formData.latitude"
                    type="number"
                    placeholder="纬度"
                  />
                  <input 
                    class="input half" 
                    v-model="formData.longitude"
                    type="number"
                    placeholder="经度"
                  />
                </view>
              </template>
            </view>
          </view>

          <view class="form-item">
            <text class="label">通联时间</text>
            <view class="datetime-inputs">
              <picker 
                mode="date" 
                :value="formData.date"
                @change="onDateChange"
              >
                <view class="picker">{{ formData.date || '选择日期' }}</view>
              </picker>
              <picker 
                mode="time" 
                :value="formData.time"
                @change="onTimeChange"
              >
                <view class="picker">{{ formData.time || '选择时间' }}</view>
              </picker>
            </view>
            <view class="utc-time">
              UTC: {{ formData.utcDate }} {{ formData.utcTime }}
            </view>
          </view>

          <view class="form-item">
            <text class="label">发送信号报告</text>
            <input 
              class="input" 
              v-model="formData.rstSent"
              placeholder="发送RST"
            />
          </view>

          <view class="form-item">
            <text class="label">接收信号报告</text>
            <input 
              class="input" 
              v-model="formData.rstRcvd"
              placeholder="接收RST"
            />
          </view>

          <view class="form-item">
            <text class="label">备注</text>
            <textarea 
              class="textarea" 
              v-model="formData.notes"
              placeholder="添加备注信息"
            />
          </view>

          <button class="submit-btn" :class="{'editing': isEditing}" @tap="handleSubmit">
            {{ isEditing ? '更新记录' : '保存记录' }}
          </button>
        </view>

        <!-- 历史记录部分 -->
        <view class="history-section" v-if="activeTab === 'history'">
          <!-- <view class="section-header">
            <view class="header-actions">
              <button class="action-btn" @tap="handleShare">分享</button>
              <button class="action-btn" @tap="exportADIF">导出ADIF</button>
            </view>
          </view> -->
          <view v-if="qsoHistory.length > 0" class="history-list">
            <!-- 表头 -->
            <view class="history-table-header">
              <text class="header-cell time">时间</text>
              <text class="header-cell callsign">呼号</text>
              <text class="header-cell mode">模式</text>
              <text class="header-cell band">频段</text>
              <text class="header-cell frequency">频率</text>
            </view>
            
            <!-- 表格内容 -->
            <view 
              class="history-table-row"
              v-for="(item, index) in qsoHistory" 
              :key="index"
              @tap="showQsoDetail(item)"
            >
              <text class="cell time">{{ item.date.replace(/-/g, '.') }}</text>
              <text class="cell callsign">{{ item.callsign }}</text>
              <text class="cell mode">{{ item.mode }}</text>
              <text class="cell band">{{ item.band }}</text>
              <text class="cell frequency">{{ item.frequency }} MHz</text>
            </view>
          </view>
          <view v-else class="history-empty">
            <text>暂无通联记录</text>
          </view>

          <!-- 修改通联详情弹窗部分 -->
          <cover-view class="qso-detail-modal-container" v-if="showDetail">
            <cover-view 
              class="qso-detail-modal-mask"
              @tap="showDetail = false"
            ></cover-view>
            <cover-view 
              class="qso-detail-modal"
              :style="{ transform: showDetail ? 'translateY(0)' : 'translateY(100%)' }"
            >
              <cover-view class="modal-content">
                <cover-view class="modal-header">
                  <cover-view class="modal-title">通联详情</cover-view>
                  <cover-view class="close-btn" @tap="showDetail = false">×</cover-view>
                </cover-view>
                <cover-view class="detail-content">
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">呼号：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.callsign }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">位置：</cover-view>
                    <cover-view v-if="selectedQso.location && selectedQso.location.length > 0" class="detail-value">{{ selectedQso.location.join('/') }}</cover-view>
                    <cover-view v-else class="detail-value">{{ selectedQso.grid || `${selectedQso.latitude}, ${selectedQso.longitude}` }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">日期时间：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.date }} {{ selectedQso.time }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">UTC：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.utcDate }} {{ selectedQso.utcTime }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">模式：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.mode }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">频段：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.band }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">信号报告：</cover-view>
                    <cover-view class="detail-value">发送:{{ selectedQso.rstSent }} 接收:{{ selectedQso.rstRcvd }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item" v-if="selectedQso.notes">
                    <cover-view class="detail-label">备注：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.notes }}</cover-view>
                  </cover-view>
                  <cover-view class="detail-item">
                    <cover-view class="detail-label">频率：</cover-view>
                    <cover-view class="detail-value">{{ selectedQso.frequency }} MHz</cover-view>
                  </cover-view>
                </cover-view>
                <cover-view class="modal-footer">
                  <cover-view class="action-btn delete-btn" @tap="handleDeleteQso">删除</cover-view>
                  <cover-view class="action-btn edit-btn" @tap="handleEditQso">编辑</cover-view>
                </cover-view>
              </cover-view>
            </cover-view>
          </cover-view>
        </view>
      </view>
    </view>

    <!-- 修改 canvas 元素 -->
    <canvas 
      canvas-id="posterCanvas"
      :style="{
        width: pixelRatio * 375 + 'px',
        height: pixelRatio * 500 + 'px',
        position: 'fixed',
        top: '-4999.5px',
        left: '-4999.5px'
      }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
// import QsoMap from '@/components/QsoMap.vue'
import { useThemeStore } from '@/stores/theme'
// import worldmapData from '@/resources/json/worldmap-data.json'
import WorldMap from './WorldMap.vue'
import { gridToLatLng } from '@/utils'
import cities from './cities.json'
import { useWxml2Canvas } from '@/hooks/useWxml2Canvas'


console.log(cities)

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 获取当前日期时间的格式化字符串
const getCurrentDateTime = () => {
  const now = new Date()
  const date = now.toISOString().split('T')[0]  // YYYY-MM-DD
  const time = now.toTimeString().substring(0, 5)  // HH:mm
  
  // 获取UTC时间
  const utcDate = now.toISOString().split('T')[0]
  const utcTime = now.toISOString().split('T')[1].substring(0, 5)
  
  return { date, time, utcDate, utcTime }
}

const mapWidth = ref(300)
const mapHeight = ref(150)

// 表单数据
const formData = ref({
  callsign: '',
  grid: '',
  latitude: '',
  longitude: '',
  location: [],
  date: getCurrentDateTime().date,
  time: getCurrentDateTime().time,
  utcDate: getCurrentDateTime().utcDate,
  utcTime: getCurrentDateTime().utcTime,
  mode: 'FM',
  band: '70cm',
  frequency: '438.500',
  rstSent: '599',
  rstRcvd: '599',
  notes: '',
  synced: false
})

// 位置类型切换
const locationType = ref('grid')

// 历史记录
const qsoHistory = ref([])

// 地图数据
const qsoData = computed(() => {
  return qsoHistory.value.map(item => {
    if (item.grid) {
      return {
        type: 'grid' as const,
        data: item.grid
      }
    } else {
      return {
        type: 'lnglat' as const,
        data: [Number(item.latitude), Number(item.longitude)]
      }
    }
  })
})

// 添加通联详情相关变量和方法
const showDetail = ref(false)
const selectedQso = ref({})

// 添加activeTab变量
const activeTab = ref('form')

// 在 script setup 部分添加以下代码
const modes = ['AM', 'FM', 'CW', 'SSB', 'DYNAMIC', 'FSK411', 'FT8', 'HELL', 'ISCAT', 'JT65', 'JT6C', 'JT6M', 'JT9', 'MFSK', 'MSK144', 'PKT', 'PSK', 'QRA64', 'ROS', 'FT4', 'RTTY', 'SSTV']
const bands = ['160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '4m', '2m', '1.25m', '70cm', '33cm', '23cm', '13cm', '9cm', '6cm', '3cm', '1.25cm']

// 计算当前选中的索引
const modeIndex = computed(() => modes.indexOf(formData.value.mode))
const bandIndex = computed(() => bands.indexOf(formData.value.band))

// 在 script setup 部分添加频段到频率的映射
const bandFreqMap = {
  '160m': '1.8-2.0',
  '80m': '3.5-4.0',
  '60m': '5.3-5.4',
  '40m': '7.0-7.3',
  '30m': '10.1-10.15',
  '20m': '14.0-14.35',
  '17m': '18.068-18.168',
  '15m': '21.0-21.45',
  '12m': '24.89-24.99',
  '10m': '28.0-29.7',
  '6m': '50-54',
  '4m': '70-70.5',
  '2m': '144-148',
  '1.25m': '222-225',
  '70cm': '420-450',
  '33cm': '902-928',
  '23cm': '1240-1300',
  '13cm': '2300-2450',
  '9cm': '3300-3500',
  '6cm': '5650-5925',
  '3cm': '10000-10500',
  '1.25cm': '24000-24250'
}

// 添加频率相关的响应式数据
const frequency = ref('')
const frequencyUnit = ref('MHz')

// 添加单位切换函数
const toggleFrequencyUnit = () => {
  frequencyUnit.value = frequencyUnit.value === 'MHz' ? 'kHz' : 'MHz'
  
  // 添加保存frequencyUnit到storage的代码
  uni.setStorage({
    key: 'frequencyUnit',
    data: frequencyUnit.value,
    success: () => {
      console.log('Frequency unit saved successfully')
    }
  })
  
  // 如果当前有频率值，进行单位转换
  if (frequency.value) {
    const currentFreq = Number(frequency.value)
    if (!isNaN(currentFreq)) {
      if (frequencyUnit.value === 'kHz') {
        // 从MHz转换到kHz
        frequency.value = String(currentFreq * 1000)
      } else {
        // 从kHz转换到MHz
        frequency.value = String(currentFreq / 1000)
      }
    }
  }
}

// 添加JARL bandplan频率到模式的映射
const jarlBandplan = [
  // 160m
  { min: 1.800, max: 1.810, mode: 'CW', band: '160m' },
  { min: 1.810, max: 1.825, mode: 'CW', band: '160m' },
  { min: 1.825, max: 1.875, mode: 'CW', band: '160m' },
  { min: 1.875, max: 1.907, mode: 'SSB', band: '160m' },
  { min: 1.907, max: 1.912, mode: 'RTTY', band: '160m' },
  { min: 1.912, max: 2.000, mode: 'SSB', band: '160m' },
  
  // 80m
  { min: 3.500, max: 3.520, mode: 'CW', band: '80m' },
  { min: 3.520, max: 3.525, mode: 'RTTY', band: '80m' },
  { min: 3.525, max: 3.575, mode: 'CW', band: '80m' },
  { min: 3.580, max: 3.599, mode: 'RTTY', band: '80m' },
  { min: 3.599, max: 3.612, mode: 'FT8', band: '80m' },
  { min: 3.613, max: 3.800, mode: 'SSB', band: '80m' },
  
  // 40m
  { min: 7.000, max: 7.025, mode: 'CW', band: '40m' },
  { min: 7.025, max: 7.030, mode: 'RTTY', band: '40m' },
  { min: 7.030, max: 7.040, mode: 'CW', band: '40m' },
  { min: 7.040, max: 7.045, mode: 'RTTY', band: '40m' },
  { min: 7.045, max: 7.074, mode: 'SSB', band: '40m' },
  { min: 7.074, max: 7.078, mode: 'FT8', band: '40m' },
  { min: 7.078, max: 7.100, mode: 'SSB', band: '40m' },
  { min: 7.100, max: 7.300, mode: 'SSB', band: '40m' },
  
  // 30m
  { min: 10.100, max: 10.130, mode: 'CW', band: '30m' },
  { min: 10.130, max: 10.140, mode: 'RTTY', band: '30m' },
  { min: 10.140, max: 10.143, mode: 'FT8', band: '30m' },
  { min: 10.143, max: 10.150, mode: 'RTTY', band: '30m' },
  
  // 20m
  { min: 14.000, max: 14.025, mode: 'CW', band: '20m' },
  { min: 14.025, max: 14.070, mode: 'CW', band: '20m' },
  { min: 14.070, max: 14.099, mode: 'RTTY', band: '20m' },
  { min: 14.099, max: 14.101, mode: 'BEACON', band: '20m' },
  { min: 14.101, max: 14.112, mode: 'RTTY', band: '20m' },
  { min: 14.112, max: 14.230, mode: 'SSB', band: '20m' },
  { min: 14.230, max: 14.285, mode: 'SSB', band: '20m' },
  { min: 14.285, max: 14.350, mode: 'SSB', band: '20m' },
  
  // 17m
  { min: 18.068, max: 18.095, mode: 'CW', band: '17m' },
  { min: 18.095, max: 18.105, mode: 'RTTY', band: '17m' },
  { min: 18.105, max: 18.110, mode: 'FT8', band: '17m' },
  { min: 18.110, max: 18.168, mode: 'SSB', band: '17m' },
  
  // 15m
  { min: 21.000, max: 21.070, mode: 'CW', band: '15m' },
  { min: 21.070, max: 21.125, mode: 'RTTY', band: '15m' },
  { min: 21.125, max: 21.200, mode: 'CW', band: '15m' },
  { min: 21.200, max: 21.450, mode: 'SSB', band: '15m' },
  
  // 12m
  { min: 24.890, max: 24.915, mode: 'CW', band: '12m' },
  { min: 24.915, max: 24.925, mode: 'RTTY', band: '12m' },
  { min: 24.925, max: 24.929, mode: 'FT8', band: '12m' },
  { min: 24.929, max: 24.990, mode: 'SSB', band: '12m' },
  
  // 10m
  { min: 28.000, max: 28.070, mode: 'CW', band: '10m' },
  { min: 28.070, max: 28.190, mode: 'RTTY', band: '10m' },
  { min: 28.190, max: 28.200, mode: 'BEACON', band: '10m' },
  { min: 28.200, max: 29.300, mode: 'SSB', band: '10m' },
  { min: 29.300, max: 29.510, mode: 'FM', band: '10m' },
  { min: 29.510, max: 29.700, mode: 'FM', band: '10m' },
  
  // 6m
  { min: 50.000, max: 50.100, mode: 'CW', band: '6m' },
  { min: 50.100, max: 50.300, mode: 'SSB', band: '6m' },
  { min: 50.300, max: 50.600, mode: 'AM', band: '6m' },
  { min: 50.600, max: 51.000, mode: 'FM', band: '6m' },
  { min: 51.000, max: 54.000, mode: 'FM', band: '6m' },
  
  // 2m
  { min: 144.000, max: 144.100, mode: 'CW', band: '2m' },
  { min: 144.100, max: 144.500, mode: 'SSB', band: '2m' },
  { min: 144.500, max: 145.800, mode: 'FM', band: '2m' },
  { min: 145.800, max: 146.000, mode: 'FM', band: '2m' },
  { min: 146.000, max: 146.600, mode: 'FM', band: '2m' },
  { min: 146.600, max: 147.000, mode: 'FM', band: '2m' },
  { min: 147.000, max: 148.000, mode: 'FM', band: '2m' },
  
  // 70cm
  { min: 430.000, max: 432.000, mode: 'CW', band: '70cm' },
  { min: 432.000, max: 433.000, mode: 'SSB', band: '70cm' },
  { min: 433.000, max: 440.000, mode: 'FM', band: '70cm' },
  { min: 440.000, max: 450.000, mode: 'FM', band: '70cm' }
]

// 处理模式变化
const onModeChange = (e) => {
  formData.value.mode = modes[e.detail.value]
}

const handlePickerChange = (e) => {
  formData.value.location = e.detail.value.map(item => item.value)
  
  // 查找省份
  const province = cities.find(p => p.value === formData.value.location[0])
  if (!province) return
  
  let item = null
  
  // 台湾省是二级结构（省 -> 县/市），其他省份是三级结构（省 -> 市 -> 区/县）
  if (formData.value.location.length === 2) {
    // 二级结构：直接在省的children中查找
    item = province.children.find(city => city.value === formData.value.location[1])
  } else if (formData.value.location.length === 3) {
    // 三级结构：省 -> 市 -> 区/县
    const city = province.children.find(c => c.value === formData.value.location[1])
    if (city && city.children) {
      item = city.children.find(area => area.value === formData.value.location[2])
    }
  }
  
  // 获取经纬度并填写到相应字段
  if (item && item.lat && item.lng) {
    formData.value.latitude = item.lat
    formData.value.longitude = item.lng
  }
  console.log('picker change:', e)
  console.log('current locationType:', locationType.value)
  console.log('current formData:', formData.value)
}

// 修改 onBandChange 函数
const onBandChange = (e) => {
  const selectedBand = bands[e.detail.value]
  formData.value.band = selectedBand
  
  // 自动填入该频段的中间频率
  const freqRange = bandFreqMap[selectedBand]
  if (freqRange) {
    const [min, max] = freqRange.split('-').map(Number)
    const midFreq = ((min + max) / 2).toFixed(3)
    
    // 根据当前单位设置显示值
    if (frequencyUnit.value === 'kHz') {
      frequency.value = String(midFreq * 1000)
    } else {
      frequency.value = midFreq
    }
    
    // 始终以MHz存储
    formData.value.frequency = midFreq
  }
}

// 更新 onFrequencyChange 函数
const onFrequencyChange = (e) => {
  let freq = Number(e.detail.value)
  frequency.value = e.detail.value
  
  // 如果单位是kHz，转换为MHz进行处理
  if (frequencyUnit.value === 'kHz') {
    freq = freq / 1000
  }
  
  // 保存到表单数据（始终以MHz为单位存储）
  formData.value.frequency = String(freq)
  
  // 查找匹配的频段规划
  let foundBandplan = null
  for (const plan of jarlBandplan) {
    if (freq >= plan.min && freq <= plan.max) {
      foundBandplan = plan
      break
    }
  }
  
  if (foundBandplan) {
    // 设置对应的频段
    formData.value.band = foundBandplan.band
    
    // 设置对应的模式
    formData.value.mode = foundBandplan.mode
    
    // 如果是SSB或FM，自动设置报告为59
    if (foundBandplan.mode === 'SSB' || foundBandplan.mode === 'FM') {
      formData.value.rstSent = '59'
      formData.value.rstRcvd = '59'
    } 
    // 如果是CW，设置报告为599
    else if (foundBandplan.mode === 'CW') {
      formData.value.rstSent = '599'
      formData.value.rstRcvd = '599'
    }
    
    uni.showToast({
      title: `已自动设置为${foundBandplan.band}/${foundBandplan.mode}`,
      icon: 'none',
      duration: 2000
    })
  } else {
    // 如果输入的频率不在任何频段规划内
    let foundBand = false
    for (const [band, range] of Object.entries(bandFreqMap)) {
      const [min, max] = range.split('-').map(Number)
      if (freq >= min && freq <= max) {
        formData.value.band = band
        foundBand = true
        break
      }
    }
    
    // 如果没有找到对应的频段
    if (!foundBand && formData.value.band && frequency.value) {
      uni.showToast({
        title: '频率超出业余频段范围',
        icon: 'none'
      })
    }
  }
}

// 日期时间选择器回调
const onDateChange = (e) => {
  formData.value.date = e.detail.value
  updateUTCDateTime()
}

const onTimeChange = (e) => {
  formData.value.time = e.detail.value
  updateUTCDateTime()
}

// 更新UTC时间
const updateUTCDateTime = () => {
  if (formData.value.date && formData.value.time) {
    const localDate = new Date(`${formData.value.date} ${formData.value.time}`)
    const utcDate = new Date(localDate.getTime())
    
    formData.value.utcDate = utcDate.toISOString().split('T')[0]
    formData.value.utcTime = utcDate.toISOString().split('T')[1].substring(0, 5)
  }
}

// 生成ADIF格式数据
const generateADIF = (logs) => {
  let adifHeader = `<ADIF_VER:5>3.1.0\n<PROGRAMID:8>HAMLogger\n<EOH>\n`
  
  let adifBody = logs.map(log => {
    const qsoDate = log.utcDate.replace(/-/g, '')
    const timeOn = log.utcTime.replace(':', '')
    
    return `<CALL:${log.callsign.length}>${log.callsign} ` +
           `<QSO_DATE:8>${qsoDate} ` +
           `<TIME_ON:4>${timeOn} ` +
           `<BAND:${log.band.length}>${log.band} ` +
           `<MODE:${log.mode.length}>${log.mode} ` +
           `<RST_SENT:3>${log.rstSent} ` +
           `<RST_RCVD:3>${log.rstRcvd} ` +
           `<GRIDSQUARE:${log.grid?.length || 0}>${log.grid || ''} ` +
           `<LAT:${String(log.latitude).length}>${log.latitude} ` +
           `<LON:${String(log.longitude).length}>${log.longitude} ` +
           `<COMMENT:${log.notes?.length || 0}>${log.notes || ''}`
  }).join('\n')
  
  return adifHeader + adifBody
}

const exportADIF = () => {
  const adifContent = generateADIF(qsoHistory.value)
  const filePath = `${uni.env.USER_DATA_PATH}/hamlog.adif`

  uni.getFileSystemManager().writeFile({
    filePath,
    data: adifContent,
    encoding: 'utf8',
    success: () => {
      uni.getFileSystemManager().saveFile({
        tempFilePath: filePath,
        success: (res) => {
          uni.showToast({
            title: '导出成功',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.log('导出失败', err)
          uni.showToast({
            title: '导出失败',
            icon: 'none'
          })
        }
      })
    },
    fail: (err) => {
      console.log('写入文件失败', err)
      uni.showToast({
        title: '写入文件失败',
        icon: 'none'
      })
    }
  })
}

// 修改 loadFromStorage 函数，移除原来的 qsoData 更新逻辑
const loadFromStorage = () => {
  uni.getStorage({
    key: 'qsoHistory',
    success: (res) => {
      if (Array.isArray(res.data)) {
        qsoHistory.value = res.data
      }
    },
    fail: () => {
      qsoHistory.value = []
    }
  })
}

// 修改 saveToStorage 函数，确保数据正确保存
const saveToStorage = () => {
  uni.setStorage({
    key: 'qsoHistory',
    data: qsoHistory.value,
    success: () => {
      console.log('QSO history saved successfully')
    },
    fail: (error) => {
      console.error('Failed to save QSO history:', error)
    }
  })
}

// 添加设备像素比
const pixelRatio = ref(1)

// 在组件挂载时加载数据
onMounted(() => {
  // 首先加载历史数据
  loadFromStorage()
  
  // 加载保存的frequencyUnit
  uni.getStorage({
    key: 'frequencyUnit',
    success: (res) => {
      if (res.data) {
        frequencyUnit.value = res.data
      }
    }
  })
  
  updateUTCDateTime()  // 初始化UTC时间

  // 获取屏幕宽度来设置地图尺寸
  const systemInfo = uni.getSystemInfoSync()
  mapWidth.value = systemInfo.windowWidth - 40
  // 根据世界地图数据的宽高比(144:98)来设置高度
  mapHeight.value = (systemInfo.windowWidth - 40) * (98/144)
  // 获取设备像素比
  pixelRatio.value = systemInfo.pixelRatio || 1
  
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

// 添加 ref
const qsoMapRef = ref(null)

// 添加删除QSO的方法
const handleDeleteQso = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除此通联记录吗？此操作不可恢复。',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        // 查找并删除选中的记录
        const index = qsoHistory.value.findIndex(item => 
          item.callsign === selectedQso.value.callsign && 
          item.date === selectedQso.value.date && 
          item.time === selectedQso.value.time
        )
        
        if (index !== -1) {
          qsoHistory.value.splice(index, 1)
          
          // 保存更新后的数据
          saveToStorage()
          
          // 关闭详情窗口
          showDetail.value = false
          
          uni.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    }
  })
}

// 添加编辑QSO的方法
const handleEditQso = () => {
  // 将选中的记录数据填充到表单中
  formData.value = {
    ...selectedQso.value
  }
  
  // 根据当前频率单位设置显示的频率值
  if (frequencyUnit.value === 'kHz') {
    frequency.value = String(Number(selectedQso.value.frequency) * 1000)
  } else {
    frequency.value = selectedQso.value.frequency
  }
  
  // 根据formData中的位置信息设置locationType
  if (selectedQso.value.grid) {
    locationType.value = 'grid'
  } else if (selectedQso.value.location && selectedQso.value.location.length > 0) {
    locationType.value = 'location'
  } else {
    locationType.value = 'latlng'
  }
  
  // 切换到表单页面
  activeTab.value = 'form'
  
  // 关闭详情窗口
  showDetail.value = false
  
  // 修改提交按钮文字
  isEditing.value = true
}

// 添加编辑状态变量
const isEditing = ref(false)

// 修改handleSubmit函数以支持编辑
const handleSubmit = () => {
  if (!formData.value.callsign || (!formData.value.grid && (!formData.value.latitude || !formData.value.longitude))) {
    uni.showToast({
      title: '请填写必要信息',
      icon: 'none'
    })
    return
  }

  let latitude, longitude
  try {
    if (locationType.value === 'grid') {
      if (!formData.value.grid) {
        uni.showToast({
          title: '请输入梅登海德网格坐标',
          icon: 'none'
        })
        return
      }
      const coords = gridToLatLng(formData.value.grid)
      latitude = coords.latitude
      longitude = coords.longitude
    } else {
      latitude = Number(formData.value.latitude)
      longitude = Number(formData.value.longitude)
      
      // 验证经纬度范围
      if (isNaN(latitude) || isNaN(longitude) || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        uni.showToast({
          title: '请输入有效的经纬度',
          icon: 'none'
        })
        return
      }
    }

    // 如果是编辑模式，先删除原记录
    if (isEditing.value) {
      const index = qsoHistory.value.findIndex(item => 
        item.callsign === selectedQso.value.callsign && 
        item.date === selectedQso.value.date && 
        item.time === selectedQso.value.time
      )
      
      if (index !== -1) {
        qsoHistory.value.splice(index, 1)
      }
    }

    // 添加到历史记录
    const newRecord = {
      ...formData.value,
      latitude,
      longitude,
    }
    qsoHistory.value.unshift(newRecord)
    
    // 保存到 storage
    saveToStorage()

    // 重置表单时保持当前时间
    const currentTime = getCurrentDateTime()
    formData.value = {
      callsign: '',
      grid: '',
      latitude: '',
      longitude: '',
      location: [],
      date: currentTime.date,
      time: currentTime.time,
      utcDate: currentTime.utcDate,
      utcTime: currentTime.utcTime,
      mode: 'FM',
      band: '70cm',
      frequency: '438.500',
      rstSent: '59',
      rstRcvd: '59',
      notes: '',
      synced: false
    }
    
    // 根据当前频率单位设置显示的频率值
    if (frequencyUnit.value === 'kHz') {
      frequency.value = '438500'
    } else {
      frequency.value = '438.500'
    }

    // 重置编辑状态
    isEditing.value = false

    // 切换到历史记录tab
    activeTab.value = 'history'

    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error.message || '坐标转换失败',
      icon: 'none'
    })
    return
  }
}

const showQsoDetail = (qso) => {
  selectedQso.value = qso
  showDetail.value = true
}

const { wxml2canvas } = useWxml2Canvas()

// 添加统计数据计算
const statistics = computed(() => {
  const uniqueCallsigns = new Set(qsoHistory.value.map(qso => qso.callsign))
  
  // 统计频率使用情况
  const freqCount = {}
  qsoHistory.value.forEach(qso => {
    freqCount[qso.frequency] = (freqCount[qso.frequency] || 0) + 1
  })
  const topFrequencies = Object.entries(freqCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([freq, count]) => `${freq}MHz`)
  
  // 统计模式使用情况
  const modeCount = {}
  qsoHistory.value.forEach(qso => {
    modeCount[qso.mode] = (modeCount[qso.mode] || 0) + 1
  })
  const topModes = Object.entries(modeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mode]) => mode)
  
  return {
    totalContacts: uniqueCallsigns.size,
    topFrequencies,
    topModes
  }
})

// 修改生成海报的方法
const generatePoster = async () => {
  try {
    uni.showLoading({ title: '生成海报中...' })
    
    const ctx = uni.createCanvasContext('posterCanvas')
    const width = 375
    const height = 500
    const padding = 20
    
    // 设置背景
    ctx.setFillStyle(isDark.value ? '#1a1a1a' : '#ffffff')
    ctx.fillRect(0, 0, width * pixelRatio.value, height * pixelRatio.value)
    
    // 考虑设备像素比
    ctx.scale(pixelRatio.value, pixelRatio.value)
    
    // 绘制标题
    ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
    ctx.setFontSize(24)
    ctx.setTextAlign('center')
    ctx.fillText('通联记录', width / 2, 40)
    
    // 绘制分割线
    ctx.setLineWidth(1)
    ctx.setStrokeStyle(isDark.value ? '#333333' : '#eeeeee')
    ctx.moveTo(padding, 60)
    ctx.lineTo(width - padding, 60)
    ctx.stroke()
    
    // 绘制主要统计信息
    ctx.setFontSize(40)
    ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
    ctx.fillText(statistics.value.totalContacts.toString(), width / 2, 120)
    
    ctx.setFontSize(16)
    ctx.fillText('位火腿', width / 2, 150)
    
    // 绘制详细信息
    ctx.setFontSize(14)
    ctx.setTextAlign('left')
    
    // 获取最近的一次通联记录
    const latestQso = qsoHistory.value[0] || {}
    
    const infoList = [
      { label: '最近通联', value: latestQso.callsign || '-' },
      { label: '日期', value: latestQso.date || '-' },
      { label: '时间', value: latestQso.time || '-' },
      { label: '模式', value: latestQso.mode || '-' },
      { label: '频率', value: latestQso.frequency ? `${latestQso.frequency}MHz` : '-' },
      { label: '常用频率', value: statistics.value.topFrequencies.join(', ') },
      { label: '常用模式', value: statistics.value.topModes.join(', ') }
    ]
    
    let y = 200
    infoList.forEach(info => {
      // 绘制标签
      ctx.setFillStyle(isDark.value ? '#999999' : '#666666')
      ctx.fillText(info.label, padding, y)
      
      // 绘制值
      ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
      ctx.fillText(info.value, padding + 80, y)
      
      y += 30
    })
    
    // 绘制底部信息
    ctx.setFontSize(12)
    ctx.setFillStyle(isDark.value ? '#666666' : '#999999')
    ctx.setTextAlign('center')
    ctx.fillText('Generated by HAM Logger', width / 2, height - 20)
    
    // 绘制完成
    ctx.draw(false, () => {
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          destWidth: width * pixelRatio.value,
          destHeight: height * pixelRatio.value,
          success: (res) => {
            uni.hideLoading()
            uni.showActionSheet({
              itemList: ['预览海报', '保存到相册'],
              success: (result) => {
                if (result.tapIndex === 0) {
                  uni.previewImage({
                    urls: [res.tempFilePath],
                    current: 0
                  })
                } else if (result.tapIndex === 1) {
                  uni.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                      uni.showToast({
                        title: '已保存到相册',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      uni.showToast({
                        title: '保存失败',
                        icon: 'none'
                      })
                    }
                  })
                }
              }
            })
          },
          fail: (err) => {
            console.error('Canvas to temp file failed:', err)
            uni.hideLoading()
            uni.showToast({
              title: '生成海报失败',
              icon: 'none'
            })
          }
        })
      }, 300)
    })
    
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '生成海报失败',
      icon: 'none'
    })
    console.error('Generate poster error:', error)
  }
}

// 添加分享按钮点击处理
const handleShare = () => {
  generatePoster()
}
</script>

<style lang="less" scoped>
.qso-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 20px;
  background-color: var(--background-primary);
}

.container {
  padding: 10px 20px;
}

.map-section {
  margin-bottom: 15px;
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
}

.form-section {
  background-color: var(--background-container);
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid var(--border-color-light);
}

.form-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.form-item {
  margin-bottom: 10px;
  box-sizing: border-box;

  .label {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .input, .textarea, .picker {
    box-sizing: border-box;
  }

  .input {
    width: 100%;
    height: 40px;
    padding: 0 10px;
    border-radius: 9px;
    border: 1px solid var(--border-color-light);
    background-color: var(--background-primary);
    color: var(--text-primary);
  }

  .textarea {
    width: 100%;
    height: 80px;
    padding: 10px;
    border-radius: 9px;
    border: 1px solid var(--border-color-light);
    background-color: var(--background-primary);
    color: var(--text-primary);
  }
}

.location-inputs {
  .location-type {
    display: flex;
    margin-bottom: 10px;

    .type-item {
      padding: 5px 15px;
      font-size: 14px;
      color: var(--text-secondary);
      border: 1px solid var(--border-color-light);
      border-radius: 4px;
      margin-right: 10px;

      &.active {
        background-color: var(--primary-color);
        color: #fff;
        border-color: var(--primary-color);
      }
    }
  }

  .latlng-inputs {
    display: flex;
    gap: 10px;

    .half {
      flex: 1;
    }
  }
}

.picker {
  width: 100%;
  height: 40px;
  line-height: 40px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--border-color-light);
  background-color: var(--background-primary);
  color: var(--text-primary);
}

.submit-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  text-align: center;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: 9px;
  margin-top: 15px;
}

.history-section {
  background-color: var(--background-container);
  padding: 15px;
  border-radius: 6px;
  border: 1px solid var(--border-color-light);
}

.section-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .action-btn {
    font-size: 12px;
    padding: 2px 10px;
    height: 26px;
    line-height: 22px;
    background-color: var(--primary-color);
    color: #fff;
    border-radius: 9px;
  }
}

.history-list {
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  overflow: hidden;
}

.history-table-header {
  display: flex;
  background-color: var(--background-secondary);
  padding: 10px 0;
  font-size: 13px;
  font-weight: bold;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color-light);
}

.history-table-row {
  display: flex;
  padding: 10px 0;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color-light);
  transition: background-color 0.3s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: var(--background-secondary);
  }
}

.header-cell,
.cell {
  text-align: center;
  padding: 0 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  flex: 1.5;
}

.callsign {
  flex: 1.2;
}

.mode {
  flex: 0.8;
}

.band {
  flex: 0.8;
}

.export-btn {
  font-size: 12px;
  padding: 2px 10px;
  height: 26px;
  line-height: 22px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: 9px;
}

.datetime-inputs {
  display: flex;
  gap: 10px;

  .picker {
    flex: 1;
  }
}

.utc-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 5px;
}

.rst-inputs {
  display: flex;
  gap: 10px;

  .half {
    flex: 1;
  }
}

.tabs {
  display: flex;
  background-color: var(--background-container);
  border-radius: 15px 15px 0 0;
  border: 1px solid var(--border-color-light);
  border-bottom: none;
  overflow: hidden;
  margin: 10px 0 0 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  font-size: 14px;
  color: var(--text-secondary);
  position: relative;
  
  &.active {
    color: var(--primary-color);
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20%;
      width: 60%;
      height: 2px;
      background-color: var(--primary-color);
      border-radius: 1px;
    }
  }
}

.tab-content {
  min-height: 200px;
  background-color: var(--background-container);
  border: 1px solid var(--border-color-light);
  border-top: none;
  border-radius: 0 0 15px 15px;
  
  // 表单部分
  .form-section {
    border: none;
    border-radius: 0;
    margin-bottom: 0;
  }

  // 历史记录部分
  .history-section {
    border: none;
    border-radius: 0;
  }
}

.history-empty {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.qso-detail-modal-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.qso-detail-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.qso-detail-modal {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  transition: transform 0.3s ease-out;
  
  .modal-content {
    width: 100%;
    max-height: 80vh;
    background-color: var(--background-container);
    border-radius: 15px 15px 0 0;
  }

  .modal-header {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);

    .modal-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-primary);
    }

    .close-btn {
      font-size: 20px;
      color: var(--text-secondary);
      padding: 0 10px;
    }
  }

  .detail-content {
    padding: 15px;
    max-height: calc(80vh - 50px);
  }

  .detail-item {
    margin-bottom: 10px;
    display: flex;
    
    .detail-label {
      width: 80px;
      color: var(--text-secondary);
      font-size: 15px;
    }
    
    .detail-value {
      flex: 1;
      color: var(--text-primary);
      font-size: 15px;
    }
  }
}

.frequency {
  flex: 1;
}

// 修改其他列的 flex 值以保持布局平衡
.time {
  flex: 1.5;
}

.callsign {
  flex: 1.2;
}

.mode {
  flex: 0.8;
}

.band {
  flex: 0.8;
}

.picker-container {
  width: 100%;
}

.frequency-input-container {
  display: flex;
  width: 100%;
  align-items: center;
  
  .frequency-input {
    flex: 1;
    border-radius: 9px 0 0 9px;
  }
  
  .unit-switch {
    width: 60px;
    height: 38px;
    line-height: 38px;
    text-align: center;
    background-color: var(--primary-color);
    color: #fff;
    border-radius: 0 9px 9px 0;
    font-size: 13px;
  }
}

.modal-footer {
  display: flex;
  padding: 10px 15px 20px 15px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 14px;
  text-align: center;
}

.delete-btn {
  background-color: #ff4757;
  color: #fff;
}

.edit-btn {
  background-color: var(--primary-color);
  color: #fff;
  margin-left: 10px;
}

// 添加编辑模式下的提交按钮样式
.submit-btn.editing {
  background-color: #ff9800;
}
</style> 