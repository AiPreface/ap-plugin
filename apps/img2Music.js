/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-04 01:03:58
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-05 16:33:08
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\img_to_music.js
 * @Description:
 *
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved.
 */
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import axios from 'axios'
import Config from '../components/ai_painting/config.js'
import { parseImg } from '../utils/utils.js'
import Log from '../utils/Log.js'

const _path = process.cwd()
const ap_cfg = await Config.getcfg()
const API = ap_cfg.img_to_music

const FiguretypeUser = {}
const getImagetime = {}

export class ImgToMusic extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'AP-图像转音频',
      /** 功能描述 */
      dsc: '简单开发示例',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?(图像|图片)?(生成|转)音(频|乐).*$',
          /** 执行方法 */
          fnc: 'img_to_music'
        },
        {
          /** 命令正则匹配 */
          reg: '^.*$',
          /** 执行方法 */
          fnc: 'getImage',
          log: false
        }
      ]
    })
  }

  async img_to_music (e) {
    if (!API) {
      return await e.reply(
        '请先配置图片转音频所需API，配置教程：https://ap-plugin.com/Config/docs8'
      )
    }
    if (FiguretypeUser[e.user_id]) {
      e.reply(
        '当前有任务在列表中排队，请不要重复发送，转换完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试'
      )
      return true
    }
    e = await parseImg(e)
    if (this.e.img) {
      e.reply('正在转换成音频，请耐心等待...', true)
      FiguretypeUser[e.user_id] = setTimeout(() => {
        if (FiguretypeUser[e.user_id]) {
          delete FiguretypeUser[e.user_id]
        }
      }, 60000)
      const start = new Date()
      const img = await axios.get(e.img[0], {
        responseType: 'arraybuffer'
      })
      const base64 = Buffer.from(img.data, 'binary').toString('base64')
      let time = 30
      let type = 'track'
      let level = 'low'
      if (e.msg) {
        if (e.msg.includes('秒')) {
          time = e.msg.match(/\d+/)[0]
        } else if (e.msg.includes('分钟')) {
          time = e.msg.match(/\d+/)[0] * 60
        }
        if (e.msg.includes('一般')) {
          level = 'low'
        } else if (e.msg.includes('较复杂')) {
          level = 'medium'
        } else if (e.msg.includes('复杂')) {
          level = 'high'
        }
        if (e.msg.includes('轨道')) {
          type = 'track'
        } else if (e.msg.includes('循环')) {
          type = 'loop'
        }
      }
      await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: ['data:image/png;base64,' + base64, time, level, type]
        })
      })
        .then((r) => r.json())
        .then((r) => {
          const data = r.data
          const end = new Date()
          const time = (end - start) / 1000
          e.reply(`转换完成，耗时${time}秒，正在发送音频，请稍等...`, true)
          e.reply(segment.record(data[0].name))
          delete FiguretypeUser[e.user_id]
          return true
        })
        .catch((r) => {
          Log.e(r)
          e.reply('转换失败，请稍后再试~', true)
        })
    } else {
      e.reply('请在60s内发送需要转换的图片~', true)
      getImagetime[e.user_id] = setTimeout(() => {
        if (getImagetime[e.user_id]) {
          e.reply('已超时，请再次发送命令~', true)
          delete getImagetime[e.user_id]
        }
      }, 60000)
      return false
    }
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
    const result = await this.img_to_music(e)
    if (result) {
      return true
    }
  }
}
