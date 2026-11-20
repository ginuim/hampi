<template>
  <view class="card-panel" :class="{ 'can-highlight': !noHighlight }" :style="paddingStyle">
    <slot />
  </view>
</template>

<script>
export default {
  props: {
    noHighlight: {
      type: Boolean,
      default: false
    },
    padding: {
      type: [String, Number],
      default: '15px'
    }
  },
  computed: {
    paddingStyle() {
      return {
        padding: this.padding
      }
    }
  }
}
</script>

<style lang="less" scoped>
.card-panel {
  background-color: var(--background-container);
  border: 1px solid var(--border-color-card);
  border-radius: 20px;

  &.can-highlight:active {
    border-color: var(--border-color-active);
    background-color: var(--background-container-active);
  }
}
</style>
