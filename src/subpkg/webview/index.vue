<template>
  <view class="webview-container">
    <NavBar title="加载中..." :showBack="true" />
    <web-view :src="url" @message="handleMessage" @onPostMessage="handlePostMessage"></web-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import NavBar from '@/components/NavBar/NavBar.vue';

const url = ref('');
const pageTitle = ref('加载中...');

// 接收页面参数
onLoad((options) => {
  if (options.url) {
    url.value = decodeURIComponent(options.url);
  }
  
  if (options.title) {
    pageTitle.value = decodeURIComponent(options.title);
    uni.setNavigationBarTitle({
      title: pageTitle.value
    });
  }
});

// WebView消息处理
const handleMessage = (event) => {
  console.log('WebView消息', event);
};

const handlePostMessage = (event) => {
  console.log('WebView postMessage', event);
};

onMounted(() => {
  // 如果没有传入标题，尝试获取网页标题
  if (!pageTitle.value || pageTitle.value === '加载中...') {
    // 由于小程序限制，无法直接获取网页标题
    // 这里可以根据URL设置一些预定义的标题
    if (url.value.includes('mp.weixin.qq.com/s/0evMdB_JvGoC2P5rgMr60A')) {
      pageTitle.value = '更新日志';
      uni.setNavigationBarTitle({
        title: pageTitle.value
      });
    }
  }
});
</script>

<style lang="less" scoped>
.webview-container {
  width: 100%;
  height: 100vh;
}
</style> 