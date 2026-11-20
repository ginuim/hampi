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
            <text>练习模式</text>
          </CardPanel>
          <CardPanel @tap="navigateTo('exam')">
            <text>模拟考试</text>
          </CardPanel>
          <CardPanel @tap="navigateTo('favorites')">
            <text>我的收藏</text>
          </CardPanel>
          <CardPanel @tap="navigateTo('history')">
            <text>考试记录</text>
          </CardPanel>
        </view>
        <view class="version">题库版本：v20211022</view>
        
        <!-- 版本切换入口 -->
        <view class="version-switch">
          <button class="switch-btn" @tap="switchToNewExam">切换到新题库</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { saveExamType, getExamType } from '@/subpkg/exam.old/utils/examUtils'
import { useThemeStore } from '@/stores/theme'
import CardPanel from '@/components/CardPanel/CardPanel.vue'
import HamSelect from '@/components/HamSelect/HamSelect.vue'

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

// 初始化时获取保存的考试类型
onMounted(() => {
  examTypeValue.value = getExamType() || 'A'
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
})

// 处理类型选择
function handleTypeChange(e: any) {
  const value = e.detail.value
  const option = examTypeOptions.find(opt => opt.value === value)
  if (option) {
    examTypeValue.value = value
    saveExamType(option.value)
  }
}

// 导航到对应功能页面
function navigateTo(mode: string) {
  const url = `/subpkg/exam.old/${mode}/index`
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

// 切换到新题库
const switchToNewExam = () => {
  try {
    // 设置新版本号
    uni.setStorageSync('questionBankVersion', '20250728')
    
    uni.showToast({
      title: '正在切换至新版题库',
      icon: 'loading'
    })
    
    // 跳转到新题库页面
    setTimeout(() => {
      uni.redirectTo({
        url: '/subpkg/exam/index'
      })
    }, 1000)
    
  } catch (e) {
    console.error('切换到新题库失败:', e)
    uni.showToast({
      title: '切换失败，请重试',
      icon: 'none'
    })
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
}

.exam-selection {
  padding: 15px;
}

.header {
  margin-bottom: 20px;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text {
    padding-left: 10px;
    color: var(--text-primary);
  }
}

.version {
  text-align: center;
  font-size: 14px;
  margin-top: 15px;
  color: var(--text-secondary);
}

.version-switch {
  margin-top: 15px;
  text-align: center;
}

.switch-btn {
  padding: 7.5px 20px;
  border-radius: 5px;
  font-size: 14px;
  border: 1px solid var(--primary-color);
  background-color: var(--primary-color);
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
</style> 