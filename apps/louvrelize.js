import moment from 'moment'
// import { louvre } from '../components/louvre/louvre.js';
// import Canvas from "canvas";
import { parseImg } from '../utils/utils.js'
import Log from '../utils/Log.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const FiguretypeUser = {}
const getImagetime = {}
const creatConvoluteAverage = (w) => new Array(w * w).fill(1 / (w * w))
const Convolutes = {
  精细: creatConvoluteAverage(5),
  一般: creatConvoluteAverage(7),
  稍粗: creatConvoluteAverage(9),
  超粗: creatConvoluteAverage(11),
  极粗: creatConvoluteAverage(13),
  浮雕: [1, 1, 1, 1, 1, -1, -1, -1, -1]
}

// 默认参数：
let style = {
  zoom: 1,
  light: 0,
  shadeLimit: 118, // 线迹轻重
  shadeLight: 20, // 调子数量
  shade: true,
  kuma: false, // Kiss
  hajimei: false, // 初回
  watermark: false, // 水印
  convoluteName: '精细', // 精细度
  convolute1Diff: true,
  convoluteName2: null,
  Convolutes,
  lightCut: 128, // 亮部处理
  darkCut: 118, // 暗部处理
  denoise: false // 降噪
}

export class louvreimg extends plugin {
  constructor () {
    super({
      name: 'AP-卢浮宫',
      dsc: 'louvreImg',
      event: 'message',
      priority: 1009,
      rule: [
        {
          reg: '^#?(卢浮宫|louvre)([\\s\\S]*)$',
          fnc: 'louvreImg'
        },
        {
          reg: '^#?线稿$',
          fnc: 'louvreImg'
        },
        {
          /** 命令正则匹配 */
          reg: '^.*$',
          /** 执行方法 */
          fnc: 'getImage',
          log: false
        }
        // {
        // 	/** 命令正则匹配 */
        // 	reg: '^#卢浮宫帮助$',
        // 	/** 执行方法 */
        // 	fnc: 'louvreHelp',
        // }
      ]
    })
  }

  async louvreImg (e) {
    if (e.msg) {
      if (e.msg.includes('帮助')) return this.louvreHelp(e)
      if (
        !/^#?(卢浮宫|louvre)[精细一般稍超极粗浮雕降噪水印kiss初回线迹轻重调子数量0-9]*$/i.test(
          e.msg
        )
      ) {
        return false
      }
    }
    let Canvas
    let louvre
    try {
      Canvas = require('canvas')
      louvre = require('../components/louvre/louvre.cjs').louvre
      // Log.i(louvre)
      // Log.i(typeof louvre)
    } catch (err) {
      Log.w(err)
      e.reply(
        '出错：louvres卢浮宫滤镜功能需要安装依赖：canvas\n请在yunzai根目录执行如下命令来安装依赖：\ncnpm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas\n\n若安装依赖后仍出现此报错，您可查看控制台报错并联系开发者反馈'
      )
      return true
    }

    if (FiguretypeUser[e.user_id]) {
      e.reply(
        '当前有任务在列表中排队，请不要重复发送，生成完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试',
        false,
        {
          at: true,
          recallMsg: 15
        }
      )
      return true
    }

    e = await parseImg(e)
    if (e.msg) {
      e.msg = e.msg.replace('自己', '')
    }
    if (!e.img) {
      e.reply('请在60s内发送需要生成卢浮宫的图片~', true)
      getImagetime[e.user_id] = setTimeout(() => {
        if (getImagetime[e.user_id]) {
          e.reply('已超时，请再次发送命令~', true)
          delete getImagetime[e.user_id]
        }
      }, 60000)
      return false
    }

    if (e.msg) {
      if (/^#?线稿$/.test(e.msg.trim())) {
        style = {
          zoom: 1,
          light: 0,
          shadeLimit: 118, // 线迹轻重
          shadeLight: 20, // 调子数量
          shade: true,
          kuma: false, // Kiss
          hajimei: false, // 初回
          watermark: false, // 水印
          convoluteName: '精细', // 精细度
          convolute1Diff: true,
          convoluteName2: null,
          Convolutes,
          lightCut: 128, // 亮部处理
          darkCut: 118, // 暗部处理
          denoise: true // 降噪
        }
      } else if (/^#?louvre$/.test(e.msg.trim())) {
        style = {
          zoom: 1,
          light: 0,
          shadeLimit: 118, // 线迹轻重
          shadeLight: 20, // 调子数量
          shade: true,
          kuma: true, // Kiss
          hajimei: false, // 初回
          watermark: false, // 水印
          convoluteName: '精细', // 精细度
          convolute1Diff: true,
          convoluteName2: null,
          Convolutes,
          lightCut: 128, // 亮部处理
          darkCut: 118, // 暗部处理
          denoise: true // 降噪
        }
      } else {
        if (e.msg.includes('精细')) {
          style.convoluteName = '精细'
        } else if (e.msg.includes('一般')) {
          style.convoluteName = '一般'
        } else if (e.msg.includes('稍粗')) {
          style.convoluteName = '稍粗'
        } else if (e.msg.includes('超粗')) {
          style.convoluteName = '超粗'
        } else if (e.msg.includes('极粗')) {
          style.convoluteName = '极粗'
        } else if (e.msg.includes('浮雕')) {
          style.convoluteName = '浮雕'
        }

        if (e.msg.includes('降噪')) {
          style.denoise = true
        } else {
          style.denoise = false
        }

        if (e.msg.includes('水印')) {
          style.watermark = true
        } else {
          style.watermark = false
        }

        if (/kiss/i.test(e.msg)) {
          // if (e.msg.includes('Kiss')) {
          style.kuma = true
        } else {
          style.kuma = false
        }

        if (e.msg.includes('初回')) {
          if (style.watermark == false) {
            e.reply('未开启水印，无法开启初回', false, {
              at: true,
              recallMsg: 15
            })
            return true
          }
          style.hajimei = true
        } else {
          style.hajimei = false
        }

        if (e.msg.includes('线迹轻重')) {
          const light = e.msg.match(/线迹轻重(\d+)/)
          if (light[1] >= 80 && light[1] <= 126) {
            style.shadeLimit = light[1]
          } else {
            e.reply('线迹轻重参数错误，应该在80-126之间，已默认为118', false, {
              at: true,
              recallMsg: 15
            })
            style.shadeLimit = 118
          }
        } else {
          style.shadeLimit = 118
        }

        if (e.msg.includes('调子数量')) {
          const shade = e.msg.match(/调子数量(\d+)/)
          if (shade[1] >= 20 && shade[1] <= 200) {
            style.shadeLight = shade[1]
          } else {
            e.reply('调子数量参数错误，应该在20-200之间，已默认为108', false, {
              at: true,
              recallMsg: 15
            })
            style.shadeLight = 108
          }
        } else {
          style.shadeLight = 108
        }
      }

      FiguretypeUser[e.user_id] = setTimeout(() => {
        if (FiguretypeUser[e.user_id]) {
          delete FiguretypeUser[e.user_id]
        }
      }, 60000)

      if (/^#?(louvre|卢浮宫)$/.test(e.msg.trim())) {
        e.reply(
          '正在生成卢浮宫风格，请稍等\n当前生成参数：\n精细程度：' +
            style.convoluteName +
            '\n降噪：' +
            (style.denoise ? '开启' : '关闭') +
            '\n水印：' +
            (style.watermark ? '开启' : '关闭') +
            '\nKiss：' +
            (style.kuma ? '开启' : '关闭') +
            '\n初回：' +
            (style.hajimei ? '开启' : '关闭') +
            '\n线迹轻重：' +
            style.shadeLimit +
            '\n调子数量：' +
            style.shadeLight,
          true,
          {
            at: true,
            recallMsg: 15
          }
        )
      }
    }
    const start = new Date()
    // 根据参数，画图
    const img = await new Canvas.loadImage(e.img[0])
    const outputCanvas = await louvre(
      {
        img,
        config: {
          ...style,
          Convolutes
        }
      },
      e
    )
    // Log.i(outputCanvas)                         //
    // return true
    const res = outputCanvas.toDataURL()
    const end = new Date()
    const time = moment(end - start).format('mm:ss')
    e.reply(`生成完成，耗时${time}，正在发送...`, false, {
      at: true,
      recallMsg: 15
    })
    e.reply(
      [
        segment.image(
          'base64://' + res.replace(/^data:image\/\w+;base64,/, '')
        ),
        // /^#?(louvre|卢浮宫)$/.test(e.msg.trim()) ? '' : '\n当前生成参数：\n精细程度：' + style.convoluteName + '\n降噪：' + (style.denoise ? '开启' : '关闭') + '\n水印：' + (style.watermark ? '开启' : '关闭') + '\nKiss：' + (style.kuma ? '开启' : '关闭') + '\n初回：' + (style.hajimei ? '开启' : '关闭') + '\n线迹轻重：' + style.shadeLimit + '\n调子数量：' + style.shadeLight,
        true,
        {
          at: true,
          recallMsg: 15
        }
      ],
      true
    )
    delete FiguretypeUser[e.user_id]
    return true
  }

  async getImage (e) {
    if (!this.e.img) {
      return false
    }
    if (getImagetime[e.user_id]) {
      clearTimeout(getImagetime[e.user_id])
      delete getImagetime[e.user_id]
    } else {
      return false
    }
    const result = await this.louvreImg(e)
    if (result) {
      return true
    }
  }

  async louvreHelp (e) {
    e.reply(
      '可设置的参数有：\n精细程度：精细，一般，稍粗，超粗，极粗，浮雕（五选一）\n降噪，水印，Kiss，初回（可选）\n线迹轻重（80-126）\n调子数量（20-200）\n例：#卢浮宫精细降噪水印Kiss初回线迹轻重118调子数量108',
      true
    )
    return true
  }
}
