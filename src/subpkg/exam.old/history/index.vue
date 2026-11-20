<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar :title="showWrongQuestions ? '错题详情' : '考试记录'" :onBack="onBack" />
    <view class="content">
      <view v-if="showWrongQuestions" class="wrong-questions">
        <exam-component 
          v-if="processedQuestions.length"
          :questions="processedQuestions"
          mode="practice"
          :isReview="true"
          :alwaysShowExplanation="true"
          @back="backToList"
        />
      </view>
      <view v-else>
        <exam-history 
          @back="goBack"
          @view-wrong="viewWrongQuestions" 
        />
        <view class="share-button-container">
          <button class="share-button" @tap="handleShare">分享今日成绩</button>
        </view>
      </view>
    </view>
    
    <!-- 添加canvas元素用于生成海报 -->
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
import { ref, computed, onMounted } from 'vue'
import ExamHistory from '../components/ExamHistory.vue'
import ExamComponent from '../components/ExamComponent.vue'
import { useThemeStore } from '@/stores/theme'
import PiButton from '@/components/PiButton.vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const showWrongQuestions = ref(false)
const currentRecord = ref<any>(null)
const pixelRatio = ref(1) // 添加设备像素比

// 处理错题数据格式
const processedQuestions = computed(() => {
  if (!currentRecord.value?.wrongQuestions) return []
  
  return currentRecord.value.wrongQuestions.map((question: any) => {
    try {
      return {
        id: question.id,
        content: question.content,
        options: question.options,
        answer: question.answer,
        userAnswer: question.userAnswer,
        e: question.e || ''
      }
    } catch (e) {
      console.error('处理错题数据失败:', e)
      return null
    }
  }).filter(Boolean)
})

const onBack = () => {
  if (showWrongQuestions.value) {
    backToList()
  } else {
    goBack()
  }
}

function goBack() {
  uni.navigateBack()
}

function viewWrongQuestions(record: any) {
  if (!record.wrongQuestions?.length) {
    uni.showToast({
      title: '没有错题记录',
      icon: 'none'
    })
    return
  }
  
  currentRecord.value = record
  showWrongQuestions.value = true
}

function backToList() {
  showWrongQuestions.value = false
  currentRecord.value = null
}

// 获取今日的考试记录
const getTodayExamRecords = () => {
  const records = uni.getStorageSync('examRecords') || []
  const today = new Date().toISOString().split('T')[0] // 获取今天的日期 YYYY-MM-DD
  
  const todayRecords = records.filter((record: any) => {
    const recordDate = new Date(record.date).toISOString().split('T')[0]
    return recordDate === today
  })
  return todayRecords.length ? todayRecords : records.slice(0, 1)
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化考试时长
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

// 生成海报
const generatePoster = async () => {
  try {
    uni.showLoading({ title: '生成海报中...' })
    
    const ctx = uni.createCanvasContext('posterCanvas')
    const width = 375
    const height = 500
    const padding = 20
    
    // 获取今日考试记录
    const todayRecords = getTodayExamRecords()
    
    if (todayRecords.length === 0) {
      uni.hideLoading()
      uni.showToast({
        title: '今日暂无考试记录',
        icon: 'none'
      })
      return
    }
    
    // 设置背景
    ctx.setFillStyle(isDark.value ? '#1a1a1a' : '#ffffff')
    ctx.fillRect(0, 0, width * pixelRatio.value, height * pixelRatio.value)
    
    // 考虑设备像素比
    ctx.scale(pixelRatio.value, pixelRatio.value)
    
    // 绘制标题
    ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
    ctx.setFontSize(24)
    ctx.setTextAlign('center')
    ctx.fillText('今日考试记录', width / 2, 40)
    
    // 绘制分割线
    ctx.setLineWidth(1)
    ctx.setStrokeStyle(isDark.value ? '#333333' : '#eeeeee')
    ctx.moveTo(padding, 60)
    ctx.lineTo(width - padding, 60)
    ctx.stroke()
    
    // 绘制日期
    const today = new Date()
    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    ctx.setFontSize(16)
    ctx.setTextAlign('center')
    ctx.fillText(dateStr, width / 2, 90)
    
    // 统计考试数据
    const totalExams = todayRecords.length
    const passedExams = todayRecords.filter((record: any) => record.passed).length
    const totalQuestions = todayRecords.reduce((sum: number, record: any) => sum + record.totalQuestions, 0)
    const correctQuestions = todayRecords.reduce((sum: number, record: any) => sum + record.correctCount, 0)
    const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions * 100).toFixed(1) : '0'
    
    // 绘制主要统计
    ctx.setFontSize(40)
    ctx.fillText(`${passedExams}/${totalExams}`, width / 2, 150)
    
    ctx.setFontSize(16)
    ctx.fillText('今日通过考试数', width / 2, 180)
    
    ctx.setFontSize(14)
    ctx.setTextAlign('left')
    
    // 绘制表格头部
    let y = 210
    const columnWidths = [180, 80, 80]
    const rowHeight = 40
    
    // 表头
    ctx.setFillStyle(isDark.value ? '#333333' : '#f5f5f5')
    ctx.fillRect(padding, y, width - padding * 2, rowHeight)
    
    ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
    ctx.setFontSize(14)
    ctx.fillText('考试类型', padding + 10, y + 25)
    ctx.fillText('分数', padding + columnWidths[0] + 10, y + 25)
    ctx.fillText('用时', padding + columnWidths[0] + columnWidths[1] + 10, y + 25)
    
    y += rowHeight
    
    // 表格内容
    for (let i = 0; i < Math.min(todayRecords.length, 5); i++) {
      const record = todayRecords[i]
      
      // 设置行背景（间隔着色）
      if (i % 2 === 0) {
        ctx.setFillStyle(isDark.value ? '#252525' : '#ffffff')
      } else {
        ctx.setFillStyle(isDark.value ? '#2a2a2a' : '#f9f9f9')
      }
      ctx.fillRect(padding, y, width - padding * 2, rowHeight)
      
      // 绘制文本
      ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
      ctx.fillText(`${record.type}类考试`, padding + 10, y + 25)
      
      // 设置成绩的颜色（通过为绿色，未通过为红色）
      if (record.passed) {
        ctx.setFillStyle('#4caf50')
      } else {
        ctx.setFillStyle('#f44336')
      }
      ctx.fillText(`${record.correctCount}/${record.totalQuestions}`, padding + columnWidths[0] + 10, y + 25)
      
      // 恢复默认颜色
      ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
      ctx.fillText(formatDuration(record.duration), padding + columnWidths[0] + columnWidths[1] + 10, y + 25)
      
      y += rowHeight
    }
    
    // 绘制总体统计
    y += 20
    ctx.setFillStyle(isDark.value ? '#ffffff' : '#333333')
    ctx.setFontSize(16)
    ctx.setTextAlign('center')
    ctx.fillText(`总正确率: ${accuracy}%`, width / 2, y)
    
    y += 30
    if (passedExams === totalExams && totalExams > 0) {
      ctx.fillText('恭喜你全部通过！继续保持！', width / 2, y)
    } else if (passedExams > 0) {
      ctx.fillText('再接再厉，争取全部通过！', width / 2, y)
    } else if (totalExams > 0) {
      ctx.fillText('加油学习，下次一定能通过！', width / 2, y)
    }
    
    // 绘制底部信息
    ctx.setFontSize(12)
    ctx.setFillStyle(isDark.value ? '#666666' : '#999999')
    
    // 绘制二维码
    const qrcodeSize = 60
    const qrcodeX = (width - qrcodeSize) / 2
    const qrcodeY = height - 80
    
    // 加载二维码图片
    const qrcodeImage = await new Promise<{path: string}>((resolve, reject) => {
      uni.getImageInfo({
        src: 'https://hampi.oss-cn-hangzhou.aliyuncs.com/fc/common/qrcode.jpg',
        success: resolve,
        fail: (err) => {
          console.error('加载二维码图片失败:', err)
          reject(err)
        }
      })
    })
    
    // 绘制二维码白色边框
    ctx.setFillStyle('#ffffff')
    const borderWidth = 5
    ctx.fillRect(qrcodeX - borderWidth, qrcodeY - borderWidth, qrcodeSize + 2 * borderWidth, qrcodeSize + 2 * borderWidth)
    
    // 绘制二维码
    ctx.drawImage(qrcodeImage.path, qrcodeX, qrcodeY, qrcodeSize, qrcodeSize)
    // 绘制底部文字（放在二维码下方）
    // ctx.fillText('HAM考试记录分享', width / 2, height - 10)
    
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

onMounted(() => {
  // 获取设备像素比
  const systemInfo = uni.getSystemInfoSync()
  pixelRatio.value = systemInfo.pixelRatio || 1
})
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.content {
  // padding: 10px;
}

.wrong-questions {
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: var(--background-container);
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

:deep(.history-item) {
  background-color: var(--background-container);
  border: 1px solid var(--border-color-light);
}

:deep(.history-score) {
  color: var(--text-primary);
}

:deep(.history-date) {
  color: var(--text-secondary);
}

.share-button-container {
  padding: 10px;
  display: flex;
  justify-content: center;
}

.share-button {
  background-color: var(--primary-color);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  border: none;
}
</style> 