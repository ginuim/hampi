<template>
  <view class="avatar-box">
    <image v-if="avatar" class="avatar" :src="avatar" mode="aspectFill" />
    <!-- <Avataaars width="80" v-if="avatarOptions" class="avatar-custom" v-bind="avatarOptions" /> -->
    <view v-else class="avatar-default">
      <text class="iconfont">&#xe62e;</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Avataaars from '@/subpkg/profile/components/Avataaars/Avataaars.vue'

const props = defineProps({
  size: {
    type: Number,
    default: 120
  }
})

const avatar = ref('')
const avatarOptions = ref({})
const loadAvatar = () => {
  const profileData = uni.getStorageSync('userProfile')
  if (profileData) {
    const parsed = JSON.parse(profileData)
    avatar.value = parsed.avatar
    // avatarOptions.value = parsed.avatarOptions
  }
}

onMounted(() => {
  loadAvatar()
  
  // 监听storage变化
  uni.$on('userProfileUpdated', () => {
    loadAvatar()
  })
})
</script>

<style lang="less" scoped>
.avatar-box {
  width: 60px;
  height: 65px;
  // border-radius: 50%;
  // overflow: hidden;
  // background: var(--background-container);
  
  .avatar {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
  }

  // .avatar-custom {
  //   width: 100%;
  //   height: 100%;
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  // }

  .avatar-default {
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--avatar-background);
    border-radius: 50%;
    flex-shrink: 0;
    
    .iconfont {
      font-size: 40px;
      color: var(--text-primary);
    }
  }
}
</style> 