<template>
  <view v-if="isShow" class="dialog-mask" :class="[animation ? 'fade-in' : '']" @click="handleMaskClick">
    <view 
      class="dialog-container" 
      :class="[
        size,
        type,
        animation ? 'zoom-in' : ''
      ]" 
      @click.stop
    >
      <!-- 标题区域 -->
      <view v-if="showTitle" class="dialog-header">
        <view class="dialog-title">{{ title }}</view>
        <view v-if="showClose" class="dialog-close" @click="handleClose">×</view>
      </view>
      
      <!-- 内容区域 -->
      <view class="dialog-content" :class="[type]">
        <slot>
          <view v-if="type === 'success'" class="dialog-icon success">✓</view>
          <view v-if="type === 'warning'" class="dialog-icon warning">!</view>
          <view v-if="type === 'error'" class="dialog-icon error">×</view>
          <view v-if="content" class="dialog-text">{{ content }}</view>
        </slot>
      </view>

      <!-- 按钮区域 -->
      <view v-if="showCancel || showConfirm" class="dialog-footer">
        <button 
          v-if="showCancel" 
          class="dialog-btn cancel-btn"
          :style="{ color: cancelColor }"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button 
          v-if="showConfirm" 
          class="dialog-btn confirm-btn"
          :style="{ color: confirmColor }"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  isShow: {
    type: Boolean,
    default: false,
    required: true
  },
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['success', 'warning', 'error', 'info', 'default'].includes(value)
  },
  mode: {
    type: String,
    default: 'base',
    validator: (value) => ['base', 'simple'].includes(value)
  },
  title: {
    type: String,
    default: '提示'
  },
  content: {
    type: String,
    default: ''
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: false
  },
  showConfirm: {
    type: Boolean,
    default: false
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelColor: {
    type: String,
    default: ''
  },
  confirmColor: {
    type: String,
    default: ''
  },
  closeOnClickMask: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  },
  animation: {
    type: Boolean,
    default: true
  },
  beforeClose: {
    type: Function
  }
})

const emit = defineEmits(['update:isShow', 'cancel', 'confirm', 'close'])

// 监听 show 变化
watch(() => props.isShow, (newVal) => {
  if (!newVal) {
    // 关闭时的处理
    emit('close')
  }
})

const handleClose = async () => {
  if (props.beforeClose) {
    const canClose = await props.beforeClose()
    if (!canClose) return
  }
  emit('update:isShow', false)
}

const handleMaskClick = () => {
  if (props.closeOnClickMask) {
    handleClose()
  }
}

const handleCancel = () => {
  emit('cancel')
  handleClose()
}

const handleConfirm = () => {
  emit('confirm')
  handleClose()
}
</script>

<style lang="less" scoped>
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  &.fade-in {
    animation: fadeIn 0.3s both;
  }
}

.dialog-container {
  background-color: var(--background-primary);
  border-radius: 8px;
  overflow: hidden;
  width: 90%;
  
  &.zoom-in {
    animation: zoomIn 0.3s both;
  }
  
  &.small {
    width: 300px;
  }
  
  &.normal {
    width: 400px;
  }
  
  &.large {
    width: 600px;
  }

  &.success {
    .dialog-title {
      color: var(--success-color);
    }
  }

  &.warning {
    .dialog-title {
      color: var(--warning-color);
    }
  }

  &.error {
    .dialog-title {
      color: var(--error-color);
    }
  }
}

.dialog-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.dialog-close {
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: var(--text-primary);
  }
}

.dialog-content {
  padding: 16px;
  color: var(--text-primary);
  text-align: center;

  &.success,
  &.warning,
  &.error,
  &.info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
}

.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  
  &.success {
    background-color: var(--success-color);
    color: #fff;
  }
  
  &.warning {
    background-color: var(--warning-color);
    color: #fff;
  }
  
  &.error {
    background-color: var(--error-color);
    color: #fff;
  }
}

.dialog-text {
  line-height: 1.5;
  word-break: break-all;
}

.dialog-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color);
}

.dialog-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: none;
  min-width: 80px;
  
  &.cancel-btn {
    background-color: var(--background-primary);
    color: var(--text-primary);
    
    &:hover {
      background-color: var(--background-secondary);
    }
  }
  
  &.confirm-btn {
    background-color: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
    
    &:hover {
      opacity: 0.9;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 