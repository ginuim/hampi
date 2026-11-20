import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

// 配置 marked-katex-extension 支持 KaTeX 公式渲染
// 默认支持 $$...$$ (行间公式) 和 $...$ (行内公式)
marked.use(markedKatex({
  throwOnError: false
}));

export default marked; 