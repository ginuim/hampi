export default {
  vite: {
    build: {
      sourcemap: false,
      minify: 'terser',
      lib: {
        formats: ['es']
      },
      rollupOptions: {
        output: {
          format: 'es',
          // 禁用代码分割，避免与iife格式冲突
          inlineDynamicImports: true
        }
      }
    }
  }
} 