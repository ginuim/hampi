<template>
  <picker
    mode="selector"
    :value="currentIndex"
    :range="displayOptions"
    @change="handleChange"
    @cancel="handleCancel"
  >
    <view class="ham-select" :class="{ 'dark': isDark }">
      <view class="select-content">
        <text class="select-text" :class="{ 'placeholder': !currentLabel }">
          {{ currentLabel || placeholder }}
        </text>
        <text class="select-arrow iconfont">&#xe688;</text>
      </view>
    </view>
  </picker>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

interface Option {
  label: string
  value: string | number
}

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array as () => Option[],
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

// 用于显示的选项数组（只包含label）
const displayOptions = computed(() => props.options.map(opt => opt.label))

// 当前选中项的索引
const currentIndex = computed(() => {
  return props.options.findIndex(opt => opt.value === props.modelValue)
})

// 当前选中项的标签
const currentLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || ''
})

function handleChange(e: any) {
  const index = e.detail.value
  const selectedOption = props.options[index]
  emit('update:modelValue', selectedOption.value)
  emit('change', {
    ...e,
    detail: {
      value: selectedOption.value,
      label: selectedOption.label
    }
  })
}

function handleCancel() {
  // 用户取消选择时的处理
}
</script>

<style lang="less" scoped>
.ham-select {
  width: 100%;
  background-color: var(--background-container);
  border-radius: 20px;
  padding: 15px 25px;
  box-sizing: border-box;
  
  .select-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    &:active {
      opacity: 0.7;
    }
  }

  .select-text {
    font-size: 16px;
    color: var(--text-primary);
    
    &.placeholder {
      color: var(--text-secondary);
    }
  }

  .select-arrow {
    font-size: 12px;
    color: var(--text-secondary);
  }
}
</style> 