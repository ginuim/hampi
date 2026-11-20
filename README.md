# HAM 派

HAM 派是面向业余无线电爱好者的学习与工具客户端。你可以用它练习 A、B、C 类业余无线电操作技术能力验证考试题目、练习摩尔斯电码（CW）、记录通联（QSO），也可以查阅呼号规则、Q 简语和常用缩语。

**[访问 HAM 派官网](https://hampi.reaidea.com/)**

## 和我们一起完善 HAM 派

欢迎所有 HAM 参与。即使不写代码，一条带题号和依据的错题反馈也能帮助下一位备考的朋友。

- **校对题库和解析**：发现题干、选项、答案、配图或解析有误，可以在 [Issues](https://github.com/ginuim/hampi/issues/new) 提交反馈。请注明题号、问题、建议修改和可核对的来源。法规题请尽量附上文件名称、条款和版本。
- **改进日常工具**：欢迎反馈 CW、通联日志、知识查询等功能的使用问题。报告故障时，附上设备或平台、复现步骤，以及预期和实际结果。
- **提交修改**：可以 fork 本仓库，完成修改后提交 Pull Request，说明改了什么、为什么改、如何验证。当前题库在 [`src/subpkg/exam/data/`](src/subpkg/exam/data/)，题目和解析分别在 `questions.json` 和 `explanations.json`。涉及答案修订时，请同时检查对应解析。

## 本地开发

客户端使用 UniApp、Vue 3 和 pnpm。安装依赖后，按目标平台启动开发构建：

```sh
pnpm install --frozen-lockfile
pnpm run dev:h5
# 或启动微信小程序开发构建
pnpm run dev:mp-weixin
```

开发构建输出在 `dist/dev/mp-weixin`。在 `src/manifest.json` 配置自己的微信小程序 AppID，再用微信开发者工具打开构建目录。生产构建使用 `pnpm run build:h5` 或 `pnpm run build:mp-weixin`。

## 仓库范围

本仓库提供客户端源码。登录和云同步需要自行配置兼容的后端，API 地址在 `src/utils/request.js` 中。文章、题目图片、在线解析和分享图片默认使用 HAM 派现有的公开资源地址。

项目尚未指定许可证。再分发题库、图片、音频或第三方组件前，请核实对应素材的授权。

73！
