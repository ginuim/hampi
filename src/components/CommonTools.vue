<template>
  <view class="common-tools" :class="{'disable-bounce': isSorting}">
    <!-- 工具区标题 -->
    <view class="section-header" v-if="showHeader">
      <text class="section-title">常用工具</text>
      <view class="more" @tap="onMoreClick">
        <text>MORE</text>
        <text class="iconfont">&#xe665;</text>
        <view class="red-dot" v-if="showRedDot"></view>
      </view>
    </view>

    <!-- 工具卡片列表 -->
    <view
      v-if="displayTools.length > 0"
      class="tool-list"
    >
      <view 
        v-for="(tool, index) in displayTools" 
        :key="tool.id"
        class="tool-item-container" 
        :class="{
          'is-sorting-item': isSorting,
          'dragging': dragIndex === index && isDragging
        }"
        :data-id="tool.id"
        :id="`tool-item-${tool.id}`"
        @touchstart="isSorting ? onTouchStart($event, index) : null"
        @touchmove="isSorting ? onTouchMove($event) : null"
        @touchend="isSorting ? onTouchEnd() : null"
        @touchcancel="isSorting ? onTouchEnd() : null"
      >
        <view class="drag-handle" v-if="isSorting">
          <text class="iconfont drag-icon">&#xe603;</text>
        </view>
        <view 
          class="tool-card" 
          @tap="handleToolTap(tool)"
        >
          <view class="tool-icon" :class="tool.iconColor">
            <image class="tool-icon-image" :src="tool.icon" mode="aspectFit" />
          </view>
          <view class="tool-info">
            <text class="tool-title">{{ tool.title }}</text>
            <text class="tool-desc">{{ tool.desc }}</text>
          </view>
          <view class="red-dot" v-if="tool.id === 'exam' && showExamRedDot"></view>
        </view>
      </view>
    </view>
    <view v-else-if="!showHeader" class="no-tools-placeholder">
      <!-- 可以在全部工具页面显示加载中或无工具提示 -->
    </view>
    
    <!-- 拖拽时的阴影元素 -->
    <view 
      v-if="isDragging && dragShadowStyle.display" 
      :style="dragShadowStyle"
      class="drag-shadow-element"
    >
      <!-- 阴影元素内容 -->
      <view class="tool-item-container">
        <view class="drag-handle" v-if="isSorting">
          <text class="iconfont drag-icon">&#xe609;</text>
        </view>
        <view class="tool-card">
          <view 
            v-if="currentDragTool" 
            class="tool-icon" 
            :class="currentDragTool.iconColor"
          >
            <image class="tool-icon-image" :src="currentDragTool.icon" mode="aspectFit" />
          </view>
          <view class="tool-info" v-if="currentDragTool">
            <text class="tool-title">{{ currentDragTool.title }}</text>
            <text class="tool-desc">{{ currentDragTool.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <text class="drag-tip" v-if="isSorting">可以拖动菜单改变顺序，点击完成保存新排序</text>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
// 移除 vuedraggable 导入
// import draggable from 'vuedraggable'

const props = defineProps({
  limitCount: {
    type: Number,
    default: 0
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  isSorting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['more'])

// 原始工具数据，为每个工具添加一个唯一 id
const initialRawTools = [
  {
    id: 'exam',
    title: 'HAM 考试',
    desc: '练习模式/模拟考试/收藏题目',
    url: '/subpkg/exam/index',
    icon: '/static/icon-exam.svg',
    iconColor: 'blue'
  },
  {
    id: 'knowledge',
    title: 'HAM 常识',
    desc: '分区代码/摩尔斯电码/缩语/字母解释法...',
    url: '/pages/knowledge/index',
    icon: '/static/icon-knowledge.svg',
    iconColor: 'yellow'
  },
  {
    id: 'cw_learn',
    title: 'CW 学习',
    desc: '摩尔斯电码/CW抄听',
    url: '/subpkg/cw/index',
    icon: '/static/icon-cw.svg',
    iconColor: 'gray'
  },
  {
    id: 'qso_log',
    title: '通联日志',
    desc: '与世界各地的 HAM 一起通联吧',
    url: '/subpkg/qso/index',
    icon: '/static/icon-qso.svg',
    iconColor: 'green'
  },
  {
    id: 'callsign_query',
    title: '呼号查询',
    desc: '查询全球呼号归属地',
    url: '/pages/callsign/index',
    icon: '/static/icon-callsign.svg',
    iconColor: 'purple'
  }
].map(tool => ({ ...tool, uniqueKey: tool.id + tool.url }));

const toolsList = ref<any[]>([])

// 拖拽相关状态
const dragIndex = ref<number | null>(null)
const dragPosition = ref({ x: 0, y: 0 })
const dragElement = ref<any>(null)
const isDragging = ref(false)
const currentDragTool = ref<any>(null)
const itemHeight = ref(180) // 预估的每个项目高度，单位为px
const dragShadowStyle = ref({
  display: false,
  position: 'fixed',
  left: '0px',
  top: '0px',
  width: '100%',
  zIndex: 1000,
  pointerEvents: 'none',
  transform: 'translate3d(0,0,0)'
})
const showRedDot = ref(false)
const showExamRedDot = ref(false)
const STORAGE_KEY = 'commonToolsOrder_v1'

onMounted(() => {
  loadToolOrder()
  if (props.showHeader) {
    const hasViewed = uni.getStorageSync('toolMore-callsign')
    showRedDot.value = !hasViewed
  }
  
  const examClicked = uni.getStorageSync('examToolClicked')
  showExamRedDot.value = !examClicked
  
  // 测量实际项目高度以更准确地计算拖拽
  setTimeout(() => {
    const query = uni.createSelectorQuery()
    query.select('.tool-item-container').boundingClientRect(data => {
      if (data && (data as any).height) {
        itemHeight.value = (data as any).height
      }
    }).exec()
  }, 300)
})

// 使用onShow生命周期钩子，在页面每次显示时刷新排序
onShow(() => {
  loadToolOrder()
  const examClicked = uni.getStorageSync('examToolClicked')
  showExamRedDot.value = !examClicked
})

function loadToolOrder() {
  const savedOrderIds: string[] = uni.getStorageSync(STORAGE_KEY) || []
  const toolsMap = new Map(initialRawTools.map(t => [t.id, t]))
  const orderedTools: any[] = []

  savedOrderIds.forEach(id => {
    if (toolsMap.has(id)) {
      orderedTools.push(toolsMap.get(id))
      toolsMap.delete(id)
    }
  })

  toolsMap.forEach(tool => orderedTools.push(tool))
  
  toolsList.value = orderedTools
}

function saveToolOrder() {
  const orderIds = toolsList.value.map(t => t.id)
  uni.setStorageSync(STORAGE_KEY, orderIds)
}

// 自定义拖拽实现
function onTouchStart(event: any, index: number) {
  if (!props.isSorting) return
  
  dragIndex.value = index
  currentDragTool.value = displayTools.value[index]
  const touch = event.touches[0]
  dragPosition.value = { x: touch.clientX, y: touch.clientY }
  
  // 准备阴影元素
  const query = uni.createSelectorQuery()
  query.select(`#tool-item-${displayTools.value[index].id}`).boundingClientRect(data => {
    if (data) {
      // 更新阴影元素样式
      dragShadowStyle.value = {
        ...dragShadowStyle.value,
        display: true,
        left: '0px',
        top: `${touch.clientY - ((data as any).height / 2)}px`,
        transform: 'translate3d(0,0,0) scale(1.05)'
      }
    }
    
    // 开始拖拽状态
    isDragging.value = true
  }).exec()
}

function onTouchMove(event: any) {
  if (!isDragging.value || dragIndex.value === null) return
  
  const touch = event.touches[0]
  const currentY = touch.clientY
  
  // 更新阴影元素位置
  dragShadowStyle.value = {
    ...dragShadowStyle.value,
    top: `${currentY - itemHeight.value / 2}px`
  }
  
  // 计算移动距离
  const moveDistance = currentY - dragPosition.value.y
  
  // 根据移动距离判断是否需要交换位置
  if (Math.abs(moveDistance) > itemHeight.value / 3) { // 移动超过1/3项目高度触发交换
    const newIndex = calculateNewIndex(currentY)
    if (newIndex !== null && newIndex !== dragIndex.value) {
      // 交换位置
      const temp = [...toolsList.value]
      const dragItem = temp[dragIndex.value]
      temp.splice(dragIndex.value, 1)
      temp.splice(newIndex, 0, dragItem)
      toolsList.value = temp
      dragIndex.value = newIndex
    }
    
    // 更新位置
    dragPosition.value = { x: touch.clientX, y: touch.clientY }
  }
  
  // 阻止默认滚动行为
  event.preventDefault()
}

function onTouchEnd() {
  if (isDragging.value && dragIndex.value !== null) {
    saveToolOrder()
  }
  
  // 隐藏阴影元素
  dragShadowStyle.value = {
    ...dragShadowStyle.value,
    display: false
  }
  
  isDragging.value = false
  dragIndex.value = null
  dragElement.value = null
  currentDragTool.value = null
}

function calculateNewIndex(currentY: number): number | null {
  // 获取滚动容器的相关信息
  const containerTop = 0 // 简化处理
  const items = displayTools.value
  
  // 计算拖动项应该放置的索引
  const relativeY = currentY - containerTop
  let newIndex = Math.floor(relativeY / itemHeight.value)
  
  // 边界检查
  if (newIndex < 0) newIndex = 0
  if (newIndex >= items.length) newIndex = items.length - 1
  
  return newIndex
}

const displayTools = computed(() => {
  if (props.isSorting) {
    return toolsList.value
  }
  if (props.showHeader && props.limitCount > 0) {
    return toolsList.value.slice(0, props.limitCount)
  }
  return toolsList.value
})

const jump = (url: string) => {
  uni.navigateTo({
    url: url
  })
}

const handleToolTap = (tool: { id: string, url: string }) => {
  if (props.isSorting) {
    return; 
  }
  
  if (tool.id === 'exam' && showExamRedDot.value) {
    uni.setStorageSync('examToolClicked', true)
    showExamRedDot.value = false
  }
  
  jump(tool.url)
}

const onMoreClick = () => {
  if (props.showHeader) {
    if (showRedDot.value) {
      uni.setStorageSync('toolMore-callsign', true)
      showRedDot.value = false
    }
    emit('more')
  }
}

// 监听排序模式变化，控制页面弹性
watch(() => props.isSorting, (newVal) => {
  if (newVal) {
    // 进入排序模式，禁用页面弹性
    disablePageBounce()
  } else {
    // 退出排序模式，恢复页面弹性
    enablePageBounce()
  }
})

// 禁用页面弹性
function disablePageBounce() {
  // 禁用页面滚动
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  
  // 记录当前页面滚动位置
  let scrollTop = 0
  try {
    // 获取页面滚动位置，不同平台可能有不同实现
    // #ifdef H5
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    // #endif
  } catch (e) {
    console.log('获取滚动位置失败', e)
  }
  
  // 针对不同平台设置不同的禁用弹性方法
  // #ifdef APP-PLUS
  const webview = plus.webview.currentWebview()
  if (webview) {
    webview.setStyle({
      bounce: 'none'
    })
  }
  // #endif
  
  // #ifdef H5
  document.body.style.overflow = 'hidden'
  // #endif
  
  // 在所有平台上，通过防止触摸事件来阻止原生滚动
  uni.pageScrollTo({
    scrollTop: scrollTop,
    duration: 0
  })
}

// 恢复页面弹性
function enablePageBounce() {
  // #ifdef APP-PLUS
  const webview = plus.webview.currentWebview()
  if (webview) {
    webview.setStyle({
      bounce: 'vertical'
    })
  }
  // #endif
  
  // #ifdef H5
  document.body.style.overflow = ''
  // #endif
}

// 在组件销毁时恢复页面弹性
onUnmounted(() => {
  if (props.isSorting) {
    enablePageBounce()
  }
})
</script>

<style lang="less">
.common-tools {
  &.disable-bounce {
    overscroll-behavior: none; /* 现代浏览器禁用弹性效果 */
    -webkit-overflow-scrolling: auto; /* iOS上禁用惯性滚动 */
    touch-action: pan-y; /* 只允许垂直滚动，禁止其他手势 */
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 15px 0;
    
    .section-title {
      font-size: 18px;
      color: var(--text-primary);
      font-weight: bold;
    }
    
    .more {
      display: flex;
      align-items: center;
      color: var(--text-secondary);
      font-size: 12px;
      position: relative;
      
      .iconfont {
        font-size: 11px;
        margin-left: 5px;
      }
      
      .red-dot {
        position: absolute;
        top: -3px;
        right: 9px;
        width: 5px;
        height: 5px;
        background-color: #ff4d4f;
        border-radius: 50%;
      }
    }
  }

  .tool-list {
    position: relative;
    z-index: 1;
  }

  .tool-item-container {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    background-color: var(--background-container);
    border: 1px solid var(--border-color-light);
    border-radius: 24px;
    transform: translateZ(0);
    transition: transform 0.1s, opacity 0.2s;
    touch-action: none; /* 禁止拖拽项的所有默认触摸行为 */

    &.is-sorting-item {
      cursor: grab;
    }
    
    &.dragging {
      opacity: 0.5;
      background-color: var(--background-container-hover);
      border-color: var(--border-color-active);
    }

    .drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      // width: 35px;
      cursor: grab;

      .drag-icon {
        font-size: 20px;
        color: var(--text-secondary);
      }
    }

    .tool-card {
      position: relative;
      display: flex;
      align-items: center;
      padding: 15px;
      flex-grow: 1;
      overflow: hidden;

      .red-dot {
        position: absolute;
        top: 10px;
        right: 20px;
        width: 5px;
        height: 5px;
        background-color: #ff4d4f;
        border-radius: 50%;
      }

      &:active {
        border-color: var(--border-color-active);
        background-color: var(--background-container-active);
      }

      .tool-icon {
        width: 46px;
        height: 46px;
        border-radius: 23px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        .tool-icon-image {
          width: 24px;
          height: 24px;
        }
        
        &.blue { background-color: #0377fd; }
        &.yellow { background-color: #fdd8a4; }
        &.gray { background-color: #4a597d; }
        &.green { background-color: #aeba6e; }
        &.orange { background-color: #f59a23; }
        &.purple { background-color: #8e44ad; }
      }
      
      .tool-info {
        margin-left: 15px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        
        .tool-title {
          font-size: 18px;
          color: var(--text-primary);
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tool-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
  
  // 拖拽阴影元素样式
  .drag-shadow-element {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    pointer-events: none;
    z-index: 1000;
    
    .tool-item-container {
      width: 90%;
      margin: 0 auto;
      opacity: 0.85;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: scale(1.05);
      border-color: var(--border-color-active);
      background-color: var(--background-container-hover);
    }
  }
  
  .no-tools-placeholder {
    text-align: center;
    padding: 25px;
    color: var(--text-secondary);
  }
}

.drag-tip {
  display: block;
  font-size: 12px;
  text-align: center;
  color: var(--text-secondary);
  margin-top: 5px;
}
</style>
