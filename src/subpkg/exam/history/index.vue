<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar :title="showWrongQuestions ? '错题详情' : '考试记录'" :onBack="onBack" />
    <view class="content">
      <view v-if="showWrongQuestions" class="wrong-questions">
        <exam-component 
          v-if="processedQuestions.length"
          :questions="processedQuestions"
          mode="review"
          :isReview="true"
          :alwaysShowExplanation="true"
          @back="backToList"
        />
      </view>
      <view v-else class="history-wrapper">
        <view class="history-content">
          <exam-history
            @back="goBack"
            @view-wrong="viewWrongQuestions"
          />
        </view>
        <view class="share-button-container">
          <button class="share-button" @tap="showShareSelector">分享考试记录</button>
        </view>
      </view>

      <!-- 分享选择弹窗 -->
      <view v-if="showShareModal" class="share-modal" @tap="closeShareModal">
        <view class="share-modal-content" @tap.stop>
          <view class="modal-header">
            <view class="modal-heading">
              <text class="modal-title">选择考试记录</text>
              <text class="modal-subtitle">最多选择10条，生成一张可保存的海报</text>
            </view>
            <button class="close-btn" @tap="closeShareModal">×</button>
          </view>

          <view class="records-list">
            <view v-if="allExamRecords.length === 0" class="no-records">
              <text>暂无考试记录</text>
            </view>

            <view
              v-for="record in allExamRecords"
              :key="record.id"
              class="record-item"
              :class="{ selected: selectedRecords.has(record.id) }"
              @tap="toggleRecord(record)"
            >
              <view class="record-info">
                <view class="record-main">
                  <text class="exam-type">{{ record.type }}类考试</text>
                  <text class="exam-date">{{ formatDate(record.date) }}</text>
                </view>
                <view class="record-stats">
                  <text :class="['score', record.passed ? 'passed' : 'failed']">
                    {{ record.correctCount }}/{{ record.totalQuestions }}
                  </text>
                  <text class="duration">{{ formatDuration(record.duration) }}</text>
                </view>
              </view>
              <view class="checkbox" :class="{ checked: selectedRecords.has(record.id) }">
                <text v-if="selectedRecords.has(record.id)">✓</text>
              </view>
            </view>
          </view>

          <view class="modal-footer">
            <view class="selection-info">
              <text>已选择 {{ selectedRecords.size }}/{{ allExamRecords.length }} 条</text>
            </view>
            <view class="action-buttons">
              <button class="cancel-btn" @tap="closeShareModal">取消</button>
              <button
                class="confirm-btn"
                :class="{ disabled: selectedRecords.size === 0 }"
                @tap="confirmShare"
              >
                生成分享海报
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加canvas元素用于生成海报（足够大的高度以支持多条记录）-->
    <canvas 
      canvas-id="posterCanvas"
      :style="{
        width: '375px',
        height: '2000px',
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        zIndex: -1
      }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import ExamHistory from '../components/ExamHistory.vue'
import ExamComponent from '../components/ExamComponent.vue'
import NavBar from '@/components/NavBar/NavBar.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const instance = getCurrentInstance()

const showWrongQuestions = ref(false)
const currentRecord = ref<any>(null)
const pixelRatio = ref(1) // 添加设备像素比

// 分享选择相关状态
const showShareModal = ref(false)
const selectedRecords = ref(new Set())
const allExamRecords = ref<any[]>([])
const MAX_SELECTION_COUNT = 10 // 最大选择数量

// 用户信息
const localUserInfo = ref<{
  avatar?: string
  nickname?: string
  callsign?: string
}>({})

// 最终使用的用户信息
const finalUserInfo = computed(() => {
  return {
    avatar: localUserInfo.value.avatar || '',
    nickname: localUserInfo.value.callsign || localUserInfo.value.nickname || 'HAM爱好者'
  }
})

// 处理错题数据格式
const processedQuestions = computed(() => {
  if (!currentRecord.value?.wrongQuestions) return []

  console.log('currentRecord.value.wrongQuestions: ', currentRecord.value?.wrongQuestions)
  
  // 从ExamHistory组件传递过来的数据已经经过处理，直接使用即可
  return currentRecord.value.wrongQuestions.map((question: any) => {
    try {
      return {
        id: question.id,
        content: question.content,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation,
        img: question.img,
        userAnswer: question.userAnswer,
        isWrongQuestion: true,
        isFavorite: false,
        optionMapping: question.optionMapping || {}
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

// 加载所有考试记录
const loadAllExamRecords = () => {
  try {
    const records = uni.getStorageSync('examRecords.20250728') || []
    allExamRecords.value = typeof records === 'string' ? JSON.parse(records) : records
  } catch (e) {
    console.error('获取考试记录失败:', e)
    allExamRecords.value = []
  }
}

// 获取今日的考试记录
const getTodayExamRecords = () => {
  const today = new Date().toISOString().split('T')[0] // 获取今天的日期 YYYY-MM-DD

  const todayRecords = allExamRecords.value.filter((record: any) => {
    const recordDate = new Date(record.date).toISOString().split('T')[0]
    return recordDate === today
  })
  return todayRecords.length ? todayRecords : allExamRecords.value.slice(0, 1)
}

// 从 storage 加载用户信息
function loadUserProfile() {
  try {
    const userProfileStr = uni.getStorageSync('userProfile')
    if (userProfileStr) {
      const userProfile = JSON.parse(userProfileStr)
      localUserInfo.value = {
        avatar: userProfile.avatar,
        nickname: userProfile.nickname,
        callsign: userProfile.callsign
      }
      console.log('✅ [海报生成] 从 storage 加载用户信息:', localUserInfo.value)
    } else {
      console.log('⚠️ [海报生成] storage 中没有 userProfile')
    }
  } catch (error) {
    console.error('❌ [海报生成] 读取用户信息失败:', error)
  }
}

// 加载图片（带超时）
function loadImageWithTimeout(src: string, timeout: number = 5000): Promise<{path: string} | null> {
  return new Promise((resolve) => {
    console.log(`🖼️ [海报生成] 开始加载图片: ${src}`)
    
    const timer = setTimeout(() => {
      console.warn(`⚠️ [海报生成] 图片加载超时: ${src}`)
      resolve(null)
    }, timeout)
    
    uni.getImageInfo({
      src: src,
      success: (res) => {
        clearTimeout(timer)
        console.log(`✅ [海报生成] 图片加载成功: ${src}`)
        resolve(res)
      },
      fail: (err) => {
        clearTimeout(timer)
        console.error(`❌ [海报生成] 图片加载失败: ${src}`, err)
        resolve(null)
      }
    })
  })
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
const generatePoster = async (records: any[] = null) => {
  try {
    console.log('🎯 [海报生成] 开始生成考试记录海报...')
    uni.showLoading({ title: '生成海报中...' })

    // 获取要分享的考试记录
    const shareRecords = records || getTodayExamRecords()

    if (shareRecords.length === 0) {
      uni.hideLoading()
      uni.showToast({
        title: '暂无考试记录可分享',
        icon: 'none'
      })
      return
    }

    const ctx = uni.createCanvasContext('posterCanvas', instance?.proxy)
    const width = 375
    const rowHeight = 66
    const height = Math.max(480, 382 + shareRecords.length * rowHeight)
    const padding = 24

    console.log('📐 [海报生成] Canvas 尺寸:', { width, height, recordCount: shareRecords.length })

    // 与成绩海报保持一致的深蓝背景，记录数增多时画布随之伸长。
    ctx.setFillStyle('#061225')
    ctx.fillRect(0, 0, width, height)
    ctx.setFillStyle('#102844')
    ctx.fillRect(0, 0, width, 256)
    ctx.setFillStyle('#296DB3')
    ctx.fillRect(0, 254, width, 2)

    ctx.setFillStyle('#FFFFFF')
    ctx.setTextAlign('left')
    ctx.setFontSize(22)
    ctx.fillText('HAM派', padding, 44)
    ctx.setFillStyle('#A3B5CD')
    ctx.setFontSize(12)
    ctx.setTextAlign('right')
    ctx.fillText('模拟考试记录', width - padding, 42)

    ctx.setTextAlign('left')
    ctx.setFontSize(13)
    ctx.fillText(Array.from(finalUserInfo.value.nickname).slice(0, 18).join(''), padding, 78)
    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(25)
    ctx.fillText('每一次练习，都算数', padding, 130)

    const totalExams = shareRecords.length
    const passedExams = shareRecords.filter((record: any) => record.passed).length
    const totalQuestions = shareRecords.reduce((sum: number, record: any) => sum + Number(record.totalQuestions || 0), 0)
    const correctQuestions = shareRecords.reduce((sum: number, record: any) => sum + Number(record.correctCount || 0), 0)
    const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions * 100).toFixed(1) : '0.0'

    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(40)
    ctx.fillText(`${passedExams}/${totalExams}`, padding, 204)
    ctx.setFontSize(29)
    ctx.fillText(`${accuracy}%`, 210, 204)
    ctx.setFillStyle('#A3B5CD')
    ctx.setFontSize(12)
    ctx.fillText('通过 / 总次数', padding, 229)
    ctx.fillText('总正确率', 210, 229)

    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(15)
    ctx.fillText('考试明细', padding, 282)
    ctx.setFillStyle('#8298B2')
    ctx.setTextAlign('right')
    ctx.setFontSize(11)
    ctx.fillText(`共 ${totalExams} 条`, width - padding, 281)

    for (let i = 0; i < shareRecords.length; i++) {
      const record = shareRecords[i]
      const y = 297 + i * rowHeight
      const recordAccuracy = record.totalQuestions > 0
        ? Math.round(record.correctCount / record.totalQuestions * 100)
        : 0
      ctx.setFillStyle('#10243D')
      ctx.fillRect(20, y, 335, 58)
      ctx.setFillStyle(record.passed ? '#66CBB9' : '#EE8F91')
      ctx.fillRect(20, y, 3, 58)

      ctx.setTextAlign('left')
      ctx.setFillStyle('#FFFFFF')
      ctx.setFontSize(14)
      ctx.fillText(`${record.type}类模拟考试`, 33, y + 23)
      ctx.setFillStyle('#91A6C2')
      ctx.setFontSize(11)
      ctx.fillText(`${record.correctCount}/${record.totalQuestions}  ·  ${formatDuration(record.duration)}`, 33, y + 44)

      ctx.setTextAlign('right')
      ctx.setFillStyle('#A3B5CD')
      ctx.setFontSize(10)
      ctx.fillText(formatDate(record.date), 342, y + 21)
      ctx.setFillStyle(record.passed ? '#66CBB9' : '#EE8F91')
      ctx.setFontSize(17)
      ctx.fillText(`${recordAccuracy}%`, 342, y + 45)
    }

    const footerY = height - 72
    ctx.setStrokeStyle('#2C4565')
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(padding, footerY)
    ctx.lineTo(width - padding, footerY)
    ctx.stroke()
    ctx.setTextAlign('left')
    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(16)
    ctx.fillText('期待在电波中相遇', padding, height - 31)

    const qrcodeImage = await loadImageWithTimeout('https://hampi.oss-cn-hangzhou.aliyuncs.com/fc/common/qrcode.jpg', 5000)
    if (qrcodeImage) {
      ctx.setFillStyle('#FFFFFF')
      ctx.fillRect(299, height - 63, 54, 54)
      ctx.drawImage(qrcodeImage.path, 302, height - 60, 48, 48)
    }

    // 绘制完成
    console.log('🎨 [海报生成] 开始绘制到Canvas...')
    
    return new Promise((resolve, reject) => {
      const drawTimeout = setTimeout(() => {
        console.error('❌ [海报生成] ctx.draw() 回调超时')
        reject(new Error('Canvas draw timeout'))
      }, 10000)
      
      try {
        ctx.draw(false, () => {
          clearTimeout(drawTimeout)
          console.log('✅ [海报生成] Canvas draw 回调触发，等待转换...')
          
          setTimeout(() => {
            uni.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: width,
              height: height,
              destWidth: width * pixelRatio.value,
              destHeight: height * pixelRatio.value,
              canvasId: 'posterCanvas',
              success: (res) => {
                console.log('✅ [海报生成] 海报生成成功:', res.tempFilePath)
                console.log('📐 [海报生成] 导出尺寸:', { 
                  width, 
                  height, 
                  destWidth: width * pixelRatio.value,
                  destHeight: height * pixelRatio.value 
                })
                uni.hideLoading()
                
                // 显示操作选项
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
                
                resolve(res.tempFilePath)
              },
              fail: (err) => {
                console.error('❌ [海报生成] Canvas转换失败:', err)
                uni.hideLoading()
                uni.showToast({
                  title: '生成海报失败',
                  icon: 'none'
                })
                reject(err)
              }
            }, instance?.proxy)
          }, 300)
        })
      } catch (error) {
        clearTimeout(drawTimeout)
        console.error('❌ [海报生成] ctx.draw() 调用失败:', error)
        reject(error)
      }
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

// 显示分享选择器
const showShareSelector = () => {
  loadAllExamRecords()

  // 检查是否有考试记录
  if (allExamRecords.value.length === 0) {
    uni.showToast({
      title: '暂无考试记录可分享',
      icon: 'none'
    })
    return
  }

  selectedRecords.value.clear()
  showShareModal.value = true
  
  // 默认选择最近的5条记录
  const recentRecords = allExamRecords.value.slice(0, Math.min(5, allExamRecords.value.length))
  recentRecords.forEach((record: any) => {
    selectedRecords.value.add(record.id)
  })

  uni.reportEvent('exam_share_poster', {
    exam_type: 'history'
  })
}

// 关闭分享弹窗
const closeShareModal = () => {
  showShareModal.value = false
  selectedRecords.value.clear()
}

// 切换记录选择状态
const toggleRecord = (record: any) => {
  if (selectedRecords.value.has(record.id)) {
    selectedRecords.value.delete(record.id)
  } else {
    if (selectedRecords.value.size >= MAX_SELECTION_COUNT) {
      uni.showToast({
        title: `最多只能选择${MAX_SELECTION_COUNT}条记录`,
        icon: 'none'
      })
      return
    }
    selectedRecords.value.add(record.id)
  }
}

// 确认分享
const confirmShare = () => {
  if (selectedRecords.value.size === 0) {
    uni.showToast({
      title: '请至少选择一条记录',
      icon: 'none'
    })
    return
  }

  const selectedRecordsList = allExamRecords.value.filter((record: any) =>
    selectedRecords.value.has(record.id)
  )

  // 按时间倒序排列（最新的在前面）
  selectedRecordsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  closeShareModal()
  generatePoster(selectedRecordsList)
}

// 保留原有的 handleShare 作为备用
const handleShare = () => {
  showShareSelector()
}

onMounted(() => {
  console.log('🚀 [考试记录] 组件挂载...')
  
  // 加载用户信息
  loadUserProfile()
  
  // 获取设备像素比
  const systemInfo = uni.getSystemInfoSync()
  pixelRatio.value = systemInfo.pixelRatio || 2
  console.log('📱 [考试记录] 设备信息:', {
    pixelRatio: pixelRatio.value,
    platform: systemInfo.platform
  })
})
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.content {
  // 参考 practice 页面，移除默认 padding，让 exam-component 充分利用空间
  min-height: 100vh;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    display: flex;
    justify-content: center;
    // padding: 15px;
  }

  // PC端居中显示
  @media screen and (min-width: 1025px) {
    display: flex;
    justify-content: center;
    // padding: 20px;
  }
}

.wrong-questions {
  height: 100%;
  width: 100%;

  // 平板端适配，保持与 practice 页面一致的布局
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    max-width: 100%;
    width: 100%;
  }

  // PC端适配，移除宽度限制，让 exam-component 自行控制布局
  @media screen and (min-width: 1025px) {
    max-width: 100%;
    width: 100%;
  }
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

.history-wrapper {
  position: relative;
  height: 100%;
}

.history-content {
  padding-bottom: 80px; // 为底部按钮预留空间

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding-bottom: 90px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding-bottom: 100px;
  }
}

.share-button-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px;
  display: flex;
  justify-content: center;
  background-color: var(--background-primary);
  border-top: 1px solid var(--border-color-light);
  z-index: 100;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 12px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 15px;
  }
}

.share-button {
  background-color: var(--primary-color);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  border: none;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 12px 24px;
    font-size: 16px;
    border-radius: 24px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 15px 30px;
    font-size: 18px;
    border-radius: 25px;
  }
}

// 分享选择弹窗样式
.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(3, 10, 22, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 20px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 40px;
  }
}

.share-modal-content {
  background-color: var(--background-container);
  border-radius: 18px;
  width: 88%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    width: 85%;
    max-width: 600px;
    max-height: 75vh;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    width: 80%;
    max-width: 700px;
    max-height: 70vh;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--border-color-light);

  .modal-title {
    display: block;
    font-size: 18px;
    font-weight: bold;
    color: var(--text-primary);
    flex: 1;

    // 平板端适配
    @media screen and (min-width: 768px) and (max-width: 1024px) {
      font-size: 20px;
    }

    // PC端适配
    @media screen and (min-width: 1025px) {
      font-size: 22px;
    }
  }

  .modal-subtitle {
    display: block;
    margin-top: 4px;
    color: var(--text-secondary);
    font-size: 12px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--background-hover);
    }

    // 平板端适配
    @media screen and (min-width: 768px) and (max-width: 1024px) {
      font-size: 26px;
      width: 32px;
      height: 32px;
    }

    // PC端适配
    @media screen and (min-width: 1025px) {
      font-size: 28px;
      width: 34px;
      height: 34px;
    }
  }
}

.records-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-height: 50vh;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 25px;
    max-height: 65vh;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 30px;
    max-height: 70vh;
  }
}

.no-records {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 14px;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
    padding: 50px 25px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    font-size: 17px;
    padding: 60px 30px;
  }
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 14px 18px;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 16px 20px;
    margin-bottom: 12px;
    border-radius: 12px;
  }

  &:hover {
    background-color: var(--background-hover);
    border-color: var(--border-color-hover);
  }

  &.selected {
    background-color: var(--primary-color-light);
    border-color: var(--primary-color);
  }
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    gap: 6px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    gap: 8px;
  }
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-type {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-primary);

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    font-size: 17px;
  }
}

.exam-date {
  font-size: 12px;
  color: var(--text-secondary);

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 13px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    font-size: 14px;
  }
}

.record-stats {
  display: flex;
  gap: 15px;
  align-items: center;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    gap: 18px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    gap: 20px;
  }
}

.score {
  font-size: 14px;
  font-weight: bold;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 16px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    font-size: 17px;
  }

  &.passed {
    color: var(--success-color);
  }

  &.failed {
    color: var(--error-color);
  }
}

.duration {
  font-size: 12px;
  color: var(--text-secondary);

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 13px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    font-size: 14px;
  }
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color-light);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 12px;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    margin-left: 15px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    margin-left: 18px;
  }

  &.checked {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    font-size: 12px;
    font-weight: bold;

    // 平板端适配
    @media screen and (min-width: 768px) and (max-width: 1024px) {
      font-size: 14px;
    }

    // PC端适配
    @media screen and (min-width: 1025px) {
      font-size: 15px;
    }
  }
}

.modal-footer {
  padding: 14px 18px 18px;
  border-top: 1px solid var(--border-color-light);

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 18px 25px 25px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 20px 30px 30px;
  }
}

.selection-info {
  text-align: left;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 14px;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    margin-bottom: 18px;
    font-size: 15px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    margin-bottom: 20px;
    font-size: 16px;
  }
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 15px;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    gap: 18px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    gap: 20px;
  }
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 22px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    padding: 14px 24px;
    font-size: 16px;
    border-radius: 10px;
  }

  // PC端适配
  @media screen and (min-width: 1025px) {
    padding: 16px 28px;
    font-size: 17px;
    border-radius: 12px;
  }
}

.cancel-btn {
  background-color: var(--background-secondary);
  color: var(--text-secondary);

  &:hover {
    background-color: var(--background-hover);
  }
}

.confirm-btn {
  background-color: var(--primary-color);
  color: #fff;

  &:hover:not(.disabled) {
    opacity: 0.9;
  }

  &.disabled {
    background-color: var(--background-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
}
</style>
