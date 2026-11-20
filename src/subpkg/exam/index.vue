<template>
  <view class="container" :class="{ 'dark': isDark }">
    <NavBar title="考试系统" />

    <view class="content">
      <view class="exam-selection">
        <view class="header">
          <HamSelect
            v-model="examTypeValue"
            :options="examTypeOptions"
            placeholder="请选择考试类型"
            @change="handleTypeChange"
          />
        </view>

        <view v-if="examTypeValue" class="mode-buttons">
          <CardPanel @tap="navigateTo('practice')">
            <view class="menu-item">
              <text class="menu-text">练习模式</text>
              <text class="menu-count">{{ stats.totalQuestions }}</text>
            </view>
          </CardPanel>
          <CardPanel @tap="navigateTo('exam')">
            <text>模拟考试</text>
          </CardPanel>
          <CardPanel @tap="navigateTo('favorites')">
            <view class="menu-item">
              <text class="menu-text">我的收藏</text>
              <text class="menu-count">{{ stats.favoritesCount }}</text>
            </view>
          </CardPanel>
          <CardPanel @tap="navigateTo('errSet')">
            <view class="menu-item">
              <text class="menu-text">错题集</text>
              <text class="menu-count">{{ stats.errorsCount }}</text>
            </view>
          </CardPanel>
          <CardPanel @tap="navigateTo('history')">
            <view class="menu-item">
              <text class="menu-text">考试记录</text>
              <text class="menu-count">{{ stats.recordsCount }}</text>
            </view>
          </CardPanel>
        </view>
        <view class="version">题库版本：v20250728</view>
        
        <!-- 版本切换入口 -->
        <view class="version-switch">
          <button class="switch-btn" @tap="switchToOldExam">切换到旧题库（已作废题库）</button>
        </view>
      </view>
    </view>

    <!-- 版本更新提示弹窗 -->
    <!-- <view v-if="showUpdateDialog" class="update-dialog-overlay" @tap="closeUpdateDialog">
      <view class="update-dialog" @tap.stop>
        <view class="dialog-header">
          <text class="dialog-title">题库版本更新</text>
        </view>
        <view class="dialog-content">
          <text class="update-text">已更新至 v20250728 版本</text>
          <rich-text class="update-desc" nodes="<p>根据《中国无线电协会关于启用新版业余无线电台操作技术能力验证题库的通知》，自<b>2025年10月1日</b>正式启用2025年版题库，欢迎使用新题库学习，预祝考试顺利！</p>"></rich-text>
        </view>
        <view class="dialog-actions">
          <button class="cancel-btn" @tap="useOldExam">使用旧题库</button>
          <button class="confirm-btn" @tap="confirmUpdate">使用新题库</button>
        </view>
      </view>
    </view> -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { saveExamType, getExamType, getFavorites, getEnhancedWrongQuestions, getPracticePosition } from '@/subpkg/exam/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import CardPanel from '@/components/CardPanel/CardPanel.vue'
import HamSelect from '@/components/HamSelect/HamSelect.vue'

// 静态导入题库数据
import questionsDataA from '@/subpkg/exam/data/A.json'
import questionsDataB from '@/subpkg/exam/data/B.json'
import questionsDataC from '@/subpkg/exam/data/C.json'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const examTypeValue = ref('A')  // 用于存储选中的值
const examTypeOptions = [
  { label: 'A类考试', value: 'A' },
  { label: 'B类考试', value: 'B' },
  { label: 'C类考试', value: 'C' }
]

const showUpdateDialog = ref(false) // 版本更新提示弹窗
uni.setStorageSync('questionBankVersion', '20250728')

// 统计数据
const stats = ref({
  totalQuestions: 0,
  favoritesCount: 0,
  errorsCount: 0,
  recordsCount: 0
})

// 获取当前考试类型的题库数据
const getCurrentQuestionData = () => {
  switch (examTypeValue.value) {
    case 'A':
      return questionsDataA
    case 'B':
      return questionsDataB
    case 'C':
      return questionsDataC
    default:
      return []
  }
}

// 更新统计数据
const updateStats = () => {
  try {
    // 获取题库总数
    stats.value.totalQuestions = getCurrentQuestionData().length
    
    // 获取收藏数
    const favorites = getFavorites()
    const currentQuestionIds = getCurrentQuestionData()
    stats.value.favoritesCount = favorites.filter((id: string) => currentQuestionIds.includes(id)).length
    
    // 获取错题数（当前考试类型）
    const wrongQuestions = getEnhancedWrongQuestions({ types: [examTypeValue.value] })
    stats.value.errorsCount = wrongQuestions.length
    
    // 获取考试记录数（当前考试类型）
    const records = uni.getStorageSync('examRecords.20250728') || []
    stats.value.recordsCount = records.filter((record: any) => record.type === examTypeValue.value).length
  } catch (e) {
    console.error('更新统计数据失败:', e)
  }
}

// 检查是否需要显示版本更新提示
const checkVersionUpdate = () => {
  try {
    const currentVersion = uni.getStorageSync('questionBankVersion')
    const targetVersion = '20250728'
    
    if (!currentVersion) {
      showUpdateDialog.value = true
    }
  } catch (e) {
    console.error('检查版本更新失败:', e)
    showUpdateDialog.value = true
  }
}

// 关闭更新提示弹窗
const closeUpdateDialog = () => {
  showUpdateDialog.value = false
}

// 确认更新，清除旧数据
const confirmUpdate = () => {
  try {
    // 设置新版本号
    uni.setStorageSync('questionBankVersion', '20250728')
    
    showUpdateDialog.value = false
    
    uni.showToast({
      title: '已切换至新题库',
      icon: 'none'
    })
  } catch (e) {
    console.error('切换题库失败:', e)
    uni.showToast({
      title: '切换失败，请重试',
      icon: 'none'
    })
  }
}

// 使用旧题库
const useOldExam = () => {
  try {
    // 设置旧版本号
    uni.setStorageSync('questionBankVersion', '20211022')
    
    showUpdateDialog.value = false
    
    uni.showToast({
      title: '正在切换至旧版题库',
      icon: 'loading'
    })
    
    // 跳转到旧题库页面
    setTimeout(() => {
      uni.redirectTo({
        url: '/subpkg/exam.old/index'
      })
    }, 1000)
    
  } catch (e) {
    console.error('切换到旧题库失败:', e)
    uni.showToast({
      title: '切换失败，请重试',
      icon: 'none'
    })
  }
}

// 切换到旧题库
const switchToOldExam = () => {
  try {
    // 设置旧版本号
    uni.setStorageSync('questionBankVersion', '20211022')
    
    uni.showToast({
      title: '正在切换至旧版题库',
      icon: 'loading'
    })
    
    // 跳转到旧题库页面
    setTimeout(() => {
      uni.redirectTo({
        url: '/subpkg/exam.old/index'
      })
    }, 1000)
    
  } catch (e) {
    console.error('切换到旧题库失败:', e)
    uni.showToast({
      title: '切换失败，请重试',
      icon: 'none'
    })
  }
}

// 初始化时获取保存的考试类型
onMounted(() => {
  examTypeValue.value = getExamType() || 'A'
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
  
  // 检查版本更新
  checkVersionUpdate()
})

// 页面显示时更新统计数据
onShow(() => {
  updateStats()
})

// 处理类型选择
function handleTypeChange(e: any) {
  const value = e.detail.value
  const option = examTypeOptions.find(opt => opt.value === value)
  if (option) {
    examTypeValue.value = value
    saveExamType(option.value)
    // 更新统计数据
    updateStats()
  }
}

// 导航到对应功能页面
function navigateTo(mode: string) {
  const url = `/subpkg/exam/${mode}/index`
  try {
    uni.navigateTo({
      url: `${url}?type=${examTypeValue.value}`,
      fail: (err) => {
        uni.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  } catch (error) {
    console.error('导航错误:', error)
  }
}
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.content {
  padding: 10px;
  
  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    display: flex;
    justify-content: center;
    padding: 15px;
  }
  
  // PC端居中显示，限制最大宽度
  @media screen and (min-width: 1025px) {
    display: flex;
    justify-content: center;
    padding: 20px;
  }
}

.exam-selection {
  padding: 15px;
  
  // 平板端适配
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    max-width: 350px;
    width: 100%;
    padding: 22.5px;
    background-color: var(--background-container);
    border-radius: 8px;
    border: 1px solid var(--border-color-light);
  }
  
  // PC端限制宽度，更好的阅读体验
  @media screen and (min-width: 1025px) {
    max-width: 400px;
    width: 100%;
    padding: 30px;
    background-color: var(--background-container);
    border-radius: 10px;
    border: 1px solid var(--border-color-light);
  }
}

.header {
  margin-bottom: 20px;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  // 平板端使用网格布局
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12.5px;
  }
  
  // PC端使用网格布局
  @media screen and (min-width: 1025px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  text {
    padding-left: 10px;
    color: var(--text-primary);
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 10px;
    
    .menu-text {
      padding-left: 0;
      color: var(--text-primary);
    }
    
    .menu-count {
      // margin-left: 8px;
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }
  }
}

.version {
  text-align: center;
  font-size: 14px; // 手机端使用px单位
  margin-top: 15px;
  color: var(--text-secondary);
}

.version-switch {
  margin-top: 15px;
  text-align: center;
}

.switch-btn {
  padding: 8px 20px; // 手机端使用px单位
  border-radius: 5px;
  font-size: 14px;
  border-radius: 22px;
  border: 1px solid var(--primary-color);
  background-color: var(--primary-color);
  opacity: 0.8;
  color: #fff;
}

:deep(.ham-select) {
  width: 100%;
  background-color: var(--background-container);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

:deep(.ham-select-placeholder) {
  color: var(--text-tertiary);
}

// 版本更新弹窗样式
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.update-dialog {
  background-color: var(--background-container);
  border-radius: 10px;
  padding: 20px;
  margin: 20px;
  max-width: 300px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  text-align: center;
  margin-bottom: 15px;
}

.dialog-title {
  font-size: 18px; // 手机端使用px单位
  font-weight: bold;
  color: var(--text-primary);
  
  // 平板端适当缩小字体
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 20px;
  }
  
  // PC端字体
  @media screen and (min-width: 1025px) {
    font-size: 22px;
  }
}

.dialog-content {
  margin-bottom: 20px;
}

.update-text {
  display: block;
  font-size: 16px; // 手机端使用px单位
  color: var(--text-primary);
  margin-bottom: 10px;
  text-align: center;
  
  // 平板端适当缩小字体
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    font-size: 18px;
  }
  
  // PC端字体
  @media screen and (min-width: 1025px) {
    font-size: 20px;
  }
}

.update-desc {
  display: block;
  font-size: 14px; // 手机端使用px单位
  color: var(--text-secondary);
  line-height: 1.5;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 10px; // 手机端使用px单位
  border-radius: 5px;
  font-size: 14px;
  border: none;
}

.cancel-btn {
  border: 1px solid var(--border-color);
  background-color: var(--background-container);
  color: var(--text-primary);
}

.confirm-btn {
  background-color: var(--primary-color);
  color: #fff;
}
:deep(.card-panel) {
  border-color: var(--border-color);
}
</style> 