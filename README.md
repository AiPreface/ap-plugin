<!--
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-22 00:38:21
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-14 19:11:09
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\README.md
 * @Description: 版本：2.10.0
 *
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
-->

<p align="center">
  <a href="https://ap-plugin.com/"><img src="./resources/readme/logo.png" width="200" height="200" alt="ap-plugin"></a>
</p>

<div align="center">

# Ap-plugin

_🎉 基于 Yunzai-Bot 的 AI 绘图插件 🎉_

</div>

<p align="center">
  </a>
    <img src="./resources/readme/header.png">
  </a>
</p>

---

<span id="header"></span>

<p align="center">
  <img src="https://img.shields.io/badge/Nodejs-16.x+-6BA552.svg" alt="Nodejs">
  <img src="https://img.shields.io/badge/Yunzai_Bot-v3-red.svg" alt="NoneBot">
  <br>
  </a>
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E8%92%99%E5%BE%B7%E5%B9%BC%E7%A8%9A%E5%9B%AD%EF%BC%88%E5%B7%B2%E6%BB%A1%EF%BC%89-green?style=flat-square" alt="QQ Chat Group">
  </a>
    <a href="https://jq.qq.com/?_wv=1027&k=OtkECVdE">
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E7%92%83%E6%9C%88%E5%B9%BC%E7%A8%9A%E5%9B%AD%EF%BC%88%E5%B7%B2%E6%BB%A1%EF%BC%89-yellow?style=flat-square" alt="QQ Chat Group">
  </a>
    <a href="https://jq.qq.com/?_wv=1027&k=FZUabhdf">
    <img src="https://img.shields.io/badge/QQ%E7%BE%A4-%E7%A8%BB%E5%A6%BB%E5%B9%BC%E7%A8%9A%E5%9B%AD-purple?style=flat-square" alt="QQ Chat Group">
  </a>
</p>

<p align="center">
  <a href="https://gitee.com/yhArcadia/ap-plugin">项目地址</a>
  ·
  <a href="#安装插件">开始使用</a>
  ·
  <a href="#配置接口">配置接口</a>
</p>

## 简介

Ap-plugin 是一款在 QQ 内快速调用[Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)提供的 API 接口进行多参数便捷 AI 绘图的[Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot)插件，除此之外也拥有多种图片处理功能，本插件功能不断拓展中，更多功能敬请期待……

<br>

## 安装插件

<!-- ### 前置安装注意

本插件有较多复杂配置，如果没有以下技能，请停止对插件的安装。

* 可能需要义务教育要求的阅读理解水平
* 可能需要义务教育要求的语文理解水平
* 需要认识26个字母并学会如何翻译它们
* 能熟练地使用一种浏览器
* 有基础的代码辨识能力，比如什么是True，什么是False
* 对于Yunzai有一定的了解，有一定的错误排查能力

如果您在配置与使用中遇到问题，请先阅读[提问的智慧](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)后，加入我们的[交流群](#header)进行提问，一般来说聪明问题将会得到解答 -->

<p align="center">
  <a href="https://asciinema.org/a/550312">
    <img src="./resources/readme/code.gif">
  </a>
</p>

#### 1. 挂载至 Yunzai-Bot 目录

```
cd Yunzai-Bot
```

#### 2. 克隆本仓库至 plugins 目录

- 使用 Gitee（国内服务器推荐使用此方法）

```
git clone https://gitee.com/yhArcadia/ap-plugin.git ./plugins/ap-plugin
```

- 使用 Github

```
git clone https://github.com/yhArcadia/ap-plugin.git ./plugins/ap-plugin
```

 <!-- 3. 安装必要依赖（axios）
 - 使用npm
```
npm install axios --registry=https://registry.npmmirror.com
```

 - 使用pnpm
```
pnpm add axios -w
``` -->

#### 3. 重启 Yunzai

```
pnpm restart
```

首次载入请观察控制台，若载入时提醒需要安装依赖，执行控制台给出的安装命令即可

<br><br>

## 配置接口

每个配置项独立对应不同功能，可根据需要按需配置：

<details>
<summary>展开/收起</summary>

|        需要配置的接口       |                         用途                         |                         配置文档                         |
| :-------------------------: | :--------------------------------------------------: | :------------------------------------------------------: |
|     Stable Diffusion接口    | 用于生产图片，相关功能：[绘图](#以文生图)，[以图生图](#以图生图)，[二次元的我](#二次元的我)等 | [文档链接](https://www.wolai.com/rMR9bFJehYhBKdQT6dY3zL) |
|        Real-CUGAN接口       |           用于图像超分，相关功能：[大清晰术](#大清晰术)           | [文档链接](https://www.wolai.com/22QBzD37qxaTcUKaB2zYRK) |
|       DeepDanbooru接口      |     用于逆推图片Tags，相关功能：[鉴赏](#鉴赏)，[二次元的我](#二次元的我)     | [文档链接](https://www.wolai.com/jRW3wLMn53vpf9wc9JCo6T) |
|     Anime Ai Detect接口     |    用于检测图像是否是AI制作的，相关功能：[鉴定图片](#鉴定图片)    | [文档链接](https://www.wolai.com/3koPDP8wEne97evw1bjDiL) |
| Anime Remove Background接口 |          用于去除图片背景，相关功能：[去背景](#去背景)          | [文档链接](https://www.wolai.com/sSZM1AHnBULxyc4s4hKquF) |
|White Box Cartoonization接口|    用于将图片转换成动漫风格，相关功能：[图片动漫化](#图片动漫化)    | [文档链接](https://www.wolai.com/ePdgFyjmMuUR9hfd4G2XLK) |
|       百度图片审核服务      |         用于检查图像是否合规，相关功能：[图像审核](#图像审核)         | [文档链接](https://www.wolai.com/9vacNhw3TPuCPy5pLYQnYw) |

其中，Stable Diffusion接口需要大量算力生成图像，相对来说成本较高，详情信息可查看[关于绘图接口的相关说明](https://www.wolai.com/k6qBiSdjzRmGZRk6cygNCk)；百度图片审核服务免费额度用完后是收费的，大约是5元10000次审核次数，总的来说还是比较便宜的；除这两个接口门槛较高外，其他的接口都是免费在[Hugging Face](https://huggingface.co/)上部署的，请自行斟酌，插件开发者不免费提供（也没能力提供）任何接口，不愿意动手的小伙伴劝退

</details>

<br><br>

## 功能演示

#### 帮助

> 首次使用请发送**ap 帮助**查看可用指令

<br> 

#### 以文生图

> 使用 Stable Diffusion 接口根据用户输入的 prompt 进行作图

<details>
<summary>展开/收起</summary>

可选参数：

- 图片方向：竖图，横图，方图（默认竖图 512×768，横图 768×512，方图 640×640）
- 采样方法：采样器 Euler a（指定采样器）
- 采样迭代步数：步数 60（值越高图像越精细）
- 种子：种子 468751975（用于生成相似图）
- 提示词相关性：自由度 11（越高越自 ♂ 由）
- 指定接口：接口 2（如果你有多接口，指定接口作图）
- 批量绘制：5 张（批量绘制图片）

|     指令      |      回复      |                        示例                        |
| :-----------: | :------------: | :------------------------------------------------: |
| #绘图+${参数} | [图片]+${参数} | ![绘图](./resources/readme/%E7%BB%98%E5%9B%BE.jpg) |

</details>

<br>

#### 以图生图

> 使用 Stable Diffusion 接口根据用户输入的 prompt 与图片进行作图

<details>
<summary>展开/收起</summary>

可选参数：

- 继承[以文生图](#以文生图)的所有参数
- 重绘幅度：强度 0.6（越高越接近 prompt 所描述）
- [图片]：带上你的图片（附带图片，引用图片与艾特用户均可）

|         指令         |      回复      |                                   示例                                   |
| :------------------: | :------------: | :----------------------------------------------------------------------: |
| #绘图+${参数}+[图片] | [图片]+${参数} | ![以图绘图](./resources/readme/%E4%BB%A5%E5%9B%BE%E7%BB%98%E5%9B%BE.jpg) |

</details>

<br>

#### 二次元的我

> 使用 Stable Diffusion 接口为用户生成各种属性的二次元人设，每天一种属性

<details>
<summary>展开/收起</summary>

可选参数：

- 二次元的我（不带前缀：随机获取属性生成图片）
- #二次元的我（带#号前缀：使用头像与随机获取的属性以图生图）
- %二次元的我（带%号前缀：使用 DeepDanbooru 接口(若可用，不可用与#号前缀相同)对头像进行逆推 Tags，结合随机属性生成图片）
- /二次元的我（带/号前缀：使用 DeepDanbooru 接口(若可用，不可用与无前缀相同)对头像进行逆推 Tags，生成图片）
- (全局)刷新二次元的我：刷新获取到的属性

|       指令        |      回复      |                                        示例                                         |
| :---------------: | :------------: | :---------------------------------------------------------------------------------: |
| ${前缀}二次元的我 | [图片]+${属性} | ![二次元的我](./resources/readme/%E4%BA%8C%E6%AC%A1%E5%85%83%E7%9A%84%E6%88%91.jpg) |

</details>

<br>

#### 大清晰术

> 使用 Real-CUGAN 接口对图片进行超分与降噪

<details>
<summary>展开/收起</summary>

可选参数：

- 超分：二重唱，三重唱，四重唱（对应 2 倍，3 倍，4 倍超分）
- 降噪：强力术式，中等术式，不变式，原式（等级越高，降噪越强）

|           指令           |      回复      |                                   示例                                   |
| :----------------------: | :------------: | :----------------------------------------------------------------------: |
| #大清晰术+${参数}+[图片] | [图片]+${参数} | ![大清晰术](./resources/readme/%E5%A4%A7%E6%B8%85%E6%99%B0%E6%9C%AF.jpg) |

</details>

<br>

#### 鉴赏

> 使用 DeepDanbooru 接口对图片进行逆推 Tags

<details>
<summary>展开/收起</summary>

|     指令     |      回复      |                        示例                        |
| :----------: | :------------: | :------------------------------------------------: |
| #鉴赏+[图片] | [图片]+${结果} | ![鉴赏](./resources/readme/%E9%89%B4%E8%B5%8F.jpg) |

</details>

<br>

#### 鉴定图片

> 使用 Anime Ai Detect 接口对图像进行检查是否为 AI 制作

<details>
<summary>展开/收起</summary>

|       指令       |  回复   |                                   示例                                   |
| :--------------: | :-----: | :----------------------------------------------------------------------: |
| #鉴定图片+[图片] | ${结果} | ![鉴定图片](./resources/readme/%E9%89%B4%E5%AE%9A%E5%9B%BE%E7%89%87.jpg) |

**※：此功能为 AI 鉴定，结果并不一定精准，请理智辨别，造成任何纠纷与插件作者无关**

</details>

<br>

#### 去背景

> 使用 Anime Remove Background 接口对图像背景进行去除

<details>
<summary>展开/收起</summary>

|      指令      |  回复  |                             示例                              |
| :------------: | :----: | :-----------------------------------------------------------: |
| #去背景+[图片] | [图片] | ![去背景](./resources/readme/%E5%8E%BB%E8%83%8C%E6%99%AF.jpg) |

</details>

<br>

#### 图片动漫化

> 使用 White Box Cartoonization 接口对图片进行动漫化

<details>
<summary>展开/收起</summary>

|        指令        |  回复  |                                        示例                                         |
| :----------------: | :----: | :---------------------------------------------------------------------------------: |
| #图片动漫化+[图片] | [图片] | ![图片动漫化](./resources/readme/%E5%9B%BE%E7%89%87%E5%8A%A8%E6%BC%AB%E5%8C%96.jpg) |

</details>

<br>

#### 图像审核

> 使用百度图片审核服务进行图像审核，避免绘制违规图片导致机器人封禁

<details>
<summary>展开/收起</summary>

**※：在使用前请安装 baidu-aip-sdk 依赖**

```
pnpm add baidu-aip-sdk -w
```

|       指令       | 回复 |                        示例                        |
| :--------------: | :--: | :------------------------------------------------: |
| #ap 设置审核开启 | 开启 | ![审核](./resources/readme/%E5%AE%A1%E6%A0%B8.jpg) |

</details>

<br>

#### 卢浮宫

> 使用 Canvas 画板将赛璐珞风格动画截图或插画，转换成One Last Kiss封面风格

<details>
<summary>展开/收起</summary>

**※：在使用前请安装 canvas 依赖，此依赖无法在部分系统直接安装，相应安装方法咨询百度**

```
cnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas
```

可选参数：

- 精细程度：精细，一般，稍粗，极粗，浮雕（五个只能选一个哦！）
- 降噪：带上此参数则开启，否则关闭
- 水印：加上「One Last Image」水印
- 初回：加上「One Last Image」彩色水印（仅开启水印情况下有效）
- Kiss：Kiss 滤镜
- 线迹轻重：80-126 之间
- 调子数量：20-200 之间

|          指令          |  回复  |                             示例                              |
| :--------------------: | :----: | :-----------------------------------------------------------: |
| #卢浮宫+${参数}+[图片] | [图片] | ![卢浮宫](./resources/readme/%E5%8D%A2%E6%B5%AE%E5%AE%AB.jpg) |

</details>

<br>

#### 局部重绘

> 使用 Stable Diffusion 接口与 Canvas 画板对图片进行局部重绘操作

<details>
<summary>展开/收起</summary>

**※：在使用前请安装 canvas 依赖，此依赖无法在部分系统直接安装，相应安装方法咨询百度**

```
cnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas
```

|                  指令                   |  回复  |                                   示例                                   |
| :-------------------------------------: | :----: | :----------------------------------------------------------------------: |
| #局部重绘+${关键词}+[原图]+[涂抹后的图] | [图片] | ![局部重绘](./resources/readme/%E5%B1%80%E9%83%A8%E9%87%8D%E7%BB%98.jpg) |

</details>

<br>

## Todo

- [ ] 更严谨的 API 鉴权方式（Arcadia）
- [ ] 简单图片处理（Su）
- [ ] 群友 XP 统计与 Tags 使用排名（Arcadia）
- [ ] 咕咕咕？

- [x] 云端同步与共享预设
- [x] 接入百度，有道翻译（Arcadia）
- [x] 图片局部重绘

## 致谢

[AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)：stable-diffusion-webui 项目  
[秋葉 aaaki](https://space.bilibili.com/12566101/)：电子佛祖，赛博菩萨  
[DianXian/Real-CUGAN](https://huggingface.co/spaces/DianXian/Real-CUGAN)：超级棒的 Real-CUGAN 在线接口  
[NoCrypt/DeepDanbooru_string](https://huggingface.co/spaces/NoCrypt/DeepDanbooru_string)：超级棒的 DeepDanbooru 在线接口  
[saltacc/anime-ai-detect](https://huggingface.co/spaces/saltacc/anime-ai-detect)：超级棒的鉴定图片项目  
[skytnt/anime-remove-background](https://huggingface.co/spaces/skytnt/anime-remove-background)：超级棒的去背景项目  
[hylee/White-box-Cartoonization](https://huggingface.co/spaces/hylee/White-box-Cartoonization)：超级棒的图片动漫化项目  
[itorr/one-last-image](https://github.com/itorr/one-last-image)：超级好看的卢浮宫生成器

## 声明

此项目仅用于学习交流，请勿用于非法用途

### 爱发电

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力  
当然，你可以对我爱发电赞助，呜咪~❤️

<details>
<summary>展开/收起</summary>

<p>
  </a>
    <img src="./resources/readme/%E7%88%B1%E5%8F%91%E7%94%B5.jpg">
  </a>
</p>

</details>

## 我们

<a href="https://github.com/yhArcadia/ap-plugin/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yhArcadia/ap-plugin" />
</a>
