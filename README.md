![ap-plugin](https://socialify.git.ci/AiPreface/ap-plugin/image?description=1&font=Raleway&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto)
<!--
 * <img decoding="async" align=right src="resources/readme/girl.png" width="35%">
-->
# AP-PLUGIN🍊

- 一个适用于 [Yunzai 系列机器人框架](https://github.com/yhArcadia/Yunzai-Bot-plugins-index) 的的 AI 绘图插件，让你在输入框中拥有便捷的 AI 绘画体验

- 使用开源的 [Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) 作为后端，自己免费部署，生成的图片多样化，功能更加丰富

- **使用中遇到问题请加 QQ 群咨询：[707331865](https://qm.qq.com/q/TXTIS9KhO2)**

> [!TIP]
> 这个插件是我刚接触 Yunzai 时，和 [渔火](https://github.com/yhArcadia) 合作开发的，已先后跑路不再维护，新作见 [nai-plugin](https://github.com/CikeyQi/nai-plugin) 和 [mj-plugin](https://github.com/CikeyQi/mj-plugin)。

## 安装插件

#### 1. 克隆仓库

```
git clone https://github.com/AiPreface/ap-plugin.git ./plugins/ap-plugin
```

> [!NOTE]
> 如果你的网络环境较差，无法连接到 Github，可以使用 [GitHub Proxy](https://mirror.ghproxy.com/) 提供的文件代理加速下载服务
>
> ```
> git clone https://mirror.ghproxy.com/https://github.com/AiPreface/ap-plugin.git ./plugins/ap-plugin
> ```

#### 2. 安装依赖

```
pnpm install --filter=ap-plugin
```

## 插件配置

> [!WARNING]
> 非常不建议手动修改配置文件，本插件已兼容 [Guoba-plugin](https://github.com/guoba-yunzai/guoba-plugin) ，请使用锅巴插件对配置项进行修改

- 关于部署 Stable Diffuison，请自行在网上寻找教程，这里放一个 [秋葉 aaaki 的教程](https://www.bilibili.com/video/BV1iM4y1y7oA)

- 关于部署 HuggingFace 平台的相关功能，本插件作者不再维护这些功能，请自行寻找教程

- 旧版的配置文档已归档在 [ap-plugin-website](https://github.com/AiPreface/ap-plugin-website/tree/main/docs/Config)，有需要可自行查看

## 功能列表

请使用 `#ap帮助` 获取~~完整~~帮助（藏了些小彩蛋功能）

- [x] 基本生成图片
- [x] 二次元的我
- [x] 鉴赏解析图片 Tags
- [x] 局部重绘
- [x] 控制网基础（需要后端安装 ControlNet）
- [x] 使用 Embedding 和 Lora
- [x] 图片存本地
- [x] 本地预设功能
- [x] 独立设置绘制参数
- [x] 多接口翻译
- [x] 切换模型
- [x] 远程下载模型（需要部署 AP 助手）
- [x] 识别动漫人物
- [x] 图片差分
- [x] 以图搜源
- [x] 卢浮宫滤镜（需要安装 Canvas 依赖）

## 常见问题

1. 我的电脑能不能画图？
   - 建议使用 NVIDIA GeForce GTX 1660 以上的独立显卡，没有独立显卡的电脑不推荐部署。
2. 为什么我部署了，网页端正常画，插件使用不了？
   - 请检查你的后端服务器能被机器人服务器访问。
   - 请在启动器中打开 `启用API` 选项，或在启动参数中加入 `--api`。

## 支持与贡献

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力， 当然，你可以对我 [爱发电](https://afdian.net/a/sumoqi) 赞助~❤️

有意见或者建议也欢迎提交 [Issues](https://github.com/AiPreface/ap-plugin/issues) 和 [Pull requests](https://github.com/AiPreface/ap-plugin/pulls)。

## 相关项目

- [Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)：Stable Diffusion web UI
- [ControlNet](https://github.com/lllyasviel/ControlNet): Let us control diffusion models!

## 许可证

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。
