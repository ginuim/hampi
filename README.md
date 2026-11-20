# HAM派客户端

HAM派是一个面向业余无线电爱好者的 UniApp 客户端，包含考试练习、摩尔斯电码学习、通联日志等功能。本仓库只包含客户端，后端和部署工具不在此发布。

## 本地运行

需要 Node.js 和 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm run dev:h5
# 微信小程序
pnpm run dev:mp-weixin
```

小程序构建产物在 `dist/dev/mp-weixin`；使用微信开发者工具打开，并在 `src/manifest.json` 中配置自己的 AppID。生产构建可使用 `pnpm run build:h5` 或 `pnpm run build:mp-weixin`。

## 服务配置与限制

默认不连接原项目的后端 API。`src/utils/request.js` 中的 `https://api.example.invalid` 是占位地址，登录和数据同步等功能需要自行实现兼容的后端并修改地址。文章、关于作者、Banner、题目图片、远程解析及分享图片使用原项目的公开资源地址，可按需替换为自己的资源。缺少服务时，相关功能不能正常使用。

仓库包含题库、图片、音频和第三方组件，发布及再分发前请核实其权利和授权。尚未指定项目许可证。
