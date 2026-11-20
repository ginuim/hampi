<template>
  <view class="knowledge-graph-viewer">
    <!-- 头部工具栏 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <text class="title">知识图谱</text>
        <text class="subtitle">{{ nodeCount }} 节点 · {{ edgeCount }} 关系</text>
      </view>
      <view class="toolbar-right">
        <button
          class="tool-btn"
          @click="toggleFilter"
          :class="{ active: showFilter }"
        >
          <uni-icons type="filter" size="18" />
          筛选
        </button>
        <button
          class="tool-btn"
          @click="resetView"
        >
          <uni-icons type="refresh" size="18" />
          重置
        </button>
      </view>
    </view>

    <!-- 筛选面板 -->
    <view v-if="showFilter" class="filter-panel">
      <view class="filter-section">
        <text class="filter-title">节点类型</text>
        <view class="filter-options">
          <label
            v-for="(count, type) in nodeTypeStats"
            :key="type"
            class="filter-option"
          >
            <checkbox
              :value="type"
              :checked="selectedNodeTypes.includes(type)"
              @change="onNodeTypeChange"
            />
            <text>{{ getNodeTypeName(type) }} ({{ count }})</text>
          </label>
        </view>
      </view>

      <view class="filter-section">
        <text class="filter-title">关系类型</text>
        <view class="filter-options">
          <label
            v-for="(count, type) in edgeTypeStats"
            :key="type"
            class="filter-option"
          >
            <checkbox
              :value="type"
              :checked="selectedEdgeTypes.includes(type)"
              @change="onEdgeTypeChange"
            />
            <text>{{ getEdgeTypeName(type) }} ({{ count }})</text>
          </label>
        </view>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-container">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索知识点、概念、法规..."
        @input="onSearch"
        @clear="clearSearch"
        bg-color="#f5f5f5"
      />
    </view>

    <!-- 图谱容器 -->
    <view class="graph-container" ref="graphContainer">
      <canvas
        v-if="!loading"
        class="graph-canvas"
        canvas-id="knowledge-graph"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @click="onCanvasClick"
      />

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" />
        <text class="loading-text">正在加载知识图谱...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && (!graphData || graphData.nodes.length === 0)" class="empty-container">
        <uni-icons type="info" size="48" color="#999" />
        <text class="empty-text">暂无知识图谱数据</text>
        <button class="generate-btn" @click="generateGraph">生成知识图谱</button>
      </view>
    </view>

    <!-- 节点详情弹窗 -->
    <uni-popup ref="nodeDetailPopup" type="center">
      <view class="node-detail">
        <view class="detail-header">
          <text class="detail-title">{{ selectedNode?.name || selectedNode?.title }}</text>
          <text class="detail-type">{{ getNodeTypeName(selectedNode?.type) }}</text>
        </view>

        <view v-if="selectedNode?.type === 'question'" class="detail-content">
          <text class="question-content">{{ selectedNode?.content }}</text>
          <view class="question-options">
            <text
              v-for="(option, index) in selectedNode?.options"
              :key="index"
              class="option"
              :class="{ correct: index === getCorrectAnswerIndex(selectedNode?.answer) }"
            >
              {{ String.fromCharCode(65 + index) }}. {{ option }}
            </text>
          </view>
          <text class="question-answer">正确答案: {{ selectedNode?.answer }}</text>
        </view>

        <view v-else class="detail-content">
          <text v-if="selectedNode?.description" class="node-description">
            {{ selectedNode.description }}
          </text>
          <text v-if="selectedNode?.definition" class="node-definition">
            {{ selectedNode.definition }}
          </text>
          <text v-if="selectedNode?.content" class="node-content">
            {{ selectedNode.content }}
          </text>

          <view v-if="selectedNode?.keywords" class="node-keywords">
            <text class="keywords-label">关键词:</text>
            <text v-for="keyword in selectedNode.keywords" :key="keyword" class="keyword">
              {{ keyword }}
            </text>
          </view>
        </view>

        <view class="detail-actions">
          <button v-if="selectedNode?.type === 'question'" class="action-btn" @click="viewQuestion">
            查看题目
          </button>
          <button class="action-btn secondary" @click="closeNodeDetail">关闭</button>
        </view>
      </view>
    </uni-popup>

    <!-- 路径分析弹窗 -->
    <uni-popup ref="pathAnalysisPopup" type="bottom">
      <view class="path-analysis">
        <view class="analysis-header">
          <text class="analysis-title">知识路径分析</text>
          <button class="close-btn" @click="closePathAnalysis">×</button>
        </view>

        <view v-if="learningPath.length > 0" class="path-content">
          <text class="path-description">基于当前选中节点，推荐的学习路径:</text>

          <view class="path-steps">
            <view
              v-for="(step, index) in learningPath"
              :key="step.id"
              class="path-step"
            >
              <view class="step-number">{{ index + 1 }}</view>
              <view class="step-content">
                <text class="step-title">{{ step.name || step.title }}</text>
                <text class="step-type">{{ getNodeTypeName(step.type) }}</text>
              </view>
              <view v-if="index < learningPath.length - 1" class="step-arrow">→</view>
            </view>
          </view>
        </view>

        <view v-else class="path-empty">
          <text>暂无推荐学习路径</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'

// 响应式数据
const loading = ref(true)
const graphData = ref(null)
const selectedNode = ref(null)
const selectedNodeTypes = ref(['question', 'knowledge', 'concept', 'regulation', 'topic'])
const selectedEdgeTypes = ref(['contains', 'tests', 'references', 'belongs_to'])
const showFilter = ref(false)
const searchKeyword = ref('')
const learningPath = ref([])

// 图谱相关
const graphContainer = ref(null)
const canvasWidth = ref(375)
const canvasHeight = ref(600)
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// 触摸事件相关
const touches = reactive({ startX: 0, startY: 0, lastX: 0, lastY: 0 })

// 弹窗引用
const nodeDetailPopup = ref(null)
const pathAnalysisPopup = ref(null)

// 计算属性
const nodeCount = computed(() => {
  if (!graphData.value) return 0
  return graphData.value.nodes.filter(node =>
    selectedNodeTypes.value.includes(node.type) &&
    (!searchKeyword.value || nodeMatchesSearch(node))
  ).length
})

const edgeCount = computed(() => {
  if (!graphData.value) return 0
  return graphData.value.edges.filter(edge =>
    selectedEdgeTypes.value.includes(edge.type) &&
    edgeInFilter(edge)
  ).length
})

const nodeTypeStats = computed(() => {
  if (!graphData.value) return {}
  const stats = {}
  graphData.value.nodes.forEach(node => {
    stats[node.type] = (stats[node.type] || 0) + 1
  })
  return stats
})

const edgeTypeStats = computed(() => {
  if (!graphData.value) return {}
  const stats = {}
  graphData.value.edges.forEach(edge => {
    stats[edge.type] = (stats[edge.type] || 0) + 1
  })
  return stats
})

// 方法
const loadGraphData = async () => {
  try {
    loading.value = true

    // 这里应该从服务器或本地文件加载知识图谱数据
    // 暂时使用模拟数据
    const response = await uni.request({
      url: '/static/knowledge-graph/knowledge-graph.json',
      method: 'GET'
    })

    if (response.statusCode === 200 && response.data) {
      graphData.value = response.data
    } else {
      console.log('知识图谱数据不存在，使用空数据')
      graphData.value = { nodes: [], edges: [] }
    }
  } catch (error) {
    console.error('加载知识图谱数据失败:', error)
    graphData.value = { nodes: [], edges: [] }
  } finally {
    loading.value = false
  }
}

const drawGraph = () => {
  if (!graphData.value) return

  const ctx = uni.createCanvasContext('knowledge-graph')

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  // 设置变换矩阵
  ctx.translate(offsetX.value, offsetY.value)
  ctx.scale(scale.value, scale.value)

  // 获取过滤后的数据
  const filteredNodes = graphData.value.nodes.filter(node =>
    selectedNodeTypes.value.includes(node.type) &&
    (!searchKeyword.value || nodeMatchesSearch(node))
  )

  const filteredEdges = graphData.value.edges.filter(edge =>
    selectedEdgeTypes.value.includes(edge.type) &&
    edgeInFilter(edge)
  )

  // 绘制边
  filteredEdges.forEach(edge => {
    const fromNode = filteredNodes.find(n => n.id === edge.from)
    const toNode = filteredNodes.find(n => n.id === edge.to)

    if (fromNode && toNode) {
      drawEdge(ctx, fromNode, toNode, edge)
    }
  })

  // 绘制节点
  filteredNodes.forEach(node => {
    drawNode(ctx, node)
  })

  ctx.draw()
}

const drawNode = (ctx, node) => {
  const x = node.x || Math.random() * (canvasWidth.value - 100) + 50
  const y = node.y || Math.random() * (canvasHeight.value - 100) + 50
  const radius = getNodeRadius(node.type)
  const color = getNodeColor(node.type)

  // 绘制节点圆圈
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.setFillStyle(color)
  ctx.fill()
  ctx.setStrokeStyle('#fff')
  ctx.setLineWidth(2)
  ctx.stroke()

  // 绘制节点标签
  ctx.setFillStyle('#333')
  ctx.setFontSize(12)
  ctx.setTextAlign('center')
  ctx.setTextBaseline('middle')

  const label = node.name || node.title || ''
  if (label.length > 10) {
    ctx.fillText(label.substring(0, 10) + '...', x, y)
  } else {
    ctx.fillText(label, x, y)
  }

  // 更新节点位置信息
  node.x = x
  node.y = y
}

const drawEdge = (ctx, fromNode, toNode, edge) => {
  const color = getEdgeColor(edge.type)
  const width = getEdgeWidth(edge.weight || 0.5)

  ctx.beginPath()
  ctx.moveTo(fromNode.x, fromNode.y)
  ctx.lineTo(toNode.x, toNode.y)
  ctx.setStrokeStyle(color)
  ctx.setLineWidth(width)
  ctx.stroke()
}

const getNodeRadius = (type) => {
  const radiusMap = {
    question: 15,
    knowledge: 20,
    concept: 18,
    regulation: 22,
    topic: 16
  }
  return radiusMap[type] || 15
}

const getNodeColor = (type) => {
  const colorMap = {
    question: '#4CAF50',
    knowledge: '#2196F3',
    concept: '#FF9800',
    regulation: '#9C27B0',
    topic: '#F44336'
  }
  return colorMap[type] || '#666'
}

const getEdgeColor = (type) => {
  const colorMap = {
    contains: '#2196F3',
    tests: '#4CAF50',
    references: '#9C27B0',
    belongs_to: '#FF9800',
    similar: '#FFC107',
    prerequisite: '#F44336',
    sequence: '#00BCD4'
  }
  return colorMap[type] || '#999'
}

const getEdgeWidth = (weight) => {
  return Math.max(1, Math.min(5, weight * 3))
}

const getNodeTypeName = (type) => {
  const nameMap = {
    question: '题目',
    knowledge: '知识点',
    concept: '概念',
    regulation: '法规',
    topic: '主题'
  }
  return nameMap[type] || type
}

const getEdgeTypeName = (type) => {
  const nameMap = {
    contains: '包含',
    tests: '测试',
    references: '引用',
    belongs_to: '属于',
    similar: '相似',
    prerequisite: '前置',
    sequence: '顺序'
  }
  return nameMap[type] || type
}

const nodeMatchesSearch = (node) => {
  if (!searchKeyword.value) return true

  const keyword = searchKeyword.value.toLowerCase()
  const name = (node.name || node.title || '').toLowerCase()
  const description = (node.description || node.content || '').toLowerCase()

  return name.includes(keyword) || description.includes(keyword)
}

const edgeInFilter = (edge) => {
  const fromNode = graphData.value.nodes.find(n => n.id === edge.from)
  const toNode = graphData.value.nodes.find(n => n.id === edge.to)

  return fromNode && toNode &&
    selectedNodeTypes.value.includes(fromNode.type) &&
    selectedNodeTypes.value.includes(toNode.type) &&
    (!searchKeyword.value || nodeMatchesSearch(fromNode) || nodeMatchesSearch(toNode))
}

const getCorrectAnswerIndex = (answer) => {
  if (!answer) return -1
  return answer.charCodeAt(0) - 65
}

// 事件处理
const onNodeTypeChange = (e) => {
  const value = e.detail.value
  selectedNodeTypes.value = value
  nextTick(() => drawGraph())
}

const onEdgeTypeChange = (e) => {
  const value = e.detail.value
  selectedEdgeTypes.value = value
  nextTick(() => drawGraph())
}

const onSearch = (e) => {
  searchKeyword.value = e.detail.value
  nextTick(() => drawGraph())
}

const clearSearch = () => {
  searchKeyword.value = ''
  nextTick(() => drawGraph())
}

const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  searchKeyword.value = ''
  selectedNodeTypes.value = ['question', 'knowledge', 'concept', 'regulation', 'topic']
  selectedEdgeTypes.value = ['contains', 'tests', 'references', 'belongs_to']
  nextTick(() => drawGraph())
}

const onTouchStart = (e) => {
  const touch = e.touches[0]
  touches.startX = touch.clientX - offsetX.value
  touches.startY = touch.clientY - offsetY.value
  touches.lastX = offsetX.value
  touches.lastY = offsetY.value
}

const onTouchMove = (e) => {
  const touch = e.touches[0]
  offsetX.value = touch.clientX - touches.startX
  offsetY.value = touch.clientY - touches.startY

  nextTick(() => drawGraph())
}

const onTouchEnd = (e) => {
  touches.lastX = offsetX.value
  touches.lastY = offsetY.value
}

const onCanvasClick = (e) => {
  // 简单的节点点击检测
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.detail.x - rect.left - offsetX.value) / scale.value
  const y = (e.detail.y - rect.top - offsetY.value) / scale.value

  const clickedNode = graphData.value.nodes.find(node => {
    if (!selectedNodeTypes.value.includes(node.type)) return false
    if (!nodeMatchesSearch(node)) return false

    const dx = x - (node.x || 0)
    const dy = y - (node.y || 0)
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= getNodeRadius(node.type)
  })

  if (clickedNode) {
    showNodeDetail(clickedNode)
  }
}

const showNodeDetail = (node) => {
  selectedNode.value = node
  nodeDetailPopup.value.open()

  // 生成学习路径
  generateLearningPath(node)
}

const closeNodeDetail = () => {
  nodeDetailPopup.value.close()
  selectedNode.value = null
}

const generateLearningPath = (startNode) => {
  // 这里实现学习路径生成算法
  // 暂时使用简单的示例
  learningPath.value = [
    startNode,
    { id: 'temp1', name: '相关知识点1', type: 'knowledge' },
    { id: 'temp2', name: '相关知识点2', type: 'knowledge' },
    { id: 'temp3', name: '练习题目', type: 'question' }
  ]
}

const closePathAnalysis = () => {
  pathAnalysisPopup.value.close()
  learningPath.value = []
}

const viewQuestion = () => {
  if (selectedNode.value?.type === 'question') {
    // 跳转到题目详情页
    uni.navigateTo({
      url: `/subpkg/exam/pages/question-detail?id=${selectedNode.value.id.replace('q_', '')}`
    })
  }
}

const generateGraph = () => {
  // 跳转到知识图谱生成页面
  uni.navigateTo({
    url: '/subpkg/exam/pages/generate-graph'
  })
}

// 生命周期
onMounted(async () => {
  // 获取容器尺寸
  const systemInfo = uni.getSystemInfoSync()
  canvasWidth.value = systemInfo.windowWidth
  canvasHeight.value = systemInfo.windowHeight - 200 // 减去头部工具栏高度

  await loadGraphData()
  nextTick(() => drawGraph())
})
</script>

<style lang="less" scoped>
.knowledge-graph-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;

  .toolbar-left {
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 8px;

    .tool-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 12px;
      background: #f5f5f5;
      border: none;
      border-radius: 16px;
      color: #666;

      &.active {
        background: #007AFF;
        color: #fff;
      }
    }
  }
}

.filter-panel {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 16px;

  .filter-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .filter-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .filter-option {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #666;
      }
    }
  }
}

.search-container {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.graph-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.graph-canvas {
  background: #fff;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.loading-text,
.empty-text {
  margin-top: 12px;
  font-size: 14px;
}

.generate-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}

.node-detail {
  width: 320px;
  max-height: 480px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;

  .detail-header {
    padding: 16px;
    border-bottom: 1px solid #eee;

    .detail-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      display: block;
    }

    .detail-type {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      display: block;
    }
  }

  .detail-content {
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;

    .question-content {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      display: block;
      margin-bottom: 12px;
    }

    .question-options {
      margin-bottom: 12px;

      .option {
        display: block;
        font-size: 13px;
        color: #666;
        margin-bottom: 6px;

        &.correct {
          color: #4CAF50;
          font-weight: 600;
        }
      }
    }

    .question-answer {
      font-size: 13px;
      color: #4CAF50;
      font-weight: 600;
      display: block;
      margin-bottom: 12px;
    }

    .node-description,
    .node-definition,
    .node-content {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      display: block;
      margin-bottom: 12px;
    }

    .node-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .keywords-label {
        font-size: 12px;
        color: #999;
      }

      .keyword {
        padding: 2px 8px;
        background: #f0f0f0;
        border-radius: 12px;
        font-size: 11px;
        color: #666;
      }
    }
  }

  .detail-actions {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #eee;

    .action-btn {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      background: #007AFF;
      color: #fff;

      &.secondary {
        background: #f5f5f5;
        color: #666;
      }
    }
  }
}

.path-analysis {
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 60vh;

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;

    .analysis-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      background: #f5f5f5;
      border: none;
      border-radius: 16px;
      font-size: 18px;
      color: #666;
    }
  }

  .path-content {
    padding: 16px;
    max-height: 40vh;
    overflow-y: auto;

    .path-description {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
      display: block;
    }

    .path-steps {
      .path-step {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .step-number {
          width: 24px;
          height: 24px;
          background: #007AFF;
          color: #fff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .step-content {
          flex: 1;
          margin-left: 12px;

          .step-title {
            font-size: 14px;
            color: #333;
            display: block;
          }

          .step-type {
            font-size: 12px;
            color: #999;
            margin-top: 2px;
            display: block;
          }
        }

        .step-arrow {
          margin-left: 12px;
          font-size: 16px;
          color: #999;
        }
      }
    }
  }

  .path-empty {
    padding: 32px 16px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }
}
</style>