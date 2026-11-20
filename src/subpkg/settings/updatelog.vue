<template>
  <view class="updatelog-page" :class="{ 'dark': isDark }">
    <NavBar title="更新日志" />
    <view class="timeline-container">
      <view class="timeline-item" v-for="(item, index) in updateLogs" :key="index">
        <view class="timeline-dot"></view>
        <view class="timeline-line" v-if="index < updateLogs.length - 1"></view>
        <CardPanel class="timeline-content">
          <view class="version-header">
            <text class="version-tag">v{{ item.version }}</text>
            <text class="update-time">{{ item.time.split(' ')[0] }}</text>
          </view>
          <view class="description">{{ item.description }}</view>
        </CardPanel>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const updateLogs = [
  {
    version: "1.5.18",
    description: "增加数据备份功能，修改Q简语",
    time: "2026-02-10 00:02",
  },
  {
    version: "1.5.17",
    description: "增加错题集功能；更新MC1-1008、MC1-1009；优化公式解析",
    time: "2025-11-17 00:02",
  },
  {
    version: "1.5.16",
    description: "增加考试结果生成分享海报功能",
    time: "2025-9-25 11:32",
  },
  {
    version: "1.5.14",
    description: "适配平板等设备、修改旧题库答案解析错误",
    time: "2025-9-25 11:32",
  },
  {
    version: "1.5.13",
    description: "修改考试记录答案错乱的问题",
    time: "2025-8-29 23:32",
  },
  {
    version: "1.5.12", 
    description: "修改新题库 bug",
    time: "2025-8-20 23:35",
  },
  {
    version: "1.5.11",
    description: "修改新题库 bug", 
    time: "2025-8-6 00:16",
  },
  {
    version: "1.5.10",
    description: "修改新题库 bug",
    time: "2025-7-31 23:57",
  },
  {
    version: "1.5.9",
    description: "增加新题库",
    time: "2025-7-31 14:11",
  },
  {
    version: "1.5.8",
    description: "修改排序功能",
    time: "2025-5-8 11:30",
  },
  {
    version: "1.5.6",
    description: "修改呼号查询功能",
    time: "2025-5-7 13:40",
  },
  {
    version: "1.4.14",
    description: "增加黄岩岛、台湾省呼号解析",
    time: "2025-4-15 14:46",
  },
  {
    version: "1.4.11",
    description: "上线呼号查询功能",
    time: "2025-4-11 14:17",
  },
  {
    version: "1.4.4",
    description: "优化答题交互",
    time: "2025-4-05 08:30",
  },
  {
    version: "1.4.4",
    description: "修改 cw 功能",
    time: "2025-4-04 20:50",
  },
  {
    version: "1.4.1",
    description: "修改 cw 功能",
    time: "2025-4-01 10:57",
  },
  {
    version: "1.0.0",
    description: "初始版本",
    time: "2025-02-14 22:30",
  }
]
</script>

<style lang="less" scoped>
.updatelog-page {
  box-sizing: border-box;
  padding: 20px;
  min-height: 100vh;
  background-color: var(--background-primary);
}

.timeline-container {
  position: relative;
  padding: 10px 0;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-left: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--primary-color);
  border: 2px solid var(--background-primary);
  box-shadow: 0 0 0 1px var(--primary-color);
  z-index: 2;
}

.timeline-line {
  position: absolute;
  left: 5px;
  top: 22px;
  width: 2px;
  height: calc(100% + 8px);
  background-color: var(--border-color);
  z-index: 1;
}

.timeline-content {
  flex: 1;
  margin-left: 10px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.version-tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--primary-color);
  color: #ffffff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.update-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.description {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

// 深色主题适配
.dark {
  .timeline-dot {
    border-color: var(--background-primary);
  }
  
  .timeline-line {
    background-color: var(--border-color);
  }
}

// 响应式设计
@media (max-width: 375px) {
  .updatelog-page {
    padding: 10px;
  }
  
  .timeline-item {
    padding-left: 25px;
  }
  
  .timeline-dot {
    width: 10px;
    height: 10px;
  }
  
  .timeline-line {
    left: 4px;
  }
  
  .timeline-content {
    margin-left: 7.5px;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>