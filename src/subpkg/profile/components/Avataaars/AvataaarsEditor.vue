<template>
  <view class="avatar-editor">
    <!-- 添加头像预览 -->
    <view class="preview-section">
      <Avataaars
        :topType="topType"
        :accessoriesType="accessoriesType"
        :hairColor="hairColor"
        :facialHairType="facialHairType"
        :facialHairColor="facialHairColor"
        :clotheType="clotheType"
        :clotheColor="clotheColor"
        :eyeType="eyeType"
        :eyebrowType="eyebrowType"
        :mouthType="mouthType"
        :skinColor="skinColor"
        :circleColor="circleColor"
        :width="120"
        :height="120"
        ref="avataarRef"
      />
      <view class="button-group">
        <pi-button class="action-btn random-btn" @tap="randomizeAvatar">随机生成</pi-button>
        <!-- <pi-button class="action-btn export-btn" @tap="exportAvatar">导出头像</pi-button> -->
      </view>
    </view>

    <!-- 快速选择区 -->
    <view class="quick-select-section">
      <view class="section-header">
        <text class="section-title">快速选择</text>
      </view>
      <scroll-view scroll-x class="quick-select-scroll">
        <view class="quick-select-items">
          <view 
            v-for="(preset, index) in presets" 
            :key="index" 
            class="quick-select-item"
            @click="applyPreset(preset)">
            <Avataaars
              v-bind="preset"
              :width="60"
              :height="60"
            />
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="editor-section" v-for="(section, index) in sections" :key="index">
      <view class="section-header">
        <text class="section-title">{{ section.title }}</text>
      </view>
      <scroll-view scroll-x class="component-scroll">
        <view class="component-items">
          <view 
            v-for="(option, optIndex) in section.options" 
            :key="optIndex"
            class="component-item"
            :class="{ selected: getCurrent(section.type, section.options) === option }"
            @click="handlePickerChange(section.type, optIndex, section.options)">
            <Avataaars
              v-bind="getPreviewOptions(section.type, option)"
              :width="60"
              :height="60"
            />
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 颜色选择部分 -->
    <view class="editor-section" v-for="(section, index) in colorSections" :key="'color-'+index">
      <view class="section-header">
        <text class="section-title">{{ section.title }}</text>
      </view>
      <scroll-view scroll-x class="color-scroll">
        <view class="color-items">
          <view 
            v-for="(option, optIndex) in section.options" 
            :key="optIndex"
            class="color-item"
            :class="{ selected: getCurrentColor(section.type, section.options) === option }"
            @click="handleColorChange(section.type, optIndex, section.options)"
            :style="{ backgroundColor: getColorValue(section.type, option) }"
          >
            <view class="color-preview" v-if="isPattern(section.type, option)">
              <Avataaars
                v-bind="getColorPreviewOptions(section.type, option)"
                :width="40"
                :height="40"
              />
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { topTypes } from './assetsTypes/top.js'
import { mouthTypes } from './assetsTypes/mouth.js'
import { eyeTypes } from './assetsTypes/eyes.js'
import { clothesType } from './assetsTypes/clothes.js'
import { eyebrowTypes } from './assetsTypes/eyebrows.js'
import { accessoriesTypes } from './assetsTypes/accessories.js'
import { facialHairTypes } from './assetsTypes/facial-hair.js'
import { hairColors, skinColors, hatAndShirtColors } from './assetsTypes/colors.js'
import Avataaars from './Avataaars.vue'

console.log(topTypes)

export default {
  name: 'AvataaarsEditor',
  components: {
    Avataaars
  },
  props: {
    topType: { type: String, default: 'ShortHairShortFlat' },
    accessoriesType: { type: String, default: 'Blank' },
    hairColor: { type: String, default: 'BrownDark' },
    facialHairType: { type: String, default: 'Blank' },
    facialHairColor: { type: String, default: 'BrownDark' },
    clotheType: { type: String, default: 'BlazerShirt' },
    clotheColor: { type: String, default: 'Blue03' },
    eyeType: { type: String, default: 'Default' },
    eyebrowType: { type: String, default: 'Default' },
    mouthType: { type: String, default: 'Default' },
    skinColor: { type: String, default: 'Light' },
    circleColor: { type: String, default: '#6FB8E0' },
  },
  emits: [
    'update:topType',
    'update:accessoriesType',
    'update:hairColor',
    'update:facialHairType',
    'update:facialHairColor',
    'update:clotheType',
    'update:clotheColor',
    'update:eyeType',
    'update:eyebrowType',
    'update:mouthType',
    'update:skinColor',
    'update:circleColor',
    'update:options'
  ],
  data() {
    return {
      topTypes: Object.keys(topTypes),
      accessoriesTypes: Object.keys(accessoriesTypes),
      facialHairTypes: Object.keys(facialHairTypes),
      clothesTypes: Object.keys(clothesType),
      eyeTypes: Object.keys(eyeTypes),
      eyebrowTypes: Object.keys(eyebrowTypes),
      mouthTypes: Object.keys(mouthTypes),
      hairColorOptions: Object.keys(hairColors),
      skinColorOptions: Object.keys(skinColors),
      hatAndShirtColorOptions: Object.keys(hatAndShirtColors),
      circleColorOptions: [
        '#6FB8E0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEEAD', '#D4A5A5', '#92A8D1', '#F7CAC9', '#B1C7B0',
        '#955251', '#009B77', '#DD4124', '#D65076', '#EFC050',
        '#5B5EA6', '#9B2335', '#DFCFBE', '#55B4B0', '#E15D44'
      ],
      // 预设头像
      presets: [
        {
          topType: 'ShortHairShortFlat',
          accessoriesType: 'Blank',
          hairColor: 'BrownDark',
          facialHairType: 'Blank',
          facialHairColor: 'BrownDark',
          clotheType: 'BlazerShirt',
          clotheColor: 'Blue03',
          eyeType: 'Default',
          eyebrowType: 'Default',
          mouthType: 'Default',
          skinColor: 'Light'
        },
        {
          topType: 'LongHairStraight',
          accessoriesType: 'Blank',
          hairColor: 'Black',
          facialHairType: 'Blank',
          facialHairColor: 'BrownDark',
          clotheType: 'BlazerShirt',
          clotheColor: 'Red',
          eyeType: 'Happy',
          eyebrowType: 'Default',
          mouthType: 'Smile',
          skinColor: 'Light'
        },
        {
          topType: 'WinterHat1',
          accessoriesType: 'Prescription02',
          hairColor: 'Blonde',
          facialHairType: 'BeardMedium',
          facialHairColor: 'Blonde',
          clotheType: 'Hoodie',
          clotheColor: 'Gray02',
          eyeType: 'Squint',
          eyebrowType: 'RaisedExcited',
          mouthType: 'Serious',
          skinColor: 'Pale'
        },
        {
          topType: 'LongHairBun',
          accessoriesType: 'Kurt',
          hairColor: 'Auburn',
          facialHairType: 'Blank',
          facialHairColor: 'BrownDark',
          clotheType: 'ShirtVNeck',
          clotheColor: 'PastelRed',
          eyeType: 'Surprised',
          eyebrowType: 'UpDown',
          mouthType: 'Concerned',
          skinColor: 'DarkBrown'
        },
        {
          topType: 'ShortHairDreads01',
          accessoriesType: 'Wayfarers',
          hairColor: 'Black',
          facialHairType: 'MoustacheFancy',
          facialHairColor: 'Black',
          clotheType: 'GraphicShirt',
          clotheColor: 'Gray01',
          eyeType: 'Wink',
          eyebrowType: 'AngryNatural',
          mouthType: 'Tongue',
          skinColor: 'Brown'
        }
      ]
    }
  },
  computed: {
    sections() {
      return [
        { title: '发型', type: 'topType', options: this.topTypes },
        { title: '配饰', type: 'accessoriesType', options: this.accessoriesTypes },
        { title: '胡子', type: 'facialHairType', options: this.facialHairTypes },
        { title: '服装', type: 'clotheType', options: this.clothesTypes },
        { title: '眼睛', type: 'eyeType', options: this.eyeTypes },
        { title: '眉毛', type: 'eyebrowType', options: this.eyebrowTypes },
        { title: '嘴巴', type: 'mouthType', options: this.mouthTypes },
      ]
    },
    colorSections() {
      return [
        { title: '发色', type: 'hairColor', options: this.hairColorOptions },
        { title: '胡子颜色', type: 'facialHairColor', options: this.hairColorOptions },
        { title: '服装颜色', type: 'clotheColor', options: this.hatAndShirtColorOptions },
        { title: '肤色', type: 'skinColor', options: this.skinColorOptions },
        { title: '背景颜色', type: 'circleColor', options: this.circleColorOptions },
      ]
    },
    allOptions() {
      return {
        topType: this.topType,
        accessoriesType: this.accessoriesType,
        hairColor: this.hairColor,
        facialHairType: this.facialHairType,
        facialHairColor: this.facialHairColor,
        clotheType: this.clotheType,
        clotheColor: this.clotheColor,
        eyeType: this.eyeType,
        eyebrowType: this.eyebrowType,
        mouthType: this.mouthType,
        skinColor: this.skinColor,
        circleColor: this.circleColor,
      }
    }
  },
  methods: {
    getTypeIndex(type, options) {
      const currentValue = this[type]
      const index = options.indexOf(currentValue)
      return index >= 0 ? index : 0
    },
    getCurrent(type, options) {
      const index = this.getTypeIndex(type, options)
      return options[index]
    },
    getColorIndex(type, options) {
      const currentValue = this[type]
      const index = options.indexOf(currentValue)
      return index >= 0 ? index : 0
    },
    getCurrentColor(type, options) {
      const index = this.getColorIndex(type, options)
      return options[index]
    },
    handlePickerChange(type, index, options) {
      const newValue = options[index]
      this.$emit(`update:${type}`, newValue)
      
      // 更新所有选项并发送更新事件
      const updatedOptions = { ...this.allOptions, [type]: newValue }
      this.$emit('update:options', updatedOptions)
    },
    handleColorChange(type, index, options) {
      const newValue = options[index]
      // 对所有类型统一处理，因为其他类型需要保留名称映射
      this.$emit(`update:${type}`, newValue)
      
      const updatedOptions = { ...this.allOptions, [type]: newValue }
      this.$emit('update:options', updatedOptions)
    },
    // 导出头像
    async exportAvatar() {
      try {
        uni.showLoading({ title: '正在导出...' });
        
        // 获取SVG数据URL
        const svgDataUrl = this.$refs.avataarRef.svgDataUrl;
        
        // 创建临时文件路径
        const tempFilePath = `${uni.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
        
        // 创建canvas绘制图像
        const canvas = uni.createOffscreenCanvas({
          type: '2d',
          width: 300,
          height: 300
        });
        const ctx = canvas.getContext('2d');
        
        // 创建图片对象
        const img = canvas.createImage();
        
        // 加载SVG图像
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = svgDataUrl;
        });
        
        // 绘制图像
        ctx.clearRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        
        // 导出为图片
        const buffer = canvas.toDataURL('image/png');
        
        // 将buffer写入临时文件
        const fs = uni.getFileSystemManager();
        fs.writeFileSync(tempFilePath, buffer.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        
        // 保存到相册
        await uni.saveImageToPhotosAlbum({
          filePath: tempFilePath
        });
        
        // 删除临时文件
        fs.unlinkSync(tempFilePath);
        
        uni.hideLoading();
        uni.showToast({
          title: '头像已保存',
          icon: 'success'
        });
      } catch (error) {
        console.error('导出头像失败', error);
        uni.hideLoading();
        
        uni.showModal({
          title: '保存失败',
          content: '无法保存头像，请检查应用权限',
          showCancel: false
        });
      }
    },
    // 添加随机化头像的方法
    randomizeAvatar() {
      const randomOptions = {
        topType: this.getRandomChoice(this.topTypes),
        accessoriesType: this.getRandomChoice(this.accessoriesTypes),
        hairColor: this.getRandomChoice(this.hairColorOptions),
        facialHairType: this.getRandomChoice(this.facialHairTypes),
        facialHairColor: this.getRandomChoice(this.hairColorOptions),
        clotheType: this.getRandomChoice(this.clothesTypes),
        clotheColor: this.getRandomChoice(this.hatAndShirtColorOptions),
        eyeType: this.getRandomChoice(this.eyeTypes),
        eyebrowType: this.getRandomChoice(this.eyebrowTypes),
        mouthType: this.getRandomChoice(this.mouthTypes),
        skinColor: this.getRandomChoice(this.skinColorOptions),
        circleColor: this.getRandomChoice(this.circleColorOptions),
      }
      
      // 更新所有属性
      Object.keys(randomOptions).forEach(key => {
        this.$emit(`update:${key}`, randomOptions[key])
      })
      
      // 发送整体更新事件
      this.$emit('update:options', randomOptions)
    },
    
    getRandomChoice(options) {
      const index = Math.floor(Math.random() * options.length)
      return options[index]
    },
    // 应用预设头像
    applyPreset(preset) {
      // 更新所有属性
      Object.keys(preset).forEach(key => {
        this.$emit(`update:${key}`, preset[key])
      })
      
      // 发送整体更新事件
      this.$emit('update:options', preset)
    },
    getPreviewOptions(type, value) {
      // 生成预览用的选项组合，保持其他选项不变
      return {
        ...this.allOptions,
        [type]: value,
        // 对某些需要特殊处理的类型进行调整
        ...(type === 'topType' && { facialHairType: 'Blank' }), // 换发型时隐藏胡子
        ...(type === 'clotheType' && { clotheColor: this.getDefaultColor(value) }) // 自动匹配默认颜色
      }
    },
    getDefaultColor(clotheType) {
      // 为不同服装类型设置默认颜色
      const colorMap = {
        BlazerShirt: 'Blue03',
        Hoodie: 'Gray02',
        GraphicShirt: 'Heather',
        ShirtVNeck: 'PastelRed'
      }
      return colorMap[clotheType] || this.clotheColor
    },
    getColorValue(type, option) {
      const colorMaps = {
        hairColor: hairColors,
        facialHairColor: hairColors,
        clotheColor: hatAndShirtColors,
        skinColor: skinColors,
        circleColor: null // 特殊处理
      }
      // 只有circleColor直接返回选项值，其他类型使用颜色映射
      return type === 'circleColor' ? option : (colorMaps[type][option] || option)
    },
    isPattern(type, option) {
      return type === 'clotheColor' && option.includes('Heather')
    },
    getColorPreviewOptions(type, value) {
      return {
        ...this.allOptions,
        [type]: value,
        ...(type === 'clotheColor' && { clotheType: 'GraphicShirt' })
      }
    },
    getAvatarDataUrl() {
      return this.$refs.avataarRef.svgDataUrl;
    }
  },
  expose: ['getAvatarDataUrl']
}
</script>

<style scoped>
.avatar-editor {
  width: 100%;
  padding: 10px 0;
  background-color: var(--background-container);
}

.preview-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: var(--background-container);
  border-radius: 6px;
  border: 1px solid var(--border-color);

  position: fixed;
  top: 85px;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
}

.editor-section {
  margin-bottom: 15px;
  background-color: var(--background-secondary);
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  padding: 10px;
  background-color: var(--background-tertiary);
}

.section-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.section-content {
  padding: 10px;
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 10px;
  background-color: var(--background-container);
  border-radius: 4px;
}

.picker-arrow {
  color: var(--text-tertiary);
  font-size: 12px;
}

.button-group {
  display: flex;
  margin-top: 10px;
  width: 100%;
  justify-content: space-around;
}

.action-btn {
  font-size: 14px;
  padding: 5px 15px;
  border-radius: 4px;
  flex: 1;
  margin: 0 5px;
  max-width: 80px;
  text-align: center;
}

.random-btn {
  background-color: var(--primary-color);
  color: #fff;
}

.export-btn {
  background-color: var(--success-color);
  color: #fff;
}

.action-btn:active {
  opacity: 0.8;
}

.quick-select-section {
  margin-bottom: 15px;
  background-color: var(--background-secondary);
  border-radius: 6px;
  overflow: hidden;
}

.quick-select-scroll {
  padding: 10px;
  width: 100%;
}

.quick-select-items {
  display: flex;
  width: fit-content;
}

.quick-select-item {
  margin-right: 10px;
  background-color: var(--background-container);
  border-radius: 4px;
  padding: 5px;
  border: 1px solid var(--border-color);
}

.quick-select-item:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.component-scroll {
  padding: 10px;
  padding-right: 0;
  width: 100%;
  box-sizing: border-box;
}

.component-items {
  display: flex;
  width: fit-content;
}

.component-item {
  margin-right: 10px;
  background-color: var(--background-primary);
  border-radius: 9px;
  padding: 5px;
  transform: scale(.95);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.component-item.selected {
  border-color: var(--primary-color);
  transform: scale(1);
  box-shadow: 0 2px 6px var(--shadow-color);
}

.component-item:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.color-scroll {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

.color-items {
  display: flex;
  gap: 10px;
  padding: 0 10px;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transform: scale(0.95);
  box-shadow: 0 1px 3px var(--shadow-color);
}

.color-item.selected {
  border-color: var(--primary-color);
  transform: scale(1);
  box-shadow: 0 2px 6px var(--shadow-color);
}

.color-preview {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(var(--pattern-color) 0% 25%, transparent 0% 50%) 50% / 10px 10px;
}
</style> 