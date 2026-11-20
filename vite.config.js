import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    // 微信小程序基础库不支持 Unicode 属性转义，降级 marked 的字符分类正则。
    ...(process.env.UNI_PLATFORM === 'mp-weixin' ? [{
      name: 'mp-weixin-marked-regexp-compat',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('/node_modules/marked/lib/marked.esm.js')) return null
        return code
          .replace(/\\p\{L\}\\p\{N\}/g, 'A-Za-z0-9\\u00C0-\\uFFFF')
          .replace(/\\p\{[PS]\}/g, '\\u0021-\\u002F\\u003A-\\u0040\\u005B-\\u0060\\u007B-\\u007E\\u2000-\\u2BFF\\u3001-\\u303F\\uFE10-\\uFE1F\\uFE30-\\uFE6F\\uFF01-\\uFF65')
      }
    }] : []),
  ],
  build: {
    // 微信上传校验器不接受依赖包中的空值合并等较新语法。
    target: process.env.UNI_PLATFORM === 'mp-weixin' ? 'es2019' : undefined,
    // // 禁用代码分割
    // rollupOptions: {
    //   output: {
    //     manualChunks: () => 'index.js', // 把所有代码打包到一个文件
    //     inlineDynamicImports: true // 内联所有动态导入
    //   }
    // }
  }
})
