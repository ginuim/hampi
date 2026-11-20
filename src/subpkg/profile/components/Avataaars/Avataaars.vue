<template>
  <view>
    <!-- 使用image标签显示SVG -->
    <image 
      :src="svgDataUrl" 
      mode="aspectFit"
      :style="{ width: width + 'px', height: height + 'px' }"
    />

    <!-- 直接显示SVG -->
    <!-- <web-view v-if="1" :src="htmlDataUrl"></web-view> -->
  </view>
</template>

<script>
import { mouthTypes } from './assetsTypes/mouth.js'
import { eyeTypes } from './assetsTypes/eyes.js'
import { topTypes } from './assetsTypes/top.js'
import { clothesType } from './assetsTypes/clothes.js'
import { eyebrowTypes } from './assetsTypes/eyebrows.js'
import { accessoriesTypes } from './assetsTypes/accessories.js'
import { facialHairTypes } from './assetsTypes/facial-hair.js'
import { GraphicShirtTypes } from './assetsTypes/graphic-shirt.js'
import { hatAndShirtColors, hairColors, skinColors } from './assetsTypes/colors.js'
import { Base64 } from 'js-base64'

export default {
    name: 'avataaars',
    props: {
        width: { type: [Number, String], default: 264 },
        height: { type: [Number, String], default: 280 },
        isCircle: { type: Boolean, default: true },
        circleColor: { type: String, default: '#6fb8e0' },
        topType: { type: String, default: 'random' },
        accessoriesType: { type: String, default: 'random' },
        facialHairType: { type: String, default: 'random' },
        clotheType: { type: String, default: 'random' },
        eyeType: { type: String, default: 'random' },
        eyebrowType: { type: String, default: 'random' },
        mouthType: { type: String, default: 'random' },
        skinColor: { type: String, default: 'random' },
        graphicType: { type: String, default: 'random' },
        hairColor: { type: String, default: 'random' },
        facialHairColor: { type: String, default: 'random' },
        topColor: { type: String, default: 'random' },
        clotheColor: { type: String, default: 'random' },
        showSvg: { type: Boolean, default: false }, // 新增属性：是否直接显示SVG
    },
    methods: {
        getRandomChoice (items) {
            const itemsLength = Object.entries(items).length
            return Object.entries(items)[Math.floor((Math.random()*(itemsLength)))][0]
        },
        getRandomValue (items) {
            const itemsLength = Object.entries(items).length
            return Object.entries(items)[Math.floor((Math.random()*(itemsLength)))][1]
        },
        // 修改base64编码方法
        base64Encode(str) {
            // 使用经过验证的base64库
            return Base64.encode(unescape(encodeURIComponent(str)));
        },
        // 生成SVG字符串
        generateSvgString() {
          const hairColorValue = this.hairColor === 'random' ? 
              this.getRandomValue(this.hairColors) : 
              this.hairColors[this.hairColor];
          
          const facialHairColorValue = this.facialHairColor === 'random' ? 
              this.getRandomValue(this.hairColors) : 
              this.hairColors[this.facialHairColor];
          
          const hatColorValue = this.topColor === 'random' ? 
              this.getRandomValue(this.hatAndShirtColors) : 
              this.hatAndShirtColors[this.topColor];
          
          const shirtColorValue = this.clotheColor === 'random' ? 
              this.getRandomValue(this.hatAndShirtColors) : 
              this.hatAndShirtColors[this.clotheColor];
          
          const skinColorValue = this.skinColor === 'random' ? 
              this.getRandomValue(this.skinColors) : 
              this.skinColors[this.skinColor];
          
          // 修改替换逻辑，确保所有颜色变量都被正确替换
          let topTypeSvg = this.topTypes[this.topTypeValue]
            .replace(/var\(--avataaar-hair-color\)/g, hairColorValue)
            .replace(/var\(--avataaar-hat-color\)/g, hatColorValue);  // 添加帽子颜色替换
          
          let facialHairSvg = this.facialHairTypes[this.facialHairTypeValue]
            .replace(/var\(--avataaar-facial-hair-color\)/g, facialHairColorValue);
          
          let clothesSvg = this.clothesType[this.clotheTypeValue]
            .replace(/var\(--avataaar-shirt-color\)/g, shirtColorValue)
            .replace(/var\(--avataaar-hat-color\)/g, hatColorValue)
            .replace(/var\(--avataaar-hair-color\)/g, hairColorValue);  // 添加额外的颜色替换
          
          let graphicShirtSvg = '';
          if (this.clotheTypeValue === 'GraphicShirt') {
            graphicShirtSvg = this.GraphicShirtTypes[this.graphicTypeValue]
              .replace(/var\(--avataaar-shirt-color\)/g, shirtColorValue);
          }
          
          // 构建完整的SVG
          let svgString = `
          <svg
            viewBox='0 0 264 280'
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            xmlns:xlink='http://www.w3.org/1999/xlink'>
            <desc>Created with getavataaars.com</desc>
            <defs>
              <circle id='path-1' cx='120' cy='120' r='120'></circle>
              <path
                d='M12,160 C12,226.27417 65.72583,280 132,280 C198.27417,280 252,226.27417 252,160 L264,160 L264,-1.42108547e-14 L-3.19744231e-14,-1.42108547e-14 L-3.19744231e-14,160 L12,160 Z'
                id='path-2'></path>
              <path
                d='M124,144.610951 L124,163 L128,163 L128,163 C167.764502,163 200,195.235498 200,235 L200,244 L0,244 L0,235 C-4.86974701e-15,195.235498 32.235498,163 72,163 L72,163 L76,163 L76,144.610951 C58.7626345,136.422372 46.3722246,119.687011 44.3051388,99.8812385 C38.4803105,99.0577866 34,94.0521096 34,88 L34,74 C34,68.0540074 38.3245733,63.1180731 44,62.1659169 L44,56 L44,56 C44,25.072054 69.072054,5.68137151e-15 100,0 L100,0 L100,0 C130.927946,-5.68137151e-15 156,25.072054 156,56 L156,62.1659169 C161.675427,63.1180731 166,68.0540074 166,74 L166,88 C166,94.0521096 161.51969,99.0577866 155.694861,99.8812385 C153.627775,119.687011 141.237365,136.422372 124,144.610951 Z'
                id='path-silhouette'></path>
            </defs>
            <g
              id='Avataaar'
              stroke='none'
              stroke-width='1'
              fill='none'
              fill-rule='evenodd'>
              <g
                transform='translate(-825.000000, -1100.000000)'
                id='Avataaar/Circle'>
                <g transform='translate(825.000000, 1100.000000)'>
                ${this.isCircle ? `
                  <g
                    id='Circle'
                    stroke-width='1'
                    fill-rule='evenodd'
                    transform='translate(12.000000, 40.000000)'>
                    <mask id='mask-1' fill='white'>
                      <use xlink:href='#path-1'></use>
                    </mask>
                    <use
                      id='Circle-Background'
                      fill='#E6E6E6'
                      xlink:href='#path-1'></use>
                    <g
                      id='Color/Palette/Blue-01'
                      mask='url(#mask-1)'
                      fill='${this.circleColor}'>
                      <rect id='🖍Color' x='0' y='0' width='240' height='240'></rect>
                    </g>
                  </g>
                  <mask id='mask-2' fill='white'>
                    <use xlink:href='#path-2' />
                  </mask>
                ` : ''}
                  <g id='Mask' />
                  <g
                    id='Avataaar'
                    stroke-width='1'
                    fill-rule='evenodd'
                    fill='black'
                    mask='url(#mask-2)'>
                    <g id='Body' transform='translate(32.000000, 36.000000)'>
                      <mask id='mask-silhouette' fill='white'>
                        <use xlink:href='#path-silhouette'></use>
                      </mask>
                      <use fill='${skinColorValue}' xlink:href='#path-silhouette'></use>
                      <path
                        d='M156,79 L156,102 C156,132.927946 130.927946,158 100,158 C69.072054,158 44,132.927946 44,102 L44,79 L44,94 C44,124.927946 69.072054,150 100,150 C130.927946,150 156,124.927946 156,94 L156,79 Z'
                        id='Neck-Shadow'
                        fill-opacity="0.100000001"
                        fill='#000000'
                        mask='url(#mask-silhouette)'></path>
                    </g>
                    ${clothesSvg}
                    ${graphicShirtSvg}
                    ${this.eyeTypes[this.eyeTypeValue]}
                    ${this.mouthTypes[this.mouthTypeValue]}
                    ${this.eyebrowTypes[this.eyebrowTypeValue]}
                    <g fill='black' transform='translate(76.000000, 82.000000)'>
                      <g
                        id='Nose/Default'
                        transform='translate(28.000000, 40.000000)'
                        opacity='0.16'>
                        <path
                          d='M16,8 C16,12.418278 21.372583,16 28,16 L28,16 C34.627417,16 40,12.418278 40,8'
                          id='Nose'>
                        </path>
                      </g>
                    </g>
                    ${topTypeSvg}
                    ${facialHairSvg}
                    ${this.accessoriesTypes[this.accessoriesTypeValue]}
                  </g>
                </g>
              </g>
            </g>
          </svg>`;

      
          // 在最后添加XML声明和清理多余空格
          svgString = `<?xml version="1.0" encoding="UTF-8"?>
            ${svgString.trim().replace(/>\s+</g, '><')}`;  // 清理标签间的空白
          
          return svgString;
        },
        // 新增方法：创建包含SVG的HTML
        createHtmlWithSvg() {
            const svgString = this.generateSvgString();
            return `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Avataaars SVG</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                  svg { width: ${this.width}px; height: ${this.height}px; }
                </style>
              </head>
              <body>
                ${svgString}
              </body>
            </html>
            `;
        }
    },
    data () {
        return {
            mouthTypes: mouthTypes,
            eyeTypes: eyeTypes,
            topTypes: topTypes,
            clothesType: clothesType,
            eyebrowTypes: eyebrowTypes,
            facialHairTypes: facialHairTypes,
            accessoriesTypes: accessoriesTypes,
            GraphicShirtTypes: GraphicShirtTypes,
            hatAndShirtColors: hatAndShirtColors,
            hairColors: hairColors,
            skinColors: skinColors,
        }
    },
    computed: {
        topTypeValue() {
            return this.topType === 'random' ? this.getRandomChoice(this.topTypes) : this.topType
        },
        accessoriesTypeValue() {
            return this.accessoriesType === 'random' ? this.getRandomChoice(this.accessoriesTypes) : this.accessoriesType
        },
        facialHairTypeValue() {
            return this.facialHairType === 'random' ? this.getRandomChoice(this.facialHairTypes) : this.facialHairType
        },
        clotheTypeValue() {
            return this.clotheType === 'random' ? this.getRandomChoice(this.clothesType) : this.clotheType
        },
        eyeTypeValue() {
            return this.eyeType === 'random' ? this.getRandomChoice(this.eyeTypes) : this.eyeType
        },
        eyebrowTypeValue() {
            return this.eyebrowType === 'random' ? this.getRandomChoice(this.eyebrowTypes) : this.eyebrowType
        },
        mouthTypeValue() {
            return this.mouthType === 'random' ? this.getRandomChoice(this.mouthTypes) : this.mouthType
        },
        skinColorValue() {
            return this.skinColor === 'random' ? this.getRandomChoice(this.skinColors) : this.skinColor
        },
        graphicTypeValue() {
            return this.graphicType === 'random' ? this.getRandomChoice(this.GraphicShirtTypes) : this.graphicType
        },
        // 生成base64编码的SVG数据URL
        svgDataUrl() {
          const svgString = this.generateSvgString();
          return `data:image/svg+xml;base64,${this.base64Encode(svgString)}`;
        },
        // 生成包含SVG的HTML数据URL
        htmlDataUrl() {
            const html = this.createHtmlWithSvg();
            return `data:text/html;base64,${this.base64Encode(html)}`;
        }
    }
}
</script>

<style>
/* 微信小程序全局样式支持 */
.CustomColor {
  fill: currentColor;
}
</style>