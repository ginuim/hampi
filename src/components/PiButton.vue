<template>
  <view 
    class="pi-button"
    :class="[
      type ? `pi-button--${type}` : '',
      disabled ? 'is-disabled' : '',
      block ? 'is-block' : ''
    ]"
    :disabled="disabled"
  >
    {{ text }}
  </view>
</template>

<script setup lang="ts">

defineProps<{
  type?: 'primary' | 'default'
  disabled?: boolean
  block?: boolean
  text?: string
}>()

// const emit = defineEmits(['tap'])

// function handleTap(e: any) {
//   emit('tap', e)
// }
</script>

<style lang="less" scoped>
.pi-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px; // 手机端使用px单位
  padding: 0 25px;
  font-size: 14px;
  border-radius: 20px;
  /* border: 1px solid var(--border-color-light); */
  background-color: var(--background-container);
  color: var(--text-primary);
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid var(--border-color);
  white-space: nowrap;

  // 平板端使用px单位，避免rpx放大
  @media screen and (min-width: 768px) and (max-width: 1024px) {
    height: 45px;
    padding: 0 30px;
    font-size: 16px;
    border-radius: 22px;
  }
  
  // PC端使用px单位
  @media screen and (min-width: 1025px) {
    height: 50px;
    padding: 0 35px;
    font-size: 18px;
    border-radius: 25px;
  }
}

.pi-button:active {
  opacity: 0.8;
}

.pi-button--primary {
  background-color: var(--primary-color);
  /* border-color: var(--primary-color); */
  color: #fff;
}

.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.is-block {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}
</style>
