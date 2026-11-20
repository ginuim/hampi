# 头像编辑器组件 (AvataaarsEditor)

基于 Avataaars 的自定义头像编辑器组件，支持多种头像部件的自定义和导出功能。

## 功能特点

- 头像实时预览
- 支持自定义头发、配饰、面部毛发、服装、眼睛、眉毛和嘴巴等部件
- 支持自定义发色、肤色等颜色选项
- 提供预设头像快速选择
- 支持随机生成头像
- 支持导出头像为PNG图片保存到相册

## 使用方法

### 基本用法

```vue
<template>
  <AvataaarsEditor
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
    @update:options="updateAvatarOptions"
  />
</template>

<script setup>
import { ref } from 'vue'
import AvataaarsEditor from './components/Avataaars/AvataaarsEditor.vue'

const avatarOptions = ref({
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
})

const updateAvatarOptions = (options) => {
  avatarOptions.value = { ...options }
}
</script>
```

### Props

| 属性名 | 类型 | 默认值 | 说明 |
| ------ | ---- | ------ | ---- |
| topType | String | 'ShortHairShortFlat' | 头发/帽子类型 |
| accessoriesType | String | 'Blank' | 配饰类型 |
| hairColor | String | 'BrownDark' | 头发颜色 |
| facialHairType | String | 'Blank' | 面部毛发类型 |
| facialHairColor | String | 'BrownDark' | 面部毛发颜色 |
| clotheType | String | 'BlazerShirt' | 服装类型 |
| clotheColor | String | 'Blue03' | 服装颜色 |
| eyeType | String | 'Default' | 眼睛类型 |
| eyebrowType | String | 'Default' | 眉毛类型 |
| mouthType | String | 'Default' | 嘴巴类型 |
| skinColor | String | 'Light' | 皮肤颜色 |

### 事件

| 事件名 | 参数 | 说明 |
| ------ | ---- | ---- |
| update:属性名 | 新值 | 当单个属性值变更时触发 |
| update:options | 包含所有属性的对象 | 当任何属性变更时触发，返回完整的属性集合 |

## 可用选项

组件支持的各种类型选项从 Avataaars 原始代码中提取，包括：

- 发型：ShortHairShortFlat, LongHairStraight, WinterHat1 等
- 配饰：Blank, Kurt, Prescription01, Prescription02, Round, Sunglasses, Wayfarers
- 面部毛发：Blank, BeardLight, BeardMajestic, MoustacheFancy 等
- 服装：BlazerShirt, BlazerSweater, CollarSweater, GraphicShirt, Hoodie 等
- 眼睛：Default, Close, Cry, EyeRoll, Happy, Side, Squint, Surprised, Wink 等
- 眉毛：Default, DefaultNatural, FlatNatural, RaisedExcited, SadConcerned 等
- 嘴巴：Default, Concerned, Disbelief, Eating, Grimace, Sad, ScreamOpen, Smile 等
- 肤色：Light, Yellow, Pale, Tanned, Brown, DarkBrown, Black
- 颜色：Black, Blue01-03, Gray01-02, Heather, PastelRed 等

## 注意事项

1. 组件使用了 uni-app 的 API 进行头像导出，确保在小程序环境中正确配置了相册权限
2. 头像预览和导出功能依赖于 Avataaars.vue 组件的实现
3. 如果在web端使用，导出功能可能需要调整实现方式 