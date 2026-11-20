<template>
  <view v-if="isVisible" class="share-modal">
    <view class="modal-overlay" @tap="closeShareModal"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">考试成绩海报</text>
        <text class="close-button" @tap="closeShareModal">×</text>
      </view>

      <canvas
        canvas-id="examPosterCanvas"
        class="poster-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      ></canvas>

      <view class="poster-preview" :class="{ 'poster-preview--empty': !posterPath }">
        <image
          v-if="posterPath"
          class="poster-image"
          :src="posterPath"
          mode="aspectFit"
          @tap="previewPoster"
        />
        <view v-else class="preview-placeholder">
          <view class="preview-indicator" :class="{ 'preview-indicator--loading': isGenerating }"></view>
          <text class="preview-status">{{ isGenerating ? '正在生成成绩海报' : '海报生成失败' }}</text>
          <text class="preview-hint">{{ isGenerating ? '请稍候，完成后即可预览和保存' : '请重试，或稍后再试' }}</text>
          <text v-if="!isGenerating" class="retry-link" @tap="generatePoster">重新生成</text>
        </view>
      </view>

      <view class="share-actions">
        <pi-button @tap="previewPoster" :disabled="!posterPath || isSaving" text="查看大图" />
        <pi-button @tap="savePoster" :disabled="!posterPath || isSaving" type="primary" :text="isSaving ? '保存中…' : saveButtonText" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, ref, watch } from 'vue'
import { formatExamDuration } from '../utils/examResultsConfig'
import PiButton from '@/components/PiButton.vue'

const props = defineProps<{
  isVisible: boolean
  examResult: any
  examType: string
  examDate: string
  userInfo: { avatar?: string; nickname?: string }
}>()
const emit = defineEmits(['close'])
const instance = getCurrentInstance()
const canvasWidth = 400
const canvasHeight = 600
const backgroundUrl = '/static/exam-poster-earth.jpg'
const qrcodeUrl = '/static/exam-poster-qrcode.jpg'
const posterPath = ref('')
const isGenerating = ref(false)
const isSaving = ref(false)
let saveButtonText = '保存到相册'
// #ifdef H5
saveButtonText = '下载海报'
// #endif
let generation = 0

function closeShareModal() {
  emit('close')
}

function loadImage(src: string): Promise<string | null> {
  return new Promise(resolve => {
    let settled = false
    const finish = (path: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(path)
    }
    const timer = setTimeout(() => finish(null), 5000)
    uni.getImageInfo({
      src,
      success: res => {
        let path = res.path
        // #ifdef MP-WEIXIN
        // getImageInfo 会把包内 /static 路径返回为 static/...；Canvas 会再按组件目录解析。
        if (src.startsWith('/static/') && path.startsWith('static/')) path = `../../../${path}`
        // #endif
        finish(path)
      },
      fail: () => finish(null)
    })
  })
}

function text(ctx: any, value: string, x: number, y: number, size: number, color: string, align: 'left' | 'center' | 'right' = 'left', weight = 0) {
  ctx.setFillStyle(color)
  ctx.setFontSize(size)
  ctx.setTextAlign(align)
  if (weight > 0 && typeof ctx.strokeText === 'function') {
    ctx.setStrokeStyle(color)
    ctx.setLineWidth(weight)
    ctx.setLineJoin('round')
    ctx.strokeText(value, x, y)
  }
  ctx.fillText(value, x, y)
}

function quoteLines(value: string): string[] {
  const quote = value.trim()
  const separator = quote.search(/[，,。；;！!？?]/)
  if (separator > 0 && separator < quote.length - 1) {
    return [quote.slice(0, separator), quote.slice(separator + 1)]
  }
  const chars = Array.from(quote)
  if (chars.length <= 7) return [quote]
  const middle = Math.ceil(chars.length / 2)
  return [chars.slice(0, middle).join(''), chars.slice(middle).join('')]
}

async function drawPoster(): Promise<string> {
  const ctx = uni.createCanvasContext('examPosterCanvas', instance?.proxy)
  if (!ctx) throw new Error('Canvas unavailable')

  const score = Number(props.examResult?.score) || 0
  const total = Number(props.examResult?.totalQuestions) || 0
  const percentage = Number(props.examResult?.percentage) || 0
  const backgroundPath = await loadImage(backgroundUrl)
  const qrcodePath = await loadImage(qrcodeUrl)

  ctx.setFillStyle('#030916')
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  if (backgroundPath) {
    // 背景略向下延伸，让地球弧线落在标题与成绩之间。
    ctx.drawImage(backgroundPath, 0, 0, canvasWidth, 680)
  } else {
    // 图片偶发加载失败时仍保留暗色海报和一条可辨认的地平线。
    ctx.setStrokeStyle('#27679F')
    ctx.setLineWidth(3)
    ctx.beginPath()
    ctx.moveTo(0, 326)
    ctx.quadraticCurveTo(200, 290, 400, 326)
    ctx.stroke()
  }

  text(ctx, 'HAM派', 24, 41, 20, '#FFFFFF', 'left', 1)
  text(ctx, `${props.examType}类模拟考试`, 376, 40, 14, '#A7B0C4', 'right', 0.6)

  const lines = quoteLines(String(props.examResult?.quote || '期待在电波中相遇'))
  lines.slice(0, 2).forEach((line, index) => {
    const chars = Array.from(line)
    const displayLine = chars.length > 12 ? `${chars.slice(0, 11).join('')}…` : line
    const fontSize = Math.min(44, Math.floor(320 / Math.max(Array.from(displayLine).length, 1)))
    text(ctx, displayLine, 24, 132 + index * 55, fontSize, '#FFFFFF', 'left', 1.8)
  })

  const scoreFontSize = percentage >= 100 ? 72 : 92
  const scoreText = String(percentage)
  ctx.setFontSize(scoreFontSize)
  const scoreWidth = ctx.measureText ? ctx.measureText(scoreText).width : scoreText.length * scoreFontSize * 0.62
  text(ctx, scoreText, 24, 480, scoreFontSize, '#FFFFFF', 'left', 2)
  text(ctx, '%', Math.min(24 + scoreWidth + 3, 185), 480, 45, '#FFFFFF', 'left', 1.5)
  text(ctx, '正确率', 27, 508, 14, '#8995AD', 'left', 0.8)

  ctx.setStrokeStyle('#263D60')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(232, 409)
  ctx.lineTo(232, 508)
  ctx.stroke()

  text(ctx, `${score} / ${total}`, 262, 433, 23, '#FFFFFF', 'left', 1.2)
  text(ctx, '答对题数', 263, 454, 13, '#8995AD', 'left', 0.8)
  const duration = formatExamDuration(props.examResult?.duration || 0)
  text(ctx, duration, 262, 486, duration.length > 6 ? 18 : 22, '#FFFFFF', 'left', 1.2)
  text(ctx, '考试用时', 263, 507, 13, '#8995AD', 'left', 0.8)

  ctx.setStrokeStyle('#263D60')
  ctx.beginPath()
  ctx.moveTo(24, 540)
  ctx.lineTo(376, 540)
  ctx.stroke()
  text(ctx, '期待在电波中相遇', 24, 574, 16, '#FFFFFF', 'left', 0.9)
  if (qrcodePath) {
    ctx.setFillStyle('#FFFFFF')
    ctx.fillRect(340, 548, 44, 44)
    ctx.drawImage(qrcodePath, 343, 551, 38, 38)
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error?: any, path?: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(path || '')
    }
    const timer = setTimeout(() => finish(new Error('Canvas draw timeout')), 10000)
    try {
      ctx.draw(false, () => {
        setTimeout(() => {
          if (settled) return
          uni.canvasToTempFilePath({
            canvasId: 'examPosterCanvas',
            destWidth: canvasWidth * 2,
            destHeight: canvasHeight * 2,
            success: res => finish(undefined, res.tempFilePath),
            fail: error => finish(error)
          }, instance?.proxy)
        }, 150)
      })
    } catch (error) {
      finish(error)
    }
  })
}

async function generatePoster() {
  const currentGeneration = ++generation
  posterPath.value = ''
  isGenerating.value = true
  try {
    await nextTick()
    const path = await drawPoster()
    if (currentGeneration === generation && props.isVisible) posterPath.value = path
  } catch (error) {
    console.error('生成考试海报失败:', error)
  } finally {
    if (currentGeneration === generation) isGenerating.value = false
  }
}

function previewPoster() {
  if (posterPath.value) uni.previewImage({ urls: [posterPath.value], current: posterPath.value })
}

function savePoster() {
  if (!posterPath.value || isSaving.value) return
  // #ifdef H5
  const link = document.createElement('a')
  link.href = posterPath.value
  link.download = `HAM派-${props.examType}类模拟考试.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  return
  // #endif
  // #ifndef H5
  isSaving.value = true
  uni.saveImageToPhotosAlbum({
    filePath: posterPath.value,
    success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' }),
    complete: () => { isSaving.value = false }
  })
  // #endif
}

watch(() => props.isVisible, visible => {
  if (visible) generatePoster()
  else generation++
}, { immediate: true })
</script>

<style lang="less" scoped>
.share-modal {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 19, 24, 0.74);
}
.modal-content {
  position: relative;
  width: 88%;
  max-width: 400px;
  max-height: 88vh;
  padding: 18px;
  border-radius: 20px;
  background: var(--background-primary);
  box-sizing: border-box;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.modal-title { font-size: 17px; font-weight: 700; }
.close-button { font-size: 27px; line-height: 28px; padding: 0 4px; }
.poster-canvas {
  position: fixed;
  top: -9999px;
  left: -9999px;
}
.poster-preview {
  width: 100%;
  height: 52vh;
  max-height: 460px;
  border-radius: 12px;
  background: #030916;
  overflow: hidden;
}
.poster-preview--empty { height: 190px; }
.poster-image { display: block; width: 100%; height: 100%; }
.preview-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
}
.preview-indicator {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
  border-radius: 50%;
  border: 2px solid #537092;
  box-sizing: border-box;
}
.preview-indicator--loading { border-top-color: #87B9FF; }
.preview-status { font-size: 17px; font-weight: 700; }
.preview-hint { font-size: 12px; color: #A1B0C8; }
.retry-link {
  margin-top: 8px;
  padding: 7px 20px;
  border-radius: 18px;
  color: #FFFFFF;
  background: #286DCE;
  font-size: 13px;
}
.share-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}
</style>
