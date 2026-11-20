<template>
  <view class="knowledge-graph-page">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-left">
        <text class="page-title">知识图谱</text>
        <text class="page-subtitle">可视化学习知识网络</text>
      </view>
      <view class="header-actions">
        <button class="action-btn" @click="showStatistics">
          <uni-icons type="chart" size="16" />
          统计
        </button>
        <button class="action-btn" @click="exportGraph">
          <uni-icons type="download" size="16" />
          导出
        </button>
      </view>
    </view>

    <!-- 知识图谱查看器 -->
    <KnowledgeGraphViewer ref="graphViewer" />

    <!-- 统计信息弹窗 -->
    <uni-popup ref="statisticsPopup" type="center">
      <view class="statistics-panel">
        <view class="panel-header">
          <text class="panel-title">知识图谱统计</text>
          <button class="close-btn" @click="closeStatistics">×</button>
        </view>

        <view class="panel-content">
          <view class="stat-section">
            <text class="section-title">整体概况</text>
            <view class="stat-grid">
              <view class="stat-item">
                <text class="stat-number">{{ totalQuestions }}</text>
                <text class="stat-label">题目总数</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ totalKnowledgePoints }}</text>
                <text class="stat-label">知识点</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ totalConcepts }}</text>
                <text class="stat-label">概念</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ totalRegulations }}</text>
                <text class="stat-label">法规条款</text>
              </view>
            </view>
          </view>

          <view class="stat-section">
            <text class="section-title">学习覆盖度</text>
            <view class="coverage-chart">
              <view class="coverage-item">
                <text class="coverage-label">法规类</text>
                <view class="progress-bar">
                  <view class="progress-fill" :style="{ width: regulationCoverage + '%' }"></view>
                </view>
                <text class="coverage-value">{{ regulationCoverage }}%</text>
              </view>
              <view class="coverage-item">
                <text class="coverage-label">技术类</text>
                <view class="progress-bar">
                  <view class="progress-fill" :style="{ width: technicalCoverage + '%' }"></view>
                </view>
                <text class="coverage-value">{{ technicalCoverage }}%</text>
              </view>
              <view class="coverage-item">
                <text class="coverage-label">操作类</text>
                <view class="progress-bar">
                  <view class="progress-fill" :style="{ width: operationalCoverage + '%' }"></view>
                </view>
                <text class="coverage-value">{{ operationalCoverage }}%</text>
              </view>
              <view class="coverage-item">
                <text class="coverage-label">安全类</text>
                <view class="progress-bar">
                  <view class="progress-fill" :style="{ width: safetyCoverage + '%' }"></view>
                </view>
                <text class="coverage-value">{{ safetyCoverage }}%</text>
              </view>
            </view>
          </view>

          <view class="stat-section">
            <text class="section-title">难度分布</text>
            <view class="difficulty-distribution">
              <view class="difficulty-item">
                <view class="difficulty-bar easy" :style="{ width: easyQuestions + '%' }"></view>
                <text class="difficulty-label">简单 {{ easyQuestions }}%</text>
              </view>
              <view class="difficulty-item">
                <view class="difficulty-bar medium" :style="{ width: mediumQuestions + '%' }"></view>
                <text class="difficulty-label">中等 {{ mediumQuestions }}%</text>
              </view>
              <view class="difficulty-item">
                <view class="difficulty-bar hard" :style="{ width: hardQuestions + '%' }"></view>
                <text class="difficulty-label">困难 {{ hardQuestions }}%</text>
              </view>
            </view>
          </view>
        </view>

        <view class="panel-footer">
          <button class="panel-btn" @click="refreshStatistics">刷新</button>
          <button class="panel-btn primary" @click="closeStatistics">确定</button>
        </view>
      </view>
    </uni-popup>

    <!-- 导出选项弹窗 -->
    <uni-popup ref="exportPopup" type="bottom">
      <view class="export-panel">
        <view class="panel-header">
          <text class="panel-title">导出知识图谱</text>
          <button class="close-btn" @click="closeExport">×</button>
        </view>

        <view class="export-options">
          <view class="export-option" @click="exportAs('json')">
            <view class="option-icon">
              <uni-icons type="doc" size="24" color="#007AFF" />
            </view>
            <view class="option-content">
              <text class="option-title">JSON格式</text>
              <text class="option-desc">完整的知识图谱数据，可导入Neo4j</text>
            </view>
            <uni-icons type="right" size="16" color="#999" />
          </view>

          <view class="export-option" @click="exportAs('csv')">
            <view class="option-icon">
              <uni-icons type="list" size="24" color="#4CAF50" />
            </view>
            <view class="option-content">
              <text class="option-title">CSV格式</text>
              <text class="option-desc">节点和关系统计表，便于分析</text>
            </view>
            <uni-icons type="right" size="16" color="#999" />
          </view>

          <view class="export-option" @click="exportAs('image')">
            <view class="option-icon">
              <uni-icons type="image" size="24" color="#FF9800" />
            </view>
            <view class="option-content">
              <text class="option-title">图片格式</text>
              <text class="option-desc">当前图谱视图截图</text>
            </view>
            <uni-icons type="right" size="16" color="#999" />
          </view>
        </view>

        <view class="export-note">
          <text class="note-text">导出的文件将保存到本地存储</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import KnowledgeGraphViewer from '@/subpkg/exam/components/KnowledgeGraphViewer.vue'

// 响应式数据
const statusBarHeight = ref(0)
const graphViewer = ref(null)

// 统计数据
const graphStatistics = ref({
  totalQuestions: 0,
  totalKnowledgePoints: 0,
  totalConcepts: 0,
  totalRegulations: 0,
  regulationCoverage: 0,
  technicalCoverage: 0,
  operationalCoverage: 0,
  safetyCoverage: 0,
  easyQuestions: 0,
  mediumQuestions: 0,
  hardQuestions: 0
})

// 弹窗引用
const statisticsPopup = ref(null)
const exportPopup = ref(null)

// 计算属性
const totalQuestions = computed(() => graphStatistics.value.totalQuestions)
const totalKnowledgePoints = computed(() => graphStatistics.value.totalKnowledgePoints)
const totalConcepts = computed(() => graphStatistics.value.totalConcepts)
const totalRegulations = computed(() => graphStatistics.value.totalRegulations)

const regulationCoverage = computed(() => graphStatistics.value.regulationCoverage)
const technicalCoverage = computed(() => graphStatistics.value.technicalCoverage)
const operationalCoverage = computed(() => graphStatistics.value.operationalCoverage)
const safetyCoverage = computed(() => graphStatistics.value.safetyCoverage)

const easyQuestions = computed(() => graphStatistics.value.easyQuestions)
const mediumQuestions = computed(() => graphStatistics.value.mediumQuestions)
const hardQuestions = computed(() => graphStatistics.value.hardQuestions)

// 方法
const loadStatistics = async () => {
  try {
    // 尝试加载统计文件
    const response = await uni.request({
      url: '/static/knowledge-graph/statistics.json',
      method: 'GET'
    })

    if (response.statusCode === 200 && response.data) {
      graphStatistics.value = {
        totalQuestions: response.data.totalQuestions || 0,
        totalKnowledgePoints: response.data.nodeTypes?.knowledge || 0,
        totalConcepts: response.data.nodeTypes?.concept || 0,
        totalRegulations: response.data.nodeTypes?.regulation || 0,
        regulationCoverage: 85, // 模拟数据
        technicalCoverage: 72,
        operationalCoverage: 68,
        safetyCoverage: 91,
        easyQuestions: 35,
        mediumQuestions: 45,
        hardQuestions: 20
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 使用默认数据
    graphStatistics.value = {
      totalQuestions: 0,
      totalKnowledgePoints: 0,
      totalConcepts: 0,
      totalRegulations: 0,
      regulationCoverage: 0,
      technicalCoverage: 0,
      operationalCoverage: 0,
      safetyCoverage: 0,
      easyQuestions: 0,
      mediumQuestions: 0,
      hardQuestions: 0
    }
  }
}

const showStatistics = () => {
  statisticsPopup.value.open()
}

const closeStatistics = () => {
  statisticsPopup.value.close()
}

const refreshStatistics = () => {
  loadStatistics()
  uni.showToast({
    title: '统计数据已刷新',
    icon: 'success'
  })
}

const exportGraph = () => {
  exportPopup.value.open()
}

const closeExport = () => {
  exportPopup.value.close()
}

const exportAs = async (format) => {
  try {
    uni.showLoading({
      title: '导出中...'
    })

    let data, filename, mimeType

    switch (format) {
      case 'json':
        // 导出JSON格式
        const graphResponse = await uni.request({
          url: '/static/knowledge-graph/knowledge-graph.json',
          method: 'GET'
        })
        data = JSON.stringify(graphResponse.data, null, 2)
        filename = 'knowledge-graph.json'
        mimeType = 'application/json'
        break

      case 'csv':
        // 导出CSV格式
        data = generateCSV()
        filename = 'knowledge-graph-stats.csv'
        mimeType = 'text/csv'
        break

      case 'image':
        // 导出图片格式
        await exportAsImage()
        uni.hideLoading()
        return
    }

    // 保存文件到本地
    const result = await saveFile(data, filename, mimeType)

    uni.hideLoading()
    if (result) {
      uni.showToast({
        title: '导出成功',
        icon: 'success'
      })
      closeExport()
    } else {
      uni.showToast({
        title: '导出失败',
        icon: 'error'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('导出失败:', error)
    uni.showToast({
      title: '导出失败',
      icon: 'error'
    })
  }
}

const generateCSV = () => {
  // 生成CSV格式的统计数据
  const headers = ['类型', '名称', '数量', '占比']
  const rows = [
    ['节点', '题目', totalQuestions.value, '100%'],
    ['节点', '知识点', totalKnowledgePoints.value, `${Math.round(totalKnowledgePoints.value / totalQuestions.value * 100)}%`],
    ['节点', '概念', totalConcepts.value, `${Math.round(totalConcepts.value / totalQuestions.value * 100)}%`],
    ['节点', '法规', totalRegulations.value, `${Math.round(totalRegulations.value / totalQuestions.value * 100)}%`]
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

const saveFile = async (data, filename, mimeType) => {
  try {
    // 在小程序环境中，这里需要特殊处理
    // 可以保存到本地存储或提供下载链接
    uni.setStorageSync('exported_' + filename, data)

    // 显示保存位置提示
    uni.showModal({
      title: '导出成功',
      content: `文件已保存到本地存储：${filename}`,
      showCancel: false
    })

    return true
  } catch (error) {
    console.error('保存文件失败:', error)
    return false
  }
}

const exportAsImage = async () => {
  // 导出图片功能需要使用canvas截图
  // 这里提供基础实现框架
  try {
    const canvas = uni.createCanvasContext('knowledge-graph', graphViewer.value)

    return new Promise((resolve, reject) => {
      canvas.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'knowledge-graph',
          success: (res) => {
            // 保存图片到相册或本地
            resolve(res.tempFilePath)
          },
          fail: reject
        }, graphViewer.value)
      })
    })
  } catch (error) {
    console.error('导出图片失败:', error)
    throw error
  }
}

// 生命周期
onMounted(() => {
  // 获取状态栏高度
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 加载统计数据
  loadStatistics()
})
</script>

<style lang="less" scoped>
.knowledge-graph-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.status-bar {
  background: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;

  .header-left {
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      display: block;
    }

    .page-subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
      display: block;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 12px;
      background: #f5f5f5;
      border: none;
      border-radius: 16px;
      color: #666;
    }
  }
}

.statistics-panel {
  width: 320px;
  max-height: 500px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      background: #f5f5f5;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      color: #666;
    }
  }

  .panel-content {
    padding: 16px;
    max-height: 350px;
    overflow-y: auto;

    .stat-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        display: block;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .stat-item {
          text-align: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;

          .stat-number {
            font-size: 20px;
            font-weight: 600;
            color: #007AFF;
            display: block;
          }

          .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
            display: block;
          }
        }
      }

      .coverage-chart {
        .coverage-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .coverage-label {
            width: 60px;
            font-size: 12px;
            color: #666;
          }

          .progress-bar {
            flex: 1;
            height: 6px;
            background: #f0f0f0;
            border-radius: 3px;
            margin: 0 12px;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              background: #007AFF;
              border-radius: 3px;
              transition: width 0.3s ease;
            }
          }

          .coverage-value {
            width: 40px;
            text-align: right;
            font-size: 12px;
            color: #333;
            font-weight: 600;
          }
        }
      }

      .difficulty-distribution {
        .difficulty-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .difficulty-bar {
            flex: 1;
            height: 8px;
            border-radius: 4px;
            margin-right: 12px;

            &.easy {
              background: #4CAF50;
            }

            &.medium {
              background: #FF9800;
            }

            &.hard {
              background: #F44336;
            }
          }

          .difficulty-label {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }

  .panel-footer {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #eee;

    .panel-btn {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      background: #fff;
      color: #666;

      &.primary {
        background: #007AFF;
        color: #fff;
        border-color: #007AFF;
      }
    }
  }
}

.export-panel {
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 60vh;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      width: 28px;
      height: 28px;
      background: #f5f5f5;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      color: #666;
    }
  }

  .export-options {
    padding: 16px;

    .export-option {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .option-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        border-radius: 20px;
        margin-right: 12px;
      }

      .option-content {
        flex: 1;

        .option-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          display: block;
        }

        .option-desc {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
          display: block;
        }
      }
    }
  }

  .export-note {
    padding: 16px;
    border-top: 1px solid #eee;

    .note-text {
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  }
}
</style>