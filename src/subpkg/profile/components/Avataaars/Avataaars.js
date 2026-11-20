import { topTypes } from './assetsTypes/top.js' // 确保路径正确

export default {
  data() {
    return {
      topTypes: topTypes // 应该直接使用导入的对象，而不是Object.keys
    }
  }
}

generateSvgString() {
  // 确保所有属性都有默认值
  const safeProps = {
    topType: this.topType || 'Blank',
    accessoriesType: this.accessoriesType || 'Blank',
    hairColor: this.hairColor || 'Black',
    facialHairType: this.facialHairType || 'Blank',
    facialHairColor: this.facialHairColor || 'Black',
    clotheType: this.clotheType || 'ShirtCrewNeck',
    clotheColor: this.clotheColor || 'Gray02',
    eyeType: this.eyeType || 'Default',
    eyebrowType: this.eyebrowType || 'Default',
    mouthType: this.mouthType || 'Default',
    skinColor: this.skinColor || 'Light'
  };

  // 添加空值保护
  const getSafeSvg = (type, value) => {
    const svg = this[`${type}Types`][value];
    return svg || ''; // 返回空字符串代替undefined
  };

  let topTypeSvg = getSafeSvg('top', safeProps.topType)
    .replace(/var\(--avataaar-hair-color\)/g, this.hairColorValue)
    .replace(/var\(--avataaar-hat-color\)/g, this.hatColorValue);

  // 其他部分也添加安全校验...
} 