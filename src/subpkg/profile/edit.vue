<template>
  <view class="edit-profile" :class="{ 'dark': isDark }">
    <NavBar :onBack="onBack" :title="showAvatarEditor ? '更换头像' : '个人资料'" />
    
    <view class="form-content">
      <view v-if="!showAvatarEditor" @click="showAvatarEditor = true" class="avatar-section">
        <view class="avatar-wrapper">
          <Avatar :size="160" :custom="avatarOptions" />
        </view>
        <text class="change-avatar">更换头像</text>
      </view>

      <view class="form-group" v-if="!showAvatarEditor">
        <view class="form-item">
          <text class="label">昵称</text>
          <input type="text" v-model="formData.nickname" placeholder="请输入昵称" />
        </view>
        
        <view class="form-item">
          <text class="label">呼号</text>
          <input type="text" v-model="formData.callsign" placeholder="请输入呼号" />
        </view>

        <view class="form-item">
          <text class="label">QTH</text>
          <input type="text" v-model="formData.qth" placeholder="请输入QTH" />
        </view>

        <view class="form-item">
          <text class="label">电子邮箱</text>
          <input type="text" v-model="formData.email" placeholder="请输入电子邮箱" />
        </view>

        <view class="form-item">
          <text class="label">个人网站</text>
          <input type="text" v-model="formData.website" placeholder="请输入个人网站" />
        </view>
      </view>

      <button class="save-btn" @click="saveProfile(true)" v-if="!showAvatarEditor">保存</button>
    </view>

    <view class="avatar-editor" v-if="showAvatarEditor">
      <AvataaarsEditor
        ref="avatarEditorRef"
        v-model:topType="avatarOptions.topType"
        v-model:accessoriesType="avatarOptions.accessoriesType"
        v-model:hairColor="avatarOptions.hairColor"
        v-model:facialHairType="avatarOptions.facialHairType"
        v-model:facialHairColor="avatarOptions.facialHairColor"
        v-model:clotheType="avatarOptions.clotheType"
        v-model:clotheColor="avatarOptions.clotheColor"
        v-model:eyeType="avatarOptions.eyeType"
        v-model:eyebrowType="avatarOptions.eyebrowType"
        v-model:mouthType="avatarOptions.mouthType"
        v-model:skinColor="avatarOptions.skinColor"
        v-model:circleColor="avatarOptions.circleColor"
        @update:options="updateAvatarOptions"
      />
      <button class="save-btn" @click="saveAvatarOptions">保存头像</button>
      <view class="tips">
        头像功能基于 fangpenlin/avataaars 和 orgordin/vuejs-avataaars 修改
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import Avatar from '@/components/Avatar.vue'
import AvataaarsEditor from './components/Avataaars/AvataaarsEditor.vue'
import http from '@/utils/request'
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
const showAvatarEditor = ref(false)
const avatarOptions = ref({
  topType: 'ShortHairShortFlat',
  accessoriesType: 'Blank',
  hairColor: 'Brown',
  facialHairType: 'Blank',
  facialHairColor: 'Brown',
  clotheType: 'ShirtCrewNeck',
  clotheColor: 'Blue03',
  eyeType: 'Default',
  eyebrowType: 'Default',
  mouthType: 'Default',
  skinColor: 'Light'
})

const formData = ref({
  avatar: '',
  nickname: '',
  callsign: '',
  qth: '',
  email: '',
  website: '',
  avatarOptions: {} // 添加保存头像配置的字段
})

const avatarEditorRef = ref(null)

const initFormData = () => {
  const profileData = uni.getStorageSync('userProfile')
  if (profileData) {
    const parsedData = JSON.parse(profileData)
    Object.assign(formData.value, parsedData)
    
    // 如果有保存的头像配置，应用它
    if (parsedData.avatarOptions) {
      avatarOptions.value = { ...parsedData.avatarOptions }
    }
  }
}

const toggleAvatarEditor = () => {
  showAvatarEditor.value = !showAvatarEditor.value
}

const updateAvatarOptions = (options) => {
  avatarOptions.value = { ...options }
}

const onBack = () => {
  if (showAvatarEditor.value) {
    showAvatarEditor.value = false
  } else {
    uni.navigateBack()
  }
}

const saveAvatarOptions = async () => {
  try {
    // 获取头像的base64数据
    const base64Data = await avatarEditorRef.value.getAvatarDataUrl();
    
    // 保存头像配置和base64数据
    formData.value.avatar = base64Data;
    formData.value.avatarOptions = { ...avatarOptions.value };
    
    // 保存到本地存储
    saveProfile(false);
    
    showAvatarEditor.value = false;
    uni.showToast({
      title: '头像已更新',
      icon: 'success'
    });
  } catch (error) {
    console.error('保存头像失败', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
}

const saveProfile = (redirect = true) => {
  // 表单验证
  if (!formData.value.nickname && !formData.value.avatarOptions) {
    uni.showToast({
      title: '昵称不能为空',
      icon: 'none'
    })
    return
  }
  
  // 确保头像选项被保存
  formData.value.avatarOptions = { ...avatarOptions.value }
  
  // 保存到本地存储
  uni.setStorageSync('userProfile', JSON.stringify(formData.value))
  
  // 触发更新事件
  uni.$emit('userProfileUpdated')
  
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })

  if (redirect) {

    http.post('/api/user/save', formData.value)
    .then(res => {
      console.log('保存成功', res.data.avatar)

      if (res.data?.avatar) {
        formData.value.avatar = res.data.avatar
      }
      uni.setStorageSync('userProfile', JSON.stringify(formData.value))
      uni.setStorageSync('profileSynced', true)
    })
    .finally(() => {
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    })
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style lang="less" scoped>
.edit-profile {
  min-height: 100vh;
  background-color: var(--background-primary);
}

.form-content {
  padding: 10px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  background-color: var(--background-container);
  margin-bottom: 10px;
  border-radius: 15px;
  border: 1px solid var(--border-color-light);
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  // border-radius: 40px;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
}

.change-avatar {
  margin-top: 10px;
  color: var(--text-primary);
  font-size: 14px;
}

.form-group {
  background-color: var(--background-container);
  border-radius: 15px;
  padding: 0 10px;
  border: 1px solid var(--border-color-light);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color-light);
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 90px;
  font-size: 14px;
  color: var(--text-primary);
}

input {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.save-btn {
  margin-top: 30px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: 6px;
  font-size: 16px;
  height: 44px;
  line-height: 44px;
}

.save-btn:active {
  opacity: 0.8;
}

.avatar-editor {
  background-color: var(--background-container);
  border-radius: 6px;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid var(--border-color-light);
}

.avatar-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.tips {
  font-size: 12px;
  text-align: center;
  color: var(--text-tertiary);
  opacity: 0.5;
  margin: 10px 0 20px 0;
}
</style> 