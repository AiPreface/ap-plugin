/*
 * @Author: 0卡苏打水
 * @Date: 2023-01-05 03:49:51
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-07 17:24:58
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\apps\white_box_cartoonization.js
 * @Description: 
 * 
 * Copyright (c) 2023 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */
import plugin from '../../../lib/plugins/plugin.js'
import Config from '../components/ai_painting/config.js'
import fetch from 'node-fetch'
import axios from 'axios'
import { parseImg } from '../utils/utils.js'
import Log from '../utils/Log.js'

const _path = process.cwd();
let ap_cfg = await Config.getcfg()
const API = ap_cfg.cartoonization
let FiguretypeUser = {}
let getImagetime = {}

export class Cartoonization extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'AP-图片动漫化',
      /** 功能描述 */
      dsc: '图片动漫化',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?(图片)?动漫化$',
          /** 执行方法 */
          fnc: 'WhiteBoxCartoonization'
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

  async WhiteBoxCartoonization(e) {
    if (!API)
      return await e.reply("请先配置图片动漫化所需API")
    if (FiguretypeUser[e.user_id]) {
      e.reply('当前有任务在列表中排队，请不要重复发送，动漫化完成后会自动发送结果，如果长时间没有结果，请等待1分钟再试')
      return true
    }
    e = await parseImg(e)
    if (this.e.img) {
      e.reply('正在进行图像动漫化，请稍后...', true)
      FiguretypeUser[e.user_id] = setTimeout(() => {
        if (FiguretypeUser[e.user_id]) {
          delete FiguretypeUser[e.user_id];
        }
      }, 60000);
      let start = new Date()
      let img = await axios.get(e.img[0], {
        responseType: 'arraybuffer'
      });
      let base64 = Buffer.from(img.data, 'binary')
        .toString('base64');
      await fetch(API + '/', {
        method: "POST",
        body: JSON.stringify({
          "data": ["data:image/png;base64," + base64],
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (response) {
          // Log.w(response.data)
          // Log.w(response.data[0])
          let end = new Date()
          let time = ((end.getTime() - start.getTime()) / 1000).toFixed(2)
          e.reply(`耗时${time}s，正在发送结果...`, true)
          response.data[0] = response.data[0].replace(/^data:image\/png;base64,/, "")
          let buffer = Buffer.from(response.data[0], 'base64')
          e.reply(segment.image(buffer))
          delete FiguretypeUser[e.user_id];
          return true
        })
    } else {
      e.reply('请在60s内发送需要动漫化的图片~', true);
      getImagetime[e.user_id] = setTimeout(() => {
        if (getImagetime[e.user_id]) {
          e.reply('动漫化已超时，请再次发送命令~', true);
          delete getImagetime[e.user_id];
        }
      }, 60000);
      return false;
    }
  }
  async getImage(e) {
    if (!this.e.img) {
      return false;
    }
    if (getImagetime[e.user_id]) {
      clearTimeout(getImagetime[e.user_id]);
      delete getImagetime[e.user_id];
    } else {
      return false;
    }
    let result = await this.WhiteBoxCartoonization(e);
    if (result) {
      return true;
    }
  }
}
